import { cleanHTML } from "../cleaner/cleanerHTML.js";
import{ getBrowser } from "../utils/browser.js";
import * as cheerio from "cheerio";
const cleanText = (text = "") =>
  text.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();

export async function scrapeCategoryContent(category) {
  const { browser, page } = await getBrowser();

  try {
    await page.goto(category.url, {
      waitUntil: "networkidle2",
      timeout: 30000
    });

    const html = await page.content();
    const $ = cleanHTML(html);
  
   
    const container = $(".container").first();

    // ✅ TITLE (works for both layouts)
    let title =
      cleanText(container.find("h1").first().text()) ||
      cleanText(container.find("h2").first().text()) ||
      cleanText(container.find("th").first().text()) ||
      null;
    const sections = [];

    /* ----------------------------------
       Extract Sections
    ---------------------------------- */
  if (container.find(".jpo-section").length){
    $(".jpo-section").each((_, section) => {
      const heading =
        cleanText($(section).find(".jpo-heading").first().text()) || null;

      const paragraphs = [];
      $(section)
        .find(".jpo-para")
        .each((_, p) => {
          const text = cleanText($(p).text());
          if (text) paragraphs.push(text);
        });

      const list = [];
      $(section)
        .find("ul li, ol li")
        .each((_, li) => {
          const text = cleanText($(li).text());
          if (text) list.push(text);
        });

      const paragraphText = paragraphs.join(" ").trim();

      const sectionObj = {
        heading,
      };

      if (paragraphText) sectionObj.paragraph = paragraphText;
      if (list.length) sectionObj.list = list;

      sections.push(sectionObj);
    });
    } 
    /* ----------------------------------
       Extract Tables
    ---------------------------------- */

    const tables = [];

    $("table").each((_, table) => {
      const headers = [];
      $(table)
        .find("th")
        .each((_, th) => {
          const text = cleanText($(th).text());
          if (text) headers.push(text);
        });

      const rows = [];

      $(table)
        .find("tbody tr")
        .each((_, tr) => {
          const row = {};
          $(tr)
            .find("td")
            .each((i, td) => {
              const key = headers[i] || `Column_${i + 1}`;
              const value = cleanText($(td).text());
              row[key] = value;
            });

          if (Object.keys(row).length) rows.push(row);
        });

      if (rows.length) {
        tables.push({
          columns: headers,
          rows
        });
      }
    });

    /* ----------------------------------
       Remove Cookie / Provider Tables
    ---------------------------------- */

    const validTables = tables.filter(t => {
      const text = JSON.stringify(t.rows).toLowerCase();
      if (text.includes("cookie")) return false;
      if (text.includes("jsessionid")) return false;
      if (text.includes("provider")) return false;
      return true;
    });

    const gradeTable = validTables.find(t =>
      t.columns.join(" ").toLowerCase().includes("grade")
    );

    if (gradeTable) {
      sections.forEach(section => {
        if (
          section.heading &&
          section.heading.toLowerCase().includes("work experience")
        ) {
          section.table = {
            columns: gradeTable.columns,
            rows: gradeTable.rows.map(row => {
              const keys = Object.keys(row);
              return {
                grade: row[keys[0]],
                experience: row[keys[1]]
              };
            })
          };
        }
      });
    }


    const finalData = {
      title,
      sections
    };

    return finalData;

  } finally {
    await browser.close();
  }
}
