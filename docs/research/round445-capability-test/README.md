# Round 445 — the capability test, as one command xian can paste

**Author:** Theseus (Klatch) · **Date:** 2026-10-23 (STOP fire) · **Repo rev at authoring:** `fc501bca`
**Asked by:** Janus → Theseus, cc Pard, Calliope, xian, 2026-10-23 17:48 PT —
`docs/mail/janus-to-theseus-cc-pard-calliope-xian-capability-test-xian-chose-a-send-pard-the-command-2026-10-23.md`.
xian chose **(A)**: attended, his own terminal on Amber, key exported for the sitting and unset after.
Pard asked for the command as a paste, what success and failure look like, which tree it wants, and
whether the server has to be running.

## The short answers

| Pard's question | Answer |
|---|---|
| **The command** | §1 below. One line, full paths, no `#`. |
| **Server running?** | **No.** The probe talks to the Anthropic API directly. `npm run dev` is not needed and should not be running. |
| **Which tree?** | `/Users/xian/Development/klatch`, branch `main`, pulled first. **Not** an agent worktree — see §3, this is the one thing that would silently spoil the recording. |
| **Success** | `VERDICT/1 NO-FAILURES`, exit 0. |
| **Failure** | `VERDICT/1 FAILURES` / `ABORT` / `CRASH`, exit non-zero. Each names its own cause on the line above. |
| **Cost** | 5 API calls, ~20k input tokens total. Cents. |
| **Can it be run twice?** | Yes. It writes nothing but its own stdout and holds no state. |

## 1. The command

```
cd /Users/xian/Development/klatch && git pull --ff-only origin main && node /Users/xian/Development/klatch/docs/research/round445-capability-test/klatch-capability-test.mjs 2>&1 | tee /Users/xian/Development/klatch/capability-test-recording.out
```

With the key handling xian already has, the whole sitting is:

```
read -rs ANTHROPIC_API_KEY; export ANTHROPIC_API_KEY
cd /Users/xian/Development/klatch && git pull --ff-only origin main && node /Users/xian/Development/klatch/docs/research/round445-capability-test/klatch-capability-test.mjs 2>&1 | tee /Users/xian/Development/klatch/capability-test-recording.out
unset ANTHROPIC_API_KEY
```

The recording lands at `/Users/xian/Development/klatch/capability-test-recording.out`. That file is
the deliverable — it carries the header (SDK version, pin, models, trigger), the five cells, the
verdict line, and a JSON block with the full detail. Nothing in it is secret; the probe never prints
the key, not even a prefix.

**One caveat on the pull:** at the time of writing, `/Users/xian/Development/klatch` has one
modified file, `docs/briefs/fire-depth-latest.md`. The pull should still fast-forward, since nothing
in this change touches that file, but if git objects, `git stash push -m capability-test` before the
pull and pop it after.

## 2. Reading the output

```
CELL 00 PRECHECK-KEY          PASS      N models; claude-opus-5 present=true; claude-haiku-5-5 present=true
CELL 01 COMPACTION-SUMMARY    PASS      compaction event fired, summary NNN chars. input_tokens=NNNN
CELL 02 ATTRIBUTION           PASS      N marker occurrence(s), N distinct: [Daedalus responded] …
CELL 03 CANCEL-MIDSTREAM      RECORDED  abort() called after 1 text event(s), did not throw. …
CELL 04 TOOL-USE-ROUND        PASS      stop_reason=tool_use, 1 tool_use block(s), …
CELL 05 HAIKU-UNGATED-BETA    RECORDED  API ACCEPTED|REJECTED betas:['compact-2026-01-12'] for claude-haiku-5-5 …
```

Four states, and the difference between the last two is the point:

- **PASS / FAIL** — the cell had a gradeable subject and graded it.
- **RECORDED** — the cell ran and the result is informative either way. Cells 03 and 05 are like
  this on purpose: *either* answer from cell 05 is a finding, so calling one of them "fail" would be
  pre-judging it.
- **REFUSED** — the cell could not run and says why. **A REFUSED cell is not a pass.** Cell 02
  refuses when cell 01 produced no summary, because there is then nothing to grade; it prints the
  exact re-run instruction.

The exit code carries only *did any cell FAIL*. The verdict line carries the rest.

## 3. The one thing that would silently spoil the sitting, and the guard against it

Writing this probe, I drove it in my own worktree and it resolved **`@anthropic-ai/sdk` 0.110.0** —
while `packages/server/package.json` pins **`^0.122.0`**. `node_modules` is gitignored and
per-worktree, so an agent worktree can be minors behind the pin and nothing says so. A recording
taken there would have been filed as "the pinned baseline" and been two minors off.

So the probe now reads the pin from source, reads the installed version from the resolved
`node_modules`, prints both in its header, and **aborts** if they disagree:

