#!/usr/bin/env bash
# gravity update + gravity update nodes

cmd_update() {
  echo ""
  echo -e "  ${BOLD}Updating Gravity Platform${NC}"
  echo ""
  timer_start

  # Step 1: Code — pull from customer's fork
  printf "  ${DIM}●${NC} Pulling latest code..."
  local git_ok=true
  local git_log
  git_log=$(mktemp)
  (
    cd "$ROOT"
    # Abort any stuck rebase/merge from a previous failed pull
    git rebase --abort >/dev/null 2>&1 || true
    git merge --abort >/dev/null 2>&1 || true
    # Reset generated files (e.g. design-system templates from deploy.sh rebuild)
    # This is safe: .env, production.yml, node_modules, package-lock.json are gitignored
    git reset HEAD -- . >/dev/null 2>&1 || true
    git checkout -- . >/dev/null 2>&1 || true
    # Fetch latest from remote
    git fetch origin >/dev/null 2>&1 || true
    # For customer deployments, always reset to match remote exactly
    # (local commits in a deployment environment are usually mistakes)
    git reset --hard origin/$(git rev-parse --abbrev-ref HEAD) >/dev/null 2>&1 || true
    # Clean any untracked files (e.g. old marketplace packages no longer in git)
    git clean -fd >/dev/null 2>&1 || true
  ) || git_ok=false
  printf "\r\033[2K"
  if $git_ok; then
    ok "Code updated"
    rm -f "$git_log"
  else
    warn "Code update failed — attempting recovery"
    local git_err
    git_err=$(cat "$git_log" 2>/dev/null | head -5)
    if [ -n "$git_err" ]; then
      echo -e "  ${DIM}Reason: $git_err${NC}"
    fi
    rm -f "$git_log"

    # Recovery: force-sync when git is broken
    printf "  ${DIM}●${NC} Forcing sync with remote..."
    (
      cd "$ROOT"
      git fetch origin >/dev/null 2>&1 || true
      local branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
      git reset --hard origin/$branch >/dev/null 2>&1 || true
      git clean -fd >/dev/null 2>&1 || true
    )
    printf "\r\033[2K"
    ok "Forced sync completed"
  fi

  # Safety: restore production.yml from example if missing
  local inv="$ROOT/ansible/inventory/production.yml"
  local inv_ex="$ROOT/ansible/inventory/production.yml.example"
  if [ ! -f "$inv" ] && [ -f "$inv_ex" ]; then
    cp "$inv_ex" "$inv"
    warn "production.yml was missing — restored from example. Edit with your VM details."
  fi

  # Step 2: Images — login to registry if DOCR_TOKEN is set
  local docr_token
  docr_token=$(grep "^DOCR_TOKEN=" "$ROOT/.env" 2>/dev/null | cut -d'=' -f2-)
  if [ -n "$docr_token" ]; then
    echo "$docr_token" | docker login registry.digitalocean.com -u "$docr_token" --password-stdin >/dev/null 2>&1 || true
  fi

  echo ""
  info "Pulling images..."
  echo ""

  local pull_start=$(date +%s)
  if docker compose -f "$ROOT/docker-compose.yml" pull; then
    local total_elapsed=$(( $(date +%s) - pull_start ))
    echo ""
    ok "Images pulled ${DIM}(${total_elapsed}s)${NC}"
  else
    echo ""
    fail "Image pull failed — check network/registry and run ${BOLD}gravity update${NC} again"
    exit 1
  fi

  # Step 3: Build packages (requires Node.js — installed by install.yml)
  local build_log
  build_log=$(mktemp)

  # Only run npm install if package-lock.json changed or node_modules missing
  local need_install=false
  if [ ! -d "$ROOT/node_modules" ]; then
    need_install=true
  elif [ -f "$ROOT/.package-lock.hash" ]; then
    local old_hash=$(cat "$ROOT/.package-lock.hash" 2>/dev/null || echo "")
    local new_hash=$(md5 -q "$ROOT/package-lock.json" 2>/dev/null || md5sum "$ROOT/package-lock.json" 2>/dev/null | cut -d' ' -f1 || echo "new")
    [ "$old_hash" != "$new_hash" ] && need_install=true
  else
    need_install=true
  fi

  (
    cd "$ROOT"
    if $need_install; then
      npm install --silent >/dev/null 2>&1 || true
      # Save hash for next run
      md5 -q "$ROOT/package-lock.json" 2>/dev/null > "$ROOT/.package-lock.hash" || \
      md5sum "$ROOT/package-lock.json" 2>/dev/null | cut -d' ' -f1 > "$ROOT/.package-lock.hash" || true
    fi
    # Turbo handles build dependencies, no need to build plugin-base separately
    npm run build --workspaces --if-present >> "$build_log" 2>&1 || true
    npm run gen:nodes >> "$build_log" 2>&1 || true
  ) &
  local build_pid=$!
  local build_start=$(date +%s)
  while kill -0 "$build_pid" 2>/dev/null || false; do
    local c="${spin:si%${#spin}:1}"
    si=$((si + 1))
    local elapsed=$(( $(date +%s) - build_start ))
    printf "\r  ${CYAN}%s${NC} Building packages... ${DIM}(%ds)${NC}  " "$c" "$elapsed"
    sleep 0.1
  done
  local build_exit=0
  wait "$build_pid" 2>/dev/null || build_exit=$?
  printf "\r\033[2K"
  if [ $build_exit -eq 0 ]; then
    ok "Packages built"
  else
    warn "Build completed with warnings — check output:"
    cat "$build_log" | tail -20 | sed 's/^/    /'
  fi
  rm -f "$build_log"

  # Step 4: Restart — with spinner
  docker compose -f "$ROOT/docker-compose.yml" --env-file "$ROOT/.env" up -d --quiet-pull >/dev/null 2>&1 &
  local restart_pid=$!
  local restart_start=$(date +%s)
  while kill -0 "$restart_pid" 2>/dev/null || false; do
    local c="${spin:si%${#spin}:1}"
    si=$((si + 1))
    local elapsed=$(( $(date +%s) - restart_start ))
    printf "\r  ${CYAN}%s${NC} Restarting services... ${DIM}(%ds)${NC}  " "$c" "$elapsed"
    sleep 0.1
  done
  wait "$restart_pid" 2>/dev/null || true
  printf "\r\033[2K"

  # Verify services actually started (not stuck in Created)
  sleep 2
  local up_count=0 created_count=0 total_count=0
  total_count=$(docker compose -f "$ROOT/docker-compose.yml" ps -a --format "{{.Name}}" 2>/dev/null | grep -c . || echo "0")
  up_count=$(docker compose -f "$ROOT/docker-compose.yml" ps -a --format "{{.Status}}" 2>/dev/null | grep -ci "up\|running" || echo "0")
  created_count=$(docker compose -f "$ROOT/docker-compose.yml" ps -a --format "{{.Status}}" 2>/dev/null | grep -ci "created" || echo "0")

  if [ "${up_count:-0}" -eq "${total_count:-0}" ] && [ "${total_count:-0}" -gt 0 ]; then
    ok "All $up_count services running"
  elif [ "${created_count:-0}" -gt 0 ]; then
    warn "$up_count/$total_count services running — $created_count stuck in Created state"
    info "Run ${BOLD}gravity doctor${NC} to diagnose"
  elif [ "${up_count:-0}" -gt 0 ]; then
    warn "$up_count/$total_count services running"
    info "Run ${BOLD}gravity status${NC} to check"
  else
    fail "No services running after restart"
    info "Run ${BOLD}gravity doctor${NC} to diagnose"
  fi

  # Summary
  echo ""
  echo -e "  ${GREEN}${BOLD}Done${NC} ${DIM}in $(timer_elapsed)${NC}"
  echo ""
  echo -e "  ${CYAN}Canvas${NC}  ${UNDERLINE}http://localhost:3001${NC}"
  echo -e "  ${CYAN}API${NC}     ${UNDERLINE}http://localhost:4100${NC}"
  echo ""
}

