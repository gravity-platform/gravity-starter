#!/usr/bin/env bash
# gravity db-setup

cmd_db_setup() {
  banner "Database Setup"
  timer_start

  # Load DATABASE_URL from .env
  local db_url
  db_url=$(grep "^DATABASE_URL=" "$ROOT/.env" 2>/dev/null | cut -d'=' -f2-)
  if [ -z "$db_url" ]; then
    fail "DATABASE_URL not found in .env"
    exit 1
  fi
  ok "DATABASE_URL configured"

  # Detect environment: monorepo (local dev) vs starter (Docker)
  if [ -d "$ROOT/apps/workflow" ]; then
    # Local dev — run directly via node
    echo ""
    echo "  Initializing database tables (local dev)..."

    # Always rebuild workflow to ensure migrations reflect latest code
    echo "  Building workflow..."
    (cd "$ROOT" && npx turbo run build --filter=@gravity-platform/gravity-workflow >/dev/null 2>&1) || {
      fail "Workflow build failed — run 'npx turbo run build' first"
      exit 1
    }

    # Run table initialization
    NODE_TLS_REJECT_UNAUTHORIZED=0 DATABASE_URL="$db_url" node --no-warnings -e "
      const db = require('$ROOT/apps/workflow/dist/db');
      (async () => {
        const steps = [
          ['Extensions', async () => {
            const { Pool } = require('pg');
            const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
            for (const ext of ['vector', 'pg_stat_statements']) {
              try { await p.query('CREATE EXTENSION IF NOT EXISTS ' + ext); }
              catch (e) { console.log('  ⚠ ' + ext + ': ' + e.message); }
            }
            await p.end();
          }],
          ['Workflows', () => db.createWorkflowTable ? db.createWorkflowTable() : Promise.resolve()],
          ['Executions', () => db.createExecutionTables ? db.createExecutionTables() : Promise.resolve()],
          ['Credentials', () => db.createCredentialsTable ? db.createCredentialsTable() : Promise.resolve()],
          ['TokenUsage', () => db.createSimpleTokenUsageTable ? db.createSimpleTokenUsageTable() : Promise.resolve()],
          ['GravityMemory', () => db.createGravityMemoryTables ? db.createGravityMemoryTables() : Promise.resolve()],
          ['Registry', () => db.createRegistryTables ? db.createRegistryTables() : Promise.resolve()],
        ];
        let ok = 0;
        for (const [name, fn] of steps) {
          try { await fn(); console.log('  ✓ ' + name); ok++; }
          catch (e) { console.error('  ✗ ' + name + ': ' + e.message); }
        }
        try {
          const dict = require('$ROOT/apps/workflow/dist/db/dictionary');
          if (dict.createAllTables) await dict.createAllTables();
          console.log('  ✓ Dictionary'); ok++;
        } catch (e) { console.error('  ✗ Dictionary: ' + e.message); }
        console.log('  Done: ' + ok + ' table groups created');
        process.exit(0);
      })().catch(e => { console.error(e); process.exit(1); });
    " 2>&1 || {
      fail "Table initialization failed"
      exit 1
    }
  else
    # Starter/production — run via Docker workflow container
    # The migration code lives inside the workflow image (dist/db/).
    # The workflow service must be running so we can exec into it.
    echo ""

    if ! docker compose -f "$ROOT/docker-compose.yml" ps --status running workflow 2>/dev/null | grep -q workflow; then
      echo ""
      echo -e "  ${YELLOW}The workflow service must be running to initialize the database.${NC}"
      echo -e "  ${DIM}(Migration code is bundled inside the workflow Docker image)${NC}"
      echo ""
      echo -e "  Start services first, then re-run:"
      echo -e "    ${GREEN}./gravity start${NC}"
      echo -e "    ${GREEN}./gravity db-setup${NC}"
      echo ""
      exit 1
    fi

    echo "  Initializing database tables (via Docker)..."

    docker compose -f "$ROOT/docker-compose.yml" exec -T \
      -e NODE_TLS_REJECT_UNAUTHORIZED=0 workflow node --no-warnings -e "
      const db = require('./dist/db');
      (async () => {
        const steps = [
          ['Extensions', async () => {
            const { Pool } = require('pg');
            const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
            for (const ext of ['vector', 'pg_stat_statements']) {
              try { await p.query('CREATE EXTENSION IF NOT EXISTS ' + ext); }
              catch (e) { console.log('  ⚠ ' + ext + ': ' + e.message); }
            }
            await p.end();
          }],
          ['Workflows', () => db.createWorkflowTable ? db.createWorkflowTable() : Promise.resolve()],
          ['Executions', () => db.createExecutionTables ? db.createExecutionTables() : Promise.resolve()],
          ['Credentials', () => db.createCredentialsTable ? db.createCredentialsTable() : Promise.resolve()],
          ['TokenUsage', () => db.createSimpleTokenUsageTable ? db.createSimpleTokenUsageTable() : Promise.resolve()],
          ['GravityMemory', () => db.createGravityMemoryTables ? db.createGravityMemoryTables() : Promise.resolve()],
          ['Registry', () => db.createRegistryTables ? db.createRegistryTables() : Promise.resolve()],
        ];
        let ok = 0;
        for (const [name, fn] of steps) {
          try { await fn(); console.log('  ✓ ' + name); ok++; }
          catch (e) { console.error('  ✗ ' + name + ': ' + e.message); }
        }
        try {
          const dict = require('./dist/db/dictionary');
          if (dict.createAllTables) await dict.createAllTables();
          console.log('  ✓ Dictionary'); ok++;
        } catch (e) { console.error('  ✗ Dictionary: ' + e.message); }
        console.log('  Done: ' + ok + ' table groups created');
        process.exit(0);
      })().catch(e => { console.error(e); process.exit(1); });
    " 2>&1 || {
      fail "Table initialization failed"
      exit 1
    }
  fi

  echo ""
  ok "Database setup complete ${DIM}($(timer_elapsed))${NC}"
  echo ""

  # Auto-verify schema after setup
  echo "  Verifying schema..."
  echo ""
  cmd_db_verify
}
