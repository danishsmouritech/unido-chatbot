import { cleanHTML }  from "../cleaner/cleanerHTML.js";
import { URLS } from "../constants/urls.js";
export async function scrapeHomepage(page) {
  await page.goto(URLS.CAREERS_HOME, {
    waitUntil: "networkidle2",
  });
  const html = await page.content();
  const $ = cleanHTML(html);
  const heroTitle = $("div.customPlugin h1").first().text().trim();
  const heroDescription = $("div.customPlugin p").first().text().trim();
  const ctaLink = $("a")
    .filter((_, el) => $(el).text().toLowerCase().includes("view all job openings"))
    .attr("href");
  const categories = [];
  $("div.threeimagecaption a").each((_, el) => {
    const title = $(el).text().trim();
    const href = $(el).attr("href");
    if (title && href) {
      categories.push({
        title,
        url: href.startsWith("http")
          ? href
          : new URL(href, URLS.CAREERS_BASE).href,
      });
    }
  });
  const uniqueCategories = Array.from(
    new Map(categories.map((item) => [item.url, item])).values()
  );

  const data = {
    page: "homepage",
    hero: {
      title: heroTitle,
      description: heroDescription,
    },
    cta: {
      label: "View all job openings",
      url: ctaLink ? new URL(ctaLink, URLS.CAREERS_BASE).href : null,
    },
    categories: uniqueCategories
  };

  return data;
}

