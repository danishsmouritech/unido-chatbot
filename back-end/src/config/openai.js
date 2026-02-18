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

export const chatClient = createAzureDeploymentClient(process.env.AZURE_OPENAI_DEPLOYMENT);
export const embeddingClient = createAzureDeploymentClient(process.env.AZURE_EMBEDDING_DEPLOYMENT);

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
