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

> **Mac (Apple Silicon) users:** Open Docker Desktop → Settings → General → enable **"Use Rosetta for x86_64/amd64 emulation on Apple Silicon"**. This is required to run the platform images.

---

## Step 1: Get Access

Ask your Gravity admin for:

1. Access to your org's fork of `gravity-starter` (GitHub)
2. **DOCR Token** — for pulling Docker images (DigitalOcean Container Registry)
3. **DATABASE_URL** — PostgreSQL connection string
4. **Redis credentials** — host, port, password
5. **Auth credentials** — AUTH_ISSUER, AUTH_CLIENT_ID, AUTH_AUDIENCE

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

## Step 3: Run the Setup Wizard

The Gravity CLI handles everything — Docker login, environment config, and image pulling:

```bash
cd ~/gravity
gravity init
```

The wizard will ask for your DOCR token, database URL, Redis, and auth credentials. It generates your `.env` file, logs into the registry, and pulls all platform images.

---

## Step 4: Start the Platform

```bash
gravity start
```

**First time?** Images were already pulled during init (~2GB). Start is fast.

---

## Step 5: Verify

```bash
gravity status
```

All services should show green:

```
  ● gravity-server                Up
  ● gravity-workflow              Up
  ● gravity-canvas                Up
  ● gravity-node-service          Up
  ● gravity-umap                  Up
  ● gravity-grafana               Up
```

---

## Step 6: Access Services

| Service     | URL                   | Description      |
| ----------- | --------------------- | ---------------- |
| **Canvas**  | http://localhost:3001 | Workflow Builder |
| **Grafana** | http://localhost:3000 | Logs & Metrics   |
| **API**     | http://localhost:4100 | REST API         |

---

## Step 7: Set Up Dev Environment

Once the platform is running, set up your development tools:

```bash
gravity dev
```

This installs workspace dependencies, generates workflow nodes from the design system, and confirms everything is ready.

---

## Developing Your Code

### Custom Nodes

```bash
# Edit your node code in packages/my-custom-node/
gravity build @gravity-platform/my-custom-node
```

### UI Components (Design System)

```bash
# Edit components in apps/design-system/storybook/
# Then regenerate and restart:
gravity gendesign
```

### Storybook (Component Preview)

```bash
npm run storybook -w @gravity-platform/design-system-dev
# Opens http://localhost:6006
```

---

## Daily Workflow

```bash
# Start your day
cd ~/gravity
gravity start

# Make changes to packages/ or apps/design-system/
gravity build               # Build all + gen:nodes + restart
gravity build @gravity-platform/my-node  # Or build one package

# End your day
gravity stop
```

---

## Updating the Platform

When your admin releases a new version:

```bash
cd ~/gravity
git pull              # Get latest starter code
gravity update           # Pull latest images and restart
```

---

## Platform Commands

| Command               | Purpose                                             |
| --------------------- | --------------------------------------------------- |
| `gravity init`        | Interactive setup wizard (first time)               |
| `gravity start`       | Start the platform                                  |
| `gravity stop`        | Stop the platform                                   |
| `gravity status`      | Show service health                                 |
| `gravity logs`        | Stream logs                                         |
| `gravity update`      | Pull latest images and restart                      |
| `gravity doctor`      | Diagnose issues                                     |
| `gravity dev`         | Install deps, generate nodes, start dev environment |
| `gravity build`       | Build all packages + gen:nodes + restart services   |
| `gravity build <pkg>` | Build one package + restart services                |
| `gravity gendesign`   | Generate design system nodes + restart              |
| `gravity open`        | Open Canvas in browser (`gravity open grafana`)     |
| `gravity help`        | Show all commands                                   |

---

## Troubleshooting

Run the doctor to diagnose issues:

```bash
gravity doctor
```

### "unauthorized" when pulling images

```bash
# Re-login to DOCR with your token
echo "dop_v1_xxxxx" | docker login registry.digitalocean.com -u dop_v1_xxxxx --password-stdin
```

### Services not starting

```bash
gravity logs server    # Check specific service logs
gravity logs workflow
```

### Redis connection refused

For local development, start Redis with Docker:

```bash
docker run -d --name gravity-redis -p 6379:6379 redis:7-alpine
```

### Clean restart

```bash
gravity stop
gravity start
```

### Nuclear reset (deletes all data!)

```bash
docker compose down -v
docker system prune -a -f
gravity start
```

---

## What's Next?

- [Challenge 2: Create Your First Agent](./02-create-your-first-agent.md)
- [Challenge 3: Create Your First Node](./03-create-your-first-node.md)
