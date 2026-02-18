import puppeteer from "puppeteer";
import { CAREER_CATEGORIES } from "../constants/careerCategories.js";
import { scrapeCategory } from "./scrapeCategory.js";
async function scrapeAllCategories() {
  const browser= await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const results = [];
  try {
    for (const category of CAREER_CATEGORIES) {
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
      );

      try {
        const data = await scrapeCategory(page, category);
        results.push(data);
      } catch (err) {
        console.error(`Category failed: ${category.key}`, err.message);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  return results;
}
export default scrapeAllCategories;
