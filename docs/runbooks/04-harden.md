# Runbook: Security Hardening

Apply security hardening to Gravity Platform VMs.

## Overview

This runbook applies security best practices to production VMs:

- Firewall configuration (UFW)
- SSH hardening
- Fail2ban for brute-force protection
- Audit logging
- Docker security settings

## Prerequisites

- [ ] Core services deployed ([01-core.md](./01-core.md))
- [ ] Database configured ([02-database.md](./02-database.md))
- [ ] Services verified working before hardening

## Steps

### 1. Run Hardening Playbook

```bash
cd ansible
ansible-playbook -i inventory/production.yml playbooks/harden.yml
```

### 2. Verify Access Still Works

```bash
# Test SSH (from your machine)
ssh root@<VM_IP>

# Test services
ansible-playbook -i inventory/production.yml playbooks/test-connectivity.yml
```

## What Gets Configured

### Firewall (UFW)

| Port | Protocol | Source        | Purpose               |
| ---- | -------- | ------------- | --------------------- |
| 22   | TCP      | Your IP       | SSH access            |
| 80   | TCP      | Any           | HTTP (Caddy redirect) |
| 443  | TCP      | Any           | HTTPS (Caddy)         |
| 5432 | TCP      | Outbound only | PostgreSQL            |

### SSH Hardening

- Disable password authentication
- Disable root login (use sudo user)
- Limit SSH to specific IPs (optional)

### Fail2ban

- Bans IPs after 5 failed SSH attempts
- 10 minute ban duration
- Protects against brute-force attacks

## Expected Output

```
SECURITY HARDENING APPLIED
============================================
Host: gravity-prod (<YOUR_VM_IP>)

Applied:
  - UFW firewall: ENABLED
  - SSH hardening: APPLIED
  - Fail2ban: RUNNING
  - Audit logging: ENABLED
```

## Troubleshooting

| Issue                 | Cause                    | Fix                                                |
| --------------------- | ------------------------ | -------------------------------------------------- |
| Locked out of SSH     | Firewall too strict      | Use DO Console to access VM                        |
| Services unreachable  | Ports not opened         | Check UFW rules: `ufw status`                      |
| Fail2ban blocking you | Too many failed attempts | Wait 10 min or unban: `fail2ban-client unban <IP>` |

## Rollback

If hardening causes issues:

```bash
# Disable firewall temporarily
ssh root@<VM_IP> "ufw disable"

# Then fix the rules and re-enable
ssh root@<VM_IP> "ufw enable"
```

## Next Steps

- [05-caddy.md](./05-caddy.md) - TLS + reverse proxy (optional)
- [06-test.md](./06-test.md) - Verify connectivity
