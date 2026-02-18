export function isBlockedQuery(question = "") {
  const text = String(question).toLowerCase();

  const offensivePatterns = [
    /\b(fuck|shit|bitch|bastard|asshole|idiot|moron)\b/i,
    /\b(hate|racist|racism|sexist)\b/i
  ];

  const confidentialPatterns = [
    /\b(confidential|internal|private document|leak|classified|secret)\b/i,
    /\b(staff salary list|employee data|personal data|passport|ssn)\b/i
  ];

  return [...offensivePatterns, ...confidentialPatterns]
    .some(pattern => pattern.test(text));
}

export function buildBlockedAnswer() {
  return "I can only help with publicly available UNIDO careers information.";
}
