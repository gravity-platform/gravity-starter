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

| Component      | Requirement                 | Notes                                                  |
| -------------- | --------------------------- | ------------------------------------------------------ |
| **PostgreSQL** | 14+                         | Customer-managed (DO Managed, AWS RDS, or self-hosted) |
| **Redis**      | 7+                          | Bundled for POC, customer-managed for Enterprise       |
| **Domain**     | DNS A records               | Point to VM IP or Load Balancer IP                     |
| **TLS**        | Caddy (auto) or customer LB | Caddy auto-provisions Let's Encrypt certs              |

### Supported Platforms

- **Cloud:** DigitalOcean, AWS, Azure, GCP
- **On-prem:** VMware, Proxmox, bare metal
- **OS:** Ubuntu 22.04 LTS (recommended), Debian 12

---

## Runbook Modules

| Runbook                                   | Description                        | Ansible Playbook            |
| ----------------------------------------- | ---------------------------------- | --------------------------- |
| [01-core](./01-core.md)                   | Deploy core app services           | `install.yml`               |
| [02-database](./02-database.md)           | Set up database tables             | `db-setup.yml`              |
| [03-ai-model](./03-ai-model.md)           | Deploy UMAP AI service             | `install-umap.yml`          |
| [04-harden](./04-harden.md)               | Security hardening                 | `harden.yml`                |
| [05-caddy](./05-caddy.md)                 | TLS + reverse proxy (optional)     | `install-caddy.yml`         |
| [06-test](./06-test.md)                   | Verify connectivity and health     | `test-connectivity.yml`     |
| [07-observability](./07-observability.md) | Grafana/Loki/Prometheus (POC only) | `install-observability.yml` |

---

## VM Deployment Recipes

### POC (Single VM - All Services)

```bash
# 1. Core services
ansible-playbook -i inventory/production.yml playbooks/install.yml

# 2. Database connection
ansible-playbook -i inventory/production.yml playbooks/configure-db.yml \
  -e "database_url=postgresql://user:pass@host:5432/gravity"

# 3. AI model
ansible-playbook -i inventory/production.yml playbooks/install-umap.yml

# 4. Security hardening
ansible-playbook -i inventory/production.yml playbooks/harden.yml

# 5. TLS (optional - if no external LB)
ansible-playbook -i inventory/production.yml playbooks/install-caddy.yml \
  -e "domain=yourdomain.com"

# 6. Verify
ansible-playbook -i inventory/production.yml playbooks/test-connectivity.yml
```

### Enterprise App VM

```bash
ansible-playbook -i inventory/production.yml playbooks/install.yml -l gravity_app_vms
ansible-playbook -i inventory/production.yml playbooks/configure-db.yml -l gravity_app_vms \
  -e "database_url=postgresql://..."
ansible-playbook -i inventory/production.yml playbooks/harden.yml -l gravity_app_vms
ansible-playbook -i inventory/production.yml playbooks/test-connectivity.yml -l gravity_app_vms
```

### Enterprise ML VM

```bash
ansible-playbook -i inventory/production.yml playbooks/install-umap.yml -l gravity_ml_vms
ansible-playbook -i inventory/production.yml playbooks/harden.yml -l gravity_ml_vms
```

## Prerequisites

- SSH access to target VMs
- Ansible installed locally
- DOCR token for pulling images
- PostgreSQL instance provisioned (customer-managed)
