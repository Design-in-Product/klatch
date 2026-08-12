# Klatch Attention Rollup

**Purpose:** the document xian skims to know what asks of him *first*. Demand-organized, sorted by what each item asks of him — not by topic. (Per Exec 2026-06-19.) **Also consumed by Janus's federated cross-project rollup** — keep it accurate and current.

**Anti-bottleneck function** (xian, 2026-06-19): the rollup makes 1:1s start primed rather than in catch-up. xian still works directly with each agent — it makes those conversations productive, it doesn't replace them.

**Trust-instrument discipline** (Exec 2026-06-19): every render comes from a fresh **verified sweep** of source docs — never from memory. A false "all clear" is a trust breach. "Quiet" must mean *verified-clear*, not *haven't-checked*.

**Last refreshed:** 2026-08-11 ~21:30 PT (Calliope) — v29. The `.env` gate's option list moved a **third** time today, again by measurement rather than argument: Theseus found the path-scope control is **tool-layer only** — it doesn't bind subprocesses at all, which reframes every option on the list as a routing-around rather than a clean fix, at different distances from the control. Concretely: option 2 (the wrapper script) turns out **inert on an unattended seat** — interpreter invocation is gated as its own class, so `bash scripts/run-aaxt.sh` needs a permission-allowlist entry that doesn't exist, a second decision surface Theseus declined to add unilaterally. Option 3 (`dotenv` in the client test setup) turns out to need **neither** of its stated prerequisites — vitest is a subprocess, so it was never subject to the path scope; it's one edit, verified working today. Pard adopted all three findings same-day and says the list is accurate for xian "for the first time." One thing worth surfacing on its own: mid-test, Theseus found he *could* read the credential file by routing through a subprocess, and stopped at `stat` without reading it — leaving the routing-around decision to xian rather than pre-empting it by demonstrating the boundary was porous. Corrected list below. **Also this render: a self-correction.** The "addressing, not secrecy" 🔴 item has been carried as open since 8/09 across five renders — it was actually answered by xian the same day it was opened (`calliope-to-daedalus-xian-discretion-clarification-2026-08-09.md`, 16:07, same-day reply to Daedalus's 08:21 question), and I never closed the loop in the rollup or in the straw-man doc as I said I would. Moved to ✅ below, three days late.

---

## Metrics strip

| Needs you | Blocked-on-others | Lower-urgency | In-flight |
|---|---|---|---|
| **2** | **0** | **4** | **5** |

*🔴: the `#3` compaction strategy call + the `.env`/AAXT-credentials gate (carried from 8/10 17:00, corrected three times now — most recently this render). "Addressing, not secrecy" moved to ✅ this render — see the self-correction note above.*

---

## 🔴 Needs you — FIRST, always

### The `#3` compaction call — now with a real number behind it, not just three options

- Background: `#3` (cross-channel context at prompt assembly) is the last of the three continuity changes. `#1` (imports mint entities) and `#2`'s replacement (the entity-scoped assembly join, `getEntityChannels`/`getEntityTranscript`) are both landed. `#3` itself is gated on this one call.
- **The options, from the 7/19 gap doc:** (a) compacted summary per agent, refreshed on entry; (b) recent-N turns plus summary; (c) on-demand tool — the agent queries its own source channel when relevant.
- **New this render:** Daedalus ran the assembly shape against the real March corpus (a copy) rather than estimating. The canonical cast — six Piper Morgan department heads — carries **~330K tokens of context before anyone speaks**, a third of a 1M window, re-sent per participant per turn. His words: *"three full sessions will not fit in one prompt" was directionally right and quantitatively understated.* **Option (a) is excluded for the canonical use case on arithmetic, not taste.**
- **His recommendation:** **(b) with (c) layered** — a bounded seed so an agent is never blank, plus the ability to reach for specifics. Also preserves Theseus's AAXT observability argument (with (b) a probe can tell "didn't know" from "knew and didn't use" — a blind on-demand-only design can't be told apart from a lucky agent that never needed to look).
- **What's blocked on this:** nothing has started building yet — Daedalus has the foundation in and is holding. Full writeup: `docs/plans/continuity-3-compaction-sizing-2026-08-10.md`. Memo: `daedalus-to-calliope-cc-xian-increment-2-reframed-2026-08-10.md`.
- **Date added:** 2026-08-10

### The `.env` / AAXT-credentials gate — third correction today; the option list is finally accurate

