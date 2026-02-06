# Getting Started

Set up your local development environment for building on Gravity.

---

## ⚠️ IMPORTANT: What You Have Access To

As a developer, you work with **your organization's fork** of gravity-starter:

| ✅ You Have Access To                  | ❌ You Do NOT Have Access To      |
| -------------------------------------- | --------------------------------- |
| Your org's fork of `gravity-starter`   | `GravityPlatform` (core platform) |
| Custom nodes in `packages/`            | Core service source code          |
| UI components in `apps/design-system/` | Server, Workflow, Canvas source   |
| Client app in `apps/GravitySAB/`       | Node-service internals            |
| Docker images (pre-built binaries)     | Platform IP                       |

**The core platform runs as Docker images.** You never see or modify the source code — you build ON TOP of it.

---

## Prerequisites

Install these on your machine:

| Tool        | Version | Install                                 |
| ----------- | ------- | --------------------------------------- |
| **Docker**  | 24+     | https://docs.docker.com/get-docker/     |
| **Node.js** | 20+     | https://nodejs.org/ or `nvm install 20` |
| **Git**     | 2.x     | https://git-scm.com/                    |

---

## Step 1: Get Access

Ask your Gravity admin for:

1. Access to your org's fork of `gravity-starter` (GitHub)
2. **DOCR Token** — for pulling Docker images (DigitalOcean Container Registry)
3. **DATABASE_URL** — PostgreSQL connection string
4. **Redis credentials** — host, port, password

---

## Step 2: Clone YOUR ORG'S Starter Repo

> ⚠️ **Clone your organization's fork, NOT the gravity-platform repo.**

```bash
# Replace YOUR_ORG with your organization name
git clone https://github.com/YOUR_ORG/gravity-starter.git ~/gravity
cd ~/gravity
```

If your org uses a private repo, include your credentials:

```bash
git clone https://YOUR_USERNAME:YOUR_GITHUB_TOKEN@github.com/YOUR_ORG/gravity-starter.git ~/gravity
```

---

## Step 3: Get Registry Token

Ask your Gravity admin for a **DigitalOcean Container Registry token**.

This token lets you pull the pre-built platform images. You don't need GitHub access to the platform code.

---

## Step 4: Login to Docker Registry

```bash
# Use the DOCR token from your admin
echo "dop_v1_xxxxx" | docker login registry.digitalocean.com -u dop_v1_xxxxx --password-stdin
```

You should see: `Login Succeeded`

---

## Step 5: Redis

Redis is required. Your admin will provide connection details (managed Redis recommended).

For **local development**, you can run Redis with Docker:

```bash
docker run -d --name gravity-redis -p 6379:6379 redis:7-alpine
```

Verify it's running:

```bash
docker ps | grep redis
```

---

## Step 6: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with credentials from your admin:

```bash
# Database (get from your admin)
DATABASE_URL=postgresql://user:pass@host:5432/gravity

# Redis (local dev: use host.docker.internal so containers can reach host Redis)
REDIS_HOST=host.docker.internal
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# Auth (your admin will provide these)
AUTH_ISSUER=https://your-tenant.auth0.com
AUTH_CLIENT_ID=your-client-id
AUTH_AUDIENCE=gravity-api
```

---

## Step 7: Start the Platform

```bash
docker compose up -d
```

This pulls pre-built images from DigitalOcean Container Registry and starts all core services.

**First time?** This downloads ~2GB of images. Subsequent starts are fast.

---

## Step 8: Verify

```bash
docker compose ps
```

All services should show "Up":

```
NAME                  STATUS
gravity-server        Up
gravity-workflow      Up
gravity-canvas        Up
gravity-node-service  Up
gravity-umap          Up
gravity-grafana       Up
...
```

---

## Step 9: Access Services

| Service     | URL                   | Description      |
| ----------- | --------------------- | ---------------- |
| **Canvas**  | http://localhost:3001 | Workflow Builder |
| **Grafana** | http://localhost:3000 | Logs & Metrics   |
| **API**     | http://localhost:4100 | REST API         |

---

## Developing Your Code

Now that the platform is running, you can develop your custom code:

### Custom Nodes

```bash
cd ~/gravity
npm install
npm run build -w @gravity-platform/my-custom-node
docker compose restart node-service workflow
```

### UI Components (Storybook)

```bash
npm run storybook -w @gravity-platform/design-system-dev
# Opens http://localhost:6006
```

### Client App (SAB)

```bash
cd apps/GravitySAB
npm install
npm run dev
# Opens http://localhost:3007
```

---

## Daily Workflow

```bash
# Start your day
cd ~/gravity
docker compose up -d          # Start platform

# Make changes to packages/ or apps/
npm run build                 # Build your changes
docker compose restart node-service workflow  # Pick up changes

# End your day
docker compose down           # Stop platform
```

---

## Updating the Platform

When your admin releases a new version:

```bash
cd ~/gravity
git pull                      # Get latest starter code
docker compose pull           # Get latest Docker images
docker compose up -d          # Restart with new images
```

---

## Troubleshooting

### "unauthorized" when pulling images

```bash
# Re-login to DOCR with your token
echo "dop_v1_xxxxx" | docker login registry.digitalocean.com -u dop_v1_xxxxx --password-stdin
```

### Services not starting

```bash
docker compose logs server    # Check specific service logs
docker compose logs workflow
```

### Redis connection refused

```bash
# Make sure Redis is running
docker ps | grep redis

# If not running, start it
docker run -d --name gravity-redis -p 6379:6379 redis:7-alpine
```

### Clean restart

```bash
docker compose down
docker compose up -d
```

### Nuclear reset (deletes all data!)

```bash
docker compose down -v
docker system prune -a -f
docker compose up -d
```

---

## What's Next?

- [Challenge 2: Create Your First Agent](./02-create-your-first-agent.md)
- [Challenge 3: Create Your First Node](./03-create-your-first-node.md)
