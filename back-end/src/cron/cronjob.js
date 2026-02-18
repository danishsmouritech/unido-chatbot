import cron from "node-cron";
import { triggerScrape } from "../services/scrape.service.js";
// Schedule the scraper to run every day at 12:00 AM
// Seconds (optional): 0 - 59
// Minute: 0 - 59
// Hour: 0 - 23
// Day of the Month: 1 - 31
// Month: 1 - 12
// Day of the week: 0 - 7 (0,7 are Sunday)
cron.schedule("0 0 * * *", () => {
  console.log("Starting UNIDO scraping job at midnight...");
  triggerScrape();
},{
  timezone: process.env.CRON_TIMEZONE || "UTC"
});
