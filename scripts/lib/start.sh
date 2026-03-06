#!/usr/bin/env bash
# gravity start + Docker file sharing check

check_docker_file_sharing() {
  # Detect macOS restricted directories that Docker cannot mount by default
  local restricted=false
  local location=""

  case "$ROOT" in
    "$HOME/Desktop"*)
      restricted=true
      location="Desktop"
      ;;
    "$HOME/Downloads"*)
      restricted=true
      location="Downloads"
      ;;
  esac

  if [ "$restricted" = true ]; then
    echo ""
    warn "Project is in a restricted folder: ${BOLD}$ROOT${NC}"
    echo ""
    echo -e "  Docker cannot mount volumes from ${BOLD}$location${NC} without extra permissions."
    echo -e "  This will cause services to stay in ${BOLD}Created${NC} state and not start."
    echo ""
    echo -e "  ${BOLD}Fix (choose one):${NC}"
    echo -e "    1. Move project to ${BOLD}~/dev/${NC} or ${BOLD}~/projects/${NC} and re-run ${BOLD}gravity init${NC}"
    echo -e "    2. Docker Desktop → Settings → Resources → File Sharing → add ${BOLD}$HOME/$location${NC}"
    echo ""
    return 1
  fi
  return 0
}

cmd_start() {
  # Login to registry if DOCR_TOKEN is set
  local docr_token
  docr_token=$(grep "^DOCR_TOKEN=" "$ROOT/.env" 2>/dev/null | cut -d'=' -f2-)
  if [ -n "$docr_token" ]; then
    echo "$docr_token" | docker login registry.digitalocean.com -u "$docr_token" --password-stdin >/dev/null 2>&1 || true
  fi

  check_docker_file_sharing || exit 1
  check_first_run
  banner "Starting Gravity Platform"
  timer_start

  # Ensure node_modules exists (required for package deps inside containers)
  if [ ! -d "$ROOT/node_modules" ]; then
    printf "  ${DIM}●${NC} Installing dependencies..."
    (cd "$ROOT" && npm install --silent >/dev/null 2>&1) || true
    printf "\r\033[2K"
    ok "Dependencies installed"
  fi

  # Auto-start Redis if needed and not running
  local redis_host
  redis_host=$(grep "^REDIS_HOST=" "$ROOT/.env" 2>/dev/null | cut -d'=' -f2-)
  if [ "$redis_host" = "host.docker.internal" ] || [ "$redis_host" = "localhost" ]; then
    if ! docker ps --format "{{.Names}}" 2>/dev/null | grep -qi redis; then
      echo -e "  ${DIM}Starting Redis...${NC}"
      docker start gravity-redis 2>/dev/null || \
        docker run -d --name gravity-redis -p 6379:6379 redis:alpine &>/dev/null || true
    fi
  fi

  # Start services silently, show our own progress
  local spin='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
  local compose_log
  compose_log=$(mktemp)

  docker compose -f "$ROOT/docker-compose.yml" --env-file "$ROOT/.env" up -d --remove-orphans >"$compose_log" 2>&1 &
  local up_pid=$!
  local i=0
  while kill -0 "$up_pid" 2>/dev/null || false; do
    local c="${spin:i%${#spin}:1}"
    i=$((i + 1))
    printf "\r  ${CYAN}%s${NC} ${DIM}Starting services...${NC} " "$c"
    sleep 0.1
  done
  local up_exit=0
  wait "$up_pid" 2>/dev/null || up_exit=$?
  if [ $up_exit -ne 0 ]; then
    printf "\r  ${RED}✗${NC} Failed to start services\n"
    echo ""
    echo -e "  ${DIM}──── docker compose output ────${NC}"
    sed 's/^/  /' "$compose_log"
    echo -e "  ${DIM}───────────────────────────────${NC}"
    echo ""
    echo -e "  ${YELLOW}Common fixes:${NC}"
    echo -e "    • Not logged into registry?  ${GREEN}gravity init${NC}"
    echo -e "    • Missing .env?              ${GREEN}cp .env.example .env${NC} and fill in values"
    echo -e "    • Images not pulled?         ${GREEN}docker compose pull${NC}"
    echo ""
    rm -f "$compose_log"
    exit 1
  else
    printf "\r  ${GREEN}✓${NC} ${DIM}Starting services${NC}  \n"
  fi
  rm -f "$compose_log"

  # Wait for services to be healthy
  local attempts=0
  local running=0
  local total=0
  i=0
  while [ $attempts -lt 15 ]; do
    running=$(docker compose -f "$ROOT/docker-compose.yml" ps --format "{{.Name}}" --filter "status=running" 2>/dev/null | wc -l | tr -d ' ')
    total=$(docker compose -f "$ROOT/docker-compose.yml" ps --format "{{.Name}}" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$running" -eq "$total" ] && [ "$total" -gt 0 ]; then
      break
    fi
    local c="${spin:i%${#spin}:1}"
    i=$((i + 1))
    printf "\r  ${CYAN}%s${NC} ${DIM}Waiting for health checks...${NC} ${DIM}(%d/%d)${NC} " "$c" "$running" "$total"
    sleep 2
    attempts=$((attempts + 1))
  done

  echo ""
  if [ "$running" -eq "$total" ] && [ "$total" -gt 0 ]; then
    printf "\r  ${GREEN}✓${NC} ${DIM}Health checks passed${NC}       \n"
    echo ""
    echo -e "  ${GREEN}${BOLD}All $running services running${NC} ${DIM}($(timer_elapsed))${NC}"
    echo ""
    echo -e "  ${WHITE}${BOLD}Your platform is ready:${NC}"
    echo ""
    echo -e "  ${CYAN}Canvas${NC}  ${DIM}(Workflow Builder)${NC}   ${UNDERLINE}http://localhost:3001${NC}"
    echo -e "  ${CYAN}API${NC}     ${DIM}(REST API)${NC}           ${UNDERLINE}http://localhost:4100${NC}"
    echo ""
    info "Run ${BOLD}gravity logs${NC}    to stream logs"
    info "Run ${BOLD}gravity open${NC}    to open Canvas in your browser"
  elif [ "$total" -eq 0 ]; then
    printf "\r  ${RED}✗${NC} No services found\n"
    echo ""
    echo -e "  ${YELLOW}No containers were created. Possible causes:${NC}"
    echo -e "    • Images not pulled yet?     ${GREEN}docker compose pull${NC}"
    echo -e "    • Not logged into registry?  ${GREEN}gravity init${NC}"
    echo ""
  else
    printf "\r  ${YELLOW}!${NC} ${DIM}$running/$total services running${NC}\n"
    echo ""
    echo -e "  ${YELLOW}${BOLD}$running/$total services up${NC} ${DIM}($(timer_elapsed))${NC}"
    echo ""
    # Show which services are stuck and why
    local created_svcs
    created_svcs=$(docker compose -f "$ROOT/docker-compose.yml" ps -a --format '{{.Name}}\t{{.Status}}' 2>/dev/null | grep -i 'created' | awk -F'\t' '{print $1}')
    if [ -n "$created_svcs" ]; then
      echo -e "  ${RED}Services stuck in 'Created' state (never started):${NC}"
      echo "$created_svcs" | while read -r svc_name; do
        echo -e "    ${DIM}• $svc_name${NC}"
      done
      echo ""
      echo -e "  ${YELLOW}Common causes:${NC}"
      echo -e "    • Docker cannot mount project directory (restricted folder)"
      echo -e "    • Try: ${GREEN}gravity doctor${NC} to diagnose"
      echo -e "    • Try: ${GREEN}docker compose down && gravity start${NC} to recreate"
    else
      info "Run ${BOLD}gravity status${NC} to see which services failed"
      info "Run ${BOLD}gravity logs <service>${NC} to check logs"
    fi
  fi
  echo ""
}
