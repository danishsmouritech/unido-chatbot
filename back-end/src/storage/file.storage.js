import fs from "fs-extra";
import path from "path";
import { uploadJSONToAzure, deleteOldBlobs } from "./azure.storage.js";
// Generate file name like: 110226_unido_full.json
 
function generateFileName(type = "full",file) {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);

  return `${day}${month}${year}_${file}_${type}.json`;
}

// Generate folder path like: data/2026/02/
function generateFolderPath(folder) {
  // const now = new Date();
  // const year = now.getFullYear();
  // const month = String(now.getMonth() + 1).padStart(2, "0");

  // return path.join(process.cwd(), "data", String(year), month);
  return path.join(process.cwd(), folder);
}

// Save JSON backup
export async function saveJSONBackup(data, type,folder,file) {
  const folderPath = generateFolderPath(folder);
  const fileName = generateFileName(type,file);
  const filePath = path.join(folderPath, fileName);
  await fs.ensureDir(folderPath);
  await fs.writeJson(filePath, data, { spaces: 2 });

  console.log(`Backup saved at: ${filePath}`);
   //  Upload to Azure
  await uploadJSONToAzure(data, fileName);

  // Delete old Azure files
  await deleteOldBlobs();
  return filePath;
}
