import mongoose from "mongoose";

const sourceSchema = new mongoose.Schema(
  {
    id: { type: String, default: null },
    score: { type: Number, default: null },
    metadata: { type: Object, default: {} }
  },
  { _id: false }
);

const chatLogSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    question: { type: String, required: true, trim: true },
    answer: { type: String, default: "" },
    status: { type: String, enum: ["success", "fallback", "error"], required: true },
    sources: { type: [sourceSchema], default: [] },
    retrieval: {
      totalRetrieved: { type: Number, default: 0 },
      relevantRetrieved: { type: Number, default: 0 },
      minRelevanceScore: { type: Number, default: null }
    },
    model: {
      chatDeployment: { type: String, default: null },
      embeddingDeployment: { type: String, default: null }
    },
    usage: {
      promptTokens: { type: Number, default: null },
      completionTokens: { type: Number, default: null },
      totalTokens: { type: Number, default: null }
    },
    timingMs: {
      embedding: { type: Number, default: 0 },
      retrieval: { type: Number, default: 0 },
      generation: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    requestMeta: {
      userAgent: { type: String, default: null },
      ip: { type: String, default: null }
    },
    error: {
      message: { type: String, default: null },
      stack: { type: String, default: null }
    }
  },
  { timestamps: true }
);

const ChatLog = mongoose.model("ChatLog", chatLogSchema);

export default ChatLog;
