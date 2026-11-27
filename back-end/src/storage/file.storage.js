import fs from "fs-extra";
import path from "path";
import { getBackupBucket } from "../config/cloudStorage.js";
import { logger } from "../utils/logger.js";
// Generate file name like: 110226_unido_full.json

function generateFileName(type = "full", file) {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  return `${day}${month}${year}_${file}_${type}.json`;
}

export async function saveJSONBackup(data, type, folder, file) {
  const fileName = generateFileName(type, file);
  const localPath = path.join(process.cwd(), folder, fileName);
  await fs.ensureDir(path.dirname(localPath));
  await fs.writeJson(localPath, data, { spaces: 2 });

  const objectName = `${folder}/${fileName}`;
  // await getBackupBucket().file(objectName).save(JSON.stringify(data, null, 2), {
    // contentType: "application/json",
    // resumable: false
  // });
  // logger.log(`Backup saved locally and uploaded to Cloud Storage: gs://${process.env.GCS_BUCKET_NAME}/${objectName}`);
  return localPath;
}

async function deleteExpiredLocalJson(folderPath, threshold) {
  if (!(await fs.pathExists(folderPath))) return 0;

  let deletedCount = 0;
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  for (const entry of entries) {
    const filePath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      deletedCount += await deleteExpiredLocalJson(filePath, threshold);
      continue;
    }
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".json") continue;

    const stats = await fs.stat(filePath);
    if (stats.mtimeMs < threshold) {
      await fs.remove(filePath);
      deletedCount += 1;
      logger.log(`Deleted expired local backup: ${path.relative(process.cwd(), filePath)}`);
    }
  }
  return deletedCount;
}

export async function deleteOldCloudBackups(retentionDays = 7) {
  if (!Number.isInteger(retentionDays) || retentionDays < 1) {
    throw new Error("Backup retention must be a positive whole number of days");
  }

  const threshold = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  let localDeleted = 0;
  let cloudDeleted = 0;

  for (const prefix of ["data/", "chunks/"]) {
    localDeleted += await deleteExpiredLocalJson(path.join(process.cwd(), prefix), threshold);
  }

  // if (!process.env.GCS_BUCKET_NAME) {
  //   logger.log("Cloud Storage cleanup skipped: GCS_BUCKET_NAME is not configured.");
  //   return { localDeleted, cloudDeleted };
  // }

  // const bucket = getBackupBucket();
  // for (const prefix of ["data/", "chunks/"]) {
  //   const [files] = await bucket.getFiles({ prefix });
  //   for (const file of files) {
  //     if (path.posix.extname(file.name).toLowerCase() !== ".json") continue;
  //     const [metadata] = await file.getMetadata();
  //     if (new Date(metadata.timeCreated).getTime() < threshold) {
  //       await file.delete();
  //       cloudDeleted += 1;
  //       logger.log(`Deleted expired Cloud Storage backup: ${file.name}`);
  //     }
  //   }
  // }

  return { localDeleted, cloudDeleted };
}