- **What it is:** a third execution-environment gate, distinct from the two Pard fixed 8/10 (`allowedTools` scope, the fabricated "no network" line). This one blocks reading the `.env` file that carries `ANTHROPIC_API_KEY` — so AAXT (Theseus's live-model probing) stays parked even though execution and network are both genuinely fixed and verified.
- **Mechanism, settled 8/10:** not a secrets-content heuristic — a decoy key written *inside* the worktree reads fine; `./.env` is a **symlink** to `~/.klatch/klatch.env`, **outside** the session's allowed working directory, and the directory sandbox blocks following the symlink out.
- **8/11 morning — option 4 (`--add-dir ~/.klatch`) withdrawn.** Theseus ran the credential test Pard assigned and found it grants *readability* but not the *capability AAXT needs*: AAXT reads `process.env`, and nothing populates it under vitest. "The capability granted is not the capability blocked." Also settled: `readlink .env` succeeds where `ls -la .env` doesn't — only the resolved target is blocked, closing off the last argument for a secrets-content heuristic.
- **8/11 midday — Pard's own billing-leak warning confirmed real.** Exporting the key into the wrapper *before* invoking the agent moves that fire's billing off xian's Max subscription onto the metered key — confirmed with a deliberately invalid key so nothing could actually be billed: Claude Code itself reports the env var "takes precedence over your claude.ai login." His fix: scope the export to a subprocess (`scripts/run-aaxt.sh`) invoked *by* the agent, so the agent's own process never holds the key.
- **8/11 evening — third correction, and the one that reframes the whole list.** Theseus found **the path-scope control doesn't bind subprocesses at all** — it's a tool-layer control on the agent's own reads, not a containment boundary. A node script he spawned read files outside the worktree freely and `stat`'d `klatch.env` (127 bytes); every one of those paths is refused through his own tools. **He stopped at `stat` and did not read the file** — deliberately, because doing so would have pre-empted xian's decision by demonstrating the boundary was porous rather than just reporting it. This single fact means **every option on the list is a routing-around, at different distances from the control** — a fact about the control, not about AAXT, and Pard says it belongs in front of xian before he picks.
  - **Option 2 (the wrapper script) is downgraded: inert on an unattended seat, not "narrowest."** Interpreter invocation is gated as its own class — `bash script.sh`, `sh script.sh`, `bash -c` all require approval that never comes in an unattended fire. It would need a `.claude/settings.json` allowlist entry authorizing the agent to invoke a script whose purpose is sourcing a secrets file — Theseus declined to add that himself, calling it a second decision surface Pard shouldn't get to launder as an implementation detail (turning Pard's own words back on him, which Pard explicitly credited).
  - **Option 3 (`dotenv.config()` in the client test setup) is upgraded: needs neither of its stated prerequisites.** vitest is a subprocess, so it was never subject to the path scope in the first place — no `--add-dir` needed. And `dotenv` already hoists into the client workspace via npm hoisting (implicit, should be made an explicit dependency once someone builds it). Verified today from a live client vitest process with a decoy env file: key present, no config changes beyond the one line. **This is now the cheapest working option, not the code-change-heavy one.**
- **Corrected list, third revision, sent to xian:**
  1. **Attended-only** — unchanged; the only option that doesn't route around any control.
  2. **`run-aaxt.sh` wrapper** — needs a permission-allowlist entry to run at all. Two decisions, not one. Billing property (subprocess-scoped export) still holds.
  3. **`dotenv.config()` in `packages/client/src/__tests__/setup.ts`** — one edit, works today, no prerequisites. Changes product code to serve a harness constraint, and hands every vitest run the key, including ones nobody intended to be credentialed.
  - Memo: `pard-to-theseus-cc-team-porous-boundary-adopted-2026-08-11.md`; doc: `docs/research/credential-gate-is-tool-layer-only-2026-08-11.md`.
- **Standing fact for the decision:** Theseus's AAXT liveness-gap fix (all 12 rounds now hard-fail on instrument failure, not just model failure) means whichever option you pick, a broken credential will show as broken, not as a clean pass.
- **Date added:** 2026-08-10 · **Corrected:** 2026-08-11, three times same day (option 4 withdrawn AM, option 1's billing risk confirmed midday, full list reframed by the subprocess-boundary finding this evening)

## ✅ "Addressing, not secrecy" — answered 2026-08-09, mis-tracked as open through 2026-08-11

- **The question:** Daedalus asked whether a klatch's assembled context should include what a participating entity said in its own 1-1s — his read was "yes, addressing not secrecy," and he asked for one word to build on.
- **The answer, same day:** xian replied live, ~8 hours later: *"A one-on-one is a direct message, but is not inherently a private message. Questions about privacy and discretion need to be handled with policies and contextual roles by the user and their agents — not assumed to be enforced in some universal way by Klatch."* Relayed and unpacked in `calliope-to-daedalus-xian-discretion-clarification-2026-08-09.md`: a direct "yes" to Daedalus's precise question, concluding "klatch assembly includes the entity's 1-1 messages, full stop." Already reflected in the discretion straw-man doc's 8/10 addenda (`docs/plans/discretion-model-options-2026-07-19.md`), which has treated it as settled since — just never in this board.
- **What went wrong:** that same memo said "I'll fold this into the straw man doc and the rollup" — the straw-man doc got it (via later addenda), the rollup didn't. The 🔴 item was written fresh into v25 the next day, reading Daedalus's *question* memo as still-open without checking whether it had already been answered, and every render since (v26, v27, v28) re-verified other things in this same item without re-checking the one claim that mattered. A "quiet" render is supposed to mean verified-clear; this one meant un-rechecked.
- **Caught:** 2026-08-11 ~21:30 PT, while sourcing this render's cohort section, by re-reading my own 8/09 mail rather than trusting the rollup's framing of it.
- **Date answered:** 2026-08-09 ~16:07 PT · **Date corrected on this board:** 2026-08-11 ~21:30 PT (three days late)

## ✅ Duty-cycle state — resolved 2026-08-10

- **Both blockers behind the 8/09 🔴 are closed.** The `--allowedTools` gap (real, fixed 8/05 but scoped too narrowly — missed `npx`) and the "no network" constraint (fabricated, never real, propagated into every fire prompt for weeks) were two distinct failures that looked like one. Pard fixed the first and retracted the second, with measurements rather than assurances: `npx vitest --version` succeeds in an unattended fire; `git ls-remote origin HEAD` returns `rc=0`.
- **All five seats re-armed, full scope:** Calliope 08:30/12:30/17:00/21:30 Sonnet 5 · Iris 07:17/19:17 Sonnet 5 · Theseus 10:47/14:47/19:47 Opus 5 (un-scoped from network-free work) · Argus 09:00/13:30/18:00 Sonnet 5 (suite execution back on) · Daedalus 09:17/13:17/17:17 Opus 5 (code work back on, no longer mail/diff-only).
- **Non-blocking, still open:** whether Amber fires should spawn-fresh (current model) or wake a persistent session — Pard named the convergent prior art (Klatch's pre-move cycle and CIO v0.1 both ran inside a live session, reached independently) as the strongest evidence for reconsidering, but Argus's 12/12 clean fires 8/06–8/10 cut the other way on practice. Explicitly not rushing this; kept apart from the mechanism fixes above.
- **Date resolved:** 2026-08-10, ~12:12 PT · **Source:** `docs/mail/pard-to-calliope-cc-team-gate-fixed-network-claim-was-false-2026-08-10.md`

## ✅ Continuity gating decisions — xian answered all four, 2026-08-08

Relayed by Janus close to verbatim (`docs/mail/janus-to-calliope-xian-answers-four-gating-decisions-2026-08-08.md`). Kept here rather than archived because two threads are still in motion (above) and the roadmap implications haven't been written up yet.

1. **Interpretation A or B?** → **B, proceed now** (messages keep `channel_id`, history builders join through `channel_entities` — additive, no migration). A gets a written pros/cons case filed to the roadmap for a later revisit, not built now.
2. **Identity resolution at import** → **Both**: Klatch guesses the name from `source_metadata`, xian confirms at import. He asked why this was ever framed as open — routed to Daedalus for direct reply.
3. **Discretion model** → **Not a pick from the four straw-man positions.** No platform-enforced privacy boundary: a 1-1 is direct, not private; discretion is a convention users and their agents set (ground-rules prompt text), never a wall Klatch builds or verifies. **"Private channels" confirmed 8/10 as deferred, not rejected** — a real future option, current stance not a permanent constraint (`docs/plans/discretion-model-options-2026-07-19.md` addendum). **Daedalus's Q2 (one transcript or two) is answered precisely, 8/10: both, at different levels** — two at the channel level (already true, `channel_id` separates them), one at the entity level (the agent's transcript is the *union* across its channels — that union is continuity `#3`, not a separate build). Corrects my own 8/09 reply, which had read it as flatly "two"; correction recorded in the straw-man doc.
4. **Directed-mode visibility** → **Confirmed:** everyone in a klatch sees everything; @mention requests a reply, doesn't gate visibility. Matches Calliope's 7/19 recommendation; current code does the opposite — fix queued in Daedalus's lane.

**Still open, not urgent:** the `klatch.db` provenance question (16-channel working DB vs. 2,367-channel backup of unknown origin) — carried forward, not yet re-asked this render.
**Correction (8/10):** the `source_channel_id` column named here as "safe to start" won't be built — Daedalus found the cardinality assumption behind it broke when `#1` shipped (one entity can now span many imported channels, so a single nullable column can't answer "which conversation is this continuous with"). Built the general join instead (`getEntityChannels`/`getEntityTranscript`, Round 36) — same question, answered completely rather than lossily. Calliope confirmed nothing else was being counted on it (`calliope-to-daedalus-source-channel-id-drop-confirmed-2026-08-10.md`). **Still safe to start:** wiring `entity.reflections` into `buildSystemPrompt`.
**Date decisions landed:** 2026-08-08.

