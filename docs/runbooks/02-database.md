# Runbook: Database Setup

Create database tables and schema.

## Overview

Gravity Platform requires a PostgreSQL database. The database is **always customer-managed** — it is never bundled with the platform.

The `DATABASE_URL` is configured in `ansible/files/.env` and deployed with `install.yml`. This runbook creates the required database tables.

## Prerequisites

- [ ] Core services deployed ([01-core.md](./01-core.md))
- [ ] `DATABASE_URL` configured in `ansible/files/.env`
- [ ] PostgreSQL instance accessible from VM (firewall allows port 5432)

## Database Requirements

| Requirement        | Value                          |
| ------------------ | ------------------------------ |
| PostgreSQL version | 14+                            |
| Database name      | `gravity`                      |
| SSL                | Required for managed databases |
| Min connections    | 20                             |

## Steps

### 1. Run Database Setup

```bash
cd ansible
ansible-playbook -i inventory/production.yml playbooks/db-setup.yml
```

### 2. Verify

```bash
# Check service health
curl https://your-domain.com/api/health

# Or via Ansible
ansible-playbook -i inventory/production.yml playbooks/health-check.yml
```

## Expected Output

```
DATABASE MIGRATION
============================================
Host: gravity-prod (<YOUR_VM_IP>)
Migration: OK
```

## Troubleshooting

| Issue              | Cause                      | Fix                                        |
| ------------------ | -------------------------- | ------------------------------------------ |
| Connection refused | Firewall blocking          | Add VM IP to database trusted sources      |
| SSL required       | Missing `?sslmode=require` | Add SSL mode to connection string          |
| Auth failed        | Wrong credentials          | Verify username/password in DO/AWS console |
| Database not found | DB not created             | Create `gravity` database manually         |

## Creating Database Manually

If the database doesn't exist:

```sql
CREATE DATABASE gravity;
```

## Next Steps

- [03-ai-model.md](./03-ai-model.md) - Deploy UMAP AI service
- [04-harden.md](./04-harden.md) - Security hardening
