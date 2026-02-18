import runScraper from "../pipeline.js";
import { updateAdminSettingsRecord } from "./adminSettings.service.js";

const scrapeState = {
  running: false,
  startedAt: null,
  finishedAt: null,
  lastStatus: "idle",
  lastError: null
};

export function getScrapeStatus() {
  return { ...scrapeState };
}

export async function triggerScrape() {
  if (scrapeState.running) {
    return { started: false, status: getScrapeStatus() };
  }

  scrapeState.running = true;
  scrapeState.startedAt = new Date();
  scrapeState.lastStatus = "running";
  scrapeState.lastError = null;

  runScraper()
    .then(async () => {
      scrapeState.running = false;
      scrapeState.finishedAt = new Date();
      scrapeState.lastStatus = "success";
      await updateAdminSettingsRecord({ lastScrapeAt: scrapeState.finishedAt });
    })
    .catch((error) => {
      scrapeState.running = false;
      scrapeState.finishedAt = new Date();
      scrapeState.lastStatus = "error";
      scrapeState.lastError = error?.message || "Unknown scraping error";
    });

  return { started: true, status: getScrapeStatus() };
}
