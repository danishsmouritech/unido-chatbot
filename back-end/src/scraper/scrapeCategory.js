import { cleanHTML }  from "../cleaner/cleanerHTML.js";
import { cleanText } from "../scraper/jobCleaner.js";
import { URLS } from "../constants/urls.js";
export async function scrapeCategory(page, category) {
  await page.goto(category.url, {
    waitUntil: "networkidle2",
    timeout: 60000
  });

  const html = await page.content();
  const $ = cleanHTML(html);
  const descriptionParts = [];

  $(".inner.col-sm-6 p").each((_, p) => {
    const text = cleanText($(p).text());
    if (text) descriptionParts.push(text);
  });

  const description = descriptionParts.join(" ");
  const learnMoreHref = $('a[href*="/content/"]').first().attr("href");

  const learnMoreUrl = learnMoreHref
    ? learnMoreHref.startsWith("http")
      ? learnMoreHref
      : `${URLS.CAREERS_BASE}${learnMoreHref}`
    : "";
  const jobs = [];

  $("table tbody tr").each((_, row) => {
    const cols = $(row).find("td");
    if (cols.length < 5) return;

    const jobLink = $(cols[0]).find("a").attr("href");

    jobs.push({
      title: cleanText($(cols[0]).text()),
      location: cleanText($(cols[1]).text()),
      category: cleanText($(cols[2]).text()),
      grade: cleanText($(cols[3]).text()),
      deadline: cleanText($(cols[4]).text()),
      url: jobLink
        ? `${URLS.CAREERS_BASE}${jobLink}`
        : null
    });
  });

  return {
    type: "job_category",
    key: category.key,
    title: category.title,
    url: category.url,
    description,
    learnMoreUrl,
    totalJobs: jobs.length,
    jobs
  };
}
