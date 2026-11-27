import { cleanHTML }  from "../cleaner/cleanerHTML.js";
import {
  cleanText,
  cleanLocation,
  cleanGrade,
  cleanDeadline
} from "./jobCleaner.js";
import { URLS } from "../constants/urls.js";
import { gotoScrapePage } from "../utils/scrapeNavigation.js";
const BASE = URLS.CAREERS_HOME;

export async function scrapeJobSearch(page) {
  const jobs = [];
  let pageNum = 0;
  let hasNext = true;

  while (hasNext) {
    const url = `${URLS.JOB_SEARCH}?startrow=${pageNum * 25}`;
    await gotoScrapePage(page, url, { waitUntil: "networkidle2", timeout: 60000});
    const html = await page.content();
    const $ = cleanHTML(html);

    const rows = $("tr.data-row");
    if (pageNum === 0 && rows.length === 0) {
      const pageText = $("body").text().replace(/\s+/g, " ").trim();
      const explicitNoResults = /no\s+(current\s+)?(job|vacanc|position)|no results|0\s+(open\s+)?jobs/i.test(pageText);
      if (!explicitNoResults) {
        throw new Error("Job-search page had no recognized job rows or explicit no-results message; refusing to treat it as an empty job list");
      }
    }

    rows.each((_, el) => {
      const titleEl = $(el).find("a.jobTitle-link").first();
      const href = titleEl.attr("href");

      if (!href) return;

      jobs.push({
        jobTitle: cleanText(titleEl.text()),
        location: cleanLocation($(el).find(".jobLocation").text()),
        department: cleanText($(el).find(".jobDepartment").text()),
        grade: cleanGrade($(el).find(".jobFacility").text()),
        deadline: cleanDeadline($(el).find(".jobShifttype").text()),
        jobDetailLink: new URL(href, BASE).href
      });
    });

    hasNext = rows.length === 25;
    pageNum++;
  }

  return jobs;
}
