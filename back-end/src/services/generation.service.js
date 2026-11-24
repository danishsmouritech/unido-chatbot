import { getChatClient } from "../config/openai.js";
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

  const completion = await getChatClient().chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT,
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: `${systemPrompt}\n\nAPPROVED EXTERNAL SOURCE REGISTRY (use these URLs and instructions as provided; they are not live data):\n${approvedExternalSources}`
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
