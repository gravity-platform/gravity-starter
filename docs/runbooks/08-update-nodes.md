# Runbook: Update Nodes & Components

Update custom packages (nodes) and design-system components without touching the core platform.

## Overview

Use this when you've:

- Created or modified a package in `packages/`
- Added or changed a component in `apps/design-system/storybook/components/`
- Added or changed a template in `apps/design-system/storybook/templates/`

This does **not** pull new Docker images or update the core platform. For a full update, use `gravity update`.

## Deploy to Server (via Ansible)

After pushing changes to your starter repo:

```bash
ansible-playbook -i inventory/production.yml playbooks/deploy-packages.yml
```

This clones `starter_repo` (from `production.yml`), copies packages to the server, runs `npm install` + `npm run build` + `gen:nodes`, and restarts node-service.

## Local Development

### Prerequisites

- [ ] Platform running (`gravity start` or `gravity dev`)
- [ ] Node.js and npm installed

### Quick Update

```bash
./gravity update nodes
```

This will:

1. Install any new dependencies
2. Build `plugin-base` (dependency for all packages)
3. Build all workspace packages
4. Generate nodes and component bundles from design-system
5. Restart `node-service` to pick up changes

Expected output:

```
  ═══ Updating Nodes ═══

  Building packages...
  ✓ Packages rebuilt (17 packages)
  Restarting node-service...

  ✓ Nodes updated (12s)
```

## Manual Steps (if needed)

### Build a single package

```bash
npm run build -w @gravity-platform/my-package
```

### Build all packages

```bash
npm run build -w @gravity-platform/plugin-base
npm run build --workspaces --if-present
```

### Regenerate design-system nodes and component bundles

```bash
npm run gen:nodes
```

This scans `apps/design-system/storybook/components/` and `templates/`, then:

- Generates workflow node definitions in `packages/design-system/src/`
- Bundles React components into `packages/design-system/dist/components/`

### Restart node-service to load new packages

```bash
docker compose restart node-service
```

## Verify

After updating, confirm packages loaded:

```bash
# Check node-service logs
docker compose logs node-service | head -20

# Check loaded plugins count
curl -s http://localhost:4102/plugins | python3 -m json.tool

# Check component bundles are served
curl -s -o /dev/null -w '%{http_code}' http://localhost:4100/components/AIResponse.js
# Should return: 200
```

## How It Works

```
packages/              → Mounted into node-service at /app/packages
                         node-service discovers and loads plugins on startup

apps/design-system/    → Components bundled into dist/components/*.js
                         Mounted into server at /app/packages/design-system
                         Server serves bundles at /components/:name.js
                         Canvas loads bundles dynamically via <script> tag
```

## Troubleshooting

| Issue                                     | Cause                            | Fix                                              |
| ----------------------------------------- | -------------------------------- | ------------------------------------------------ |
| Package not loading                       | Missing `dist/index.js`          | Run `gravity update nodes`                       |
| Component 404                             | Bundle not generated             | Run `npm run gen:nodes` then restart server      |
| "Cannot find module" in node-service logs | Old node-service image (<v1.8.4) | Run `gravity update` (full) to pull new images   |
| TypeScript errors during build            | Missing dependency               | Run `npm install` then retry                     |
| gen:nodes fails                           | Storybook config issue           | Check `apps/design-system/storybook/` for errors |

## Related

- [01-core.md](./01-core.md) — Initial deployment
- [06-test.md](./06-test.md) — Full health check
- [Node documentation](../nodes/) — How to create custom nodes
