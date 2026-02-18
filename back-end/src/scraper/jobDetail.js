
import { cleanHTML }  from "../cleaner/cleanerHTML.js";


const clean = (t = "") =>
  t.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();

function extractMetaMap(text) {
  const map = {};
  const labels = [
    "Requisition ID",
    "Grade",
    "Country",
    "Duty Station",
    "Category",
    "Type of Job Posting",
    "Employment Type",
    "Appointment Type",
    "Indicative Minimum Net Annual Salary",
    "Application Deadline"
  ];

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const next = labels[i + 1];

    const regex = new RegExp(
      `${label}\\s*:\\s*(.*?)${next ? `(?=${next}\\s*:)` : "$"}`,
      "i"
    );

    const match = text.match(regex);
    if (match) map[label] = clean(match[1]);
  }

  return map;
}

function extractDeadline(text) {
  const match = text.match(
    /\d{1,2}-[A-Za-z]{3}-\d{4},\s*\d{1,2}:\d{2}\s*(AM|PM)\s*\(.*?time\)/i
  );
  return match ? clean(match[0]) : null;
}

function extractInlineSection(fullText, label) {
  const regex = new RegExp(
    `${label}\\s*:\\s*(.*?)(?=Languages\\s*:|Education\\s*:|Experience\\s*:|For further information|REQUIRED COMPETENCIES|$)`,
    "i"
  );

  const match = fullText.match(regex);
  return match ? clean(match[1]) : null;
}



function extractSections(text) {
  const sections = [];

  const HEADERS = [
    "Vacancy Announcement",
    "ORGANIZATIONAL CONTEXT",
    "PROJECT CONTEXT",
    "FUNCTIONAL RESPONSIBILITIES",
    "MINIMUM ORGANIZATIONAL REQUIREMENTS",
    "REQUIRED COMPETENCIES"
  ];

  for (let i = 0; i < HEADERS.length; i++) {
    const start = HEADERS[i];
    const end = HEADERS[i + 1];

    const startIdx = text.indexOf(start);
    if (startIdx === -1) continue;

    const slice = text.slice(startIdx + start.length);
    const endIdx = end ? slice.indexOf(end) : -1;

    const content = endIdx === -1 ? slice : slice.slice(0, endIdx);

    sections.push({
      heading:
        start === "MINIMUM ORGANIZATIONAL REQUIREMENTS"
          ? "Organizational Requirements and Desirable Criteria"
          : start,
      content: clean(content)
    });
  }

  return sections;
}


export async function scrapeJobDetail(page, jobUrl) {
  await page.goto(jobUrl, { waitUntil: "networkidle2", timeout: 60000 });

  const html = await page.content();
  const $ = cleanHTML(html);

  const container = $(".jobdescription");

  const title =
    clean($("h1 span[itemprop='title']").text()) ||
    clean($("h1").text());
  const metaText = clean(container.find("p").first().text());
  const meta = extractMetaMap(metaText);
  const fullText = clean(container.text());
  const languages = extractInlineSection(fullText, "Languages");
  const education = extractInlineSection(fullText, "Education");
  const experience = extractInlineSection(fullText, "Experience");

  let cleanText = fullText
    .replace(/Languages\s*:.*?(?=Education|Experience|For further information|REQUIRED COMPETENCIES|$)/i, "")
    .replace(/Education\s*:.*?(?=Experience|For further information|REQUIRED COMPETENCIES|$)/i, "")
    .replace(/Experience\s*:.*?(?=For further information|REQUIRED COMPETENCIES|$)/i, "");

  let sections = extractSections(cleanText);

  if (languages)
    sections.unshift({ heading: "Languages", content: languages });

  if (education)
    sections.push({ heading: "Education", content: education });

  if (experience)
    sections.push({ heading: "Experience", content: experience });

  return {
    type: "job_detail",
    url: jobUrl,
    title,
    requisitionId: meta["Requisition ID"] || null,
    grade: meta["Grade"] || null,
    country: meta["Country"] || null,
    dutyStation: meta["Duty Station"] || null,
    category: meta["Category"] || null,
    jobPostingType: meta["Type of Job Posting"] || null,
    employmentType: meta["Employment Type"] || null,
    appointmentType: meta["Appointment Type"] || null,
    salary: meta["Indicative Minimum Net Annual Salary"] || null,
    deadline: meta["Application Deadline"] || extractDeadline(metaText),
    sections
  };
}
