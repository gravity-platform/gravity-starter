# Challenge 8: Deployment

Deploy Gravity Platform to production VMs.

## Overview

Production deployment uses **Ansible playbooks** to install and configure services on your VMs. The runbooks cover everything from core services to TLS, security hardening, and observability.

## Prerequisites

- SSH access to target VM(s)
- Ansible installed locally (`pip install ansible`)
- DOCR token for pulling images
- PostgreSQL instance provisioned (customer-managed)

## Quick Deploy (POC — Single VM)

```bash
cd ansible

# 1. Configure inventory
cp inventory/production.yml.example inventory/production.yml
# Edit with your VM IP, SSH key, etc.

# 2. Deploy core services
ansible-playbook -i inventory/production.yml playbooks/install.yml

# 3. Set up database
ansible-playbook -i inventory/production.yml playbooks/db-setup.yml

# 4. Deploy AI model
ansible-playbook -i inventory/production.yml playbooks/install-umap.yml

# 5. TLS with Caddy (optional)
ansible-playbook -i inventory/production.yml playbooks/install-caddy.yml \
  -e "domain=yourdomain.com"

# 6. Verify
ansible-playbook -i inventory/production.yml playbooks/test-connectivity.yml
```

## Runbooks

For detailed step-by-step guides, see the [Runbooks](../runbooks/README.md):

| Runbook                                             | Description                    |
| --------------------------------------------------- | ------------------------------ |
| [01-core](../runbooks/01-core.md)                   | Deploy core app services       |
| [02-database](../runbooks/02-database.md)           | Set up database tables         |
| [03-ai-model](../runbooks/03-ai-model.md)           | Deploy UMAP AI service         |
| [04-harden](../runbooks/04-harden.md)               | Security hardening             |
| [05-caddy](../runbooks/05-caddy.md)                 | TLS + reverse proxy            |
| [06-test](../runbooks/06-test.md)                   | Verify connectivity and health |
| [07-observability](../runbooks/07-observability.md) | Grafana/Loki (POC only)        |

## Deploying Custom Code

After deploying the platform, push your custom nodes and components:

```bash
ansible-playbook -i inventory/production.yml playbooks/deploy-packages.yml
```

## ✅ Challenge Complete

Your platform is deployed to production! Proceed to [Challenge 9: Update Gravity](./09-update-gravity.md).
