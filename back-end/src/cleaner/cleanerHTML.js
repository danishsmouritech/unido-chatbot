import * as cheerio from "cheerio";
export function cleanHTML(rawHTML) {
  const $ = cheerio.load(rawHTML);
  // Remove unwanted elements
  $("script, style, header, footer, nav").remove();

  return $;
}
