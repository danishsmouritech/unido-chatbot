import puppeteer from "puppeteer";
export async function getBrowser() {
 const browser = await puppeteer.launch({
   headless: true,
    slowMo: 40,
    defaultViewport: null,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--start-maximized"
   ]
      });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
  );

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false
    });
  });
  await page.setExtraHTTPHeaders({
    "accept-language": "en-US,en;q=0.9"
  });


  return { browser, page };
}
