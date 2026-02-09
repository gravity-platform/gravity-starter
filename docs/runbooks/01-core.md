# Runbook: Core Services

Deploy the core Gravity Platform services to a VM.

## Services Deployed

| Service          | Port | Description                         |
| ---------------- | ---- | ----------------------------------- |
| **server**       | 4100 | API gateway                         |
| **workflow**     | 4101 | XState orchestration engine         |
| **node-service** | 4102 | Node execution service              |
| **mcp-server**   | 4103 | MCP (Model Context Protocol) server |
| **canvas**       | 3001 | Web UI                              |

## VM Requirements

| Tier                  | Cores | RAM   | Storage    | Notes                      |
| --------------------- | ----- | ----- | ---------- | -------------------------- |
| **POC**               | 4     | 8 GB  | 100 GB SSD | All services on one VM     |
| **Enterprise App VM** | 8     | 32 GB | 200 GB SSD | 2 VMs for Active/Active HA |

## Prerequisites

- [ ] VM provisioned (Ubuntu 22.04 LTS recommended)
- [ ] SSH access configured (key-based)
- [ ] PostgreSQL database provisioned (see [02-database.md](./02-database.md))
- [ ] Redis provisioned (managed Redis recommended for enterprise)
- [ ] DOCR token for pulling Gravity Docker images (from your Gravity admin)

## Steps

### 1. Configure Ansible Inventory

Copy the example inventory and fill in your VM details:

```bash
cp ansible/inventory/production.yml.example ansible/inventory/production.yml
```

Then edit `ansible/inventory/production.yml`:

```yaml
all:
  children:
    app_vms:
      hosts:
        app-vm-1:
          ansible_host: <YOUR_VM_IP>
          ansible_user: root
```

> **Note:** `production.yml` is gitignored — it will not be overwritten when you run `gravity update`. Only the `.example` file is tracked in git.

### 2. Configure Environment File

Copy the example and fill in your values:

```bash
cp ansible/files/.env.example ansible/files/.env
```

Edit `ansible/files/.env` with your credentials:

```bash
# DOCR - DigitalOcean Container Registry
DOCR_TOKEN=dop_v1_your_token_here

# Database and Redis
DATABASE_URL=postgresql://user:pass@host:5432/gravity
REDIS_HOST=your-redis-host
REDIS_PORT=25061  # DO Managed Redis uses 25061; local Redis uses 6379
REDIS_PASSWORD=your-redis-password
```

### 3. Run Core Platform Installation

```bash
cd ansible
ansible-playbook -i inventory/production.yml playbooks/install.yml
```

This installs Docker, Node.js, pulls DOCR images, and starts **core platform** (server, workflow, node-service, mcp-server, canvas).

### 4. Deploy Customer Packages

Clones your `starter_repo` (set in `production.yml`), builds packages on the server, and restarts node-service:

```bash
ansible-playbook -i inventory/production.yml playbooks/deploy-packages.yml
```

### 5. Verify

```bash
# Quick health check
ansible-playbook -i inventory/production.yml playbooks/health-check.yml

# Full connectivity test (includes DB, Redis, API endpoints)
ansible-playbook -i inventory/production.yml playbooks/test-connectivity.yml
```

## Expected Output

```
GRAVITY PLATFORM DEPLOYED
============================================
Host: gravity-prod (<YOUR_VM_IP>)

Service Health:
  - Server:       OK
  - Workflow:      OK
  - Node Service:  OK
  - MCP Server:    OK
  - Canvas:        OK

Access URLs:
  - Canvas:  http://<YOUR_VM_IP>:3001
  - API:     http://<YOUR_VM_IP>:4100
```

## Troubleshooting

| Issue               | Cause            | Fix                                            |
| ------------------- | ---------------- | ---------------------------------------------- |
| DOCR login failed   | Invalid token    | Get a new DOCR token from your Gravity admin   |
| Service unhealthy   | Missing env vars | Check `.env` file on VM at `/opt/gravity/.env` |
| Port already in use | Previous install | Run `docker compose down` first                |

## Next Steps

- [02-database.md](./02-database.md) - Configure database connection
- Run `deploy-packages.yml` to deploy custom nodes and design system
