import { writeFileSync } from "fs";

export function exportCareerCategories(categories) {
  const categoryDetails = categories.map(c => ({
    title: c.title,
    url: c.url
  }));

  const fileContent =
    "export const CAREER_CATEGORIES = " +
    JSON.stringify(categoryDetails, null, 2) +
    ";\n";

  writeFileSync(
    "src/constants/careerCategories.js",
    fileContent,
    "utf-8"
  );
}

export function exportJobDetailLinks(jobSummaries) {
  const links = jobSummaries.map(job => ({
    jobTitle: job.jobTitle,
    jobDetailLink: job.jobDetailLink
  }));

  const fileContent =
    "export const JOB_DETAIL_LINKS = " +
    JSON.stringify(links, null, 2) +
    ";\n";

  writeFileSync(
    "src/constants/jobDetailslinks.js",
    fileContent,
    "utf-8"
  );
}
export function exportCategoryContent(categories) {
  const links = categories.map(category => ({
    title: category.title,
    url: category.learnMoreUrl
  }));

  const fileContent =
    "export const CONTENT_CATEGORIES = " +
    JSON.stringify(links, null, 2) +
    ";\n";

  writeFileSync(
    "src/constants/categoriesContent.js",
    fileContent,
    "utf-8"
  );
}