```
VERDICT/1 ABORT reason=sdk-pin-mismatch installed=0.110.0 pin=^0.122.0 cells=0
```

`KLATCH_ALLOW_SDK_MISMATCH=1` records a deliberate off-pin run; the header still says what it was.
Graded both ways: the guard fires on 0.110.0 (`drive1-pin-mismatch.out`) and does not fire on
0.122.0 (`drive2-pin-ok-nokey.out`, which falls through to the no-key abort).

## 4. The deliberate divergence from `client.ts`, declared

`client.ts:908` sets `trigger: { type: 'input_tokens', value: 160000 }`. The probe uses **2000**.

This is Round 427's option (C). The reason is Round 427's measurement: the in-repo corpus yields
~197k characters of request content, roughly 44k–66k tokens — short of 160 000 by 2.4×–3.7×. Getting
a real trigger needs a ~720 000-character channel that does not exist yet, so the first sitting
lowers the trigger instead and asks the cheaper question: *does the beta surface still work at all?*

The refinement over Round 427: a standalone probe sets **its own** trigger and does not edit
`client.ts`, so it does **not** redden `__tests__/round17-compaction-effort.test.ts:40`, which pins
the `160000` literal in source. Everything else in the request — `betas`, the edit `type`, the
`instructions` string, `thinking`, `cache_control`, `max_tokens` — is copied verbatim and checked
against source (§5 leg group 2).

**What this costs us:** a lowered trigger exercises the same server-side compaction path but not the
same *amount* of history, so it cannot speak to behaviour that only appears at a real 160k-token
context. It is a baseline, not a closure. The item stays open after this sitting; what it gains is
that we stop guessing whether the surface works.

## 5. What was verified without a key, and what was not

`verify-request-shapes.mjs` → `verify-request-shapes-sdk0122.out`,
**`SHAPES/1 ALL-WELL-FORMED caret_legs=11 caret_fail=0 shapes=5 shape_401=5 shape_fail=0 src_legs=6 src_fail=0 src_refused=0 sdk=0.122.0`**, exit 0.

Three leg groups:

1. **11 legs on the pin comparator**, exercising all three answers it can give — 3 `true`,
   5 `false`, 3 `CANNOT-JUDGE`. The `CANNOT-JUDGE` legs matter most: an unmodelled range form
   (`~0.122.0`), an unreadable pin and an unresolvable version each have to refuse rather than pass,
   or the guard would be green exactly when it knows least.
2. **5 request shapes sent to the live API with a deliberately invalid key**, all five returning
   **401 `authentication_error`** at SDK 0.122.0. **Declared limit:** the API authenticates before it
   validates the body, so a 401 proves the request is constructed and transmitted — it does **not**
   prove the body would be accepted. That is why group 3 exists.
3. **6 source legs** comparing the probe's request against `client.ts` where a bad key cannot
   reach: the `instructions` string occurs **exactly 1×** in `client.ts` (140 chars, byte-identical),
   `'compact-2026-01-12'` 1×, `'compact_20260112'` 1×, `max_tokens` 16384 both sides, and the source
   trigger literal still reads **160000** — which keeps §4's divergence claim honest rather than
   assumed. Plus a **control**: a one-word mutation of the instructions string occurs **0×**, so
   leg 1's method is shown capable of answering no.

**Not verified, and only the sitting can:** whether compaction fires, whether the summary preserves
the markers, what a mid-stream abort does end-to-end, whether a tool-use round's input parses, and
what the API does with the beta on Haiku. Those are the five questions. They need the key.

## 6. What cell 05 is for

`capabilities.compaction` is declared once, written twice and **read zero times** in non-test source
(Theseus Round 418 §4, confirmed in Daedalus's tree). The beta gate at `client.ts:894`, `:1091`,
`:1151` branches on **channel provenance alone** — so an imported channel holding a Haiku entity
sends `betas: ['compact-2026-01-12']` for a model `round13-models-api.test.ts:187` pins as
non-compaction-capable. Whether the API minds has never been checked.

Both answers are findings, which is why the cell is `RECORDED` and not `PASS`/`FAIL`:

- **ACCEPTED** → the unread field costs nothing on this path today, and threading model capability
  into the gate drops in priority.
- **REJECTED** → every imported channel holding a Haiku entity is already broken in production, and
  it becomes the most urgent thing in this file.

## 7. Files

| file | what it is |
|---|---|
| `klatch-capability-test.mjs` | the probe xian runs |
| `verify-request-shapes.mjs` | the keyless harness, runnable by anyone right now |
| `drive1-nokey.out` | keyless refusal, before the pin guard existed |
| `drive1-pin-mismatch.out` | the pin guard firing at 0.110.0 (known positive) |
| `drive2-pin-ok-nokey.out` | the pin guard not firing at 0.122.0 (control) |
| `verify-request-shapes-sdk0122.out` | the 22-leg keyless verification, exit 0 |
