# Runbook: Restart & Rebuild

Rebuild packages, regenerate nodes, reload components, and restart services so the platform picks up your latest changes.

## When To Use

- New or updated **design system components** (storybook atoms/components)
- New or updated **custom node packages** (in `packages/`)
- After `git pull` or `gravity update` when the platform isn't reflecting changes
- After editing node executor code, templates, or component bundles

## Quick Commands

### Local Development

```bash
# Full rebuild — builds all packages, regenerates nodes, restarts services
./gravity build

# Build one package only
./gravity build @gravity-platform/my-package

# Regenerate design system nodes only (after editing storybook components)
./gravity gendesign

# Full dev setup — install deps, build, gen:nodes, restart
./gravity dev
```

### Production Server (via Ansible)

```bash
cd ansible
ansible-playbook -i inventory/production.yml playbooks/deploy-packages.yml
```

## What Each Step Does

| Step | Command | What happens |
|------|---------|-------------|
| **1. Install deps** | `npm install` | Installs workspace dependencies |
| **2. Build packages** | `npm run build --workspaces` | Compiles TypeScript → `dist/` for all packages |
| **3. Generate nodes** | `npm run gen:nodes` | Scans `apps/design-system/storybook/` and generates workflow nodes + component bundles in `packages/design-system/` |
| **4. Restart node-service** | `docker compose restart node-service` | Reloads built packages and plugins |
| **5. Restart workflow** | `docker compose restart workflow` | Picks up new node definitions |
| **6. Restart server** | `docker compose restart server` | Reloads component bundles served at `/components/*.js` |

## Manual Step-by-Step (when CLI commands aren't enough)

If you need full control, run each step individually:

```bash
# 1. Install dependencies
npm install

# 2. Build plugin-base first (other packages depend on it)
npm run build -w @gravity-platform/plugin-base

# 3. Build all packages
npm run build --workspaces --if-present

# 4. Regenerate nodes from design system
npm run gen:nodes

# 5. Restart services that load packages
docker compose restart node-service workflow server

# 6. Verify
./gravity status
```

## Component Bundle Reload

Component bundles (the `.js` files served at `http://localhost:4100/components/`) are built by `gen:nodes` and stored in `packages/design-system/components/`. The **server** service serves these files.

If components aren't updating in the Canvas:

```bash
# Regenerate component bundles
npm run gen:nodes

# Restart server (serves component bundles)
docker compose restart server

# Verify a component loads
curl -s http://localhost:4100/components/AIResponse.js | head -5
```

## Nuclear Restart (full teardown + rebuild)

When things are truly stuck:

```bash
# Stop everything
./gravity stop

# Rebuild from scratch
npm install
npm run build -w @gravity-platform/plugin-base
npm run build --workspaces --if-present
npm run gen:nodes

# Start fresh
./gravity start
```

## Verify

```bash
# Check all services are running
./gravity status

# Full health check
./gravity check

# Check plugins loaded in node-service
curl -s http://localhost:4102/plugins | python3 -m json.tool | head -20

# Check component bundles served
curl -s -o /dev/null -w '%{http_code}' http://localhost:4100/components/AIResponse.js
# Should return 200
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| New component not in Canvas | `gen:nodes` not run | `./gravity gendesign` |
| Node shows in Canvas but errors | Package not built | `./gravity build` |
| Component renders old version | Server serving cached bundle | `docker compose restart server` |
| `plugins: 0` in status | node-service didn't load packages | Check `docker compose logs node-service` |
| Build fails | Missing plugin-base | `npm run build -w @gravity-platform/plugin-base` first |
| gen:nodes fails | design-system not built | `npm run build -w @gravity-platform/design-system-dev` first |

## Related

- [01-core.md](./01-core.md) — Initial deployment
- [08-deploy-packages.md](./08-deploy-packages.md) — Deploy packages to production
- [06-test.md](./06-test.md) — Full health check
