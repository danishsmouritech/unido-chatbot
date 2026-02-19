import runScraper from "../pipeline.js";
import { updateAdminSettingsRecord } from "./adminSettings.service.js";

const scrapeState = {
  lastStatus: "idle", // idle | running | success | error
  startedAt: null,
  finishedAt: null,
  lastError: null
};

export function getScrapeStatus() {
  return { ...scrapeState };
}

export async function triggerScrape() {
  if (scrapeState.lastStatus === "running") {
    return { started: false, status: getScrapeStatus() };
  }

  scrapeState.lastStatus = "running";
  scrapeState.startedAt = new Date();
  scrapeState.finishedAt = null;
  scrapeState.lastError = null;

  runScraper()
    .then(async () => {
      scrapeState.lastStatus = "success";
      scrapeState.finishedAt = new Date();

      await updateAdminSettingsRecord({
        lastScrapeAt: scrapeState.finishedAt
      });
    })
    .catch((error) => {
      scrapeState.lastStatus = "error";
      scrapeState.finishedAt = new Date();
      scrapeState.lastError =
        error?.message || "Unknown scraping error";
    });

  return { started: true, status: getScrapeStatus() };
}

