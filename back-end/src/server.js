import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";
import chatRoutes from "./routes/chat.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { assertOpenAIConfig } from "./config/openai.js";
import { assertElasticConnection } from "./config/elasticsearch.js";
import { ensureChunkIndex } from "./services/elasticsearch.service.js";
import { getAdminSettingsRecord } from "./services/adminSettings.service.js";
import adminAuthRoutes from "./routes/adminAuth.routes.js";
import { ensureDefaultAdmin } from "./services/adminAuth.service.js";


//preventing cron from running everywhere automatically on different environments
if (process.env.ENABLE_CRON === "true") {
 await import("./cron/cronjob.js");
}

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

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


const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (process.env.MONGO_URI) {
      await connectDB();
      await ensureDefaultAdmin();
      await getAdminSettingsRecord();
    }
    await ensureChunkIndex();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}
startServer();
