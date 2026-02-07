# Challenge 9: Update Gravity

Keep your platform up to date when new versions are released.

## When to Update

Your Gravity admin will notify you when a new platform version is available. Updates include bug fixes, new features, and performance improvements to the core services.

## Steps

### 1. Pull Latest Starter Code

```bash
cd ~/gravity
git pull
```

This updates your `docker-compose.yml`, `./gravity` script, docs, and any shared config.

### 2. Update Platform Images

```bash
./gravity update
```

This pulls the latest Docker images and restarts all services.

### 3. Verify

```bash
./gravity status
./gravity doctor
```

## ✅ Onboarding Complete!

For detailed node development, see the [Node Documentation](../nodes/README.md).
