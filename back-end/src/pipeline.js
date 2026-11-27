import { getBrowser } from "./utils/browser.js";
import { scrapeHomepage } from "./scraper/homepage.js";
import scrapeFaqs from "./scraper/faqs.js";
import { scrapeJobSearch } from "./scraper/jobSearch.js";
import { scrapeJobDetail } from "./scraper/jobDetail.js";
import scrapeAllCategories from "./scraper/scrapeAllCategories.js";
import { scrapeCategoryContent } from "./scraper/scrapeCategoryContent.js";
import { CONTENT_CATEGORIES } from "./constants/categoriesContent.js";
import { CAREER_CATEGORIES } from "./constants/careerCategories.js";
import { deleteOldCloudBackups, saveJSONBackup } from "./storage/file.storage.js";
import { createChunksByType } from "./chunking/chunker.js";
import {
  bulkIndexChunks,
  getIndexedChunks,
  deleteChunks
} from "./services/indexing.service.js";
import { assertVectorSearchConfig } from "./services/vectorSearch.service.js";
import { generateEmbedding } from "./services/embedding.service.js";
import { exportCareerCategories, exportCategoryContent, exportJobDetailLinks } from "./services/exportConstants.service.js";
import { logger } from "./utils/logger.js";
import path from "node:path";
import { pathToFileURL } from "node:url";
async function withEmbeddings(chunks = []) {
  const enriched = [];
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.content, "RETRIEVAL_DOCUMENT");
    enriched.push({
      ...chunk,
      embedding
    });
  }
  return enriched;
}

function validateScrapedData({ homepage, faqs, jobSummaries, jobDetails, categories, categoryContent }) {
  const errors = [];

  if (!homepage?.hero?.title?.trim() || !homepage?.hero?.description?.trim()) {
    errors.push("homepage title or description is missing");
  }
  if (!Array.isArray(homepage?.categories) || homepage.categories.length === 0) {
    errors.push("homepage returned no career categories");
  }
  if (!Array.isArray(faqs?.faqs) || faqs.faqs.length === 0 ||
      faqs.faqs.some(faq => !faq.question?.trim() || !faq.answer?.trim())) {
    errors.push("FAQ scrape returned no complete question/answer records");
  }
  if (!Array.isArray(jobSummaries) || jobSummaries.some(job => !job.jobDetailLink)) {
    errors.push("job summary scrape returned invalid records");
  }
  if (!Array.isArray(jobDetails) || jobDetails.length !== jobSummaries?.length ||
      jobDetails.some((detail, index) => !detail?.url || detail.url !== jobSummaries[index]?.jobDetailLink)) {
    errors.push("job detail scrape did not complete for every scraped job");
  }
  if (!Array.isArray(categories) || categories.length !== CAREER_CATEGORIES.length) {
    errors.push(`career category scrape incomplete (expected ${CAREER_CATEGORIES.length}, got ${categories?.length ?? 0})`);
  } else {
    const invalidCategories = categories.filter(category =>
      !category?.title || !category?.url || !category?.description?.trim()
    );
    if (invalidCategories.length) {
      errors.push(`career categories missing title, URL, or description: ${invalidCategories.map(category => category?.url || category?.title || "unknown category").join(", ")}`);
    }
  }
  if (!Array.isArray(categoryContent) || categoryContent.length !== CONTENT_CATEGORIES.length) {
    errors.push(`category content scrape incomplete (expected ${CONTENT_CATEGORIES.length}, got ${categoryContent?.length ?? 0})`);
  } else {
    const emptyPages = categoryContent.filter(content =>
      !content?.url || !Array.isArray(content.sections) ||
      !content.sections.some(section => section.paragraph?.trim() || section.list?.length || section.table?.rows?.length)
    );
    if (emptyPages.length) {
      errors.push(`category content missing URL or extracted text for: ${emptyPages.map(content => content?.url || content?.title || "unknown page").join(", ")}`);
    }
  }

  if (errors.length) {
    throw new Error(`Scrape validation failed; index was not changed: ${errors.join("; ")}`);
  }
}

function validateChunks(chunks = []) {
  if (!chunks.length) throw new Error("Chunk validation failed: scrape produced no chunks; index was not changed");
  const ids = new Set();
  for (const chunk of chunks) {
    if (!chunk?.id || !chunk.content?.trim()) {
      throw new Error("Chunk validation failed: found a chunk without an ID or content; index was not changed");
    }
    if (ids.has(chunk.id)) {
      throw new Error(`Chunk validation failed: duplicate chunk ID ${chunk.id}; index was not changed`);
    }
    ids.add(chunk.id);
  }
}