cmd_update_nodes() {
  echo ""
  echo -e "  ${BOLD}Updating Nodes${NC}"
  echo ""
  timer_start

  # Step 1: Dependencies
  printf "  ${DIM}●${NC} Installing dependencies..."
  (cd "$ROOT" && npm install --silent >/dev/null 2>&1) || true
  printf "\r\033[2K"
  ok "Dependencies installed"

  # Step 2: Build
  printf "  ${DIM}●${NC} Building packages..."
  (cd "$ROOT" && npm run build -w @gravity-platform/plugin-base >/dev/null 2>&1) || true
  local build_output
  build_output=$(cd "$ROOT" && npm run build --workspaces --if-present 2>&1) || true
  local pkg_count
  pkg_count=$(echo "$build_output" | grep -c '> .* build' || echo "0")
  printf "\r\033[2K"
  ok "${pkg_count} packages built"

  # Step 3: Generate nodes
  printf "  ${DIM}●${NC} Generating nodes..."
  (cd "$ROOT" && npm run gen:nodes >/dev/null 2>&1) || true
  printf "\r\033[2K"
  ok "Nodes generated"

  # Step 4: Restart
  printf "  ${DIM}●${NC} Restarting node-service..."
  docker compose -f "$ROOT/docker-compose.yml" restart node-service >/dev/null 2>&1 || true
  printf "\r\033[2K"
  ok "Node-service restarted"

  # Summary
  echo ""
  echo -e "  ${GREEN}${BOLD}Done${NC} ${DIM}in $(timer_elapsed)${NC}"
  echo ""
}
