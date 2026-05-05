# UNIDO AI Chatbot — GCP Infrastructure Proposal

**Document Version:** 1.0  
**Date:** April 29, 2026  
**Prepared For:** UNIDO Technical Team  
**Project:** UNIDO Careers AI Chatbot

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Overview](#2-current-architecture-overview)
3. [Proposed GCP Architecture](#3-proposed-gcp-architecture)
4. [GCP Service Mapping](#4-gcp-service-mapping)
5. [Infrastructure Cost Breakdown](#5-infrastructure-cost-breakdown)
6. [Required Code Changes](#6-required-code-changes)
7. [Migration Timeline](#7-migration-timeline)
8. [Architecture Diagram](#8-architecture-diagram)
9. [Recommendations](#9-recommendations)

---

## 1. Executive Summary

This document outlines the proposed Google Cloud Platform (GCP) infrastructure for the UNIDO AI Chatbot application. The project currently uses Azure OpenAI, Elasticsearch, MongoDB, and Azure Blob Storage. This proposal maps each service to its GCP equivalent, provides detailed cost estimates (one-time and monthly), and outlines the code changes and timeline required for migration.

**Key Highlights:**
- Estimated monthly cost: **$380 – $680/month** (depending on traffic)
- One-time migration cost: **$150 – $250** (setup and data migration)
- Development effort for code changes: **5 – 8 working days**
- Zero downtime migration possible with phased approach

---

## 2. Current Architecture Overview

| Component | Current Service | Purpose |
|-----------|----------------|---------|
| AI Chat Model | Azure OpenAI (GPT-4o-mini) | Generate conversational responses |
| Embeddings | Azure OpenAI (text-embedding-3-small) | Generate 1536D vectors for RAG |
| Vector Search | Elasticsearch (self-hosted/managed) | kNN similarity search on embeddings |
| Database | MongoDB (Atlas or self-hosted) | Store sessions, logs, admin settings |
| Object Storage | Azure Blob Storage | Backup scraped data (JSON files) |
| Web Scraping | Puppeteer (headless Chrome) | Daily scraping of UNIDO careers site |
| Frontend | Static React SPA (Vite) | User-facing chatbot + admin panel |
| Backend | Node.js + Express 5 | REST API + WebSocket server |
| Real-time | Socket.io | Live admin dashboard updates |
| Scheduling | node-cron | Daily scraping pipeline |

---

## 3. Proposed GCP Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Google Cloud Platform                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐     ┌──────────────────┐     ┌────────────────┐  │
│  │  Cloud CDN   │────▶│  Firebase Hosting │     │  Cloud Armor   │  │
│  │  (Caching)   │     │  (React SPA)      │     │  (WAF/DDoS)   │  │
│  └──────────────┘     └──────────────────┘     └────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      Cloud Run                                │   │
│  │  ┌─────────────────────────────────────────────────────────┐ │   │
│  │  │  Node.js Backend (Express + Socket.io)                  │ │   │
│  │  │  - REST API                                             │ │   │
│  │  │  - WebSocket Server                                     │ │   │
│  │  │  - Cron Jobs (Cloud Scheduler trigger)                  │ │   │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌───────────────┐  ┌────────────────┐  ┌──────────────────────┐   │
│  │ Vertex AI     │  │ Elasticsearch  │  │  MongoDB Atlas       │   │
│  │ (Gemini /     │  │ on GCP         │  │  (on GCP region)     │   │
│  │  OpenAI API)  │  │ (Elastic Cloud)│  │                      │   │
│  └───────────────┘  └────────────────┘  └──────────────────────┘   │
│                                                                     │
│  ┌───────────────┐  ┌────────────────┐  ┌──────────────────────┐   │
│  │ Cloud Storage │  │ Cloud Scheduler│  │  Secret Manager      │   │
│  │ (Backups)     │  │ (Cron Trigger) │  │  (Env Vars/Keys)     │   │
│  └───────────────┘  └────────────────┘  └──────────────────────┘   │
│                                                                     │
│  ┌───────────────┐  ┌────────────────┐                             │
│  │ Cloud Logging │  │ Cloud Monitor  │                             │
│  │ (Logs)        │  │ (Alerts)       │                             │
│  └───────────────┘  └────────────────┘                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. GCP Service Mapping

### 4.1 Compute — Cloud Run

| Aspect | Details |
|--------|---------|
| **Service** | Cloud Run (fully managed) |
| **Use Case** | Host Node.js backend (Express + Socket.io) |
| **Why Cloud Run** | Serverless, auto-scales to zero, supports WebSockets, container-based |
| **Configuration** | Min instances: 1 (to keep WebSocket alive), Max instances: 10 |
| **CPU/Memory** | 1 vCPU, 1 GB RAM (scalable) |
| **Region** | europe-west1 (Belgium) — closest to UNIDO HQ in Vienna |

### 4.2 AI/ML — Vertex AI with OpenAI-Compatible API

| Aspect | Details |
|--------|---------|
| **Service** | Vertex AI (Model Garden) |
| **Option A** | Use **Gemini 2.0 Flash** (Google's native model) — cheapest, fastest |
| **Option B** | Use **OpenAI models via Vertex AI** (GPT-4o-mini available on Vertex) |
| **Option C** | Use **OpenAI API directly** (no GCP dependency for AI) |
| **Embeddings** | Vertex AI `text-embedding-005` (768D) OR continue with OpenAI `text-embedding-3-small` (1536D) |
| **Recommendation** | **Option A (Gemini 2.0 Flash)** — 90% cost reduction, comparable quality for RAG |

**Gemini 2.0 Flash Pricing:**
- Input: $0.10 / 1M tokens
- Output: $0.40 / 1M tokens
- vs GPT-4o-mini: Input $0.15, Output $0.60 / 1M tokens

### 4.3 Vector Search — Elasticsearch on Elastic Cloud (GCP)

| Aspect | Details |
|--------|---------|
| **Service** | Elastic Cloud on GCP (managed Elasticsearch) |
| **Why** | Zero code changes needed, same client library, same kNN queries |
| **Alternative** | Vertex AI Vector Search (requires code rewrite) |
| **Configuration** | 1 node, 4 GB RAM, 120 GB storage |
| **Region** | GCP europe-west1 |

### 4.4 Database — MongoDB Atlas on GCP

| Aspect | Details |
|--------|---------|
| **Service** | MongoDB Atlas (deployed on GCP) |
| **Why** | Zero code changes for Mongoose ORM, native GCP peering |
| **Configuration** | M10 cluster (2 GB RAM, 10 GB storage) — sufficient for chat logs |
| **Region** | GCP europe-west1 |

### 4.5 Object Storage — Cloud Storage

| Aspect | Details |
|--------|---------|
| **Service** | Google Cloud Storage (GCS) |
| **Use Case** | Store scraped data backups (JSON files) |
| **Replaces** | Azure Blob Storage |
| **Storage Class** | Standard (for frequently accessed) or Nearline (for backups) |
| **Lifecycle** | Auto-delete after 7 days (matching current retention) |

### 4.6 Frontend Hosting — Firebase Hosting / Cloud Storage + CDN

| Aspect | Details |
|--------|---------|
| **Service** | Firebase Hosting (free tier available) |
| **Use Case** | Serve React SPA (static files from `vite build`) |
| **Why** | Global CDN, automatic SSL, custom domains, easy CI/CD |
| **Alternative** | Cloud Storage + Cloud CDN (more control, slightly more setup) |

### 4.7 Scheduling — Cloud Scheduler

| Aspect | Details |
|--------|---------|
| **Service** | Cloud Scheduler + Cloud Run |
| **Use Case** | Trigger daily scraping pipeline at 00:00 UTC |
| **Replaces** | node-cron (in-process) |
| **Why** | Reliable, doesn't depend on server uptime, retry policies |

### 4.8 Security & Configuration

| Service | Purpose |
|---------|---------|
| **Secret Manager** | Store API keys, JWT secrets, DB credentials |
| **Cloud Armor** | WAF, DDoS protection, IP allowlisting |
| **IAM** | Service account permissions, least-privilege access |
| **VPC** | Private networking between Cloud Run ↔ Elasticsearch ↔ MongoDB |

### 4.9 Monitoring & Logging

| Service | Purpose |
|---------|---------|
| **Cloud Logging** | Centralized application logs |
| **Cloud Monitoring** | Uptime checks, alerts, dashboards |
| **Error Reporting** | Automatic error detection and grouping |

---

## 5. Infrastructure Cost Breakdown

### 5.1 One-Time Costs (Setup & Migration)

| Item | Cost | Notes |
|------|------|-------|
| GCP Project setup & IAM configuration | $0 | Free |
| Domain DNS migration | $0 | Free |
| Docker containerization (Cloud Run) | $0 | Dev effort only |
| Elasticsearch data migration | ~$50 | Data transfer + re-indexing compute |
| MongoDB Atlas migration | ~$50 | mongodump/mongorestore + transfer |
| SSL certificates | $0 | Managed by GCP/Firebase |
| Cloud Storage bucket setup | $0 | Free |
| Firebase Hosting setup | $0 | Free |
| Testing & validation environment | ~$50–150 | Temporary compute for parallel testing |
| **Total One-Time Cost** | **$150 – $250** | |

### 5.2 Monthly Recurring Costs

#### Option A: Using Gemini 2.0 Flash (Recommended — Lowest Cost)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **Cloud Run** (Backend) | 1 vCPU, 1 GB RAM, min 1 instance, ~720 hrs/month | $40 – $65 |
| **Vertex AI - Gemini 2.0 Flash** | ~500K input tokens + ~200K output tokens/month | $10 – $25 |
| **Vertex AI - Embeddings** | text-embedding-005, ~100K tokens/month (daily re-index) | $1 – $5 |
| **Elasticsearch (Elastic Cloud on GCP)** | 1 node, 4 GB RAM | $95 – $120 |
| **MongoDB Atlas** (GCP) | M10 Dedicated Cluster | $57 – $80 |
| **Cloud Storage** | ~5 GB Standard (7-day retention) | $1 – $2 |
| **Firebase Hosting** | Free tier (10 GB transfer/month) | $0 |
| **Cloud Scheduler** | 3 jobs (daily scrape trigger) | $0.30 |
| **Secret Manager** | ~15 secrets, 10K access operations | $0.60 |
| **Cloud Logging & Monitoring** | First 50 GB free | $0 – $10 |
| **Cloud Armor** | Basic security policy | $5 – $10 |
| **Network Egress** | ~10 GB/month | $1 – $5 |
| **Total Monthly (Option A)** | | **$210 – $325** |

#### Option B: Using OpenAI API Directly (GPT-4o-mini)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **Cloud Run** (Backend) | 1 vCPU, 1 GB RAM, min 1 instance | $40 – $65 |
| **OpenAI API - GPT-4o-mini** | ~500K input + ~200K output tokens/month | $15 – $40 |
| **OpenAI API - Embeddings** | text-embedding-3-small, ~100K tokens/month | $2 – $5 |
| **Elasticsearch (Elastic Cloud on GCP)** | 1 node, 4 GB RAM | $95 – $120 |
| **MongoDB Atlas** (GCP) | M10 Dedicated Cluster | $57 – $80 |
| **Cloud Storage** | ~5 GB Standard | $1 – $2 |
| **Firebase Hosting** | Free tier | $0 |
| **Cloud Scheduler** | 3 jobs | $0.30 |
| **Secret Manager** | ~15 secrets | $0.60 |
| **Cloud Logging & Monitoring** | First 50 GB free | $0 – $10 |
| **Cloud Armor** | Basic security policy | $5 – $10 |
| **Network Egress** | ~10 GB/month | $1 – $5 |
| **Total Monthly (Option B)** | | **$220 – $340** |

#### Option C: Using Vertex AI with OpenAI Models (GPT-4o-mini on Vertex)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| All GCP infra (same as above) | — | $200 – $300 |
| **Vertex AI - GPT-4o-mini** (via Model Garden) | Same tokens as Option B | $20 – $50 |
| **Total Monthly (Option C)** | | **$240 – $360** |

### 5.3 Cost Comparison Summary

| Scenario | Monthly Cost | Annual Cost |
|----------|-------------|-------------|
| **Option A: Gemini Flash** (Recommended) | $210 – $325 | $2,520 – $3,900 |
| **Option B: OpenAI Direct** | $220 – $340 | $2,640 – $4,080 |
| **Option C: OpenAI on Vertex** | $240 – $360 | $2,880 – $4,320 |

### 5.4 Cost Optimization Opportunities

| Optimization | Savings |
|-------------|---------|
| Use Committed Use Discounts (CUDs) for Cloud Run | 17–40% on compute |
| Use MongoDB Atlas Serverless (M0/shared) instead of M10 | Save ~$50/month |
| Use Vertex AI Vector Search instead of Elastic Cloud | Save ~$60/month (requires code changes) |
| Scale Cloud Run to zero during off-hours | Save ~$15/month |
| Use Cloud Run Jobs for scraping (pay only when running) | Save ~$10/month |

**With all optimizations applied:** ~$130 – $220/month

---

## 6. Required Code Changes

### 6.1 Changes Summary

| File/Module | Change Type | Effort |
|-------------|-------------|--------|
| `src/config/openai.js` | Replace Azure OpenAI SDK with Vertex AI / OpenAI SDK | Medium |
| `src/services/embedding.service.js` | Update embedding API calls | Low |
| `src/services/generation.service.js` | Update chat completion calls | Low |
| `src/config/azureBlob.js` | Replace with GCS client library | Medium |
| `src/storage/azure.storage.js` | Rewrite for Cloud Storage | Medium |
| `src/cron/cronjob.js` | Adapt for Cloud Scheduler HTTP trigger | Low |
| `Dockerfile` (new) | Create container image for Cloud Run | Low |
| `.env` / Secret Manager | Update environment variables | Low |
| `Frontend/src/config/appConfig.js` | Update API URL to Cloud Run endpoint | Trivial |
| `firebase.json` (new) | Firebase Hosting configuration | Low |
| `cloudbuild.yaml` (new) | CI/CD pipeline for Cloud Build | Low |

### 6.2 Detailed Code Changes

#### A. AI Service Migration (Option A — Gemini)

**File: `back-end/src/config/openai.js`**

Current: Uses Azure OpenAI SDK (`@azure/openai` / `openai` with Azure config)  
Change: Replace with `@google-cloud/vertexai` SDK

```javascript
// Before (Azure OpenAI)
import { AzureOpenAI } from "openai";
const client = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_KEY,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION,
});

// After (Vertex AI - Gemini)
import { VertexAI } from "@google-cloud/vertexai";
const vertexAI = new VertexAI({
  project: process.env.GCP_PROJECT_ID,
  location: process.env.GCP_REGION,
});
const model = vertexAI.getGenerativeModel({ model: "gemini-2.0-flash" });
```

**File: `back-end/src/services/embedding.service.js`**

```javascript
// Before (Azure text-embedding-3-small)
const response = await embeddingClient.embeddings.create({
  input: text,
  model: deploymentName,
});

// After (Vertex AI text-embedding-005)
import { PredictionServiceClient } from "@google-cloud/aiplatform";
// OR use the textembedding model via Vertex AI SDK
```

**File: `back-end/src/services/generation.service.js`**

```javascript
// Before (Azure GPT-4o-mini)
const response = await chatClient.chat.completions.create({
  model: deploymentName,
  messages: [...],
  temperature: 0.1,
});

// After (Gemini 2.0 Flash)
const result = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: prompt }] }],
  generationConfig: { temperature: 0.1 },
});
```

> **Note:** If choosing Option B (OpenAI Direct), minimal changes — just remove Azure-specific config and use standard OpenAI SDK.

#### B. Storage Migration

**File: `back-end/src/storage/azure.storage.js` → `gcs.storage.js`**

```javascript
// Before (Azure Blob Storage)
import { BlobServiceClient } from "@azure/storage-blob";

// After (Google Cloud Storage)
import { Storage } from "@google-cloud/storage";
const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

async function uploadBackup(filename, data) {
  const file = bucket.file(filename);
  await file.save(JSON.stringify(data), { contentType: "application/json" });
}

async function deleteOldBackups(retentionDays = 7) {
  const [files] = await bucket.getFiles();
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  for (const file of files) {
    if (new Date(file.metadata.timeCreated) < cutoff) {
      await file.delete();
    }
  }
}
```

#### C. Containerization (New Files)

**File: `back-end/Dockerfile`** (New)

```dockerfile
FROM node:20-slim
RUN apt-get update && apt-get install -y chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
```

**File: `back-end/.dockerignore`** (New)

```
node_modules
data/
chunks/
.env
```

#### D. Cloud Scheduler Integration

**File: `back-end/src/cron/cronjob.js`**

```javascript
// Before: node-cron runs inside the process
import cron from "node-cron";
cron.schedule("0 0 * * *", () => runPipeline());

// After: HTTP endpoint triggered by Cloud Scheduler
// Add route in server.js:
app.post("/api/internal/trigger-scrape", authMiddleware, async (req, res) => {
  await runPipeline();
  res.status(200).json({ success: true });
});
```

#### E. Environment Variables Update

```bash
# Remove Azure-specific
- AZURE_OPENAI_ENDPOINT
- AZURE_OPENAI_KEY
- AZURE_OPENAI_API_VERSION
- AZURE_OPENAI_DEPLOYMENT
- AZURE_EMBEDDING_DEPLOYMENT
- AZURE_STORAGE_CONNECTION_STRING
- AZURE_STORAGE_CONTAINER

# Add GCP-specific
+ GCP_PROJECT_ID=your-project-id
+ GCP_REGION=europe-west1
+ GCS_BUCKET_NAME=unido-chatbot-backups
+ GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
# (Not needed on Cloud Run — uses default service account)

# If using OpenAI directly (Option B)
+ OPENAI_API_KEY=sk-...
+ OPENAI_MODEL=gpt-4o-mini
+ OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

#### F. Frontend Deployment

**File: `firebase.json`** (New)

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css|map)",
        "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
      }
    ]
  }
}
```

### 6.3 New Dependencies

```json
// Remove
- "@azure/storage-blob": "^12.31.0"

// Add (Option A - Gemini)
+ "@google-cloud/vertexai": "^1.x"
+ "@google-cloud/storage": "^7.x"

// Add (Option B - OpenAI Direct)
+ "@google-cloud/storage": "^7.x"
// "openai" package already installed, just reconfigure
```

### 6.4 No Changes Required (Compatible As-Is)

| Component | Reason |
|-----------|--------|
| Elasticsearch client (`@elastic/elasticsearch`) | Same client works with Elastic Cloud on GCP |
| MongoDB/Mongoose | MongoDB Atlas works on any cloud; same connection string |
| Socket.io | Cloud Run supports WebSockets natively |
| Express routes, controllers, middleware | No cloud-specific code |
| Security middleware (Helmet, rate-limiting) | Framework-level, cloud-agnostic |
| Frontend React app | Static build, deploys anywhere |
| Puppeteer scraper | Works in Docker with Chromium installed |

---

## 7. Migration Timeline

### Phase 1: Infrastructure Setup (Day 1–2)

| Task | Duration | Details |
|------|----------|---------|
| Create GCP project & enable APIs | 2 hours | Enable Cloud Run, Vertex AI, Cloud Storage, Secret Manager |
| Set up IAM & service accounts | 2 hours | Least-privilege permissions |
| Deploy MongoDB Atlas on GCP | 2 hours | M10 cluster in europe-west1 |
| Set up Elastic Cloud on GCP | 2 hours | 1-node cluster with kNN enabled |
| Create Cloud Storage bucket | 30 min | Lifecycle rules for 7-day retention |
| Configure Secret Manager | 1 hour | Store all environment variables |
| Set up Firebase Hosting | 30 min | Connect to custom domain |

### Phase 2: Code Changes (Day 2–5)

| Task | Duration | Details |
|------|----------|---------|
| AI service migration (Vertex AI / OpenAI) | 4–6 hours | Config + service files |
| Storage migration (Azure Blob → GCS) | 2–3 hours | New storage service |
| Dockerize backend | 2–3 hours | Dockerfile + test locally |
| Cloud Scheduler integration | 1–2 hours | HTTP trigger endpoint |
| Environment variable migration | 1 hour | Secret Manager integration |
| Frontend config update | 30 min | Update API base URL |

### Phase 3: Testing & Validation (Day 5–7)

| Task | Duration | Details |
|------|----------|---------|
| Deploy to Cloud Run (staging) | 2 hours | First deployment + debug |
| Test RAG pipeline end-to-end | 3–4 hours | Verify embedding + search + generation |
| Test scraping pipeline | 2 hours | Run full scrape cycle |
| Test WebSocket (admin dashboard) | 1 hour | Verify real-time updates |
| Load testing | 2–3 hours | Verify auto-scaling behavior |
| Deploy frontend to Firebase | 1 hour | Verify CDN and routing |

### Phase 4: Go Live (Day 7–8)

| Task | Duration | Details |
|------|----------|---------|
| DNS cutover | 1 hour | Point domain to new infra |
| Monitor for 24 hours | Ongoing | Watch logs, errors, latency |
| Decommission old infrastructure | 1 hour | After validation period |

### Total Estimated Timeline: **5 – 8 Working Days**

---

## 8. Architecture Diagram

### Data Flow

```
User (Browser)
    │
    ▼
Firebase Hosting (React SPA)
    │
    ▼ (REST API / WebSocket)
Cloud Run (Node.js Backend)
    │
    ├──▶ Vertex AI (Gemini 2.0 Flash) ──── Chat Response Generation
    │
    ├──▶ Vertex AI (Embeddings) ──── Query Vectorization
    │
    ├──▶ Elasticsearch (Elastic Cloud) ──── kNN Vector Search
    │
    ├──▶ MongoDB Atlas ──── Sessions, Logs, Settings
    │
    ├──▶ Cloud Storage ──── Data Backups (JSON)
    │
    └──◀ Cloud Scheduler ──── Daily Scrape Trigger (00:00 UTC)
              │
              ▼
        Puppeteer Scraper → Chunk → Embed → Index to Elasticsearch
```

### Security Architecture

```
Internet
    │
    ▼
Cloud Armor (WAF + DDoS Protection)
    │
    ▼
Cloud Load Balancer (HTTPS termination)
    │
    ▼
Cloud Run (Private networking)
    │
    ├──▶ MongoDB Atlas (VPC Peering, private endpoint)
    ├──▶ Elasticsearch (Private endpoint)
    └──▶ Secret Manager (IAM-based access)
```

---

## 9. Recommendations

### 9.1 Recommended Option: **Option A (Gemini 2.0 Flash)**

| Factor | Reasoning |
|--------|-----------|
| **Cost** | 30-60% cheaper than GPT-4o-mini for similar quality |
| **Latency** | Lower latency when both AI and infra are on GCP |
| **Data Residency** | All data stays within GCP (Europe region) |
| **Vendor Lock-in** | Moderate; can switch to OpenAI later with config change |
| **Quality** | Gemini 2.0 Flash excellent for RAG tasks at this scale |

### 9.2 If OpenAI Quality is Preferred: **Option B (OpenAI Direct)**

- Minimal code changes (just remove Azure wrapper)
- Same model quality as current setup
- Slightly higher AI costs but lower migration effort

### 9.3 Additional Recommendations

1. **Start with MongoDB Atlas Shared (M0/M2)** — Free tier or $9/month is sufficient for initial load; upgrade later if needed
2. **Use Cloud Run min-instances=1** — Ensures WebSocket connections stay alive without cold starts
3. **Enable Cloud CDN** on the Cloud Run service for API response caching (cacheable GET endpoints)
4. **Set up Cloud Build** for CI/CD — auto-deploy on git push
5. **Consider Vertex AI Vector Search** as future replacement for Elasticsearch — would reduce costs by ~$60-100/month but requires more significant code changes
6. **Implement structured logging** with Cloud Logging client for better observability

### 9.4 GCP Free Tier Benefits

| Service | Free Allowance |
|---------|---------------|
| Cloud Run | 2M requests/month, 360K vCPU-seconds, 180K GiB-seconds |
| Cloud Storage | 5 GB Standard storage |
| Firebase Hosting | 10 GB transfer/month, 1 GB storage |
| Cloud Scheduler | 3 free jobs |
| Secret Manager | 6 active secret versions, 10K access operations |
| Cloud Logging | 50 GB/month |
| Cloud Build | 120 build-minutes/day |

---

## Appendix A: Environment Variables (GCP)

```env
# Application
NODE_ENV=production
PORT=5000

# GCP
GCP_PROJECT_ID=unido-chatbot-prod
GCP_REGION=europe-west1

# AI (Option A - Gemini)
VERTEX_AI_MODEL=gemini-2.0-flash
VERTEX_EMBEDDING_MODEL=text-embedding-005

# AI (Option B - OpenAI Direct)
# OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini
# OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.gcp.mongodb.net/unido

# Elasticsearch
ELASTIC_NODE=https://your-deployment.es.europe-west1.gcp.elastic-cloud.com
ELASTIC_USERNAME=elastic
ELASTIC_PASSWORD=your-password

# Storage
GCS_BUCKET_NAME=unido-chatbot-backups

# Auth
JWT_SECRET=your-32-char-secret
ADMIN_EMAIL=admin@unido.org
ADMIN_PASSWORD=secure-password

# Features
ENABLE_CRON=true
CRON_TIMEZONE=UTC
RAG_MIN_SCORE=0.75
RAG_TOP_K=5
```

---

## Appendix B: GCP CLI Commands for Setup

```bash
# Create project
gcloud projects create unido-chatbot-prod

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  aiplatform.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  cloudscheduler.googleapis.com \
  cloudbuild.googleapis.com \
  firebase.googleapis.com

# Deploy to Cloud Run
gcloud run deploy unido-chatbot \
  --source . \
  --region europe-west1 \
  --min-instances 1 \
  --max-instances 10 \
  --memory 1Gi \
  --cpu 1 \
  --port 5000 \
  --allow-unauthenticated

# Create Cloud Scheduler job
gcloud scheduler jobs create http daily-scrape \
  --schedule="0 0 * * *" \
  --uri="https://unido-chatbot-xxxxx.run.app/api/internal/trigger-scrape" \
  --http-method=POST \
  --oidc-service-account-email=scheduler-sa@unido-chatbot-prod.iam.gserviceaccount.com

# Create Cloud Storage bucket
gsutil mb -l europe-west1 gs://unido-chatbot-backups
gsutil lifecycle set lifecycle.json gs://unido-chatbot-backups
```

---

*End of Document*