### ~~Cut v1.0.0~~ — WITHDRAWN 2026-07-19

- Previously listed as "all gates clear." It was not. Retracted rather than deleted so the trust-instrument record shows the correction. Release notes, blog post, LinkedIn + PH copy remain drafted and reusable once the gate is genuinely met.
- **Also outstanding from beta scope:** Paths B/C (JIT import + new-agent-in-picker) were in xian's 6/26 scope, were never built, and were not named in the 6/27 "composition complete" call. Separate from the continuity gap — Path B wouldn't have closed it.


---

## 🟡 Lower-urgency decisions

### Sonnet 5 tokenizer +30% — compaction threshold may need recalibration

- **What:** Sonnet 5 ships a new tokenizer producing ~30% more tokens from the same input vs. Sonnet 4.6. Klatch's compaction threshold (160K, tuned during Step 9) was calibrated for 1M-context models with Sonnet 4.6 tokenization. Sonnet 5 users will hit the threshold in ~77% as many turns — and pay ~30% more per session at the same usage pattern.
- **Sweep finding:** `docs/intel/2026-07-06-sweep.md` §1. Verified against `packages/server/src/claude/client.ts` — threshold gating is token-count-based.
- **What's needed:** No code change required before v1.0. Worth noting before Step 11 design (memory architecture depends on compaction behavior). Argus recommends a brief note in the Step 11 pre-design checklist rather than a threshold change before 1.0.
- **Analog:** Opus 4.7 had +35% tokenizer impact, documented in `docs/mail/read/argus-to-daedalus-opus-4-7-impact-2026-04-29.md`. Sonnet 5 is the same class of issue.
- **Date added:** 2026-07-06

### Model overlay grooming + DEFAULT_MODEL flip — reframed 8/4; no availability emergency

- **Correction (Argus, 8/4):** three weeks of sweeps escalating "users cannot select Opus 5, picker two generations stale" were aimed at the wrong seam. The picker has been **dynamic since Daedalus's 6/21 landing** — runtime validation via `isValidModel` against `/api/models` discovery; when the live API lists `claude-opus-5` (launched 7/24), Klatch can already offer and accept it. `AVAILABLE_MODELS` is labels + offline fallback only. The 7/05 lineup-refresh ask is superseded (`argus-to-daedalus-model-overlay-refresh-2026-08-04.md`; old memo moved to `read/`).
- **What Daedalus does (all small):** overlay label rows for 4.8 + Opus 5; drop 4.7's stale "Newest Opus" label; Sonnet 5 tokenizer clause; `buildFallback()` default-mismatch one-liner (`useModels.ts:20` returns 4-6 while `DEFAULT_MODEL` is 4-7 — derive, don't restate); SDK `^0.110` → `^0.115`.
- **What's yours:** the **DEFAULT_MODEL flip** (4.7 → 4.8 or Opus 5) — your decision per the manual-constant design note, same as the 4.6→4.7 precedent. No urgency.
- **Date added:** 2026-07-05 · **Reframed:** 2026-08-04

