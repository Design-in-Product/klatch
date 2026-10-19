# Intelligence Sweep — Curated Review — 2026-10-19 (Argus)

**Curated by:** Argus (Quality + Testing), duty-cycle fire (START, unattended)
**Covers:** `2026-09-14-sweep.md` through `2026-10-19-sweep.md` — six sweeps, backlogged since the
last curation (`2026-09-07-sweep-curated.md`). The 10/19 sweep's own carry-over section already
folds forward everything still open from the five in between, so this curates current state rather
than re-litigating each of the six individually. No item present in an intermediate sweep and absent
from every later carry-over list is treated as closed by the automation; one such drop is checked
by hand below (§3) rather than taken on faith.
**Method:** re-verify the highest-stakes claims directly against the live codebase and, this round,
the live Anthropic Models API and npm registry — not the automation's own "Verified against" lines,
which are sourced from web trackers that disagreed with each other and, on the SDK figure, with the
real number.

---

## Verified this session (independent of the automation's own claims)

- **[VERIFIED, live Models API]** Called `GET /v1/models` with Klatch's own `ANTHROPIC_API_KEY` from
  `.env`. All three 5.5 models are live and callable right now: `claude-opus-5-5`,
  `claude-sonnet-5-5`, `claude-haiku-5-5`. `claude-haiku-4-5-20251001` is still present in the
  listing (not hard-removed), consistent with the sweep's "legacy label, not yet retired" framing
  rather than the conflicting hard-Nov-30-EOL claim it also cites. This is firmer evidence than the
  automation had for any of the three ship dates (Sep 22 Opus 5.5, Sep 28 Sonnet 5.5, this sweep's
  Haiku 5.5/4.5-legacy item) — they're not just announced, they answer.
- **[VERIFIED, `packages/shared/src/types.ts:1-10`]** `AVAILABLE_MODELS` tops out at `claude-opus-5`
  / `claude-sonnet-5` / `claude-fable-5-1`; none of the three 5.5 ids are present; the only Haiku
  entry is `claude-haiku-4-5-20251001`. The three-model gap the sweeps have been tracking since
  9/28 (Opus 5.5) and 10/05 (+ Sonnet 5.5) is confirmed exactly as described, and this sweep's
  Haiku 5.5 addition completes the set. Runtime model validation is against the discovered
  `/api/models` set, not this overlay (`types.ts:13-18`), so the three models already work in
  Klatch today if a client types the id by hand — this is a labels/offline-fallback/default gap,
  not a functional one.
- **[VERIFIED, live npm registry, this session]** `npm view @anthropic-ai/sdk version` →
  **0.135.0**. Klatch is pinned `^0.122.0` (`packages/server/package.json:15`) — a 13-minor gap.
  **This corrects the record**: the automation's own sources disagreed with each other across the
  backlog (0.125.0 on 9/14, 0.127.0 on 9/21, 0.128.0 on 9/28 and again cited through 10/12, then
  0.124.0 — a *smaller* number than the same sweep's own prior-week citation — on 10/19). The real
  gap has been larger than every one of those six numbers, every week, and has only grown.
- **[VERIFIED, `packages/server/package.json:21`]** `"hono": "^4.13.1"` — the 10/19 sweep's own
  correction holds (prior sweeps wrongly called 4.12.16 latest); the Oct 4 4.13.13 patch is within
  range. No action.
- **[VERIFIED, `package.json:24`]** `"vitest": "^4.0.18"` against live registry `5.0.5` — still a
  real major-version gap, unchanged from the 9/7 curation's assessment. Not routing: a test-runner
  major bump across 2500+ tests warrants a dedicated migration fire, not an opportunistic change
  mid-sweep-curation (same call as 9/7).

## §3 — one dropped item checked by hand, not taken on faith

The 9/28 sweep flagged, as part of the Opus 5.5 ship: *"forced tool call (`tool_choice: {type:
"any"}`) no longer supported for Opus 5.5... needs checking against Klatch's entity streaming
paths"* — marked `[VERIFICATION NEEDED]`, never resolved in that sweep, and silently absent from
every carry-over list since (10/05's carry-over already drops it with no close-out line).
**Checked directly rather than trusting the drop:** `grep -rn "tool_choice" packages/server/src/
packages/shared/src/` — zero hits. Klatch never sets `tool_choice` anywhere in the codebase, so the
forced-tool-call removal has no surface to break against. The item is moot, not merely stale —
closing it here with a reason, rather than letting an unexplained disappearance stand as the record.

No overturns beyond the SDK figure above — the sweep's other verification lines check out.

## Routed this session

**One item mailed to Daedalus** — both are his lane (model registry + dependency bump), bundled
into one memo since they're the two live HIGH items:
`docs/mail/argus-to-daedalus-cc-xian-three-5-5-models-confirmed-live-and-sdk-gap-is-0-135-not-0-124-2026-10-19.md`

1. **Add `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5` to `AVAILABLE_MODELS`** — all
   three confirmed live via the Models API this session, same shape as the existing entries. Haiku
   5.5 is the newest-flagged item (this sweep); Opus 5.5 and Sonnet 5.5 have been open since 9/28
   and 10/05 respectively — a two-and-three-week lag that a backlogged curation cycle let run
   longer than it should have.
2. **SDK bump target is `^0.135.0`, not the `0.124`–`0.128` range any prior sweep cited** — verified
   against the live npm registry this session (`npm view @anthropic-ai/sdk version`), not a web
   tracker. 13 minors behind, 9th consecutive week the gap has been open.

## Not routed — awareness only, no Klatch code change

- **Forced-tool-call removal (Opus 5.5).** Closed above (§3) — `tool_choice` has no call sites in
  Klatch. No action, no routing.
- **Fable 5.1 breaking-change list (flagged 9/21, partially checked 9/28, dropped by 10/05).** The
  one piece with code surface (forced tool call) is covered by the same §3 finding. The other named
  change (preserved-thinking constraint) applies to accounts created ≥ Aug 31, 2026 — not a Klatch
  code path. Not reopening.
- **ViteConf / Vite+ beta, Microsoft Agent Framework GA, MemPalace hook-integration angle, Anthropic
  IPO roadshow, MCP spec, React, CC release train.** All within existing pin ranges or background
  context, matching the sweeps' own LOW/no-action framing across the backlog. IPO thread: still
  watching for a close-out trigger (listing or offering completion), per the 9/7 call.
- **Vitest 4→5 major bump.** Confirmed still open (above); staying on Argus's own radar for a
  dedicated migration fire rather than being routed mid-cycle, same call made at the 9/7 curation.
