import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-10-21";
const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || "").replace(/\/+$/, "");
const apiKey = process.env.AZURE_OPENAI_KEY;

function createAzureDeploymentClient(deploymentName) {
  if (!endpoint || !apiKey || !deploymentName) {
      throw new Error("Azure OpenAI config missing");
  }

  return new OpenAI({
    apiKey,
    baseURL: `${endpoint}/openai/deployments/${deploymentName}`,
    defaultQuery: { "api-version": apiVersion },
    defaultHeaders: { "api-key": apiKey }
  });
}

// Lazy-initialized clients to avoid startup errors when env vars are not yet loaded
let _chatClient = null;
let _embeddingClient = null;

export function getChatClient() {
  if (!_chatClient) {
    _chatClient = createAzureDeploymentClient(process.env.AZURE_OPENAI_DEPLOYMENT);
  }
  return _chatClient;
}

export function getEmbeddingClient() {
  if (!_embeddingClient) {
    _embeddingClient = createAzureDeploymentClient(process.env.AZURE_EMBEDDING_DEPLOYMENT);
  }
  return _embeddingClient;
}

// Keep backward-compat named export (lazy getter)
export const chatClient = new Proxy({}, {
  get(_, prop) {
    return getChatClient()[prop];
  }
});

export function assertOpenAIConfig() {
  if (!endpoint) throw new Error("AZURE_OPENAI_ENDPOINT is missing");
  if (!apiKey) throw new Error("AZURE_OPENAI_KEY is missing");
  if (!process.env.AZURE_OPENAI_DEPLOYMENT) {
    throw new Error("AZURE_OPENAI_DEPLOYMENT is missing");
  }
  if (!process.env.AZURE_EMBEDDING_DEPLOYMENT) {
    throw new Error("AZURE_EMBEDDING_DEPLOYMENT is missing");
  }
}
