const BLOCKED_PAGE_PATTERN =
  /captcha|verify you are human|access denied|temporarily blocked|unusual traffic/i;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function gotoScrapePage(page, url, options = {}) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
        ...options
      });

      if (!response) {
        throw new Error(`No response received for ${url}`);
      }

      const status = response.status();

      if (status === 429 || status >= 500) {
        throw new Error(`Temporary HTTP error ${status} for ${url}`);
      }

      if (!response.ok()) {
        throw new Error(`Non-retryable HTTP error ${status} for ${url}`);
      }

      await page.waitForSelector("body", { timeout: 10000 });

      const bodyText = await page.evaluate(
        () => document.body?.innerText || ""
      );

      if (bodyText.trim().length < 30) {
        throw new Error(`Page returned insufficient text: ${url}`);
      }

      if (BLOCKED_PAGE_PATTERN.test(bodyText)) {
        throw new Error(`Possible CAPTCHA or blocked page: ${url}`);
      }

      return response;
    } catch (error) {
      const message = error.message || "";

      const retryable =
        /ERR_CONNECTION_RESET|ERR_CONNECTION_CLOSED|ERR_TIMED_OUT|Navigation timeout|Temporary HTTP error|Target closed/i.test(message);

      if (!retryable || attempt === maxAttempts) {
        throw error;
      }

      const waitMs = attempt * 3000;
      console.warn(
        `Attempt ${attempt}/${maxAttempts} failed for ${url}. Retrying in ${waitMs}ms: ${message}`
      );

      await delay(waitMs);
    }
  }
}