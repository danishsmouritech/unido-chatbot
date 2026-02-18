
import crypto from "crypto";

// UTILITIES


function clean(text = "") {
  return text.replace(/\s+/g, " ").trim();
}

function splitIntoSentences(text = "") {
  const cleaned = clean(text);

  return (
    cleaned
      .replace(/([a-z])\.([A-Z])/g, "$1. $2")
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []
  );
}

function splitText(text = "", options = {}) {
  const { maxLength = 1000, overlapSentences = 1 } = options;

  const sentences = splitIntoSentences(text);
  const chunks = [];

  let currentChunk = [];
  let currentLength = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceLength = sentence.length;

    if (currentLength + sentenceLength > maxLength && currentChunk.length) {
      chunks.push(currentChunk.join(" ").trim());

      // Overlap
      currentChunk = currentChunk.slice(-overlapSentences);
      currentLength = currentChunk.join(" ").length;
    }

    currentChunk.push(sentence);
    currentLength += sentenceLength;
  }

  if (currentChunk.length) {
    chunks.push(currentChunk.join(" ").trim());
  }

  return chunks;
}

function generateId(text = "") {
  return crypto.createHash("sha256").update(text).digest("hex");
}
  // STANDARD CHUNK FORMAT


function createChunk({ baseId, content, metadata, chunkIndex, totalChunks }) {
  const cleanedContent = clean(content);

  return {
    id: `${baseId}_${chunkIndex}`,
    content: cleanedContent,
    metadata: {
      ...metadata,
      chunk_index: chunkIndex,
      total_chunks: totalChunks,
      content_length: cleanedContent.length,
      embedding_version: "v1",
      source: "unido_careers"
    }
  };
}
//homepage
function chunkHomepage(homepage = {}) {
  const chunks = [];

  if (homepage.hero) {
    const heroText = `
UNIDO Careers.
Title: ${homepage.hero.title}.
Description: ${homepage.hero.description}.
    `;

    const parts = splitText(heroText);

    parts.forEach((part, index) => {
      chunks.push(
        createChunk({
          baseId: "homepage_hero",
          content: part,
          metadata: {
            page: "homepage",
            doc_type: "hero",
            section: "hero"
          },
          chunkIndex: index + 1,
          totalChunks: parts.length
        })
      );
    });
  }

  if (homepage.cta) {
    const content = `
UNIDO provides an online career portal where candidates can view and apply for job openings.
Call to action: ${homepage.cta.label}.
    `;

    chunks.push({
      id: "homepage_cta_1",
      content: clean(content),
      metadata: {
        page: "homepage",
        doc_type: "cta",
        url: homepage.cta.url,
        chunk_index: 1,
        total_chunks: 1
      }
    });
  }

  homepage.categories?.forEach((cat) => {
    const baseId = generateId(cat.url);

    chunks.push({
      id: `homepage_category_${baseId}`,
      content: clean(
        `UNIDO offers career opportunities under the ${cat.title} category.`
      ),
      metadata: {
        page: "homepage",
        doc_type: "category",
        title: cat.title,
        url: cat.url,
        chunk_index: 1,
        total_chunks: 1
      }
    });
  });

  return chunks;
}

  // FAQ CHUNKING
function chunkFaqs(faqData = {}) {
  const chunks = [];

  faqData?.faqs?.forEach((faq) => {
    const combinedText = `
Question: ${faq.question}
Answer: ${faq.answer}
    `;

    const parts = splitText(combinedText);
    const baseId = `faq_${generateId(faq.question)}`;

    parts.forEach((part, index) => {
      chunks.push(
        createChunk({
          baseId,
          content: part,
          metadata: {
            page: "faqs",
            doc_type: "faq",
            question: clean(faq.question)
          },
          chunkIndex: index + 1,
          totalChunks: parts.length
        })
      );
    });
  });

  return chunks;
}

// JOB SUMMARIES

function chunkJobSummaries(jobSummaries = []) {
  const chunks = [];

  jobSummaries.forEach((job) => {
    const text = `
UNIDO is hiring for the position of ${job.jobTitle}.
Location: ${job.location}.
Department: ${job.department || "Not specified"}.
Grade level: ${job.grade}.
Application deadline: ${job.deadline}.
Apply through the official UNIDO careers portal.
    `;

    const parts = splitText(text);
    const baseId = `job_summary_${generateId(job.jobDetailLink)}`;

    parts.forEach((part, index) => {
      chunks.push(
        createChunk({
          baseId,
          content: part,
          metadata: {
            page: "job-summary",
            doc_type: "job_summary",
            jobTitle: job.jobTitle,
            location: job.location,
            department: job.department || null,
            grade: job.grade,
            deadline: job.deadline,
            url: job.jobDetailLink
          },
          chunkIndex: index + 1,
          totalChunks: parts.length
        })
      );
    });
  });

  return chunks;
}

//JOB DETAILS

