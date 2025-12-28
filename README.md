# Gravity Starter Template

Build custom AI experiences powered by the Gravity Platform.

## Quick Start

### Clone the Repository

```bash
# Using GitHub token (replace YOUR_TOKEN with your personal access token)
git clone https://YOUR_USERNAME:YOUR_TOKEN@github.com/gravity-platform/gravity-starter.git ~/gravity
cd ~/gravity
```

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy environment config
cp .env.example .env
# Edit .env with your database and OIDC settings

# 3. Pull platform images (requires GHCR login)
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
docker compose pull

# 4. Build your client app
docker compose build sab

# 5. Start everything
docker compose up -d
```

## Access

- **Canvas** (Workflow Builder): http://localhost:3001
- **SAB** (Client App): http://localhost:3007

## Development

### Creating Custom Nodes

1. Create a new package in `packages/my-custom-node/`
2. Build: `npm run build -w @gravity-platform/my-custom-node`
3. Restart: `docker compose restart node-service`

### Creating UI Components

1. Create component in `apps/design-system/storybook/components/`
2. Generate nodes: `npm run gen:nodes`
3. Restart: `docker compose restart node-service`

## Documentation

See the [Developer Guide](./docs/DEVELOPER_GUIDE.md) for full documentation.
