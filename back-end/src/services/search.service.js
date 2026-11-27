import { firestore } from "../config/db.js";
import { findNearestDatapoints } from "./vectorSearch.service.js";

export async function searchRelevantChunks(queryEmbedding, topK) {
  const neighbors = await findNearestDatapoints(queryEmbedding, topK);
  const ids = [...new Set(neighbors.map(neighbor => neighbor.datapointId).filter(Boolean))];
  if (!ids.length) return [];

  const docs = await firestore.getAll(...ids.map(id => firestore.collection("knowledgeChunks").doc(id)));
  const byId = new Map(docs.filter(doc => doc.exists).map(doc => [doc.id, doc.data()]));
  return neighbors.flatMap(neighbor => {
    const id = neighbor.datapointId;
    const chunk = byId.get(id);
    if (!chunk) return [];
    // Vertex Vector Search returns cosine distance; RAG thresholds expect similarity.
    const score = Number.isFinite(neighbor.distance) ? 1 - neighbor.distance : 0;
    return [{ ...chunk, id, score }];
  });
}
