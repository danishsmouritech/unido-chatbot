import { cleanHTML } from "../cleaner/cleanerHTML.js";
import { gotoScrapePage } from "../utils/scrapeNavigation.js";
const cleanText = (text = "") =>
  text.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();

export async function scrapeCategoryContent(category,page) {

    await gotoScrapePage(page, category.url);

    const html = await page.content();
    const $ = cleanHTML(html);
  
   
    const contentContainer = $(".container").filter((_, element) =>
      $(element).find("h1, h2").length > 0
    ).first();
    const container = contentContainer.length ? contentContainer : $(".container").first();

    //  TITLE (works for both layouts)
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
    container.find(".jpo-section").each((_, section) => {
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

      const tableRows = $(section).find("table").toArray().flatMap(table => {
        const rows = $(table).find("tr").toArray().map(row =>
          $(row).find("th, td").toArray().map(cell => cleanText($(cell).text()))
        ).filter(row => row.some(Boolean));
        if (rows.length < 2) return [];

        const firstRow = rows[0];
        const firstRowIsHeader = $(table).find("tr").first().find("th").length > 0 ||
          firstRow.some(value => /grade|experience|education|nationality|\bage\b|language/i.test(value));
        const columns = firstRowIsHeader
          ? firstRow
          : firstRow.map((_, index) => `Column_${index + 1}`);
        const dataRows = firstRowIsHeader ? rows.slice(1) : rows;

        return dataRows.map(row => Object.fromEntries(
          columns.map((column, index) => [column, row[index] || ""]).filter(([, value]) => value)
        ));
      });
      if (tableRows.length) sectionObj.table = { rows: tableRows };

      const resourceLinks = $(section).find("a").toArray().map(anchor => {
        const label = cleanText($(anchor).text());
        const href = $(anchor).attr("href")?.trim();
        if (!href || href.startsWith("#") || /^javascript:/i.test(href)) return label;
        let url = href;
        try { url = new URL(href, category.url).href; } catch { /* Keep the scraped href. */ }
        return !label || label === href || label === url ? url : `${label}: ${url}`;
      }).filter(Boolean);
      const tableValues = tableRows.flatMap(row => Object.values(row)).join(" ");
      const missingResources = resourceLinks.filter(resource => {
        const url = resource.split(": ").at(-1);
        return !paragraphText.includes(url) && !tableValues.includes(url) && !list.includes(resource);
      });
      if (missingResources.length) sectionObj.list = [...(sectionObj.list || []), ...missingResources];

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

    // International Professionals and some other pages use standard HTML
    // headings and paragraphs rather than the site's .jpo-section markup.
    if (!sections.some(section => section.paragraph || section.list?.length || section.table?.rows?.length)) {
      sections.length = 0;
      let current = null;
      const ensureSection = () => {
        if (!current) {
          current = { heading: "Overview" };
          sections.push(current);
        }
        return current;
      };
      const isBoilerplate = text =>
        /cookie consent manager|required cookies|jsessionid|accept all cookies/i.test(text);

      container.find("h2, h3, h4, p, ul, ol, table").each((_, element) => {
        const node = $(element);
        const tagName = element.tagName?.toLowerCase();
        const text = cleanText(node.text());
        if (!text || isBoilerplate(text)) return;

        if (["h2", "h3", "h4"].includes(tagName)) {
          if (text.toLowerCase() === title?.toLowerCase()) return;
          current = { heading: text };
          sections.push(current);
          return;
        }

        if (tagName === "p") {
          if (node.closest("li, table").length) return;
          const section = ensureSection();
          section.paragraph = [section.paragraph, text].filter(Boolean).join(" ");
          return;
        }

        if (tagName === "ul" || tagName === "ol") {
          const items = node.children("li").map((__, item) => cleanText($(item).text())).get().filter(Boolean);
          if (items.length) {
            const section = ensureSection();
            section.list = [...(section.list || []), ...items];
          }
          return;
        }

        if (tagName === "table") {
          const rows = node.find("tr").toArray().map(row =>
            $(row).find("th, td").toArray().map(cell => cleanText($(cell).text()))
          );
          const nonEmptyRows = rows.filter(row => row.some(Boolean));
          if (nonEmptyRows.length < 2) return;

          const headers = nonEmptyRows[0].map(value => value.toLowerCase());
          const gradeIndex = headers.findIndex(value => value.includes("grade"));
          const experienceIndex = headers.findIndex(value => value.includes("experience"));
          const dataRows = nonEmptyRows.slice(1);
          const section = ensureSection();
          if (gradeIndex >= 0 && experienceIndex >= 0) {
            section.table = {
              rows: dataRows.map(row => ({
                grade: row[gradeIndex] || "",
                experience: row[experienceIndex] || ""
              })).filter(row => row.grade || row.experience)
            };
          } else {
            const lines = dataRows.map(row => row.filter(Boolean).join(": ")).filter(Boolean);
            if (lines.length) section.list = [...(section.list || []), ...lines];
          }
        }
      });
    }
    const finalData = {
      title,
      url: category.url,
      sections
    };

    return finalData;
}
