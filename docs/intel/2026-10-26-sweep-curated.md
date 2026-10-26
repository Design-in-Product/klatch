# Intelligence Sweep — Curated Review — 2026-10-26 (Argus)

**Curated by:** Argus (Quality + Testing), duty-cycle fire (START, unattended)
**Covers:** `2026-10-26-sweep.md` — one sweep, no backlog (last curation was `2026-10-19-sweep-curated.md`,
which closed the six-sweep backlog through 10/19).
**Method:** re-verify the sweep's own HIGH items directly — live Models API (capabilities.effort for
the three 5.5 models), live npm registry + GitHub release notes (SDK gap), and the official Anthropic
model-deprecations page (Haiku 4.5 EOL claim) — not the automation's web-tracker sources, which have
been wrong on the SDK figure in every curation to date and are wrong again this sweep, more severely.

---

## Verified this session (independent of the automation's own claims)

- **[VERIFIED, live Models API, this session]** Called `GET /v1/models/{id}` for all three 5.5 models
  with Klatch's own `ANTHROPIC_API_KEY`. Each individually confirms `capabilities.effort.supported: true`
  with all five levels (`low`, `medium`, `high`, `xhigh`, `max`) supported:
  - `claude-opus-5-5`: `effort":{"supported":true,"low":{"supported":true},"medium":{"supported":true},"high":{"supported":true},"xhigh":{"supported":true},"max":{"supported":true}}`
  - `claude-sonnet-5-5`: same shape, all five levels supported.
  - `claude-haiku-5-5`: same shape, all five levels supported.
  This closes the sweep's §HIGH #2 follow-on. The 10/19 code comment at `types.ts:171-184` explicitly
  asked for this to be read "one id per reading, not all three on one" to avoid inferring from family
  resemblance rather than reading each — satisfied here: each of the three was read as its own API
  call, not inferred from the others. All three are candidates to move into `FIVE_LEVEL` in one edit,
  since each one's own reading (not an inference) supports it.
- **[VERIFIED, live npm registry + GitHub releases, this session]** `npm view @anthropic-ai/sdk
  version` → **1.3.0**, not the sweep's "v0.124.0 still highest seen; no October update found." The
  gap is far larger than reported: `0.137.0` (Oct 20) → `1.0.0` (Oct 21) → `1.1.0` (Oct 21) → `1.2.0`
  (Oct 23) → `1.3.0` (Oct 23) — a full major-version bump plus three more releases, all inside this
  sweep's own 7-day window, invisible to every external tracker it cited. Same pattern as 10/19's SDK
  correction (web trackers disagreeing with each other and the real number), worse this time — a major
  bump, not just an undercount.
  - Checked the GitHub release notes directly (`anthropics/anthropic-sdk-typescript` releases, page 2):
    `sdk-v1.0.0`'s only "⚠ BREAKING CHANGES" line is **"api: add support for new API version
    2026-10-21"** — a conventional-commits major bump triggered by a new default `anthropic-version`,
    not a rewritten client surface. `1.1.0`–`1.3.0` (Oct 21–23) add user-profile fields, message
    threads, usage/cost-report dimensions, and bug fixes — no further breaking-change markers.
  - Cross-checked the one concrete breaking change documented for API version `2026-10-21` itself
    (via `platform.claude.com/docs/en/about-claude/model-deprecations`): `temperature`, `top_p`, and
    `top_k` are **removed** (400 error) at that API version for Claude 4.7+ models and Claude Mythos
    Preview. `grep -rn "temperature|top_p|top_k|anthropic-version" packages/server/src/claude/
    client.ts` (this session) — **zero hits**. Klatch sets none of these; the one documented breaking
    surface of the 1.0.0 bump does not reach Klatch's call sites. Same shape as 10/19's `tool_choice`
    finding — checked directly rather than assumed moot.
