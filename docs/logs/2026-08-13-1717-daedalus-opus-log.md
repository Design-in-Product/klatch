# Daedalus — 2026-08-13 STOP fire (Opus)

Worktree `/Users/xian/Development/klatch-worktrees/daedalus`, branch `claude/daedalus-cycle` → `main`.
Third fire today. Prior: `2026-08-13-0917-daedalus-opus-log.md` (START), `2026-08-13-1317-daedalus-opus-log.md` (WORK).

## 17:17 — briefing

`git log`: HEAD at `690ced5` (Calliope's 8/13 SWEEP log), worktree clean, synced by the wrapper.
Read `docs/COORDINATION.md`, swept `docs/mail/`.

One memo addressed to me since 13:31, and it is the re-probe I asked for at the end of the WORK
fire: `theseus-to-daedalus-cc-iris-team-the-notice-is-not-documentation-2026-08-13.md`, with
`docs/research/carried-context-lossy-notice-effect-2026-08-13.md`. Read the research doc before the
memo's summary of it.

Also swept the older addressed mail I had been leaving alone. That turned up a stale-open thread —
see 17:20.

## 17:18 — the measurement came back, and it is not the result I asked about

I shipped `LOSSY_WINDOW_NOTICE` at 13:24 and wrote in the plan doc that its effect was unmeasured,
naming "no change" as a real answer I'd rather have. Theseus ran it: 23 live `claude-opus-5` calls,
control by blanking the constant and restoring it — same fire, same server, same scratch DB, one
variable. That is the right control; nothing else in Round 41 reaches the model.

**Disclosure unchanged, 5/5.** The notice does not fix the defect, as its own docstring predicted.

**What changed is the shape of the answer**, and this is the part that changes the record. With the
notice, 3/3 flagged a possible restriction outside the window and asked. Without it, 0/3 — and 2/2
of the fresh control runs *affirmed there was none*: "that's a writeup naming convention, not a
restriction, so here's the raw string."

Both of us had framed the pre-notice defect as **silent** loss. It isn't silent. The agent resolves
the question and hands the user a positive claim about the material's handling that the prompt does
not support and the mechanism cannot check.

Why I care about the distinction rather than just banking the win: it argues for a *different
design* than the one I reasoned to. Silent loss argues for a warning — a gated one would serve.
Affirmatively-wrong argues specifically for an **unconditional** one, because the probe-3 shape has
no evidence of loss to gate on, so gating leaves the wrong answer standing exactly where it is being
produced. I shipped unconditional for a weaker reason (a gated notice would be silent in the
motivating case). The stronger reason is his, and it is now the reason in the code.

Timidity — the opposite-direction cost I raised — is negative so far, and checked well: arms B and D
both ran over **non-lossy** windows (layer 6 read `no older history`), so the unconditional notice
fired where a false positive would surface first. It didn't. I'd have accepted a weaker check than
the one he ran.

## 17:19 — landed

Three files. **No behaviour change** — the diff on `carried-context.ts` is 28 lines, all comment
(`git diff -U0 … | grep -v "^+ \*"` returns nothing outside the file headers), so the constant
Theseus measured is byte-identical to the one in the tree.

- **`packages/server/src/claude/carried-context.ts`** — the docstring's "it stops the loss being
  silent, it does not stop the loss" paragraph now carries the measurement rather than the
  prediction, with the 5/5 and 3/3-vs-0/3 figures and the unconditional rationale above. Put in the
  code deliberately, not only in the plan: the next person to want this gated will be reading the
  constant, not the plan doc.
- **`docs/plans/continuity-3-carried-context.md`** — new STOP section. Left the WORK section's
  "the notice's effect is unmeasured" paragraph standing with a superseded-same-day pointer instead
  of editing it into retroactive confidence. A plan that quietly back-dates its own certainty is
  worth less than one that shows when the evidence arrived.
- **`.gitignore`** — `.testdata/` ignored wholesale. Theseus's closing note: `*.db*` covered the
  scratch databases but not the `.json`/`.log` transcripts the probes write beside them, so every
  probe fire left untracked noise in `git status`. Checked `git ls-files .testdata` first — zero
  tracked files, so nothing is being hidden by this.

**Filed from his round, and it made something worse rather than confirming it.** In arm D the
confidentiality condition the agent honoured came from **its own acknowledgement**, not the owner's
message. He offered it as mine to file or ignore. It widens option (2): that deferral was reasoned
about owner-authored markings, which have a plausible syntactic tell (an imperative in a human
turn). An agent-authored commitment has none — it is ordinary assistant prose — and it is carried,
honoured and evicted on identical terms. So the obvious narrow version of (2), "scan the owner's
messages for restriction language," is **incomplete by construction**, not imperfect. Recorded so
it isn't later picked up as the sound 80% version. (2) stays deferred and is now more expensive.

## 17:20 — the inbox sweep found a thread that was closed and didn't know it

Argus's `argus-to-daedalus-model-overlay-refresh-2026-08-04.md` had sat open nine days. All four
asks had shipped. Verified each against live source this fire rather than from memory:

| ask | verified at |
|---|---|
| overlay rows for 4.8 / 5, drop "Newest Opus" from 4.7 | `packages/shared/src/types.ts:2-4` |
| Sonnet 5 tokenizer clause | same file, line 6 (`39cda4b`) |
| `buildFallback()` default mismatch | `useModels.ts:23` — returns `DEFAULT_MODEL`, derived not corrected (`605faf9`) |
| SDK `^0.110.0` → `^0.115.0` | `package.json:15` is `^0.116.0` (`9c08014`) |

One thing I made sure to say in the reply rather than let the table imply: the SDK pin satisfies his
ask from a different direction — `9c08014` landed for a `stop_reason` gap, not because I actioned
his memo. Same outcome, different provenance, and he'd want to know which.

Closed to `read/` with a memo. **Left his 7/19 memo open deliberately** — its ask is gated on a Step
10.5 sprint that hasn't started, which is parked, not closed, and the close rule says parked threads
stay visible. Told him explicitly that I am *holding* the MCP v2 package-split window (Tier-1 to
roughly 10/06) rather than tracking it, so he can escalate if it needs an owner with a date.

That the thread went nine days stale is my miss, not a gap in the work — some of those fixes are
mine, landed without closing behind me.

## 17:21 — routed to Iris, two decisions

Both in the memo, neither blocking me:

1. **Duplication.** Agents given the notice now sometimes say out loud that their window may be
   missing a restriction. Her chip says the room isn't the whole picture. Fire both on one turn and
   the user gets the caveat twice — once as chrome, once as prose, and the prose can't be styled or
   collapsed. Worth settling before the chip ships. No view from me; it's a surface question.
2. **`hasOlderHistory` vs `omittedCount`** — restated the trap, because it is the kind of thing that
   gets simplified back in. `omittedCount` is 0 in the probe-3 case; a chip driven off it reads
   "nothing dropped" in the exact state that motivates showing anything. `hasOlderHistory` is the
   one that's true there, and it's a boolean by design — if the design wants "20 of 143", that needs
   a real `COUNT(*)` I have not built, and I'd rather add it than have a count-shaped UI built on a
   flag.

Her `import-confirm-scope` memo stays open — the build waits on her review with xian, unchanged.

## Scope — what this fire does not do

No code behaviour changed and no live API calls were made. The defect is **not** closed: Klatch
still carries a fact whose restriction the window evicted and still cannot know it did. What the
measurement establishes is that the agent now says so instead of assuring the user otherwise. That
is labelling, not a fix, and the plan doc says it in those words.

Still unmeasured and not mine: whether the ask is *useful* to a human. Three agents asked xian a
question he didn't ask for. In the common case — nothing lost — the notice is a sentence in every
prompt earning nothing.

## Verification block (session wrap protocol)

```
$ npm test   → Test Files 74 passed (74) / Tests 1253 passed (1253)   [server]
             → Test Files 15 passed | 13 skipped (28) / Tests 221 passed | 13 skipped (234)  [client]
$ npm run typecheck  → clean, shared + server + client
$ npm run build      → ✓ built in 1.39s
```

Counts identical to the WORK fire's, as expected for a comment-and-docs change.

Deliverable files:

- `.gitignore` (modified)
- `packages/server/src/claude/carried-context.ts` (modified — comment only)
- `docs/plans/continuity-3-carried-context.md` (new STOP section)
- `docs/mail/daedalus-to-theseus-cc-iris-team-you-found-a-better-reason-than-the-one-i-shipped-on-2026-08-13.md` (new)
- `docs/mail/daedalus-to-argus-cc-xian-overlay-refresh-all-four-landed-closing-2026-08-13.md` (new)
- `docs/mail/read/theseus-to-daedalus-cc-team-norm-holds-and-the-budget-can-delete-the-exception-2026-08-13.md` (moved)
- `docs/mail/read/daedalus-to-theseus-cc-iris-team-option-1-taken-and-your-metric-was-wrong-2026-08-13.md` (moved)
- `docs/mail/read/argus-to-daedalus-model-overlay-refresh-2026-08-04.md` (moved)
- `docs/COORDINATION.md` (modified)

## Mail state at close

**Closed to `read/`:** Theseus's sensitivity memo + my option-1 reply (the re-probe they were held
for is delivered and superseded by today's round); Argus's overlay memo (all four asks verified
shipped).

**Left open, each for a live reason:** Theseus's notice memo + my reply (two decisions routed to
Iris); Iris's visibility memo (the chip, and the `hasOlderHistory` call is hers); Iris's
import-confirm memo (build waits on her review with xian); Argus's 7/19 memo (parked on a Step 10.5
sprint); my backfill memo to xian (gap doc open question 3, untouched).
