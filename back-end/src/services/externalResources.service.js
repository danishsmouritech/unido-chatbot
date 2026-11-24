import { EXTERNAL_SOURCES } from "../config/externalSources.js";

const PERSONAL_SALARY_REQUEST = /\b(salary\s+list|payroll|employee\s+(salary|compensation)|specific\s+staff\s+salary)\b/i;
const SALARY_SCALE_REQUEST = /\b(salary\s+scales?|pay\s+scales?|salary\s+grades?|salary\s+structure|remuneration\s+scale|un\s+salary\s+scale)\b/i;
const GRADE_EARNINGS_REQUEST = /\b(?:p|d|g)\s*[-–]?\s*\d\b.{0,45}\b(earn|salary|pay|compensation)\b|\b(earn|salary|pay|compensation)\b.{0,45}\b(?:p|d|g)\s*[-–]?\s*\d\b/i;

const SOURCE_LABELS = {
  onehr: "OneHR Salary Scales",
  icsc: "ICSC Salary Scales",
  youtube: "UNIDO YouTube Outreach playlist"
};

function link(sourceId) {
  const source = EXTERNAL_SOURCES[sourceId];
  return `[${SOURCE_LABELS[sourceId]}](${source.url})`;
}

function numberedInstructions(sourceId) {
  return EXTERNAL_SOURCES[sourceId].instructions
    .map((instruction, index) => `${index + 1}. ${instruction}`)
    .join("\n");
}

function sourceInstructions(sourceId) {
  const source = EXTERNAL_SOURCES[sourceId];
  return `${source.title}:\n\n${numberedInstructions(sourceId)}\n\nOfficial source: ${link(sourceId)} .`;
}

export function getExternalResourceAnswer(question = "") {
  const text = String(question).trim();

  if (/\b(youtube|unido\s+videos?|outreach\s+videos?|recruitment\s+videos?)\b/i.test(text)) {
    return sourceInstructions("youtube");
  }

  const namesOneHR = /\bone\s*hr\b/i.test(text);
  const namesICSC = /\bicsc\b|international\s+civil\s+service\s+commission/i.test(text);
  const asksForScale = SALARY_SCALE_REQUEST.test(text) || GRADE_EARNINGS_REQUEST.test(text);
  if ((asksForScale || namesOneHR || namesICSC) && !PERSONAL_SALARY_REQUEST.test(text)) {
    if (namesOneHR && !namesICSC) {
      return sourceInstructions("onehr");
    }
    if (namesICSC && !namesOneHR) {
      return sourceInstructions("icsc");
    }

    const grade = text.match(/\b([pgd])\s*[-–]?\s*\d\b/i)?.[1]?.toLowerCase();
    if (grade === "g") {
      return sourceInstructions("onehr");
    }
    if (grade === "p" || grade === "d") {
      return sourceInstructions("icsc");
    }

    return `To find the latest salary information for a vacancy:\n\n1. Check the staff category in the vacancy announcement.\n\n${sourceInstructions("onehr")}\n\n${sourceInstructions("icsc")}\n\nThe chatbot does not estimate salary figures.`;
  }

  return null;
}
