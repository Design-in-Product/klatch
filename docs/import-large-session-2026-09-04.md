# Importing a Piper Morgan department head — Round 150

**Author:** Theseus · **Date:** 2026-09-04 (WORK fire) · **Instrument:** `scripts/probe-import-large-session.mts`
**69 checks, 3 failed, 0 skipped. Zero model calls. `git diff --stat -- packages/` empty; `klatch.db` mtime and size unchanged; both config roots read-only.**

## Why this fire

Browse now walks two config roots (`4602561`, Daedalus, Round 149). With
`KLATCH_EXTRA_SESSION_ROOTS=~/.claude-pm` set, Browse returns 593–594 sessions across 92
projects at 9 ms warm, all eleven of Janus's department heads included.

Every one of those numbers is about **browse**. Janus asked for "one deliberate look before
xian drives it"; Daedalus wrote it down twice as still open, in his memo to me and in his note
to xian:

> the import path is untested at that size and I did not test it this fire — the largest
> session import has been run against is 604 messages, and the smallest PM file is an order of
> magnitude past that.

Browse reads a fingerprint. Import parses every event, materialises turns, and writes rows.
Different code paths, different costs, and only one of them had been measured. This is the
other one, at the HTTP endpoint, against the real files.

## Headline

**Three of the eleven department heads cannot be imported at all.** They are over the 50 MB
import cap, they are offered in the browse list the user picks from, and the endpoint refuses
them in 5 ms with `File too large (70MB). Maximum is 50MB.`

The other eight import cleanly and fast — **3.15 s for all eight**, 273 MB of JSONL, 6–7 ms/MB,
and reading one back afterwards costs 26 ms. Size is not the problem. **The cap is.**

## Finding 1 — 3/11 heads are offered and cannot be imported

| head | size | lines | importable |
|---|---|---|---|
| docs | **70.3 MB** | 40,514 | **no — over cap** |
| lead | **59.9 MB** | 21,919 | **no — over cap** |
| comms | **51.8 MB** | 29,493 | **no — over cap** |
| web | 45.3 MB | 26,498 | yes |
| cio | 42.2 MB | 22,441 | yes |
| pa | 37.4 MB | 23,011 | yes |
| host | 35.4 MB | 21,882 | yes |
| ppm | 32.7 MB | 20,581 | yes |
| arch | 27.9 MB | 17,444 | yes |
| cxo | 26.8 MB | 16,394 | yes |
| exec | 25.8 MB | 13,054 | yes |

`MAX_IMPORT_SIZE = 50 * 1024 * 1024` (`packages/server/src/routes/import.ts:17`). The probe reads
that constant out of the source rather than hardcoding 50, and refuses to run if it cannot find
it — a hardcoded 50 here would keep "passing" after the constant moved and report a boundary
that was no longer the boundary.

**This is new with the second corpus and is not a latent problem on ours.** The largest file on
the shipped root is 34.2 MB, 68% of the cap; 0 of 518 exceed it. On PM's root the largest is
70.3 MB, 141% of the cap. The cap has never bound on anything before because nothing we had was
big enough to reach it.

**Verified at the endpoint, not inferred from the branch:** POST with the 70.3 MB path returns
HTTP 400 in 5 ms with `{"error":"File too large (70MB). Maximum is 50MB."}`. The rejection fires
on `stat.size` before `parseClaudeCodeSession` is called.

**And they are offered.** With multi-root browse on, all three over-cap session ids appear in the
browse payload the import dialog renders. The scanner does not filter by size — correctly, it is
not the scanner's cap. So the user-visible behaviour is: eleven heads listed, three of them error
on click.

## Finding 2 — the cap is refusing files that are cheaper per byte than the ones it allows

The three refused files were parsed in-process with the importer's own parser (no import, no
change to the cap):

| head | size | parse time | parse rate | turns | events |
|---|---|---|---|---|---|
| docs | 70.3 MB | 350 ms | **5 ms/MB** | 135 | 40,514 |
| lead | 59.9 MB | 242 ms | **4 ms/MB** | 370 | 21,919 |
| comms | 51.8 MB | 243 ms | **5 ms/MB** | 108 | 29,493 |

Against **6–7 ms/MB end-to-end** for the eight the cap permits. Parsing is streaming
(`createReadStream` + `readline`), so nothing here loads a file whole.

So the cap is not protecting against a measured cost. **That does not make removing it correct** —
it guards the multipart upload path too, where the body genuinely is buffered
(`arrayBuffer.byteLength`), and that path was not measured here. The honest statement is narrower
than "remove it": *on the path-based route, at 70 MB, the cost the cap would be protecting against
is 350 ms and ~130 MB of transient RSS.* The ruling is Daedalus's and xian's; this supplies the
number it would need.

## Finding 3 — import at this size is fast, linear, and bounded in memory

All eight under-cap heads, imported in descending size order into a scratch DB:

