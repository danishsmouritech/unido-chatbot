/**
 * Guard Service – Content Filtering & Input Protection
 * Implements multi-layer content guard per security architecture.
 */

const OFFENSIVE_PATTERNS = [
  /\b(fuck|shit|bitch|bastard|asshole|idiot|moron|damn|crap|dickhead)\b/i,
  /\b(hate\s+speech|racist|racism|sexist|sexism|bigot|slur)\b/i,
  /\b(kill\s+yourself|kys|die|threat|bomb|attack|weapon)\b/i,
];

const CONFIDENTIAL_PATTERNS = [
  /\b(confidential|internal\s+document|private\s+document|leak|classified|secret)\b/i,
  /\b(staff\s+salary|salary\s+list|employee\s+data|personal\s+data|passport|ssn|social\s+security)\b/i,
  /\b(credit\s+card|bank\s+account|financial\s+record|medical\s+record)\b/i,
];

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+(instructions?|prompts?)/i,
  /you\s+are\s+now\s+/i,
  /pretend\s+(you|to\s+be)/i,
  /system\s*:\s*/i,
  /\bDAN\b.*\bjailbreak\b/i,
  /override\s+(your|the)\s+(rules|instructions|guidelines)/i,
  /forget\s+(everything|your|all)/i,
  /act\s+as\s+(if|though)\s+you/i,
  /new\s+instructions?:/i,
  /\[INST\]/i,
  /<<SYS>>/i,
];

const OUT_OF_SCOPE_PATTERNS = [
  /\b(write\s+me\s+(a\s+)?code|generate\s+code|programming)\b/i,
  /\b(recipe|weather|sports|stock\s+market|crypto)\b/i,
  /\b(homework|essay|thesis|dissertation)\b/i,
];

export function isBlockedQuery(question = "") {
  const text = String(question).toLowerCase().trim();

  if (!text || text.length > 2000) return true;

  const allPatterns = [
    ...OFFENSIVE_PATTERNS,
    ...CONFIDENTIAL_PATTERNS,
    ...PROMPT_INJECTION_PATTERNS,
  ];

  return allPatterns.some((pattern) => pattern.test(text));
}

export function isOutOfScope(question = "") {
  const text = String(question).toLowerCase().trim();
  return OUT_OF_SCOPE_PATTERNS.some((pattern) => pattern.test(text));
}

export function getBlockReason(question = "") {
  const text = String(question).toLowerCase().trim();

  if (OFFENSIVE_PATTERNS.some((p) => p.test(text))) return "offensive_content";
  if (CONFIDENTIAL_PATTERNS.some((p) => p.test(text))) return "confidential_request";
  if (PROMPT_INJECTION_PATTERNS.some((p) => p.test(text))) return "prompt_injection";
  if (OUT_OF_SCOPE_PATTERNS.some((p) => p.test(text))) return "out_of_scope";
  return "unknown";
}

export function buildBlockedAnswer(reason) {
  switch (reason) {
    case "offensive_content":
      return "I'm here to help with UNIDO career-related questions. Please keep your queries professional and respectful.";
    case "confidential_request":
      return "I can only assist with publicly available UNIDO careers information. I cannot share confidential or personal data.";
    case "prompt_injection":
      return "I can only help with UNIDO careers information. How can I assist you with job opportunities or the application process?";
    case "out_of_scope":
      return "I specialise in UNIDO career opportunities, application processes, and eligibility criteria. Could you ask something related to UNIDO careers?";
    default:
      return "I can only help with publicly available UNIDO careers information. How can I assist you today?";
  }
}
