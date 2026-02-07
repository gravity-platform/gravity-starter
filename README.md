# Gravity Starter Template

Build custom AI experiences powered by the Gravity Platform.

## Quick Start

```bash
# 1. Setup (configure env, login to registry, pull images)
./gravity init

# 2. Start the platform
./gravity start

# 3. Install dev dependencies (for building custom nodes & components)
npm install
```

## Platform Commands

| Command | Purpose |
|---------|---------|
| `./gravity init` | Interactive setup wizard |
| `./gravity start` | Start the platform |
| `./gravity stop` | Stop the platform |
| `./gravity status` | Show service health |
| `./gravity logs` | Stream logs (`./gravity logs server` for one service) |
| `./gravity update` | Pull latest images and restart |
| `./gravity doctor` | Diagnose issues |
| `./gravity dev` | Install deps, generate nodes, start dev environment |
| `./gravity build` | Build all + gen:nodes + restart (`./gravity build <pkg>` for one) |

## Access

- **Canvas** (Workflow Builder): http://localhost:3001
- **API**: http://localhost:4100
- **Grafana** (Logs): http://localhost:3000

## Development

### Custom Nodes

```bash
# Create a new package in packages/my-custom-node/
# ... write your node code ...

# Build and restart
./gravity build @gravity-platform/my-custom-node
```

See `docs/nodes/` for full node development guide.

### UI Components (Design System)

```bash
# Edit components in apps/design-system/storybook/
# Regenerate workflow nodes + restart
./gravity gendesign
```

See `docs/onboarding/05-components-and-templates.md` for details.

## Deployment (Production)

See `ansible/` and `docs/runbooks/` for production deployment.