| head | size | wall | rate | rows persisted | peak RSS delta |
|---|---|---|---|---|---|
| web | 45.3 MB | 291 ms | 6 ms/MB | 55 | 131.6 MB (2.9× file) |
| cio | 42.2 MB | 269 ms | 6 ms/MB | 158 | 64.9 MB |
| pa | 37.4 MB | 248 ms | 7 ms/MB | 113 | 4.1 MB |
| host | 35.4 MB | 233 ms | 7 ms/MB | 31 | 0.0 MB |
| ppm | 32.7 MB | 227 ms | 7 ms/MB | 55 | 1.2 MB |
| arch | 27.9 MB | 197 ms | 7 ms/MB | 82 | 0.0 MB |
| cxo | 26.8 MB | 187 ms | 7 ms/MB | 71 | 0.0 MB |
| exec | 25.8 MB | 181 ms | 7 ms/MB | 288 | 0.0 MB |

- **Linear in bytes:** 6–7 ms/MB across 25.8–45.3 MB, spread 1.11×. Nothing superlinear.
- **Not dominated by dedup:** first import 6 ms/MB on an empty DB, last 7 ms/MB with seven
  channels already present.
- **Total to onboard the importable cast: 3,152 ms.**
- **RSS deltas after the first are ~0** because V8's heap is already sized; the 131.6 MB on the
  first import is the real high-water mark, ~2.9× the file. Read the first row, not the average.
- **Read-back is not a second wall:** `GET /channels/:id/messages` 4 ms / 0.4 MB;
  `?include=artifacts` — the call the client actually makes — **26 ms / 4.5 MB / 5,218 artifacts**;
  `/stats` 200.

**Janus's sizing question is answered: no, 40k-line files do not break import.** The only thing
that breaks is the byte cap, and it is a constant, not a behaviour.

## Finding 4 — new data on an already-ruled question, not a new bug

Browse's `messageCount` versus rows actually persisted, for the same eight files:

| head | browse `turnCount` | browse `messageCount` | rows persisted | overstatement |
|---|---|---|---|---|
| web | 29 | 9,652 | 55 | **175×** |
| cio | 81 | 7,822 | 158 | 50× |
| pa | 58 | 8,183 | 113 | 72× |
| host | 17 | 7,599 | 31 | **245×** |
| ppm | 29 | 7,000 | 55 | 127× |
| arch | 41 | 5,862 | 82 | 71× |
| cxo | 37 | 5,192 | 71 | 73× |
| exec | 146 | 4,012 | 288 | 13.9× |

**This is not a new defect.** Daedalus ruled on it in Round 147
(`docs/browse-count-vs-persisted-rows-2026-09-03.md`): the residual is zero, no user event is
lost, every collapsed assistant event survives as an artifact, and the count is simply in the
wrong unit. He shipped `turnCount` for the right unit and left the label to Iris.

**What is new is the magnitude on the corpus that matters.** He measured 1.9× and 3.3× and wrote
that the error "swings with how tool-heavy the session was." On PM's corpus it swings
**13.9×–245×** — two orders of magnitude past anything measured before, because these are
scheduled agent sessions that are almost entirely tool traffic.

`ImportDialog.tsx:759` renders `messageCount` today. So with `KLATCH_EXTRA_SESSION_ROOTS` set,
xian sees **"7599 msgs"** next to the `host` head and gets a channel with **31 messages**.
`turnCount` predicts it correctly: the scanner's documented bound — *persisted rows ≤ 2 ×
turnCount* — **holds on all 8 heads**, checked here against the second corpus for the first time.

That is an input to Iris's labelling call, which Calliope confirmed is unblocked today. It is
hers to decide; this is the number to decide against.

## Corroborations and small notes

- **`lead` parses to 370 turns** — exactly the max `turnCount` I reported for PM's corpus in
  Round 148, from a different instrument. Independent agreement on the same file.
- **The `docs` head is now 40,514 lines**, against 40,458 measured this morning (Round 148) and
  40,397 recorded by Daedalus before that. **+117 lines in one day, against a live file.**
  Headroom under `FINGERPRINT_LINE_CAP` (50,000) is **23.4% and still falling**. Same phenomenon
  Daedalus hit from the other side when his cross-arm equality check went green by luck: this
  corpus does not hold still.
- Browse reported **594** sessions this fire, against Daedalus's 593 and my 592 yesterday. Drift,
  not disagreement.
- **No source was patched.** Unlike Round 148, this probe needed no `getClaudeProjectsDir()`
  rewrite: import is path-based and `validateImportPath` accepts any absolute non-traversing path,
  so the second corpus is reachable directly. Arm B gets multi-root browse from the env var
  Daedalus shipped. Arm G asserts the empty `packages/` diff rather than trusting the claim.

## Open, and deliberately not closed here

1. **The multipart upload path at these sizes was not measured.** It buffers
   (`arrayBuffer.byteLength`), so it is the path where a byte cap plausibly earns its keep. Any
   ruling on `MAX_IMPORT_SIZE` needs that number and this fire does not have it.
2. **What the three over-cap heads should do instead of erroring** is a product decision, not a
   measurement. Options exist (raise the cap, cap only the upload path, stream-import) and I am
   not choosing between them.
3. **Rendering quality was not assessed.** A 5,218-artifact channel returns in 26 ms; whether it
   is *readable* in the client is Iris's question and I did not open a browser.
4. **The cold-figure gap from Round 148 is still open** — Daedalus proposed the specific
   discriminating run (re-run arm B with arm A's second-root read removed). Not done this fire;
   this unit was the one xian would hit first.
