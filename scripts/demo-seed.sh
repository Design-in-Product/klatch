#!/usr/bin/env bash
#
# demo-seed.sh — Set up channels for demo screen recording
#
# Usage:
#   npm run demo:seed          (server must be running on :3001)
#   PORT=4000 ./scripts/demo-seed.sh   (custom port)
#
# This creates two channels with contrasting system prompts,
# then clears any existing messages so recording starts clean.
# It does NOT send messages — you type live for the authentic feel.

set -euo pipefail

BASE="${BASE_URL:-http://localhost:${PORT:-3001}}/api"

# Colors for output
GREEN='\033[0;32m'
DIM='\033[2m'
NC='\033[0m'

echo ""
echo -e "${GREEN}Klatch demo seed${NC}"
echo -e "${DIM}Setting up channels for screen recording...${NC}"
echo ""

# --- Channel 1: Code Reviewer ---
echo -n "Creating #code-reviewer... "
REVIEWER=$(curl -s -X POST "$BASE/channels" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "code-reviewer",
    "systemPrompt": "You are a senior software engineer doing code review. Be direct and concise. When discussing code, cite specific line numbers or patterns. Prioritize correctness, then readability, then performance. Use short paragraphs. If something is fine, say so briefly — don'\''t pad with praise.",
    "model": "claude-sonnet-4-6"
  }')

if echo "$REVIEWER" | grep -q '"id"'; then
  REVIEWER_ID=$(echo "$REVIEWER" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo -e "${GREEN}done${NC} (id: ${DIM}${REVIEWER_ID}${NC})"
else
  echo "skipped (may already exist)"
fi

# --- Channel 2: Brainstormer ---
echo -n "Creating #brainstormer... "
BRAINSTORMER=$(curl -s -X POST "$BASE/channels" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "brainstormer",
    "systemPrompt": "You are a creative thinking partner. Use vivid analogies and metaphors. Ask probing follow-up questions that reframe the problem. Build on ideas rather than critiquing them — say \"yes, and\" rather than \"but\". Keep energy high. Use short punchy sentences mixed with the occasional longer exploratory thought.",
    "model": "claude-sonnet-4-6"
  }')

if echo "$BRAINSTORMER" | grep -q '"id"'; then
  BRAINSTORMER_ID=$(echo "$BRAINSTORMER" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo -e "${GREEN}done${NC} (id: ${DIM}${BRAINSTORMER_ID}${NC})"
else
  echo "skipped (may already exist)"
fi

echo ""
echo -e "${GREEN}Ready to record!${NC}"
echo ""
echo "Suggested demo flow:"
echo "  1. Open http://localhost:${PORT:-3001} (or :5173 if using Vite dev)"
echo "  2. Click #code-reviewer, type:"
echo "     \"How should I handle errors in a REST API?\""
echo "  3. Let it stream ~5s, then switch to #brainstormer"
echo "  4. Ask the same question — note the different tone"
echo "  5. For clip 2: send a long question, hit Stop, then Retry"
echo ""
