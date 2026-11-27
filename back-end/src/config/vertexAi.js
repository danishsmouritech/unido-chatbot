import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

let client;

export function getVertexAIClient() {
  if (!client) {
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
    if (!project) throw new Error("GOOGLE_CLOUD_PROJECT is required");
    client = new GoogleGenAI({ vertexai: true, project, location });
  }
  return client;
}

export function assertVertexAIConfig() {
  if (!process.env.GOOGLE_CLOUD_PROJECT) throw new Error("GOOGLE_CLOUD_PROJECT is required");
  if (!process.env.GOOGLE_CLOUD_LOCATION) throw new Error("GOOGLE_CLOUD_LOCATION is required");
}

export const CHAT_MODEL = process.env.VERTEX_GEMINI_MODEL || "gemini-3.5-flash-lite";
export const EMBEDDING_MODEL = process.env.VERTEX_EMBEDDING_MODEL || "text-embedding-005";
