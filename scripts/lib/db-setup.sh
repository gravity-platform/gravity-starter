#!/usr/bin/env bash
# gravity db-setup — runs node-pg-migrate to apply all pending migrations

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

  # Auto-add sslmode=prefer if not specified (works for both SSL and non-SSL Postgres)
  if [[ "$db_url" != *"sslmode="* ]]; then
    if [[ "$db_url" == *"?"* ]]; then
      db_url="${db_url}&sslmode=prefer"
    else
      db_url="${db_url}?sslmode=prefer"
    fi
  fi

  # Detect environment: monorepo (local dev) vs starter (Docker)
  if [ -d "$ROOT/apps/workflow" ]; then
    # ── Local dev — run node-pg-migrate directly ──
    echo ""
    echo "  Running migrations (local dev)..."

    NODE_TLS_REJECT_UNAUTHORIZED=0 DATABASE_URL="$db_url" \
      npx node-pg-migrate up \
        --migrations-dir "$ROOT/apps/workflow/migrations" \
        --migration-file-language sql \
        --no-lock \
        2>&1 | sed 's/^/  /' || {
      fail "Migrations failed"
      exit 1
    }

    # Seed security corpus (idempotent)
    _seed_security_corpus "$db_url" "$ROOT/apps/memory/src/security/corpus-seed.json"

  else
    # ── Starter/production — run via Docker workflow container ──
    echo ""

    if ! docker compose -f "$ROOT/docker-compose.yml" ps --status running workflow 2>/dev/null | grep -q workflow; then
      echo ""
      echo -e "  ${YELLOW}The workflow service must be running to apply migrations.${NC}"
      echo -e "  ${DIM}(Migration files are bundled inside the workflow Docker image)${NC}"
      echo ""
      echo -e "  Start services first, then re-run:"
      echo -e "    ${GREEN}./gravity start${NC}"
      echo -e "    ${GREEN}./gravity db-setup${NC}"
      echo ""
      exit 1
    fi

    echo "  Running migrations (via Docker)..."

    docker compose -f "$ROOT/docker-compose.yml" exec -T \
      -e NODE_TLS_REJECT_UNAUTHORIZED=0 \
      -e DATABASE_URL="$db_url" \
      workflow \
      npx node-pg-migrate up \
        --migrations-dir /app/migrations \
        --migration-file-language sql \
        --no-lock \
        2>&1 | sed 's/^/  /' || {
      fail "Migrations failed"
      exit 1
    }

    # Seed security corpus via Docker
    docker compose -f "$ROOT/docker-compose.yml" exec -T \
      -e NODE_TLS_REJECT_UNAUTHORIZED=0 workflow node --no-warnings -e "
      const fs = require('fs');
      const { Pool } = require('pg');
      (async () => {
        try {
          const seedData = JSON.parse(fs.readFileSync('/app/security-corpus-seed.json', 'utf-8'));
          const ssl = process.env.DATABASE_URL.includes('sslmode=') ? { rejectUnauthorized: false } : false;
          const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl });
          for (const a of seedData) {
            await pool.query(
              'INSERT INTO security_attack_corpus (id,category,label,attack_prompt,expected_result,severity,source,is_active) VALUES (\$1,\$2,\$3,\$4,\$5,\$6,\$7,true) ON CONFLICT (id) DO NOTHING',
              [a.id, a.category, a.label, a.attack_prompt, a.expected_result, a.severity, a.source]
            );
          }
          console.log('  ✓ Seeded ' + seedData.length + ' security corpus attacks');
          await pool.end();
        } catch (e) { console.warn('  ⚠ Security corpus seed skipped: ' + e.message); }
        process.exit(0);
      })();
    " 2>&1 || true
  fi

  echo ""
  ok "Database setup complete ${DIM}($(timer_elapsed))${NC}"
  echo ""

  # Auto-verify schema after setup
  echo "  Verifying schema..."
  echo ""
  cmd_db_verify
}

# Seed security attack corpus (local dev helper)
_seed_security_corpus() {
  local db_url="$1"
  local seed_file="$2"

  if [ ! -f "$seed_file" ]; then
    echo "  ⚠ Security corpus seed file not found — skipping"
    return 0
  fi

  NODE_TLS_REJECT_UNAUTHORIZED=0 DATABASE_URL="$db_url" node --no-warnings -e "
    const fs = require('fs');
    const { Pool } = require('pg');
    (async () => {
      try {
        const seedData = JSON.parse(fs.readFileSync('$seed_file', 'utf-8'));
        const ssl = process.env.DATABASE_URL.includes('sslmode=') ? { rejectUnauthorized: false } : false;
        const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl });
        for (const a of seedData) {
          await pool.query(
            'INSERT INTO security_attack_corpus (id,category,label,attack_prompt,expected_result,severity,source,is_active) VALUES (\$1,\$2,\$3,\$4,\$5,\$6,\$7,true) ON CONFLICT (id) DO NOTHING',
            [a.id, a.category, a.label, a.attack_prompt, a.expected_result, a.severity, a.source]
          );
        }
        console.log('  ✓ Seeded ' + seedData.length + ' security corpus attacks');
        await pool.end();
      } catch (e) { console.warn('  ⚠ Security corpus seed skipped: ' + e.message); }
      process.exit(0);
    })();
  " 2>&1 || true
}
