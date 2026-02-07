# Gravity Platform Ansible Automation

Ansible playbooks for enterprise deployment, upgrades, and operations.

## Structure

```
ansible/
├── inventory/
│   └── production.yml          # Your inventory (gitignored)
├── playbooks/
│   ├── install.yml             # Fresh installation
│   ├── install-caddy.yml       # Install Caddy reverse proxy with TLS
│   ├── install-umap.yml        # Install UMAP service
│   ├── upgrade.yml             # Rolling upgrade
│   ├── rollback.yml            # Rollback to previous version
│   ├── health-check.yml        # Verify all services healthy
│   ├── backup.yml              # Backup database
│   ├── restore.yml             # Restore from backup
│   ├── db-migrate.yml          # Database migrations
│   ├── harden.yml              # Security hardening
│   └── uninstall-caddy.yml     # Remove Caddy
├── files/
│   ├── .env.example            # Environment template
│   └── .env                    # Your secrets (gitignored)
├── templates/
│   └── Caddyfile.j2            # Caddy config template
└── ansible.cfg
```

## Quick Start

```bash
# 1. Configure inventory
cp inventory/production.yml.example inventory/production.yml
vim inventory/production.yml  # Set your VM IPs

# 2. Configure environment
cp files/.env.example files/.env
vim files/.env  # Set DATABASE_URL, REDIS_*, AUTH_*, DOMAIN

# 3. Install Gravity services
ansible-playbook -i inventory/production.yml playbooks/install.yml

# 4. Install Caddy (TLS)
ansible-playbook -i inventory/production.yml playbooks/install-caddy.yml -e "domain=yourdomain.com"

# 5. Verify
ansible-playbook -i inventory/production.yml playbooks/health-check.yml
```

## Playbooks

| Playbook              | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| `install.yml`         | Fresh installation (Docker, services, health checks) |
| `install-caddy.yml`   | Install Caddy reverse proxy with automatic TLS       |
| `install-umap.yml`    | Install UMAP service (optional, for spatial search)  |
| `upgrade.yml`         | Pull new images and restart (rolling upgrade)        |
| `rollback.yml`        | Rollback to previous version                         |
| `health-check.yml`    | Verify all services are healthy                      |
| `backup.yml`          | Backup PostgreSQL database                           |
| `restore.yml`         | Restore database from backup                         |
| `db-migrate.yml`      | Run database migrations                              |
| `harden.yml`          | Security hardening (SSH, firewall, fail2ban)         |
| `uninstall-caddy.yml` | Remove Caddy                                         |

## Common Operations

```bash
# Upgrade to latest version (after CI build completes)
ansible-playbook -i inventory/production.yml playbooks/upgrade.yml

# Check health
ansible-playbook -i inventory/production.yml playbooks/health-check.yml

# Backup database
ansible-playbook -i inventory/production.yml playbooks/backup.yml

# Install Caddy with your domain
ansible-playbook -i inventory/production.yml playbooks/install-caddy.yml -e "domain=example.com"

# Install UMAP (optional)
ansible-playbook -i inventory/production.yml playbooks/install-umap.yml
```

## Requirements

- Ansible 2.12+
- SSH access to target VMs
- DOCR token (for pulling Docker images from DigitalOcean Container Registry)
