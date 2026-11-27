import { CHAT_MODEL, getVertexAIClient } from "../config/vertexAi.js";
import { EXTERNAL_SOURCES } from "../config/externalSources.js";
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
  const configuredPrompt = settings?.systemPrompt || `You are a UNIDO Careers Assistant.
Answer ONLY from provided CONTEXT.
If insufficient info, say you don't have enough information.`;
  const systemPrompt = `${configuredPrompt}

EXTERNAL SOURCE INSTRUCTIONS:
- Use careers.unido.org and approved FAQs as the primary sources for recruitment answers.
- Do not invent or estimate salary figures. For salary scale questions, refer users to the official OneHR or ICSC source as appropriate and tell them to check it for current information.
- OneHR is the reference for General Service and related category scales; ICSC is the reference for Professional and higher category scales.
- For UNIDO outreach video questions, provide the approved YouTube Outreach link. Only summarize video content if verified transcripts are present in the provided context. Never invent video content or timestamps.
- Distinguish information in the provided context from external references. Do not claim to have checked external sites in real time.`;
  const approvedExternalSources = JSON.stringify(EXTERNAL_SOURCES, null, 2);

  const contents = [
    ...normalizedHistory.map(message => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }]
    })),
    { role: "user", parts: [{ text: `QUESTION:\n${question}\n\nCONTEXT:\n${contextText}` }] }
  ];
  const response = await getVertexAIClient().models.generateContent({
    model: CHAT_MODEL,
    contents,
    config: {
      temperature: 0.1,
      systemInstruction: `${systemPrompt}\n\nAPPROVED EXTERNAL SOURCE REGISTRY (use these URLs and instructions as provided; they are not live data):\n${approvedExternalSources}`
    }
  });

  return response.text?.trim();
}
