# UNIDO RAG Backend

Node.js backend for scraping, indexing, retrieval, chat generation, and admin operations.

## Prerequisites

- Node.js 20+
- MongoDB (for sessions, logs, admin settings/users)
- Elasticsearch (for vector retrieval)
- Azure OpenAI deployments (chat + embedding)
- Azure Blob Storage (for JSON backups)

## Environment Variables

Create `back-end/.env` with the following values.

Required for startup:

- `PORT=5000`
- `MONGO_URI=...`
- `JWT_SECRET=...`
- `ADMIN_EMAIL=...`
- `ADMIN_PASSWORD=...`

Required for Azure OpenAI:

- `AZURE_OPENAI_ENDPOINT=...`
- `AZURE_OPENAI_KEY=...`
- `AZURE_OPENAI_DEPLOYMENT=...`
- `AZURE_EMBEDDING_DEPLOYMENT=...`
- `AZURE_OPENAI_API_VERSION=2024-10-21`

Required for Elasticsearch:

- `ELASTIC_NODE=http://localhost:9200`
- `ELASTIC_USERNAME=...` (optional if unsecured local node)
- `ELASTIC_PASSWORD=...` (optional if unsecured local node)
- `RAG_TOP_K=5`
- `RAG_MIN_SCORE=0.75`

Required for Azure Blob backup:

- `AZURE_STORAGE_CONNECTION_STRING=...`
- `AZURE_STORAGE_CONTAINER=...`

Optional:

- `ENABLE_CRON=true` (enables scheduled scraping job)
- `CRON_TIMEZONE=UTC`

## Install

```bash
npm install
```

## Run

Start API server:

```bash
npm run dev
```

Run full scrape + chunk + embed + index pipeline manually:

```bash
npm run pipeline
```

## Important Behavior

- Server startup fails if `JWT_SECRET` is missing.
- Default admin creation requires `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- When scraping is triggered, Elasticsearch index content is cleared and re-indexed from the latest scrape to avoid stale jobs.
- Chat endpoints return `503` when chatbot is disabled from admin settings.
