#!/usr/bin/env bash
set -euo pipefail

# Seed script for the "Mystery Menu" roundtable demo
#
# Usage:
#   1. Start server:  KLATCH_DB=demo.db npm run dev:server
#   2. Run this:      ./scripts/seed-demo.sh
#
# This creates a project, a roundtable channel, and three entities,
# then assigns everything together. It does NOT send messages —
# you type live for the authentic feel.

API="http://localhost:${PORT:-3001}/api"

# --- Colors for output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}▸${NC} $1"; }
ok()    { echo -e "${GREEN}✓${NC} $1"; }
err()   { echo -e "${RED}✗${NC} $1" >&2; }

# --- Check server is running ---
if ! curl -sf "$API/channels" > /dev/null 2>&1; then
  err "Server not reachable at $API"
  echo ""
  echo "  Start the server first:"
  echo "    KLATCH_DB=demo.db npm run dev:server"
  echo ""
  exit 1
fi
ok "Server is reachable"

# --- Create project ---
info "Creating project..."

PROJECT_ID=$(curl -sf -X POST "$API/projects" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Mystery Menu Restaurant",
    "instructions": "This is the leadership team of a mid-sized fine dining restaurant exploring a new tasting menu concept. The owner (the human user) pitches ideas and the team responds with their professional perspectives."
  }' | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
ok "Project: Mystery Menu Restaurant ($PROJECT_ID)"

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
    "type": "klatch",
    "mode": "roundtable",
    "systemPrompt": "You are the leadership team of a mid-sized fine dining restaurant. The owner has just walked in with an idea. Respond in character — be opinionated, specific, and react to what the others have said. Keep responses to 2-3 short paragraphs."
  }' | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
ok "Channel: mystery-menu ($CHANNEL_ID)"

# --- Assign channel to project ---
info "Assigning channel to project..."

curl -sf -X PATCH "$API/channels/$CHANNEL_ID" \
  -H 'Content-Type: application/json' \
  -d "{\"projectId\": \"$PROJECT_ID\"}" > /dev/null
ok "Channel assigned to Mystery Menu Restaurant"

# --- Assign entities to channel ---
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

# Remove default entity (channel now has the three roundtable members + default)
curl -sf -X DELETE "$API/channels/$CHANNEL_ID/entities/default-entity" > /dev/null
ok "Assigned Chef Margaux, Sam, Julien — removed default Claude"

# --- Print instructions ---
echo ""
echo -e "${BOLD}══════════════════════════════════════════${NC}"
echo -e "${BOLD}  Demo ready!${NC}"
echo -e "${BOLD}══════════════════════════════════════════${NC}"
echo ""
echo -e "  The server should already be running with:"
echo -e "    ${CYAN}KLATCH_DB=demo.db npm run dev:server${NC}"
echo ""
echo -e "  Start the client (if not running):"
echo -e "    ${CYAN}npm run dev:client${NC}"
echo ""
echo -e "  Then:"
echo -e "  1. Open ${BOLD}http://localhost:5173${NC}"
echo -e "  2. Expand the ${BOLD}Mystery Menu Restaurant${NC} project"
echo -e "  3. Click into ${BOLD}#mystery-menu${NC}"
echo -e "  4. Type this prompt:"
echo ""
echo -e "  ${GREEN}I've been thinking about a new tasting menu concept.${NC}"
echo -e "  ${GREEN}For \$300, and just knowing guests' dietary restrictions,${NC}"
echo -e "  ${GREEN}we create a completely custom meal — nothing from the${NC}"
echo -e "  ${GREEN}regular menu, designed specifically for them. Thoughts?${NC}"
echo ""
echo -e "  5. Watch the roundtable unfold (~20s)"
echo ""
