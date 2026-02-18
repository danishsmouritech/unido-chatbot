// Remove extra whitespace & newlines
const cleanText = (text = "") =>
  text.replace(/\s+/g, " ").trim();

// Remove duplicate lines (locations issue)
const cleanLocation = (text = "") => {
  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  return [...new Set(lines)][0] || "";
};

const cleanGrade = (text = "") => {
  text = cleanText(text);
  const half = text.length / 2;
  if (text.slice(0, half) === text.slice(half)) {
    return text.slice(0, half);
  }
  return text;
};
function extractByLabel(text, label) {
  const regex = new RegExp(`${label}\\s*:?\\s*([^\\n]+)`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}
// Normalize date
const cleanDeadline = (text = "") => {
  const d = new Date(text);
  if (isNaN(d)) return cleanText(text);
  return d.toISOString().split("T")[0];
};

export {
  cleanText,
  cleanLocation,
  cleanGrade,
  cleanDeadline,
  extractByLabel
};