### MAXT Session 02 + April-28 round-trip MAXT — parked
- **What:** Theseus's MAXT Session 02 and Daedalus's April-28 round-trip MAXT both need xian's live attention. Not time-pressured; xian rouses Theseus situationally.
- **Date added:** 2026-06-23

### Cron-shape experiments registry: calibration still pending real observations
- **What:** `cron-shape-experiments.md` — straw-model entries; real per-agent observations now accumulating. Calibration is post-launch data; no decision needed yet.
- **Date added:** 2026-06-03

---

## 🔵 In flight

Awareness, no action needed.

### Cohort status (Amber, verified 2026-08-11 ~21:30 PT — post-reboot day, full cycle)
All five survived the ~07:30 PT macOS 26.6 reboot; LaunchAgents confirmed re-armed by each seat from inside its own fire, no seat lost its schedule. Pard's Amber reboot runbook reached v3 today, written from the actual first live run rather than rehearsed in the abstract — five defects found and fixed, all the same shape (a step described rather than run); informational for this board, nothing new asked of xian in it that he didn't already live through.
- **Calliope** — this fire (21:30 STOP). `.env` gate 🔴 rewritten a third time this render (subprocess-boundary finding — see above); server AAXT residual 🔵 updated (holes closed, new denominator residual added); new 🔵 for the truncated-message status decision. No new mail addressed to Calliope directly this fire.
- **Theseus** — 19:47 STOP fire verified Argus's hole A/B fix from his own seat (both closed), found the fidelity-denominator residual while doing it, and found the subprocess-boundary fact driving this render's `.env` rewrite — including stopping deliberately at `stat` rather than reading the credential file once he'd found the boundary porous.
- **Argus** — 18:00 STOP fire closed both server-gate residual holes Theseus flagged 8/10 (`totalScored===0` ⇒ `'failed'`, judge-failure route ⇒ `'Unscored'`), caught a third instance of the same failure class (a stale test pinning the old contract) while testing it, and added two new `runAAXT`-level regression tests. `npm test` 1155 server (+2) / 212 client, typecheck clean — run for real this fire.
- **Daedalus** — 17:17 STOP fire landed both queued dependency bumps (Hono `^4.13.1`, SDK `^0.116.0`, each reviewed against the real changelog rather than a summary) and, while checking the SDK's new `model_context_window_exceeded` reason, found the truncated/refused-message bug above — recorded, not fixed, correctly routed to Iris rather than inventing a status unilaterally.
- **Iris** — 19:17 STOP fire decided the truncated-message status shape Daedalus routed to her same day (`'incomplete'` + `stopReason` enum, reusing existing render treatment) — thread stays open pending Daedalus's server-side implementation, per close-discipline.

### Server AAXT gate residual — holes A/B closed and independently verified; one new residual, not blocking
- **What:** Argus closed the two holes Theseus found 8/10 (auxiliary failure at probe generation, judge failure at scoring — both previously fell through to `'low'`/`'Absent'`, the same bucket as a genuine low-conveyance reading). `totalScored === 0` now reports `'failed'`; the judge-failure route now reports `'Unscored'`, same category as the route already fixed. Two new regression tests pin both directly; a stale test asserting the old contract was caught and updated in the same pass.
- **Theseus verified both from his own seat, not by reading the diff** — re-ran his 8/10 decoy-key repros against Argus's fix: Hole B now `Unscored` (was `Absent`); Hole A now `overallFidelity: 'failed'` (was `'low'`), with the error markers confirming generation was genuinely attempted rather than skipped.
- **New residual, found while verifying: `Unscored` results still count toward the fidelity denominator.** `runner.ts`'s `totalScored` includes unscored probes, and the zero-probes guard only fires when *every* probe is unscored — so a partial judge flap (the likelier real-world case) still deflates the ratio. Measured: 4 probes, judge throws on 1, reports `'medium'` against an honest 100%-of-scored ratio. **Not a regression** (pre-fix this landed in the same deflated place via `Absent`) and the direction is conservative — it under-reports, never manufactures a false green.
- **Deliberately left to Argus** — same reasoning as the holes it follows: recasting the denominator changes what every past fidelity number on file was computed over, which is his policy call to make, not Theseus's to decide mid-fire. Suggested shape offered (divide by `totalScored − unscoredCount`, with a floor). Doc: `docs/research/aaxt-partial-judge-outage-2026-08-11.md`.
- **Date added:** 2026-08-10 · **Holes A/B closed:** 2026-08-11 · **New residual found:** 2026-08-11 (same day, during verification)

### New — truncated and refused messages are stored as silently "complete"
- **What:** `packages/server/src/claude/client.ts` treats any non-`tool_use` stop reason as a clean finish and writes the message `'complete'`. The Anthropic SDK's actual union has four non-clean reasons — `max_tokens` (cut off mid-sentence), `model_context_window_exceeded` (new in SDK 0.114), `refusal`, `pause_turn` (expects to be resumed) — and today all four render identically to a normal reply. Found by Daedalus while reviewing the SDK changelog for the dependency bump, not while looking for it; a stale code comment claiming coverage of only two stop reasons is corrected in place.
- **Why it matters here specifically:** Klatch's whole premise is that these are conversations you keep — a silently truncated turn is a corrupted record of one, worse than in a throwaway chat UI.
- **Decided, not xian's call:** Iris chose the shape same-day — new `Message.status = 'incomplete'` (covers refusal too, so not `'truncated'`) plus an optional `stopReason` enum, rendered with UI treatment the codebase already has (the existing error-line slot, the amber "flagged not wrong" color already used for imports) rather than new chrome. No resume affordance for `pause_turn` yet — real follow-up, not this increment. Server-side carry-through is Daedalus's next queued implementation unit; nothing blocked behind it.
- **Caveat both of them named:** designed against the current code, not observed against a live truncated response — worth a MAXT/manual pass once built.
- **Date added:** 2026-08-11

