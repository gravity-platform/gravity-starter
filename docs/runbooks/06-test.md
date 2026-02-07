# Runbook: Test Connectivity

Verify all services are running and accessible.

## Overview

This runbook validates:

- Docker is running
- All containers are healthy
- Internal ports are open
- Health endpoints respond
- External access works (if Caddy installed)

## Prerequisites

- [ ] Core services deployed ([01-core.md](./01-core.md))
- [ ] Database configured ([02-database.md](./02-database.md))

## Steps

### 1. Run Connectivity Test

```bash
cd ansible
ansible-playbook -i inventory/production.yml playbooks/test-connectivity.yml
```

### 2. Manual Verification (Optional)

```bash
# SSH to VM
ssh root@<VM_IP>

# Check containers
docker compose ps

# Check logs
docker compose logs --tail=50 server
docker compose logs --tail=50 workflow
```

## Expected Output

```
CONNECTIVITY TEST RESULTS
============================================
Host: gravity-prod (YOUR_VM_IP)

Docker: OK

Port Status:
  - Canvas (3001): OK
  - Server (4100): OK
  - Workflow (4101): OK
  - Node Service (4102): OK
  - MCP Server (4103): OK
  - Redis (6379): OK

Health Endpoints:
  - Server: OK
  - Workflow: OK
  - Node Service: OK
  - MCP Server: OK

Caddy (external):
  - Port 80: OK
  - Port 443: OK
```

## Service Health Endpoints

| Service      | URL                            | Expected |
| ------------ | ------------------------------ | -------- |
| Server       | `http://localhost:4100/health` | 200 OK   |
| Workflow     | `http://localhost:4101/health` | 200 OK   |
| Node Service | `http://localhost:4102/health` | 200 OK   |
| MCP Server   | `http://localhost:4103/health` | 200 OK   |
| UMAP         | `http://localhost:5001/health` | 200 OK   |

## Troubleshooting

| Issue                     | Cause               | Fix                                         |
| ------------------------- | ------------------- | ------------------------------------------- |
| Container not running     | Crashed on startup  | Check logs: `docker compose logs <service>` |
| Health check failed       | Missing env vars    | Verify `.env` at `/opt/gravity/.env`        |
| Port closed               | Service not started | Restart: `docker compose restart <service>` |
| Database connection error | Wrong DATABASE_URL  | Re-run [02-database.md](./02-database.md)   |

## Quick Commands

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart server

# View logs
docker compose logs -f server

# Check resource usage
docker stats
```

## Local Development Verification

Run these checks after `gravity dev` or `gravity update` to verify everything is working.

### Quick Check (copy-paste this block)

```bash
echo "=== Gravity Platform Health Check ==="
echo ""

# 1. Services running
echo "1. Services"
for svc in server workflow node-service canvas umap mcp-server; do
  status=$(docker compose ps --format '{{.Status}}' $svc 2>/dev/null | head -1)
  if echo "$status" | grep -q "Up"; then
    echo "   ✓ $svc — $status"
  else
    echo "   ✗ $svc — NOT RUNNING"
  fi
done
echo ""

# 2. Health endpoints
echo "2. Health Endpoints"
for url in http://localhost:4100/health http://localhost:4101/health http://localhost:4102/health http://localhost:5001/health; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null)
  name=$(echo "$url" | grep -oE '[0-9]+' | head -1)
  if [ "$code" = "200" ]; then
    echo "   ✓ :$name — 200 OK"
  else
    echo "   ✗ :$name — $code"
  fi
done
echo ""

# 3. Packages built
echo "3. Packages (dist/index.js)"
built=0; total=0
for pkg in packages/*/; do
  [ -f "$pkg/package.json" ] || continue
  name=$(basename "$pkg")
  # Skip non-plugin packages
  case "$name" in design-system|gravity-client|plugin-base|skills|prompt-blocks) continue;; esac
  total=$((total + 1))
  if [ -f "$pkg/dist/index.js" ]; then
    built=$((built + 1))
  else
    echo "   ✗ $name — missing dist/index.js"
  fi
done
echo "   ✓ $built/$total packages built"
echo ""

# 4. Node-service loaded plugins
echo "4. Node Service Plugins"
nodes_json=$(curl -s http://localhost:4102/nodes 2>/dev/null)
node_count=$(echo "$nodes_json" | grep -o '"type"' | wc -l | tr -d ' ')
echo "   Nodes registered: $node_count"
plugins_json=$(curl -s http://localhost:4102/plugins 2>/dev/null)
echo "   Plugins: $(echo "$plugins_json" | grep -o '"name"' | wc -l | tr -d ' ') loaded"
echo ""

# 5. Component bundles served
echo "5. Component Bundles (server → Canvas)"
for comp in AIResponse.js Card.js ChatInput.js; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:4100/components/$comp" 2>/dev/null)
  if [ "$code" = "200" ]; then
    echo "   ✓ /components/$comp — 200"
  else
    echo "   ✗ /components/$comp — $code"
  fi
done
echo ""

# 6. Canvas accessible
echo "6. Canvas UI"
code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3001 2>/dev/null)
if [ "$code" = "200" ]; then
  echo "   ✓ http://localhost:3001 — 200 OK"
else
  echo "   ✗ http://localhost:3001 — $code"
fi
echo ""
echo "=== Done ==="
```

### Expected Output (all passing)

```
=== Gravity Platform Health Check ===

1. Services
   ✓ server — Up 2 minutes
   ✓ workflow — Up 2 minutes
   ✓ node-service — Up 2 minutes
   ✓ canvas — Up 2 minutes
   ✓ umap — Up 2 minutes
   ✓ mcp-server — Up 2 minutes

2. Health Endpoints
   ✓ :4100 — 200 OK
   ✓ :4101 — 200 OK
   ✓ :4102 — 200 OK
   ✓ :5001 — 200 OK

3. Packages (dist/index.js)
   ✓ 12/12 packages built

4. Node Service Plugins
   Nodes registered: 45
   Plugins: 12 loaded

5. Component Bundles (server → Canvas)
   ✓ /components/AIResponse.js — 200
   ✓ /components/Card.js — 200
   ✓ /components/ChatInput.js — 200

6. Canvas UI
   ✓ http://localhost:3001 — 200 OK

=== Done ===
```

### Troubleshooting Failures

| Check                  | Failure                            | Fix                                                       |
| ---------------------- | ---------------------------------- | --------------------------------------------------------- |
| Services not running   | Container crashed                  | `docker compose logs <service>` then `gravity update`     |
| Health endpoint failed | Missing `.env` vars                | Check `.env` has `REDIS_HOST`, `DATABASE_URL`, auth vars  |
| Packages not built     | No `dist/` directory               | `gravity update` (builds all packages)                    |
| Plugins: 0 loaded      | node-service can't import packages | Check image version — needs v1.8.4+. Run `gravity update` |
| Component bundles 404  | Server can't find design-system    | Verify `DESIGN_SYSTEM_PATH` in docker-compose.yml         |
| Canvas 404             | Container not started              | `docker compose up -d canvas`                             |

## Next Steps

If all tests pass, your deployment is complete!

For ongoing operations:

- **Upgrades:** `ansible-playbook playbooks/upgrade.yml`
- **Backups:** `ansible-playbook playbooks/backup.yml`
- **Rollback:** `ansible-playbook playbooks/rollback.yml`
