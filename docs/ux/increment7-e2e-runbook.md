# Increment 7 (@mention override) — morning e2e runbook

**Status (2026-06-27 evening):** built + unit-verified + Iris-approved ✅, on `claude/daedalus` (`17c3d78`), 1 ahead of main. xian chose to run the live e2e fresh in the morning *before* the merge (it's a routing behaviour change). This is that runbook.

## What you're verifying

`@mention` now **overrides any klatch mode** (spec §5). In a klatch with 2+ agents:
- `@AgentName ...` routes **only** to that agent (suppresses the others / short-circuits the sequence for that message).
- A message with **no** `@` reaches **all** agents per the channel's default mode (unchanged).
- Typing `@` in the composer shows the **autocomplete** — and this now works in **panel/roundtable** klatches, not just directed.

## Steps (your real app, ~2 min)

1. **Stop** your currently-running app (the one on :3001 / :5173).
2. **Run the worktree app** — it has increment 7 and auto-resolves your `.env`, `node_modules`, and `klatch.db` by walking up the tree (so it's your real data):
   ```
   cd .claude/worktrees/daedalus && npm run dev
   ```
3. Open a **klatch with 2+ agents** (you'll see your real ones; or make a quick throwaway 2-agent klatch).
4. Type `@` in the composer → the dropdown should list the klatch's agents. Pick one (or type `@Name`).
5. **Send `@AgentName hello`** → **only that agent** should reply.
6. **Send `hello everyone`** (no `@`) → **all agents** should reply.

**Success = both behaviours above.** (Bonus check: in a directed-mode klatch, a no-`@` message should still prompt "use @EntityName".)

## Then

- **If it works:** merge `claude/daedalus` → main. Daedalus can run the merge on your "go" (same playbook as the increment-6 merge: verify → `--no-ff` → push → reset branch → close Iris's thread → notify Theseus). **That puts the full composition gesture on main = the beta gate.**
- **If anything's off:** tell Daedalus exactly what you saw. It's branch-only — nothing's on main, no harm.

## Context / why trust the units

- Server override: 4 route tests (panel-override, roundtable-override, no-mention regression, no-match edge) + full server suite **1120** green.
- Client autocomplete: MessageInput **10/10** (+4 new), full client suite **212** green, tsc clean.
- Iris verdict 6/27 ~21:30: **Conformant ✅** (all 3 bounded decisions approved).
- This e2e only confirms the **live integration** — a real agent responding through the stream, which units can't exercise (no API key in CI/worktree).

## After merge (post-beta-gate QA)

- Theseus: R46 (clone-from-klatch MAXT) + R47 (@mention MAXT).
- xian + Theseus: MAXT Session 03 — incl. Iris's discoverability note (panel/roundtable composer doesn't yet hint `@` in the placeholder; observe whether that's a gap).
