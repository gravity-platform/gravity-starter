# Runbook: Caddy (TLS + Reverse Proxy)

Configure Caddy for TLS termination and hostname-based routing.

## Overview

Caddy provides:

- Automatic Let's Encrypt TLS certificates
- Hostname-based routing (api.domain.com → server, mcp.domain.com → mcp-server)
- HTTP → HTTPS redirect

**Caddy is optional.** Skip this if customer has their own load balancer (F5, HAProxy, AWS ALB).

## Prerequisites

- [ ] Core services deployed ([01-core.md](./01-core.md))
- [ ] DNS A records pointing to VM IP (or Load Balancer IP)
- [ ] Ports 80 and 443 open on firewall

## When to Use Caddy

| Scenario                   | Use Caddy? | Notes                             |
| -------------------------- | ---------- | --------------------------------- |
| Single VM, no LB           | ✅ Yes     | Caddy handles TLS + routing       |
| Multi-VM with cloud LB     | ✅ Yes     | LB passthrough, Caddy handles TLS |
| Enterprise with F5/HAProxy | ❌ No      | Customer LB handles everything    |

## Steps

### 1. Configure DNS

Point these A records to your VM IP (or Load Balancer IP):

| Hostname             | Value     |
| -------------------- | --------- |
| `yourdomain.com`     | `<VM_IP>` |
| `api.yourdomain.com` | `<VM_IP>` |
| `mcp.yourdomain.com` | `<VM_IP>` |

### 2. Install Caddy

```bash
cd ansible
ansible-playbook -i inventory/production.yml playbooks/install-caddy.yml \
  -e "domain=yourdomain.com"
```

### 3. Verify

```bash
curl https://yourdomain.com
curl https://api.yourdomain.com/health
curl https://mcp.yourdomain.com/health
```

## With Load Balancer (HTTPS Passthrough)

If using a cloud load balancer (DigitalOcean, AWS, etc.):

1. Configure LB for **HTTPS Passthrough** (443 → 443)
2. Point DNS to Load Balancer IP
3. Install Caddy normally (it handles TLS)

```
User → LB (HTTPS Passthrough) → VM → Caddy (TLS) → Services
```

## Configured Routes

| Subdomain        | Service     | Port |
| ---------------- | ----------- | ---- |
| `domain.com`     | Canvas (UI) | 3001 |
| `api.domain.com` | API Server  | 4100 |
| `mcp.domain.com` | MCP Server  | 4103 |

## Expected Output

```
CADDY REVERSE PROXY INSTALLED
============================================
Host: gravity-prod (<YOUR_VM_IP>)
Domain: yourdomain.com
Mode: Direct (TLS via Lets Encrypt)

Configured routes:
  - https://yourdomain.com -> Canvas (port 3001)
  - https://api.yourdomain.com -> API Server (port 4100)
  - https://mcp.yourdomain.com -> MCP Server (port 4103)
```

## Troubleshooting

| Issue                    | Cause                  | Fix                                        |
| ------------------------ | ---------------------- | ------------------------------------------ |
| Cert provisioning failed | DNS not pointing to VM | Verify DNS with `dig yourdomain.com`       |
| Port 80/443 blocked      | Firewall               | Open ports: `ufw allow 80,443/tcp`         |
| Too many cert requests   | Rate limited           | Wait 1 hour, Let's Encrypt has rate limits |

## Uninstall Caddy

```bash
ansible-playbook -i inventory/production.yml playbooks/uninstall-caddy.yml
```

## Next Steps

- [06-test.md](./06-test.md) - Verify connectivity
