import express from "express";
import { createServer } from "http";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { Server as SocketIOServer } from "socket.io";
import { connectDB } from "./config/db.js";
import chatRoutes from "./routes/chat.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { assertOpenAIConfig } from "./config/openai.js";
import { assertElasticConnection } from "./config/elasticsearch.js";
import { ensureChunkIndex } from "./services/elasticsearch.service.js";
import { getAdminSettingsRecord } from "./services/adminSettings.service.js";
import adminAuthRoutes from "./routes/adminAuth.routes.js";
import {
  assertAdminAuthConfig,
  ensureDefaultAdmin
} from "./services/adminAuth.service.js";
import { openApiSpec } from "./docs/openapi.js";
import { setSocketServer } from "./realtime/socket.js";


dotenv.config();
//preventing cron from running everywhere automatically on different environments
if (process.env.ENABLE_CRON === "true") {
 await import("./cron/cronjob.js");
}

const app = express();
app.use(cors());
app.use(express.json());
app.get("/api/docs.json", (_req, res) => {
  res.json(openApiSpec);
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.get("/health", async(_req, res) => {
  try {
          assertOpenAIConfig();
    await assertElasticConnection();
    res.status(200).json({ status: "ok", service: "unido-rag-backend" });
  }catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
  
});

app.use("/api/chat", chatRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
setSocketServer(io);

io.on("connection", (socket) => {
  socket.emit("socket:ready", { connectedAt: new Date().toISOString() });
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
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}
startServer();
