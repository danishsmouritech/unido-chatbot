import { cleanHTML }  from "../cleaner/cleanerHTML.js";
import { URLS } from "../constants/urls.js";

async function scrapeFaqs(page) {
  await page.goto(URLS.FAQS, { waitUntil: "networkidle2", timeout: 60000});
  await page.waitForSelector(".node__content", { timeout: 30000 });
  const html = await page.content();
 
 
  const $ = cleanHTML(html);
   const faqs = [];
  let currentQuestion = null;
  let answerBuffer = [];
  $(".node__content p").each((_, el) => {
    const text = $(el).text().trim();
    if ($(el).find("strong").length && /^\d+\./.test(text)) {
      if (currentQuestion) {
        faqs.push({
          question: currentQuestion,
          answer: answerBuffer.join(" ").trim()
        });
      }

      currentQuestion = text.replace(/^\d+\.\s*/, "");
      answerBuffer = [];
    } else if (currentQuestion) {
      answerBuffer.push(text);
    }
  });
  if (currentQuestion) {
    faqs.push({
      question: currentQuestion,
      answer: answerBuffer.join(" ").trim()
    });
  }
  return { page: "faqs", faqs };

}
export default scrapeFaqs;