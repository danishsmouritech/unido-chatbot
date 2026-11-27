import { GoogleAuth } from "google-auth-library";

const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });

function config() {
  const { GOOGLE_CLOUD_PROJECT: project, GOOGLE_CLOUD_LOCATION: location } = process.env;
  const indexId = process.env.VERTEX_VECTOR_INDEX_ID;
  const indexEndpointId = process.env.VERTEX_VECTOR_INDEX_ENDPOINT_ID;
  const deployedIndexId = process.env.VERTEX_VECTOR_DEPLOYED_INDEX_ID;
  const publicEndpointDomain = process.env.VERTEX_VECTOR_PUBLIC_ENDPOINT;
  const missing = Object.entries({ project, location, indexId, indexEndpointId, deployedIndexId, publicEndpointDomain })
    .filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) throw new Error(`Vertex Vector Search configuration missing: ${missing.join(", ")}`);
  return { project, location, indexId, indexEndpointId, deployedIndexId, publicEndpointDomain };
}

async function request(url, method, data) {
  const client = await auth.getClient();
  const result = await client.request({ url, method, data });
  return result.data;
}

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function readDatapoints(ids) {
  const { project, location, indexEndpointId, deployedIndexId, publicEndpointDomain } = config();
  const url = `https://${publicEndpointDomain}/v1/projects/${project}/locations/${location}/indexEndpoints/${indexEndpointId}:readIndexDatapoints`;
  const result = await request(url, "POST", { deployedIndexId, ids });
  return new Map((result.datapoints || []).map(datapoint => [datapoint.datapointId, datapoint]));
}

function vectorMatches(actual = [], expected = []) {
  return actual.length === expected.length && actual.every((value, index) =>
    Math.abs(value - expected[index]) <= 1e-5
  );
}

export async function verifyVectorDatapoints(ids = [], {
  shouldExist = true,
  expectedVectors = new Map(),
  maxAttempts = 15,
  delayMs = 1000
} = {}) {
  if (!ids.length) return;

  for (let offset = 0; offset < ids.length; offset += 1000) {
    const batch = ids.slice(offset, offset + 1000);
    let missing = batch;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const datapoints = await readDatapoints(batch);
      missing = batch.filter(id => {
        const datapoint = datapoints.get(id);
        if (!shouldExist) return Boolean(datapoint);
        if (!datapoint) return true;
        const expected = expectedVectors.get(id);
        return expected ? !vectorMatches(datapoint.featureVector || [], expected) : false;
      });
      if (!missing.length) break;
      if (attempt + 1 < maxAttempts) await wait(delayMs);
    }

    if (missing.length) {
      const action = shouldExist ? "appear in" : "be removed from";
      throw new Error(`Vector Search verification failed: ${missing.length} datapoint(s) did not ${action} the deployed index after ${maxAttempts} checks. Sample IDs: ${missing.slice(0, 5).join(", ")}`);
    }
  }
}

export function assertVectorSearchConfig() {
  config();
}

export async function upsertVectorDatapoints(chunks = []) {
  if (!chunks.length) return;
  const { project, location, indexId } = config();
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/indexes/${indexId}:upsertDatapoints`;
  for (let offset = 0; offset < chunks.length; offset += 1000) {
    const datapoints = chunks.slice(offset, offset + 1000).map(chunk => ({
      datapointId: chunk.id,
      featureVector: chunk.embedding
    }));
    await request(url, "POST", { datapoints });
  }
}

export async function deleteVectorDatapoints(ids = []) {
  if (!ids.length) return;
  const { project, location, indexId } = config();
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/indexes/${indexId}:removeDatapoints`;
  for (let offset = 0; offset < ids.length; offset += 1000) {
    await request(url, "POST", { datapointIds: ids.slice(offset, offset + 1000) });
  }
  await verifyVectorDatapoints(ids, { shouldExist: false });
}

export async function findNearestDatapoints(queryEmbedding, count) {
  const { project, location, indexEndpointId, deployedIndexId, publicEndpointDomain } = config();
  const url = `https://${publicEndpointDomain}/v1/projects/${project}/locations/${location}/indexEndpoints/${indexEndpointId}:findNeighbors`;
  const result = await request(url, "POST", {
    deployedIndexId,
    queries: [{ datapoint: { featureVector: queryEmbedding } }],
    neighborCount: count
  });
  return result.nearestNeighbors?.[0]?.neighbors || [];
}
