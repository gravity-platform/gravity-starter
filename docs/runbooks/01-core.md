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

Edit `ansible/inventory/production.yml` with your VM details:

```yaml
all:
  hosts:
    gravity-prod:
      ansible_host: <YOUR_VM_IP>
      ansible_user: root
```

### 2. Configure Environment File

Copy `ansible/files/.env.example` to `ansible/files/.env` and configure:

```bash
# DOCR - DigitalOcean Container Registry
DOCR_TOKEN=dop_v1_your_token_here

# Database and Redis
DATABASE_URL=postgresql://user:pass@host:5432/gravity
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

### 3. Run Core Platform Installation

```bash
cd ansible
ansible-playbook -i inventory/production.yml playbooks/install.yml
```

This installs **core platform only** (server, workflow, node-service, mcp-server, canvas) from DOCR.

### 4. Deploy Customer Packages (Optional)

If you have custom nodes or design system components:

```bash
ansible-playbook -i inventory/production.yml playbooks/deploy-packages.yml \
  -e "packages_repo=https://github.com/your-org/your-gravity.git"
```

### 5. Verify

```bash
ansible-playbook -i inventory/production.yml playbooks/health-check.yml
```

## Expected Output

```
GRAVITY PLATFORM DEPLOYED SUCCESSFULLY
============================================
Host: gravity-prod (<YOUR_VM_IP>)

Service Health:
  - Server:       OK
  - Workflow:     OK
  - Node Service: OK
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
