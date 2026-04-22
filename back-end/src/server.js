import express from "express";
import { createServer } from "http";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import jwt from "jsonwebtoken";
import swaggerUi from "swagger-ui-express";
import { Server as SocketIOServer } from "socket.io";
import { connectDB } from "./config/db.js";
import chatRoutes from "./routes/chat.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import adminAuthRoutes from "./routes/adminAuth.routes.js";
import { assertOpenAIConfig } from "./config/openai.js";
import { assertElasticConnection } from "./config/elasticsearch.js";
import { ensureChunkIndex } from "./services/elasticsearch.service.js";
import { getAdminSettingsRecord } from "./services/adminSettings.service.js";
import {
  assertAdminAuthConfig,
  ensureDefaultAdmin
} from "./services/adminAuth.service.js";
import { openApiSpec } from "./docs/openapi.js";
import { setSocketServer } from "./realtime/socket.js";
import { logger } from "./utils/logger.js";
import {
  requestId,
  securityHeaders,
  inputSanitizer,
  payloadGuard,
  auditLogger,
  noSQLInjectionGuard,
  methodGuard,
  globalErrorHandler
} from "./middleware/security.middleware.js";

dotenv.config();
//preventing cron from running everywhere automatically on different environments
if (process.env.ENABLE_CRON === "true") {
 await import("./cron/cronjob.js");
}

const app = express();

// HTTPS enforcement in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? ['https://careers.unido.org']
    : ['http://localhost:5000', 'http://localhost:5173','http://localhost:5174'];

app.use(cors({
  origin: function (origin, callback) {
    // Block requests with no origin in production (prevents CSRF)
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('Origin required'), false);
      }
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600
}));

app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null
      }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    dnsPrefetchControl: { allow: false },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  }));
app.disable("x-powered-by");

// Security middleware stack
app.use(requestId);
app.use(securityHeaders);
app.use(methodGuard);
app.use(payloadGuard);
app.use(auditLogger);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Input sanitization & NoSQL injection guard (after body parsing)
app.use(inputSanitizer);
app.use(noSQLInjectionGuard);
app.get("/api/docs.json", (_req, res) => {
  res.json(openApiSpec);
});
if (process.env.NODE_ENV !== "production") {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
}
app.get("/health", async(_req, res) => {
  try {
          assertOpenAIConfig();
    await assertElasticConnection();
    res.status(200).json({ status: "ok", service: "unido-rag-backend" });
  }catch (error) {
    logger.error("Health check failed:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
  
});
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" }
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many admin requests. Try again later." }
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
  skipSuccessfulRequests: false
});
const speedLimiter = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 50,
  delayMs:()=> 500
});

app.use("/api", speedLimiter);
app.use("/api/admin/auth", authLimiter);
app.use("/api/chat", chatLimiter);
app.use("/api/admin", adminLimiter);
app.use("/api/chat", chatRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler for unknown routes
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler – must be last middleware
app.use(globalErrorHandler);

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: function (origin, callback) {
      if (!origin && process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(null,false);
      }
    },
    methods: ["GET", "POST", 'PUT', 'DELETE'],
    credentials: true
  }
});
setSocketServer(io);

io.on("connection", (socket) => {
  socket.emit("socket:ready", { connectedAt: new Date().toISOString() });

  // Disconnect idle sockets after 30 minutes
  const idleTimeout = setTimeout(() => {
    socket.disconnect(true);
  }, 30 * 60 * 1000);

  socket.on("disconnect", () => {
    clearTimeout(idleTimeout);
  });
});

// Socket authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    
    if (token) {
      // Validate token format before verifying
      if (typeof token !== "string" || token.split(".").length !== 3) {
        socket.isAdmin = false;
        return next();
      }

      const user = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
        maxAge: "30m"
      });
      socket.user = user;
      socket.isAdmin = user?.role === "admin";
    } else {
      socket.isAdmin = false;
    }
    
    next();
  } catch (error) {
    // Invalid token - still allow connection but mark as public
    socket.isAdmin = false;
    next();
  }
});
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    assertAdminAuthConfig();

    if (process.env.MONGO_URI) {
      await connectDB();
      await ensureDefaultAdmin();
      await getAdminSettingsRecord();
    }
    // await ensureChunkIndex();
    httpServer.listen(PORT, () => {
      logger.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error("Failed to start server", err);
    process.exit(1);
  }
}

startServer();