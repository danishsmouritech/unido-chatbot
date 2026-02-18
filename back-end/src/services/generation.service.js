import { chatClient } from "../config/openai.js";
import { getAdminSettingsRecord } from "./adminSettings.service.js";

function buildContextText(chunks) {
  return chunks
    .map((chunk, index) =>
      `[Source ${index + 1}]\n${chunk.content}`
    )
    .join("\n\n");
}

function normalizeHistory(history = []) {
  return history.map((message) => {
    if (message.role === "bot") {
      return { ...message, role: "assistant" };
    }
    return message;
  });
}

export async function generateAnswer(question, history, chunks) {
  const contextText = buildContextText(chunks);
  const normalizedHistory = normalizeHistory(history);
  const settings = await getAdminSettingsRecord();
  const systemPrompt = settings?.systemPrompt || `You are a UNIDO Careers Assistant.
Answer ONLY from provided CONTEXT.
If insufficient info, say you don't have enough information.`;

  const completion = await chatClient.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT,
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      ...normalizedHistory,
      {
        role: "user",
        content: `QUESTION:\n${question}\n\nCONTEXT:\n${contextText}`
      }
    ]
  });

  return completion?.choices?.[0]?.message?.content?.trim();
}
