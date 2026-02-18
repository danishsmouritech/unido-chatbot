import dotenv from "dotenv";
import { Client } from "@elastic/elasticsearch";

dotenv.config();

const node = process.env.ELASTIC_NODE || process.env.ELASTICSEARCH_URL || "http://localhost:9200";
const username = process.env.ELASTIC_USERNAME;
const password = process.env.ELASTIC_PASSWORD;

const clientConfig = { node };

if (username && password) {
  clientConfig.auth = { username, password };
}

export const esClient = new Client(clientConfig);

export async function assertElasticConnection() {
  //Used to check connection
  await esClient.info();
}