- **[VERIFIED, live `platform.claude.com/docs/en/about-claude/model-deprecations`, this session]**
  **The sweep's Haiku 4.5 framing is wrong, and Klatch's own code label inherited the error.** The
  official deprecations table lists `claude-haiku-4-5-20251001` as **Active** (`Deprecated: N/A`),
  not Deprecated — "tentative retirement not sooner than October 15, 2026" is the standard floor
  column every active model carries, not an announced EOL. The page's "Deprecation history" section
  (most recent first) has **no entry for Haiku 4.5 at all**. The November 30, 2026 retirement date
  every sweep since 10/19 has attached to Haiku 4.5 actually belongs to a different model:
  `claude-sonnet-4-5-20250929`, Deprecated 2026-09-30, retirement **November 30, 2026** — confirmed
  by its own dated entry in the deprecation history. Klatch does not carry
  `claude-sonnet-4-5-20250929` in `AVAILABLE_MODELS` (`grep` this session — no match), so the
  correction has zero Klatch code surface, but Klatch's own label for Haiku 4.5
  (`types.ts:13`, `'Prior-generation Haiku — legacy, EOL announced'`) was written by Daedalus on
  10/19 directly from that sweep's claim and is traceable (`git log -S"EOL announced"`) to that one
  commit — not independently checked against the official page at the time. "Legacy" (superseded by
  Haiku 5.5 as default) is accurate; "EOL announced" is not — no API-level EOL has been announced for
  Haiku 4.5. The Oct 29 date in this sweep's §HIGH #1 is real but is a **consumer product-surface**
  change (removed from the Chat/Cowork/Design model selector), confirmed separately by the sweep's
  Japanese support-article source — it does not touch the API Klatch calls.

## Routed this session

**One item mailed to Daedalus** — both are his lane (model registry + dependency tracking), bundled
into one memo:
`docs/mail/argus-to-daedalus-cc-xian-5-5-effort-arrays-confirmed-five-level-sdk-is-1-3-0-not-0-124-and-haiku-4-5-label-overstates-eol-2026-10-26.md`

1. **Promote all three 5.5 models into `FIVE_LEVEL`** (`types.ts:185`) — each one's own
   `capabilities.effort` was read individually this session and supports all five levels; the 10/19
   comment's concern (inferring from family resemblance) doesn't apply since none were inferred.
2. **SDK gap is 13 minors behind a major-version bump** (`^0.122.0` → `1.3.0` live), not the `0.124`
   range any sweep has cited. The one documented breaking change in the 1.0.0 release (removed
   sampling params at API version `2026-10-21`) has no Klatch call sites — upgrading is not urgent,
   but the dependency version Daedalus is tracking against has been wrong in every sweep since 8/10,
   this time by an order more than a minor-version miscount.
3. **Haiku 4.5's `'legacy, EOL announced'` label overstates a fact not in evidence** — no API-level
   EOL has been announced for `claude-haiku-4-5-20251001` per the live deprecations page; the Nov 30
   date belongs to `claude-sonnet-4-5-20250929`, which Klatch doesn't carry. Recommend softening the
   label to drop "EOL announced" (e.g. `'Prior-generation Haiku — legacy'`) unless/until an actual
   deprecation entry appears for it. Not blocking — cosmetic label accuracy, Daedalus's call on wording
   since he owns the file.

## Not routed — awareness only, no Klatch code change

- **Claude Code v2.1.297–303 (seven releases since Oct 9).** Could not independently verify hook/MCP/
  SSE content this session — WebFetch against `github.com/anthropics/claude-code/blob/main/
  CHANGELOG.md` returned page chrome only (large-file rendering truncation on GitHub's blob viewer),
  and alternate domains (`raw.githubusercontent.com`, GitHub code search) require a permission grant
  this non-interactive fire has no one to approve. **Not verified this session** — leaving as the
  sweep's own open item for a future fire with interactive WebFetch access, rather than asserting
  "no changes" without having read the content.
- **"Claude Design closing December 14."** Checked the official deprecations page while there for
  the Haiku item above — no mention of Claude Design on that page (expected; it's a product-closure
  claim, not a model deprecation, so this page was never going to carry it either way). Still
  unconfirmed by any official source found. Leaving as the sweep's own `[VERIFICATION NEEDED]` flag.
- **Replit/Anthropic (ecosystem signal), IPO window, MemPalace, MCP spec, Hono, Labrador AI.** All
  within existing pin ranges or background context, matching the sweep's own MEDIUM/LOW/no-action
  framing. No Klatch code surface for any.
