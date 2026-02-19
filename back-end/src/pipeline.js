import { getBrowser } from "./utils/browser.js";
import { scrapeHomepage } from "./scraper/homepage.js";
import scrapeFaqs from "./scraper/faqs.js";
import { scrapeJobSearch } from "./scraper/jobSearch.js";
import { scrapeJobDetail } from "./scraper/jobDetail.js";
import scrapeAllCategories from "./scraper/scrapeAllCategories.js";
import { scrapeCategoryContent } from "./scraper/scrapeCategoryContent.js";
import { CONTENT_CATEGORIES } from "./constants/categoriesContent.js";
import { writeFileSync } from "fs";
import { saveJSONBackup } from "./storage/file.storage.js";
import { createChunksByType } from "./chunking/chunker.js";
import { bulkIndexChunks } from "./services/indexing.service.js";
import { ensureChunkIndex } from "./services/elasticsearch.service.js";
import { generateEmbedding } from "./services/embedding.service.js";

async function withEmbeddings(chunks = []) {
  const enriched = [];
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.content);
    enriched.push({
      ...chunk,
      embedding
    });
  }
  return enriched;
}

async function runScraper() {
  const { browser, page } = await getBrowser();
  try {
    // Homepage
    const homepage = await scrapeHomepage(page);
    await saveJSONBackup(homepage, "homepage","data","unido");
    // FAQs
    const faqs = await scrapeFaqs(page);
    await saveJSONBackup(faqs, "faqs","data","unido");
    // Job summaries
    const jobSummaries = await scrapeJobSearch(page);
    await saveJSONBackup(jobSummaries, "jobSummaries","data","unido");
     // Job details
    const jobDetails = [];
    const jobDetailLinksArr = [];
    for (const job of jobSummaries) {
      const detail = await scrapeJobDetail(page, job.jobDetailLink);
      jobDetails.push(detail);
      jobDetailLinksArr.push({ jobTitle: job.jobTitle, jobDetailLink: job.jobDetailLink });
      await new Promise(r => setTimeout(r, 1500));
    }
    await saveJSONBackup(jobDetails, "jobDetails","data","unido");
    // Write job detail links to constants file
    const jobLinksExport = 'export const JOB_DETAIL_LINKS = ' + JSON.stringify(jobDetailLinksArr, null, 2) + ';\n';
    writeFileSync('src/constants/jobDetailslinks.js', jobLinksExport, 'utf-8');

    // Categories
    const categories = await scrapeAllCategories();
    await saveJSONBackup(categories, "categories","data","unido");
    // Category content
    const categoryContent = [];
    for (const category of CONTENT_CATEGORIES) {
      const categoryData = await scrapeCategoryContent(category);
      categoryContent.push(categoryData);
      await new Promise(r => setTimeout(r, 1500));
    }
    await saveJSONBackup(categoryContent, "categoryContent","data","unido");
    
    // Create chunks by type (now with embeddings)
  console.log(" Creating chunks with embeddings...");
const chunksByType = await createChunksByType({
  homepage,
  faqs,
  jobSummaries,
  categories,
  jobDetails,
  categoryContent
});

// Save chunks using storage helper
for (const [type, chunks] of Object.entries(chunksByType)) {
  await saveJSONBackup(
    chunks,
    `${type}_chunks`,
    "chunks",
    "unido"
  );
  console.log(` Saved ${chunks.length} chunks for ${type}`);
    }
    // checks whether the index exists in Elasticsearch, and if not, creates it with the correct vector (dense_vector) mapping so your chunks can be stored and searched semantically.
    await ensureChunkIndex();
    console.log(" Indexing chunks into Elasticsearch...");

    for (const chunks of Object.values(chunksByType)) {
  // Sends chunks (content + embedding + metadata) to Elasticsearch.
  const chunksWithEmbeddings = await withEmbeddings(chunks);
  await bulkIndexChunks(chunksWithEmbeddings);
}
    console.log("All chunks indexed into Elasticsearch");
    const totalChunks = Object.values(chunksByType).reduce((sum, arr) => sum + arr.length, 0);
    console.log(` Total chunks created: ${totalChunks}`);
  } catch (err) {
    console.error("Error during scraping:", err);
    throw err;
  } finally {
    await browser.close();
  }
}
const isDirectRun =process.argv[1] && new URL(`file://${process.argv[1].replace(/\\/g, "/")}`).href === import.meta.url;

if (isDirectRun) {
  runScraper();
}

export default runScraper;
