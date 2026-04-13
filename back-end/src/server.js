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
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(null,false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: true
  }));
app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
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
  message: "Too many requests, please try again later"
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50
});
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many login attempts. Try again later."
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
});

// Socket authentication - required for all connections
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    
    // If token is provided, verify it
    if (token) {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = user;
    socket.isAdmin = user?.role === 'admin';
    } else {
      // Allow public socket connections (for public chatbot notifications)
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