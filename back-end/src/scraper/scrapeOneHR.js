import { URLS } from "../constants/urls.js";
import { cleanHTML } from "../cleaner/cleanerHTML.js";

export async function scrapeOneHR(page) {

  await page.goto(URLS.ONEHR, {
    waitUntil: "networkidle2",
    timeout: 60000
  });

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log("Current URL:", page.url());


  const rawHTML = await page.content();

  // Clean HTML
  const $ = cleanHTML(rawHTML);
  console.log("Cleaned HTML length:", $);
  // Get cleaned text
  const cleanedText = $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim();

  const onehr = await page.evaluate(() => {


    const title = document.title;

    const text = document.body.innerText
      .replace(/\r/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const tables = [...document.querySelectorAll("table")]
      .map((table, tableIndex) => {

        const rows = [...table.querySelectorAll("tr")]
          .map(row => {

            return [...row.querySelectorAll("th, td")]
              .map(cell =>
                cell.innerText.trim()
              );

          })
          .filter(row => row.length > 0);

        return {
          tableIndex,
          rows
        };

      })
      .filter(table => table.rows.length > 0);

    const dutyStations = [
      ...document.querySelectorAll("option")
    ]
      .map(option =>
        option.innerText.trim()
      )
      .filter(Boolean);


    const materialOptions = [
      ...document.querySelectorAll("mat-option")
    ]
      .map(option =>
        option.innerText.trim()
      )
      .filter(Boolean);

    const links = [
      ...document.querySelectorAll("a")
    ]
      .map(link => ({
        text: link.innerText.trim(),
        href: link.href
      }))
      .filter(link => link.text || link.href);

    return {
      title,
      url: window.location.href,
      text,
      tables,
      dutyStations,
      materialOptions,
      links
    };
  });

  const dutyStations = [
    ...new Set([
      ...onehr.dutyStations,
      ...onehr.materialOptions
    ])
  ];

  const content = [
    onehr.title,

    onehr.text,

    cleanedText,

    onehr.tables.length
      ? onehr.tables
          .map(table =>
            table.rows
              .map(row => row.join(" | "))
              .join("\n")
          )
          .join("\n\n")
      : ""
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = {
    source: URLS.ONEHR,

    title: onehr.title,

    content,

    tables: onehr.tables,

    metadata: {
      source: URLS.ONEHR,
      type: "onehr",
      category: "salary-scale",
      dutyStations,
      scrapedAt: new Date().toISOString()
    },

    links: onehr.links
  };

  console.log("=================================");
  console.log("ONEHR scraping completed");
  console.log("=================================");

  console.log("Title:", result.title);
  console.log("Content length:", result.content.length);
  console.log("Duty stations:", dutyStations.length);
  console.log("Tables:", result.tables.length);

  return result;
}