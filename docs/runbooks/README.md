# Gravity Platform Runbooks

Modular runbooks for deploying and managing Gravity Platform VMs.

---

## Infrastructure Requirements

### VM Specifications

| VM Role    | Cores | RAM   | Storage    | Count             | Services                                           |
| ---------- | ----- | ----- | ---------- | ----------------- | -------------------------------------------------- |
| **POC**    | 4     | 8 GB  | 100 GB SSD | 1                 | All services                                       |
| **App VM** | 8     | 32 GB | 200 GB SSD | 2 (Active/Active) | server, workflow, node-service, mcp-server, canvas |
| **ML VM**  | 4     | 16 GB | 100 GB SSD | 1 (Dedicated)     | umap-service                                       |

### External Dependencies

| Component      | Requirement                 | Notes                                                                |
| -------------- | --------------------------- | -------------------------------------------------------------------- |
| **PostgreSQL** | 14+                         | Customer-managed (DO Managed, AWS RDS, or self-hosted)               |
| **Redis**      | 7+                          | Customer-managed (DO Managed Redis, AWS ElastiCache, or self-hosted) |
| **Domain**     | DNS A records               | Point to VM IP or Load Balancer IP                                   |
| **TLS**        | Caddy (auto) or customer LB | Caddy auto-provisions Let's Encrypt certs                            |

### Supported Platforms

- **Cloud:** DigitalOcean, AWS, Azure, GCP
- **On-prem:** VMware, Proxmox, bare metal
- **OS:** Ubuntu 22.04 LTS (recommended), Debian 12

---

## Runbook Modules

| Runbook                                                                                                              | Description                                                                      | Ansible Playbook            |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------- |
| [01-core](./01-core.md)                                                                                              | Deploy core app services                                                         | `install.yml`               |
| [02-database](./02-database.md)                                                                                      | Set up database tables                                                           | `db-setup.yml`              |
| [03-ai-model](./03-ai-model.md)                                                                                      | Deploy UMAP AI service                                                           | `install-umap.yml`          |
| [04-harden](./04-harden.md)                                                                                          | Security hardening                                                               | `harden.yml`                |
| [05-caddy](./05-caddy.md)                                                                                            | TLS + reverse proxy (optional)                                                   | `install-caddy.yml`         |
| [06-test](./06-test.md)                                                                                              | Verify connectivity and health                                                   | `test-connectivity.yml`     |
| [07-observability](./07-observability.md)                                                                            | Grafana/Loki/Prometheus (POC only)                                               | `install-observability.yml` |
| [08-update-nodes](./08-update-nodes.md)                                                                              | Update packages and components                                                   | `deploy-packages.yml`       |
| [Architecture Diagrams](https://gravity-platform.github.io/gravity-starter/docs/runbooks/architecture-diagrams.html) | Interactive system architecture diagrams ([local](./architecture-diagrams.html)) | —                           |

---

## VM Deployment Recipes

### POC (Single VM - All Services)

```bash
# 1. Core services (Docker, Node.js, DOCR images)
ansible-playbook -i inventory/production.yml playbooks/install.yml

# 2. Database tables (reads DATABASE_URL from ansible/files/.env)
ansible-playbook -i inventory/production.yml playbooks/db-setup.yml

# 3. Customer packages (clones starter_repo, builds on server)
ansible-playbook -i inventory/production.yml playbooks/deploy-packages.yml

# 4. AI model
ansible-playbook -i inventory/production.yml playbooks/install-umap.yml

# 5. Security hardening
ansible-playbook -i inventory/production.yml playbooks/harden.yml

# 6. TLS (optional - if no external LB)
ansible-playbook -i inventory/production.yml playbooks/install-caddy.yml \
  -e "domain=yourdomain.com"

# 7. Verify
ansible-playbook -i inventory/production.yml playbooks/test-connectivity.yml
```

### Enterprise App VM

```bash
ansible-playbook -i inventory/production.yml playbooks/install.yml -l app_vms
ansible-playbook -i inventory/production.yml playbooks/db-setup.yml -l app_vms
ansible-playbook -i inventory/production.yml playbooks/deploy-packages.yml -l app_vms
ansible-playbook -i inventory/production.yml playbooks/harden.yml -l app_vms
ansible-playbook -i inventory/production.yml playbooks/test-connectivity.yml -l app_vms
```

### Enterprise ML VM

```bash
ansible-playbook -i inventory/production.yml playbooks/install-umap.yml -l ml_vms
ansible-playbook -i inventory/production.yml playbooks/harden.yml -l ml_vms
```

## Environment Files — Two `.env` Files, Two Purposes

```
┌──────────────────────────────────────────────────────────────────┐
│  .env  (project root)                                            │
│                                                                  │
│  Purpose: LOCAL DEVELOPMENT ONLY                                 │
│  Read by: docker compose (automatically reads root .env)         │
│  Contains: localhost Redis, local DB, no TLS, no DOMAIN          │
│                                                                  │
│  Example values:                                                 │
│    REDIS_HOST=host.docker.internal                               │
│    REDIS_PORT=6379                                               │
│    REDIS_PASSWORD=                                               │
│    REDIS_TLS=false                                               │
│    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/... │
│    # DOMAIN is unset — Canvas defaults to localhost:4100         │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  ansible/files/.env                                              │
│                                                                  │
│  Purpose: PRODUCTION DEPLOYMENT                                  │
│  Read by: Ansible (copies to /opt/gravity/.env on the server)    │
│  Contains: real Redis, real DB, TLS enabled, DOMAIN set          │
│                                                                  │
│  Example values:                                                 │
│    REDIS_HOST=your-redis.db.ondigitalocean.com                   │
│    REDIS_PORT=25061                                              │
│    REDIS_PASSWORD=your-password                                  │
│    REDIS_TLS=true                                                │
│    DATABASE_URL=postgresql://user:pass@db-host:25060/defaultdb   │
│    DOMAIN=yourdomain.com                                         │
└──────────────────────────────────────────────────────────────────┘
```

**Key rules:**

- **Never** copy `ansible/files/.env` values into the root `.env` (or vice versa)
- The root `.env` is gitignored — each developer configures their own
- `ansible/files/.env` is also gitignored — it contains production secrets
- `ansible/files/.env.example` is the template for production config
- On the server, Ansible places `.env` at `/opt/gravity/.env` where `docker compose` reads it

**How `DOMAIN` drives Canvas URLs:**
When `DOMAIN=yourdomain.com` is set in `.env`, `docker-compose.yml` automatically derives:

- `VITE_API_URL=https://api.yourdomain.com`
- `VITE_SERVER_WS_URL=wss://api.yourdomain.com`

When `DOMAIN` is unset (local dev), Canvas falls back to `http://localhost:4100`.

---

## Prerequisites

- SSH access to target VMs
- Ansible installed locally
- DOCR token for pulling images
- PostgreSQL instance provisioned (customer-managed)
- `starter_repo` set in `production.yml` (your fork of gravity-starter)