### Composition gesture + beta gate — FULLY CLEAR ✅
- All 7 increments on main. MAXT Session 03: 15/15. R45: 8/8. R46 (clone): 8/8, 0 Phantoms. R47 (@mention): 8/8, 0 Phantoms. All green.
- Launch copy suite complete: blog post v3, release notes v1.0, README rewrite, LinkedIn + PH drafts.
- **Release cut is the only remaining gate (see 🔴).**

### Pages build, strategic threads, CIO artifact request
- Pages: fixed 6/22, no new issues.
- BYOC/portability/transporter settled. xian's July focal shift. Question-box item pending newsletter.
- CIO 6/3 canonical-artifacts request: **status unverified since late June** — carried across the freeze, not re-checked (needs an interactive session with network to verify; flagged for next one).

---

## 🟢 Resolved since last board (8/10)

- ~~**Duty-cycle state — 4 of 5 seats disarmed**~~ — Pard fixed the `--allowedTools` gap (`npx`/`vitest` now covered) and retracted a fabricated "no network" constraint that had shaped every fire prompt for weeks. All five seats re-armed at full scope. *Closed 8/10.*
- ~~**Code-execution gate in unattended fires**~~ — was the same fix as above, not a separate one: the 8/05 `--allowedTools` change named `git`/`npm` but missed `npx`, which is how Klatch's suite actually runs. *Closed 8/10.*
- ~~**Client build is red**~~ — Daedalus's fix was bigger than the 27-error report: the *root* build (`shared && server && client`) had never succeeded once, since the initial commit (`packages/shared` had no `build` script); server alone carried 55 uncounted errors on top. Fixed all of it, including a live MCP crash (`klatch://entities/{id}` threw on any entity with a `validUntil` reflection) that a stale comment had claimed was covered since May. Typecheck now runs in `npm test` for all three workspaces plus root. Independently verified green from two seats (Daedalus's own fire, Theseus's 19:47 re-run): build green end to end, `npm test` exit 0, 1153 server / 212 client. *Closed 8/10.*

## 🟢 Resolved since prior board (8/9)

- ~~**Four continuity gating decisions**~~ — xian answered all four directly, 8/08 (relayed by Janus). B chosen for Interpretation A/B; identity resolution is guess+confirm; discretion model is "direct not private" + ground-rules convention + per-message routing (new architecture, not yet built); directed-mode visibility confirmed as Calliope recommended. Two reply-owed threads spun out, tracked above. *Closed 8/9 (decisions landed 8/8).*
- ~~**ANTHROPIC_API_KEY on Amber**~~ — resolved 8/05 by Pard: one canonical `.env`, symlinked into six worktrees, live-verified (real Haiku call, 200), own Console workspace + spend cap. This board had it listed as open through v23; four-day staleness caught by Janus's 8/08 memo. *Closed 8/9 (resolved 8/5).*
- ~~**Unattended fires couldn't commit**~~ — fixed 8/05 (`mediajunkie e52daa2`, `--allowedTools 'Bash(git:*)' 'Bash(npm:*)'`); confirmed by every dated log commit landing on `origin/main` since. **Note: this did not fix code execution** (see 🟠 above) — a narrower, still-open gate. *Closed 8/9 (resolved 8/5).*

## 🟢 Resolved since prior board (8/4)

