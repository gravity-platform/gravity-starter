# Challenge 1: Getting Started

Deploy the Gravity platform and access Canvas.

## Goal

By the end of this challenge, you'll have:

- Gravity platform running locally or on a server
- Access to Canvas (workflow builder)
- Access to SAB (client application)
- Access to Storybook (component development)

## Steps

### 1. Clone gravity-starter

```bash
git clone https://github.com/gravity-platform/gravity-starter.git ~/gravity
cd ~/gravity
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/gravity

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Auth (optional for local dev)
DISABLE_AUTH=true
```

### 3. Login to GHCR

You need a GitHub PAT with `read:packages` scope to pull the platform images.

> **Note:** This gives read-only access to compiled Docker images only. No source code access.

**For Developers:**

1. Ask your Gravity admin to add your GitHub username to the team
2. Create a Personal Access Token:
   - Go to https://github.com/settings/tokens
   - Click **Generate new token (classic)**
   - Name it (e.g., "Gravity Docker")
   - Select **only** `read:packages` scope
   - Click **Generate token**
   - Copy the token (you won't see it again!)
3. Login to GHCR:

```bash
echo "YOUR_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

**For Admins (one-time setup):**

Add developers to your GitHub team at `github.com/orgs/gravity-platform/teams`

### 4. Deploy

```bash
./scripts/deploy.sh
```

**Deploy Script Options:**

| Command                       | What it does                                                    |
| ----------------------------- | --------------------------------------------------------------- |
| `./scripts/deploy.sh`         | Full deploy (pull images, gen:nodes, build packages, build SAB) |
| `./scripts/deploy.sh update`  | Pull latest GHCR images and restart (no rebuild)                |
| `./scripts/deploy.sh rebuild` | Rebuild SAB only and restart                                    |
| `./scripts/deploy.sh clean`   | Clean caches + full deploy (use when builds fail)               |

### 5. Local Development

For local development with hot reload:

**Start Redis first:**

```bash
docker pull redis:7-alpine   # Pull from Docker Hub
docker compose up -d redis   # Start Redis
```

**Then run the platform:**

```bash
npm install          # Install dependencies
npm run build        # Build all packages with Turbo
npm run dev          # Run everything with hot reload
```

This starts all services locally with file watching enabled.

### 6. Verify

```bash
docker compose ps  # All services should be "Up"
```

## Services

### Core Platform (GHCR Images)

| Service      | Port | Description                                           |
| ------------ | ---- | ----------------------------------------------------- |
| Canvas       | 3001 | Workflow Builder UI                                   |
| Server       | 4100 | REST API Gateway, WebSocket Hub, OAuth/JWT auth       |
| Workflow     | 4101 | Agent Builder, Workflow Orchestration, Signal Routing |
| Node Service | 4102 | Marketplace, Custom Components, Design System         |
| MCP Server   | 4103 | ChatGPT Apps Integration, OAuth/JWT auth              |
| UMAP Service | 5001 | UMAP Model Training, Spatial Search Embedding         |
| Redis        | 6379 | Cache, pub/sub                                        |
| Postgres     | 5432 | Database                                              |

### Marketplace Nodes (Included)

The starter pack includes these node packages:

| Package                           | Description                            |
| --------------------------------- | -------------------------------------- |
| `@gravity-platform/openai`        | OpenAI GPT models, embeddings          |
| `@gravity-platform/aws-bedrock`   | AWS Bedrock (Claude, Titan)            |
| `@gravity-platform/aws-nova`      | AWS Nova models                        |
| `@gravity-platform/aws-s3`        | S3 file operations                     |
| `@gravity-platform/cloudinary`    | Image/video management                 |
| `@gravity-platform/pinecone`      | Vector database                        |
| `@gravity-platform/design-system` | UI components (Card, AIResponse, etc.) |
| `@gravity-platform/flow`          | Flow control (Loop, Switch, etc.)      |
| `@gravity-platform/ingest`        | Content ingestion                      |

### Starter Pack (Your Code)

| Service   | Port | URL                   | Description              |
| --------- | ---- | --------------------- | ------------------------ |
| Storybook | 6006 | http://localhost:6006 | UI Component Development |
| SAB       | 3007 | http://localhost:3007 | Client Chat Application  |

### Observability (Core Platform)

| Service    | Port | Description                 |
| ---------- | ---- | --------------------------- |
| Grafana    | 3000 | Dashboards & Visualizations |
| Prometheus | 9090 | Metrics Collection          |
| Loki       | 3100 | Log Aggregation             |
| Tempo      | 3200 | Distributed Tracing         |
| Promtail   | 9080 | Log Shipping                |

## ✅ Challenge Complete

You should see the Canvas workflow builder. Proceed to [Challenge 2: Create Your First Agent](./02-create-your-first-agent.md).