async function runScraper() {
  // assertVectorSearchConfig();
  const { browser, page } = await getBrowser();
  try {
    logger.log("Scraping all configured website sources...");
    const homepage = await scrapeHomepage(page);
    const faqs = await scrapeFaqs(page);
    const jobSummaries = await scrapeJobSearch(page);
    const jobDetails = [];
    for (const job of jobSummaries) {
      const detail = await scrapeJobDetail(page, job.jobDetailLink);
      jobDetails.push(detail);
    }
    const categories = await scrapeAllCategories();
    const categoryContent = [];
    for (const category of CONTENT_CATEGORIES) {
      const categoryData = await scrapeCategoryContent(category,page);
      categoryContent.push(categoryData);
      await new Promise(r => setTimeout(r, 1500));
    }

    logger.log("Validating that all configured sources completed...");
    validateScrapedData({ homepage, faqs, jobSummaries, jobDetails, categories, categoryContent });

    // Save source backups only after all source validation passes.
    exportCareerCategories(homepage.categories);
    exportJobDetailLinks(jobSummaries);
    exportCategoryContent(categories);
    await saveJSONBackup(homepage, "homepage", "data", "unido");
    await saveJSONBackup(faqs, "faqs", "data", "unido");
    await saveJSONBackup(jobSummaries, "jobSummaries", "data", "unido");
    await saveJSONBackup(jobDetails, "jobDetails", "data", "unido");
    await saveJSONBackup(categories, "categories", "data", "unido");
    await saveJSONBackup(categoryContent, "categoryContent", "data", "unido");

    logger.log("Creating and validating chunks...");
    const chunksByType = await createChunksByType({
      homepage,
      faqs,
      jobSummaries,
      categories,
      jobDetails,
      categoryContent
    });
    const scrapedChunks = Object.values(chunksByType).flat();
    validateChunks(scrapedChunks);
    for (const [type, chunks] of Object.entries(chunksByType)) {
      await saveJSONBackup(chunks, `${type}_chunks`, "chunks", "unido");
      logger.log(`Saved ${chunks.length} chunks for ${type}`);
    }
     const backupRetentionDays = Number(process.env.BACKUP_RETENTION_DAYS || 7);
    try {
      const { localDeleted, cloudDeleted } = await deleteOldCloudBackups(backupRetentionDays);
      logger.log(`Backup retention complete: deleted ${localDeleted} local and ${cloudDeleted} Cloud Storage JSON file(s) older than ${backupRetentionDays} day(s).`);
    } catch (cleanupError) {
      // Cleanup must not mark an already verified scrape and index as failed.
      logger.error("Backup retention cleanup failed:", cleanupError);
    }
    logger.log("Comparing validated chunks with Firestore...");
    const indexedChunks = await getIndexedChunks();
    const indexedById = new Map(indexedChunks.map(chunk => [chunk.id, chunk]));
    const scrapedIds = new Set(scrapedChunks.map(chunk => chunk.id));
    const changedChunks = scrapedChunks.filter(chunk =>
      indexedById.get(chunk.id)?.content !== chunk.content
    );
    const unchangedChunks = scrapedChunks.filter(chunk =>
      indexedById.get(chunk.id)?.content === chunk.content
    );

    logger.log(`Found ${changedChunks.length} new or changed chunks and ${unchangedChunks.length} unchanged chunks.`);
    // Unchanged chunks skip embedding and Vector Search upsert. Changed chunks
    // are all embedded before any index or Firestore writes begin.
    const chunksToSave = [
      ...unchangedChunks,
      ...(await withEmbeddings(changedChunks))
    ];

    logger.log("Upserting changed vectors and verifying Firestore/Vector Search writes...");
    await bulkIndexChunks(chunksToSave);

    // Deletions happen only after complete source validation and successful
    // read-back verification of the current chunks.
    const staleIds = indexedChunks
      .filter(chunk => !scrapedIds.has(chunk.id))
      .map(chunk => chunk.id);
    await deleteChunks(staleIds);
    // const backupRetentionDays = Number(process.env.BACKUP_RETENTION_DAYS || 7);
    // try {
    //   const { localDeleted, cloudDeleted } = await deleteOldCloudBackups(backupRetentionDays);
    //   logger.log(`Backup retention complete: deleted ${localDeleted} local and ${cloudDeleted} Cloud Storage JSON file(s) older than ${backupRetentionDays} day(s).`);
    // } catch (cleanupError) {
    //   // Cleanup must not mark an already verified scrape and index as failed.
    //   logger.error("Backup retention cleanup failed:", cleanupError);
    // }
    logger.log(`Verified ${scrapedChunks.length} current chunks; reused ${unchangedChunks.length} vectors; generated and indexed ${changedChunks.length} vectors; removed ${staleIds.length} stale chunks.`);
  } catch (err) {
    logger.error("Error during scraping:", err);
    throw err;
  } finally {
    await browser.close();
  }
}
const isDirectRun =process.argv[1] &&  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirectRun) {
  runScraper().catch(() => {
    // runScraper already logs the detailed error. Mark the process as failed
    // without producing a second, redundant unhandled-rejection stack trace.
    process.exitCode = 1;
  });
}

export default runScraper;