function chunkJobDetails(jobs = []) {
  const chunks = [];
  const MAX_CHARS = 1200;

  jobs.forEach((job) => {
    const jobBaseId = `job_detail_${generateId(job.url || job.requisitionId)}`;

    job.sections?.forEach((section, sectionIndex) => {
      if (!section.content) return;

      const formattedText = `
Job Title: ${job.title}
Requisition ID: ${job.requisitionId}
Grade: ${job.grade}
Location: ${job.dutyStation}, ${job.country}
Category: ${job.category}

Section: ${section.heading || "General"}

${section.content}
      `;

      const parts = splitText(formattedText, {
        maxLength: MAX_CHARS,
        overlapSentences: 1
      });

      parts.forEach((part, index) => {
        chunks.push(
          createChunk({
            baseId: `${jobBaseId}_${sectionIndex}`,
            content: part,
            metadata: {
              page: "job-detail",
              doc_type: "job_detail",
              title: job.title,
              requisitionId: job.requisitionId,
              grade: job.grade,
              country: job.country,
              dutyStation: job.dutyStation,
              category: job.category,
              section: section.heading || "General",
              url: job.url
            },
            chunkIndex: index + 1,
            totalChunks: parts.length
          })
        );
      });
    });
  });

  return chunks;
}
function chunkJobCategories(categories = []) {
  const chunks = [];

  categories.forEach((category) => {
    const overviewText = `
Category: ${category.title}.
Description: ${category.description}.
This category currently has ${category.totalJobs} open positions.
    `;

    const overviewParts = splitText(overviewText);
    const categoryBaseId = generateId(category.url);

    overviewParts.forEach((part, index) => {
      chunks.push(
        createChunk({
          baseId: `category_${categoryBaseId}`,
          content: part,
          metadata: {
            page: "job-category",
            doc_type: "category_overview",
            category_key: category.key,
            category_title: category.title,
            total_jobs: category.totalJobs,
            url: category.url,
            learn_more_url: category.learnMoreUrl
          },
          chunkIndex: index + 1,
          totalChunks: overviewParts.length
        })
      );
    });

    if (category.learnMoreUrl) {
      chunks.push({
        id: `category_learnmore_${categoryBaseId}`,
        content: clean(
          `Learn more about ${category.title} opportunities at UNIDO by visiting the official information page.`
        ),
        metadata: {
          page: "job-category",
          doc_type: "category_learn_more",
          category_key: category.key,
          category_title: category.title,
          url: category.learnMoreUrl,
          chunk_index: 1,
          total_chunks: 1
        }
      });
    }
    category.jobs?.forEach((job) => {

      const jobText = `
UNIDO is hiring under the ${category.title} category.
Position: ${job.title}.
Location: ${job.location}.
Grade: ${job.grade}.
Application deadline: ${job.deadline}.
      `;

      const jobParts = splitText(jobText);
      const jobBaseId = generateId(job.url);

      jobParts.forEach((part, index) => {
        chunks.push(
          createChunk({
            baseId: `category_job_${jobBaseId}`,
            content: part,
            metadata: {
              page: "job-category",
              doc_type: "category_job",
              category_key: category.key,
              category_title: category.title,
              job_title: job.title,
              location: job.location,
              grade: job.grade,
              deadline: job.deadline,
              url: job.url
            },
            chunkIndex: index + 1,
            totalChunks: jobParts.length
          })
        );
      });

    });

  });

  return chunks;
}
// CATEGORY CONTENT

function chunkCategoryContent(data = []) {
  const chunks = [];

  data.forEach((category) => {
    const categoryTitle = category.title || "General Information";
    const baseId = `category_content_${generateId(category.url || categoryTitle)}`;

    category.sections?.forEach((section, sectionIndex) => {
      let contentParts = [];

      if (section.heading)
        contentParts.push(`Section: ${section.heading}`);

      if (section.paragraph)
        contentParts.push(section.paragraph.trim());

      if (section.table?.rows) {
        const tableText = section.table.rows
          .map((row) => `- ${row.grade}: ${row.experience}`)
          .join("\n");

        contentParts.push(`Work experience requirements:\n${tableText}`);
      }

      if (section.list?.length > 0) {
        const listText = section.list
          .map((item) => `- ${item}`)
          .join("\n");

        contentParts.push(`Key points:\n${listText}`);
      }

      const fullContent = `
Category: ${categoryTitle}

${contentParts.join("\n\n")}
      `;

      const parts = splitText(fullContent);

      parts.forEach((part, index) => {
        chunks.push(
          createChunk({
            baseId: `${baseId}_${sectionIndex}`,
            content: part,
            metadata: {
              page: "career-category",
              doc_type: "category_content",
              category: categoryTitle,
              section: section.heading || "overview",
              url: category.url || null
            },
            chunkIndex: index + 1,
            totalChunks: parts.length
          })
        );
      });
    });
  });

  return chunks;
}
// sharing data to all pages
export function createChunksByType(data) {
  return {
    homepage: chunkHomepage(data.homepage),
    faqs: chunkFaqs(data.faqs),
    jobSummaries: chunkJobSummaries(data.jobSummaries),
    jobCategories: chunkJobCategories(data.categories),
    jobDetails: chunkJobDetails(data.jobDetails),
    categoryContent: chunkCategoryContent(data.categoryContent)
  };
}
