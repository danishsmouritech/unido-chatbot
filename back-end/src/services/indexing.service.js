import { firestore } from "../config/db.js";
import {
  deleteVectorDatapoints,
  upsertVectorDatapoints,
  verifyVectorDatapoints
} from "./vectorSearch.service.js";
import { logger } from "../utils/logger.js";

const CHUNKS = "knowledgeChunks";

export async function getIndexedChunks() {
  const snapshot = await firestore.collection(CHUNKS).get();
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
}

export async function deleteChunks(ids = []) {
  if (!ids.length) return;
  await deleteVectorDatapoints(ids);
  for (let offset = 0; offset < ids.length; offset += 450) {
    const batch = firestore.batch();
    ids.slice(offset, offset + 450).forEach(id => batch.delete(firestore.collection(CHUNKS).doc(id)));
    await batch.commit();
  }

  const remaining = [];
  for (let offset = 0; offset < ids.length; offset += 400) {
    const refs = ids.slice(offset, offset + 400).map(id => firestore.collection(CHUNKS).doc(id));
    const snapshots = await firestore.getAll(...refs);
    snapshots.forEach(snapshot => { if (snapshot.exists) remaining.push(snapshot.id); });
  }
  if (remaining.length) {
    throw new Error(`Firestore deletion verification failed for ${remaining.length} stale chunk(s): ${remaining.slice(0, 5).join(", ")}`);
  }
}

export async function saveChunkDocuments(chunks = []) {
  for (let offset = 0; offset < chunks.length; offset += 450) {
    const batch = firestore.batch();
    chunks.slice(offset, offset + 450).forEach(chunk => {
      const { embedding, ...document } = chunk;
      batch.set(firestore.collection(CHUNKS).doc(chunk.id), document, { merge: true });
    });
    await batch.commit();
  }
}

export async function bulkIndexChunks(chunks = []) {
  if (!chunks.length) return;
  // Store searchable text and metadata in Firestore; Vector Search stores only
  // each chunk's datapoint ID and its vector.
  const vectorChunks = chunks.filter(chunk => chunk.embedding?.length);
  await upsertVectorDatapoints(vectorChunks);
  await verifyVectorDatapoints(vectorChunks.map(chunk => chunk.id), {
    expectedVectors: new Map(vectorChunks.map(chunk => [chunk.id, chunk.embedding]))
  });
  await saveChunkDocuments(chunks);

  const missingDocuments = [];
  for (let offset = 0; offset < chunks.length; offset += 400) {
    const batch = chunks.slice(offset, offset + 400);
    const refs = batch.map(chunk => firestore.collection(CHUNKS).doc(chunk.id));
    const snapshots = await firestore.getAll(...refs);
    snapshots.forEach((snapshot, index) => {
      if (!snapshot.exists || snapshot.data().content !== batch[index].content) {
        missingDocuments.push(batch[index].id);
      }
    });
  }
  if (missingDocuments.length) {
    throw new Error(`Firestore indexing verification failed for ${missingDocuments.length} chunk(s): ${missingDocuments.slice(0, 5).join(", ")}`);
  }

  logger.log(`Saved ${chunks.length} chunk documents to Firestore and updated vector datapoints.`);
}
