#!/usr/bin/env bash
set -euo pipefail

# Seed script for the "Mystery Menu" roundtable demo
# Usage: ./scripts/seed-demo.sh

API="http://localhost:3001/api"
DB_PATH="$(dirname "$0")/../klatch.db"

# --- Colors for output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}▸${NC} $1"; }
ok()    { echo -e "${GREEN}✓${NC} $1"; }
err()   { echo -e "${RED}✗${NC} $1" >&2; }

# --- Preflight ---
if curl -sf "$API/channels" > /dev/null 2>&1; then
  err "Server is already running. Please stop it first (Ctrl-C the dev server), then re-run this script."
  exit 1
fi

# --- Reset DB ---
if [ -f "$DB_PATH" ]; then
  rm "$DB_PATH"
  ok "Deleted existing database"
else
  info "No existing database — starting fresh"
fi

# --- Start server in background ---
info "Starting server..."
cd "$(dirname "$0")/.."
npm run dev:server > /dev/null 2>&1 &
SERVER_PID=$!
trap "kill $SERVER_PID 2>/dev/null || true" EXIT

# Wait for server to be ready
for i in {1..30}; do
  if curl -sf "$API/channels" > /dev/null 2>&1; then
    break
  fi
  if [ "$i" -eq 30 ]; then
    err "Server failed to start after 30s"
    exit 1
  fi
  sleep 1
done
ok "Server is ready"

# --- Create entities ---
info "Creating entities..."

CHEF_ID=$(curl -sf -X POST "$API/entities" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Chef Margaux",
    "handle": "chef",
    "model": "claude-sonnet-4-6",
    "color": "#ef4444",
    "systemPrompt": "You are Chef Margaux, head chef of a mid-sized fine dining restaurant. You are a creative purist who thinks in flavor, technique, and kitchen feasibility. You defend the food vision fiercely. You speak with confident brevity — your opinions were earned over years in the kitchen. You are excited by creative challenges but realistic about execution. Keep responses to 2-3 short paragraphs."
  }' | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
ok "Chef Margaux ($CHEF_ID)"

SAM_ID=$(curl -sf -X POST "$API/entities" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Sam",
    "handle": "foh",
    "model": "claude-sonnet-4-6",
    "color": "#10b981",
    "systemPrompt": "You are Sam, the front-of-house manager at a mid-sized fine dining restaurant. You are a guest-experience obsessive. You think about pacing, ambiance, how servers explain each dish, and what happens when a guest does not like a course. You are warm, practical, and occasionally protective of your staff. You support bold ideas but always ask the hard operational questions. Keep responses to 2-3 short paragraphs."
  }' | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
ok "Sam ($SAM_ID)"

JULIEN_ID=$(curl -sf -X POST "$API/entities" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Julien",
    "handle": "somm",
    "model": "claude-sonnet-4-6",
    "color": "#8b5cf6",
    "systemPrompt": "You are Julien, the sommelier at a mid-sized fine dining restaurant. You are a pairing evangelist who sees every dish as half-finished without the right glass beside it. You are slightly pretentious but self-aware about it. You think in terroir and texture. You will always argue for the wine budget. You get genuinely excited when a pairing idea clicks. Keep responses to 2-3 short paragraphs."
  }' | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
ok "Julien ($JULIEN_ID)"

# --- Create roundtable channel ---
info "Creating mystery-menu channel..."

CHANNEL_ID=$(curl -sf -X POST "$API/channels" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "mystery-menu",
    "mode": "roundtable",
    "model": "claude-sonnet-4-6",
    "systemPrompt": "You are the leadership team of a mid-sized fine dining restaurant. The owner has just walked in with an idea. Respond in character — be opinionated, specific, and react to what the others have said. Keep responses to 2-3 short paragraphs."
  }' | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
ok "Channel: mystery-menu ($CHANNEL_ID)"

# --- Assign entities to channel, remove default ---
info "Assigning entities to channel..."

curl -sf -X POST "$API/channels/$CHANNEL_ID/entities" \
  -H 'Content-Type: application/json' \
  -d "{\"entityId\": \"$CHEF_ID\"}" > /dev/null
curl -sf -X POST "$API/channels/$CHANNEL_ID/entities" \
  -H 'Content-Type: application/json' \
  -d "{\"entityId\": \"$SAM_ID\"}" > /dev/null
curl -sf -X POST "$API/channels/$CHANNEL_ID/entities" \
  -H 'Content-Type: application/json' \
  -d "{\"entityId\": \"$JULIEN_ID\"}" > /dev/null

# Now safe to remove default entity (channel has 4 entities)
curl -sf -X DELETE "$API/channels/$CHANNEL_ID/entities/default-entity" > /dev/null
ok "Assigned Chef Margaux, Sam, Julien — removed default Claude"

# --- Stop server ---
kill $SERVER_PID 2>/dev/null || true
trap - EXIT
ok "Server stopped"

# --- Print instructions ---
echo ""
echo -e "${BOLD}══════════════════════════════════════════${NC}"
echo -e "${BOLD}  Demo ready! Here's the play:${NC}"
echo -e "${BOLD}══════════════════════════════════════════${NC}"
echo ""
echo -e "  1. ${CYAN}npm run dev${NC}"
echo -e "  2. Click into ${BOLD}#mystery-menu${NC}"
echo -e "  3. Paste this prompt:"
echo ""
echo -e "  ${GREEN}I want to do a monthly \"mystery tasting menu\" —${NC}"
echo -e "  ${GREEN}guests don't see the menu, they just tell us${NC}"
echo -e "  ${GREEN}their allergies and trust us. Seven courses,${NC}"
echo -e "  ${GREEN}\$150 a head. Can we pull this off?${NC}"
echo ""
echo -e "  4. Watch the roundtable unfold (~20s)"
echo -e "  5. Record it!"
echo ""