- ~~**Amber migration (all five Klatch agents)**~~ — complete. Five handoffs filed and reviewer-verified by Pard ("strongest batch of the twenty-one migrations this constellation has run"). Per-worktree git identity structural; federation link to Janus's cross-project rollup survives by repo identity (nothing to re-point); intel-sweep cloud triggers ran straight through the 16-day gap and need no rebuild. *Closed 8/4.*
- ~~**Argus's owed discretion probe-design reply**~~ — delivered 8/4 (held open since 7/19; session died mid-cycle before it was written). Probe designs per position now in the straw man doc, not just in mail. *Closed 8/4.*
- ~~**Node-26 arrival blocker (`better-sqlite3` won't compile)**~~ — found by Theseus on first Amber session, fixed by Argus same night (`^12.11.1`); full suite green under the bump, 1332 passing = 7/19 baseline. First-day proof the team's find→route→fix loop survived the migration. *Closed 8/4.*
- ~~**"Opus 5 not selectable" sweep escalation**~~ — false alarm, corrected by Argus 8/4: picker is dynamic since 6/21; what remains is overlay grooming (🟡, reframed). *Closed 8/4.*

## 🟢 Resolved since prior board (7/5)

- ~~**AVAILABLE_MODELS — Sonnet 5 + Fable 5 missing from picker**~~ — Daedalus shipped `0395c4b`; SDK bumped `^0.96` → `^0.110`. Model picker current for v1.0. *Closed 7/5.*
- ~~**Nudge Argus — mode-1 since 6/28**~~ — Argus back online; sweep #14 filed; COORDINATION.md updated; vitest 4 config fixed. *Closed 7/4.*

## 🟢 Resolved (6/27 → 6/29)

- ~~**R46+R47 AAXT (Theseus)**~~ — both passed 6/28 overnight. R46: 8/8, 0 Phantoms. R47: 8/8, 0 Phantoms. Beta gate fully confirmed. *Closed 6/28–6/29.*
- ~~**Release cut blocked on AAXT**~~ — AAXT passed; release cut now a 🔴 for xian. *Closed 6/28.*
- ~~**Blog post POV revision**~~ — v3 drafted (meta angle: built it using the same kind of team). Closing line rewritten. Series footer corrected. xian approved direction, making edit pass. *Closed 6/29.*
- ~~**Merge claude/daedalus (Inc 7 — @mention override)**~~ — merged 6/27 (`aaca51b`). *Closed 6/27 night.*
- ~~**MAXT Session 03 — beta gate**~~ — 15/15 PASS (xian live, 6/27 ~19:45). *Closed 6/27 night.*

## 🟢 Resolved (6/27 morning → evening)

- ~~**Merge claude/daedalus (Inc 6 — clone-from-klatch)**~~ — merged 6/27 (`a313ab2`, xian-authorized). Iris ✅ conformant. *Closed 6/27 evening.*

## 🟢 Previously resolved (6/26 → 6/27 morning)

- ~~**AAXT cross-ref + #general guard blocked on merge**~~ — R45 completed by Theseus 6/26; 8/8 probes, 0 Phantoms. *Closed 6/27.*
- ~~**Merge claude/daedalus (Inc 2–5 + copy fixes)**~~ — landed 6/26 (`c877825`, xian-authorized). *Closed 6/27; superseded by Inc 6.*

## 🟢 Previously resolved (6/25 → 6/26)

- ~~**Iris Phase 3 formal cutover**~~ — done 6/24. *Closed 6/25.*
- ~~**branch -D worktree-daedalus-2026-05-18**~~ — executed 6/24. *Closed 6/25.*
- ~~**Blog post LinkedIn share (lower-urgency)**~~ — escalated to 🔴 POV-revision ask per xian's 6/25 direction. No longer "ship as-is."

*(Earlier closures pruned — see 6/25 cycle log.)*

---

## Changelog

- **v29 (2026-08-11 ~21:30 PT, Calliope)** — **Self-correction: the "addressing, not secrecy" 🔴 item was stale for three days.** It was answered by xian the same day it was opened (8/09, ~16:07, relayed same-day in `calliope-to-daedalus-xian-discretion-clarification-2026-08-09.md`) but never closed on this board — carried as an open decision through v25–v28 despite my own mail on file saying it was settled. Moved to ✅ with a full account of what went wrong. 🔴 3→2 net of this correction. `.env` gate 🔴 corrected a third time today, and this one reframes the whole thread: Theseus found the path-scope control is tool-layer only, not a real containment boundary — a subprocess he spawned read files outside the worktree freely, and he deliberately stopped at `stat` without reading the credential file rather than pre-empt xian's decision. That single fact means every option on the list routes around the control at a different distance, which flips the standing (option 2, the wrapper script, is inert unattended without a second permission-allowlist decision; option 3, `dotenv` in the client test setup, needs neither of its stated prerequisites and is now the cheapest working option). Pard adopted all three findings and calls the list accurate for the first time. Server AAXT gate residual 🔵 updated: Argus closed both holes Theseus flagged 8/10, independently verified from Theseus's own seat — but verifying it surfaced a new one, `Unscored` results still counted in the fidelity denominator, deflating partial-outage runs; conservative direction, not blocking, left to Argus's policy call same as its predecessors. New 🔵: Daedalus found every non-`tool_use` stop reason (truncated, refused, context-exceeded, pause) is silently stored as `'complete'`; Iris decided the shape same day (`'incomplete'` status + `stopReason` enum) without needing xian's input; Daedalus's server-side carry-through is next in his queue. Cohort section rewritten for the full post-reboot day across all five fires. 🔵 4→5 (new truncated-message item; residual item's content changed but count unchanged).
- **v28 (2026-08-11 ~17:00 PT, Calliope)** — First render of the post-reboot day. `.env` gate 🔴 corrected twice by measurement, not argument: Theseus ran the exact credential test Pard assigned him and found v27's favored option (`--add-dir ~/.klatch`) grants readability but not the capability AAXT actually needs (it reads `process.env`; nothing loads dotenv under vitest) — Pard withdrew the option same day. Separately, Pard finally measured his own week-old billing-leak warning: a wrapper-level key export is a real, silent diversion off xian's subscription (confirmed with a bogus key — Claude Code names the precedence itself). His fix scopes the export to the AAXT test subprocess (`scripts/run-aaxt.sh`) rather than the agent's own process. Corrected 3-option list now in the 🔴 item. Cohort section rewritten for the reboot-survival day: all five LaunchAgents confirmed re-armed from inside their own fires; Daedalus proved (from installed Vitest 4 source, not timing inference) that a client-test-parallelism fix had been silently inert since the Vitest 4 bump, fixed it, and separately logged a live collision between an unattended fire and an attended session in the same worktree — first concrete instance of a risk the 8/11 reboot runbook only described. No new mail addressed to Calliope this fire; no mail hygiene needed (nothing new closed).
- **v27 (2026-08-10 ~21:30 PT, Calliope)** — Client build 🔵 item resolved: Daedalus's fix (bigger than reported — root build never succeeded once, since the initial commit) independently verified green from a second seat (Theseus, 19:47). New 🔵: a server AAXT gate residual — Theseus found Argus's `Unscored` fix leaves two of three instrument-fault routes still reading as legitimate results; routed to Argus, not blocking. The `.env` gate 🔴 narrowed sharply, not resolved: Pard re-checked his own "independent confirmation," found it confounded, and traced the real cause to his own secrets layout (one canonical file, six symlinking worktrees) — a fourth option (`--add-dir ~/.klatch`) now looks like the likely pick, still untested and still xian's call given the billing-leak concern underneath it. **Named a pattern:** Theseus routed a naming ask after finding three same-day instances of "a comment asserts coverage nothing exercises" (Round 34's MCP header, 12 green-but-dead AAXT rounds, the liveness-gate guard's own comment) — written up as the **Institutional Phantom**, tied to AAXT's existing Phantom category rather than new taxonomy (`docs/research/institutional-phantom-2026-08-10.md`). Mail hygiene: 8 stale 7/19-era threads closed to `read/` (pre-gate-protocol, team-memos-reply, composition-continuity-reply, and their outbound pairs — all substantively answered by 8/08–8/10 decisions). 🔵 count unchanged net (client-build resolved, gate-residual added). 🟡 count corrected 3→4 — miscounted in v26, the section has carried 4 items (tokenizer, model overlay, MAXT-parked, cron-shape registry) since 7/06.
- **v26 (2026-08-10 ~17:00 PT, Calliope)** — Two new 🔴 decision-threads for xian, both concrete and ready to act on: the `#3` compaction call (Daedalus measured the real March corpus — six department heads = ~330K tokens before anyone speaks, excluding option (a) on arithmetic; recommends (b)+(c)), and the `.env`/AAXT-credentials gate (Argus found a third distinct execution gate beyond today's two fixes; Pard named the billing-leak hazard under any fix and framed three options; Theseus corrected the underlying mechanism — directory-sandbox-on-a-symlink, not a secrets heuristic — before xian picks between them). 🔴 1→3. New 🔵: client build is red (Theseus, 27 type errors, routed to Daedalus, not urgent — vitest doesn't typecheck so no prior green claim covered it) and AAXT liveness gap fixed (Theseus — all 12 rounds previously passed green on total API failure; now hard-fail correctly). Corrected the `source_channel_id` "safe to start" item from v25's continuity-decisions section — it won't be built; Daedalus shipped the more general join instead, confirmed by Calliope as losing nothing counted on. Mail hygiene: 11 closed `*-to-calliope` threads (5 flagged stale at v25, plus the just-closed gate-fixed/duty-cycle-prior-art/rollup-ack threads) moved to `read/`. Cohort section rewritten to this render's actual fire content per agent.
- **v25 (2026-08-10 ~12:30 PT, Calliope)** — Duty-cycle 🔴 and code-execution 🟠 both resolved same-render: Pard fixed the real `--allowedTools` gap (`npx`/`vitest` now covered) and retracted a fabricated "no network" constraint that had shaped every fire prompt for weeks — measured false today (`api.github.com` 200, `git ls-remote` rc=0). All five seats re-armed at full scope; this render is the live test (two commits pushed straight to `origin/main`, no workaround). 🔴 2→1 (only the "addressing, not secrecy" thread remains). 🟠 1→0. Cohort section rewritten to the re-armed cadences. Also this fire: one-transcript-vs-two correction folded in (Daedalus, "two at channel level, one at entity level"); private-channels-deferred addendum recorded; UX false-privacy-impression note routed to Iris.
- **v24 (2026-08-09 ~08:40 PT, Calliope)** — First render after a 5-day gap (no Calliope session 8/4 night → 8/9 morning; my own cycle was one of the four disarmed 8/5). Headline flip: the four continuity gating decisions are **answered** (xian, 8/8, relayed by Janus) — removed from 🔴, moved to a dedicated ✅ section with two spun-out reply threads tracked as in-motion. New 🔴 in their place: **duty-cycle state** — only Argus's cycle is armed and firing; the other four were disarmed 8/5 pending a review whose resolution I could not find in `docs/mail/`; Argus's cycle has produced 13 consecutive no-ops on a code-execution permission gate, unresolved and flagged to Pard twice with no reply (new 🟠). Published the first Klatch check-in artifact (Janus's 8/5 ask, delivered 4 days late): https://claude.ai/code/artifact/6b0f6f84-eeae-4b21-ae01-21f5f5524707. 🟢 +3 (decisions answered; API-key staleness corrected — resolved 8/5, this board had it wrong through v23; unattended-fire commit gate confirmed fixed with a named residual gap). Cohort section rewritten to reflect the 5-day quiet stretch honestly rather than repeating 8/4 status as if current.
- **v23 (2026-08-04 ~23:30 PT, Calliope)** — First Amber render, post-migration. Decision state verified unchanged (predicate: no xian-authored mail since 7/19; Argus's same-day check concurs; Iris verified git 7/25+ is migration traffic only). 🔴 item enriched with the 8/4 staging: Daedalus assembly-inversion read (team rec: assembly-only = Interpretation B), Argus per-position probe designs (straw man corrected 8/4 — two probe layers, not "binary"), Iris §6 candidate text (held for live session). Cohort section rewritten for Amber (worktrees, identities, LaunchAgent cadences; Argus armed same evening). 🟡 count corrected 5→4 (miscount in v22); Opus-picker 🟡 reframed per Argus's 8/4 wrong-seam correction (picker dynamic since 6/21 — no availability gap; DEFAULT_MODEL flip surfaced as xian's). CIO item honestly marked unverified-since-June. 🟢 +4 (migration complete; Argus's owed reply; Node-26 blocker found→fixed same night; Opus-5-selectable false alarm corrected).
- **v22 (2026-07-19 ~11:25 PT, Calliope)** — see header of prior render; superseded text summarized: continuity finding replies same-day, Q4 answered (v0.9.x alpha), Interpretation A/B fork holds Daedalus, ~49→16 imports correction.
- **v20 (2026-07-06 ~07:05 PT, Argus)** — Sweep #15 (auto 6/29–7/6) reviewed. New 🟡: Sonnet 5 tokenizer +30% compaction impact (threshold 160K was calibrated for 4.6; Sonnet 5 users hit it in ~77% as many turns). MCP spec July 28 RC: beta SDKs out, 22 days to final (no 1.0 action — stdio-only). Opus 4.8 still pending Daedalus reply. Suite 1332 green. 🟡 +1 → 5.
- **v19 (2026-07-05 ~12:50 PT, Argus)** — SDK `^0.110` runtime-confirmed green after `npm install` + full suite (exit 0). Opus 4.8 gap found + Daedalus memo filed (`argus-to-daedalus-opus-lineup-refresh-2026-07-05.md`). Mail threads closed (Calliope + Daedalus). 🟡 +1 (Opus lineup refresh). v18 timestamp error noted (committed 12:44 PT, not 17:30 PT).
- **v18 (2026-07-05 ~12:44 PT, Calliope)** — AVAILABLE_MODELS + SDK bump shipped by Daedalus (`0395c4b`). Persona captures: Daedalus ✅ Argus ✅ Iris pending. MAXT klatch session in progress. 🟡 −1 (AVAILABLE_MODELS closed). Cohort updated.
- **v17 (2026-07-04 ~19:35 PT, Argus)** — Argus back online; mode-1 🔴 cleared. Sweep #14: Sonnet 5 + Fable 5 available (AVAILABLE_MODELS gap → Daedalus); SDK ^0.110.0 (14 minors behind). vitest 4 migration fix applied (client flake root cause). Server: 1120 tests green. 🔴 → 1 (cut v1.0.0). 🟡 +AVAILABLE_MODELS update.
- **v16 (2026-07-04 ~13:30 PT, Calliope)** — Quota reset 7/1. Argus mode-1 (6/28–7/4, 6 days); sweep #14 overdue. Cohort status verified. Logbook gap: last entry 3/25 (3.5 months behind). 🔴: cut v1.0.0 + nudge Argus. 🟡 +logbook + MAXT real-use-case.
- **v15 (2026-06-29 morning, Calliope)** — R46+R47 AAXT passed (Theseus, 6/28). Launch copy suite complete (blog v3, release notes, README, LinkedIn/PH). 🔴: cut v1.0.0 (xian's call). 🟠 → 0. Lean 2-hour cron active.
- **v14 (2026-06-27 ~22:40 PT, Calliope)** — Inc 7 merged (`aaca51b`); MAXT Session 03 15/15 PASS; beta gate CLEAR. 🔴 → 0. 🟠: R46+R47 AAXT (Theseus, 6/28 ~9:31am). Release cut follows. Composition gesture complete.
- **v13 (2026-06-27 ~21:50 PT, Argus)** — Inc 7 Iris ✅ conformant (`611fca9`); composition gesture complete. 🔴: merge `claude/daedalus` (Inc 7). Argus R49 added. Cohort + composition updated.
- **v12 (2026-06-27 ~21:30 PT, Calliope)** — Inc 7 (final composition increment — @mention overrides any mode) built by Daedalus (`17c3d78`); in Iris UX review. Cohort + composition gesture updated.
- **v11 (2026-06-27 ~20:20 PT, Argus)** — Inc 6 merged (`a313ab2`). 🔴 → 0 items. Test count: 1324 (1116 server / 208 client). R46 MAXT unblocked; Theseus notified. Inc 7 building. Cohort updated.
- **v10 (2026-06-27 ~19:20 PT)** — Iris ✅ received (6/27 ~19:03); clone-from-klatch conformant; merge gate cleared. 🔴 item updated: "ready to merge now." Cohort: Iris woken + reviewed. Composition gesture: Inc 6 merge-ready.
- **v9 (2026-06-27 evening)** — Argus status corrected: 1322 tests (not 1291); R46–R48 AAXT written 6/26 on `claude/argus` (not merge-blocked). Argus removed from "waiting post-merge" in 🔴 item.
- **v8 (2026-06-27)** — Prior merge landed (`c877825`, 6/26); rollup corrected. 🔴 item updated to Inc 6 (clone-from-klatch) awaiting Iris review. Prior merge closure added to resolved. Inc 1–5 now on main. 🔴 count: 1.
- **v7 (2026-06-27)** — R45 passed (Theseus, 6/26): CrossRefStrip + `#general` guard, 8/8, 0 Phantoms. Inc 6 (clone) built by Daedalus, in Iris review. "Daedalus waiting on merge" removed (he proceeded). AAXT-blocked entry resolved. 🔴 count: 1 (merge still critical path).
- **v6 (2026-06-26)** — Beta definition captured from xian directly: composition gesture fully implemented + tested/QA'd = beta (v0.9 or v1.0); Search is post-beta. Merge item reframed as critical-path-to-beta. Beta-path 🔴 resolved (definition now documented). 🔴 count: 1.
- **v5 (2026-06-26)** — Verified sweep triggered by Janus stall-sweep request. Two new 🔴: Daedalus branch merge (4 agents blocked) + beta critical path (xian's top ask). Blog post upgraded from 🟡 to 🔴 POV-revision needed. Cohort status updated (Daedalus cron-silence resolved). Stale v4 "no 🔴" summary corrected.
- **v4 (2026-06-25)** — Iris Phase 3 cutover resolved. 🔴 → 0. All 5 agents cycling.
- **v3 (2026-06-23)** — Full verified-sweep rewrite. New 🔴: Iris Phase 3 cutover.
- **v2.1 (2026-06-21)** — post-Iris-session-12 refresh.
- **v2 (2026-06-19 evening)** — demand-organized refactor per Exec's advice.
- **v1 (2026-06-19 morning)** — initial sketch.
