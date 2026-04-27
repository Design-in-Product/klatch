#!/usr/bin/env bash
set -euo pipefail

# AAXT seed script — creates test channels for live behavioral probing
#
# Usage:
#   1. Start server: npm run dev
#   2. Run this:     ./scripts/aaxt-seed.sh
#
# Creates:
#   CH1: Rich native channel (project + memory + KB file + pinned file + custom entity + 6 messages)
#   CH2: Bare minimum (no project, default entity, 2 messages)
#   CH3: Project-only (instructions but no memory/files, custom entity, 5 messages)
#
# Prints channel IDs at the end for use in Track B/C curl commands.

API="http://localhost:${PORT:-3001}/api"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}▸${NC} $1"; }
ok()    { echo -e "${GREEN}✓${NC} $1"; }
err()   { echo -e "${RED}✗${NC} $1" >&2; }

if ! curl -sf "$API/channels" > /dev/null 2>&1; then
  err "Server not reachable at $API"
  echo "  Start the server first: npm run dev"
  exit 1
fi
ok "Server is reachable"

# ── CH1: Rich native channel ──

info "Creating CH1: Rich native channel..."

PROJ1_ID=$(curl -sf -X POST "$API/projects" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "AAXT Test Project",
    "instructions": "This project uses TypeScript with strict mode. Tests use Vitest with in-memory SQLite. Follow the POST + SSE streaming pattern for all new endpoints. No ORM — raw better-sqlite3 queries only.",
    "memory": "The user prefers concise code reviews. The project started in January 2026. The primary database is SQLite at the project root (klatch.db). Default model is claude-opus-4-6."
  }' | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
ok "Project: AAXT Test Project ($PROJ1_ID)"

ENT1_ID=$(curl -sf -X POST "$API/entities" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Daedalus",
    "handle": "daedalus",
    "model": "claude-opus-4-6",
    "color": "#6366f1",
    "systemPrompt": "You are Daedalus, the primary architect and builder on the Klatch project. You design and implement features, focusing on clean architecture, small increments, and practical solutions. You work on the main branch. You are thorough but concise. When asked about the project, you draw on your deep knowledge of the codebase."
  }' | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
ok "Entity: Daedalus ($ENT1_ID)"

CH1_ID=$(curl -sf -X POST "$API/channels" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "aaxt-rich",
    "systemPrompt": "This channel focuses on architecture review and test coverage for the export pipeline. Pay attention to the 5-layer prompt assembly model and how context flows between layers."
  }' | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
ok "Channel: aaxt-rich ($CH1_ID)"

# Assign to project + entity
curl -sf -X PATCH "$API/channels/$CH1_ID" \
  -H 'Content-Type: application/json' \
  -d "{\"projectId\": \"$PROJ1_ID\"}" > /dev/null
curl -sf -X POST "$API/channels/$CH1_ID/entities" \
  -H 'Content-Type: application/json' \
  -d "{\"entityId\": \"$ENT1_ID\"}" > /dev/null
curl -sf -X DELETE "$API/channels/$CH1_ID/entities/default-entity" > /dev/null 2>&1 || true
ok "CH1 assigned to project + Daedalus entity"

# Add messages
for i in $(seq 1 3); do
  curl -sf -X POST "$API/channels/$CH1_ID/messages" \
    -H 'Content-Type: application/json' \
    -d "{\"content\": \"Question $i about the export pipeline architecture.\"}" > /dev/null
  sleep 2
done
ok "CH1: 3 conversation rounds seeded"

# ── CH2: Bare minimum ──

info "Creating CH2: Bare minimum channel..."

CH2_ID=$(curl -sf -X POST "$API/channels" \
  -H 'Content-Type: application/json' \
  -d '{"name": "aaxt-bare"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

curl -sf -X POST "$API/channels/$CH2_ID/messages" \
  -H 'Content-Type: application/json' \
  -d '{"content": "Hello, what can you help with?"}' > /dev/null
sleep 2
ok "CH2: Bare channel with 1 conversation round ($CH2_ID)"

# ── CH3: Project-only (instructions, no memory/files) ──

info "Creating CH3: Project-only channel..."

PROJ3_ID=$(curl -sf -X POST "$API/projects" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Instructions Only Project",
    "instructions": "This project follows a strict code review process. All PRs require two approvals. Use conventional commits. The main branch must always pass CI. No direct pushes to main."
  }' | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

ENT3_ID=$(curl -sf -X POST "$API/entities" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Argus",
    "handle": "argus",
    "model": "claude-opus-4-6",
    "color": "#10b981",
    "systemPrompt": "You are Argus, the quality and test infrastructure specialist. You build test suites, catch regressions, and review merges. You are meticulous and systematic."
  }' | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

CH3_ID=$(curl -sf -X POST "$API/channels" \
  -H 'Content-Type: application/json' \
  -d '{"name": "aaxt-project-only"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

curl -sf -X PATCH "$API/channels/$CH3_ID" \
  -H 'Content-Type: application/json' \
  -d "{\"projectId\": \"$PROJ3_ID\"}" > /dev/null
curl -sf -X POST "$API/channels/$CH3_ID/entities" \
  -H 'Content-Type: application/json' \
  -d "{\"entityId\": \"$ENT3_ID\"}" > /dev/null
curl -sf -X DELETE "$API/channels/$CH3_ID/entities/default-entity" > /dev/null 2>&1 || true

for i in $(seq 1 2); do
  curl -sf -X POST "$API/channels/$CH3_ID/messages" \
    -H 'Content-Type: application/json' \
    -d "{\"content\": \"Review question $i about the testing strategy.\"}" > /dev/null
  sleep 2
done
ok "CH3: Project-only channel with 2 rounds ($CH3_ID)"

# ── Summary ──

echo ""
echo -e "${BOLD}══════════════════════════════════════════${NC}"
echo -e "${BOLD}  AAXT Channels Seeded${NC}"
echo -e "${BOLD}══════════════════════════════════════════${NC}"
echo ""
echo -e "  CH1 (rich):         ${CYAN}$CH1_ID${NC}"
echo -e "  CH2 (bare):         ${CYAN}$CH2_ID${NC}"
echo -e "  CH3 (project-only): ${CYAN}$CH3_ID${NC}"
echo ""
echo -e "  ${BOLD}Track B commands:${NC}"
echo -e "  curl http://localhost:3001/api/aaxt/status"
echo -e "  curl -X POST http://localhost:3001/api/channels/$CH1_ID/aaxt-probe | jq ."
echo -e "  curl -X POST http://localhost:3001/api/channels/$CH1_ID/aaxt-run | jq ."
echo -e "  curl -X POST http://localhost:3001/api/channels/$CH2_ID/aaxt-run | jq ."
echo -e "  curl -X POST http://localhost:3001/api/channels/$CH3_ID/aaxt-run | jq ."
echo ""
echo -e "  ${BOLD}Track C commands:${NC}"
echo -e "  curl 'http://localhost:3001/api/channels/$CH1_ID/export-preview?briefing=true' | jq .entities[0].field_notes"
echo -e "  curl 'http://localhost:3001/api/channels/$CH1_ID/export-preview?extract=true' | jq .entities[0].field_notes"
echo -e "  curl -X POST http://localhost:3001/api/channels/$CH1_ID/reflect | jq ."
echo ""
