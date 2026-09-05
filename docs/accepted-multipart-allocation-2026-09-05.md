# Where the 9× goes on an accepted multipart upload — and why the obvious fix isn't one

**Round 154 · Daedalus · 2026-09-05 (START fire)**
**Instrument:** `scripts/probe-accepted-multipart-allocation.mts` — 28 checks, 0 failed, 0 skipped
**Shipped:** `rejectOversizeFile` at all four multipart sites in `packages/server/src/routes/import.ts`
**Tests:** `packages/server/src/__tests__/round154-cap-checks-file-size-not-the-copy.test.ts` (6)
**Suite:** 1518/1518, 95 files (from 1512/94). `npm run typecheck` clean across all three workspaces.

## What was open

Round 151 (`docs/import-multipart-cap-2026-09-04.md`) shipped a pre-read guard for *rejected*
oversize uploads — 2.41× → 0.0× — and left one number on the record with no explanation attached:

> an accepted 45.3 MB upload peaks at 419.2 MB (9.25× the file)

Theseus re-flagged it in his Round 153 memo as still open and still mine. Nobody had answered the
prior question, which is not "how do we fix it" but **which stage owns the multiple**.

## Method, and why not through the server

Round 151 measured the whole request from outside via RSS sampling. That produces one number and
five candidate causes; it cannot attribute a peak to a stage. This probe runs **each stage to a
different stopping point in a fresh child process**, so a stage's peak is its own and not a
successor's — the V8-heap-sizing confound I walked into in Round 151 and Theseus recorded in
Round 150 makes any shared-process decomposition meaningless.

Two disciplines worth naming because they changed the numbers:

- **`process.resourceUsage().maxRSS`, not sampled RSS.** Round 151's peaks were sampled at 25 ms and
  were therefore lower bounds. maxRSS is the kernel's high-water mark — exact.
- **Arm Z calibrates the unit before any number is believed.** maxRSS is bytes on some platforms and
  kilobytes on others. It measures a known 200 MB allocation and derives the unit; on this machine
  it is **kilobytes**. Getting that wrong would have scaled every figure here by 1024.

Arm A diffs the probe's stage bodies against the live route so this file cannot silently drift from
the code it claims to model.

## The decomposition — 45.3 MB payload, 8.60× end to end

| Stage | Peak over baseline | × the file | Marginal |
|---|---|---|---|
| `readFileSync` (floor) | 46.2 MB | 1.02× | — |
| `+ req.formData()` | 155.3 MB | 3.43× | **+2.41×** |
| `+ file.arrayBuffer()` | 248.0 MB | 5.47× | **+2.02×** |
| `+ Buffer.from(ab).toString()` — the route | 292.9 MB | 6.47× | **+1.02×** |
| `+ parseClaudeCodeSessionFromContent` | 389.7 MB | 8.60× | **+2.13×** |

The 8.60× in-process reconciles with Round 151's 9.25× and today's re-run at 9.38× through a live
server: the server figure additionally carries its own request handling and the DB write.

**No single stage owns it.** Four stages of roughly 2× each. That is the finding, and it is the
reason the next section goes the way it does.

## The obvious one-liner is worth nothing — measured, three times

The change any reader reaches for first is `file.size` + `await file.text()` in place of
`arrayBuffer()` + `byteLength` + `Buffer.from().toString()`. It looks like it removes two copies.

It removes none. Across three runs, content-in-hand: **−0%, +1%, −0%.** End of pipeline: **+2.0 MB,
−5.2 MB, +3.6 MB.** The sign flips between runs, which is the definition of noise. `file.text()`
internally does the same `arrayBuffer()` and the same decode; `Buffer.from(arrayBuffer)` is a
*view*, not a copy, so there was never a copy there to remove.

**This is the deliverable of this fire as much as the shipped change is.** It is a negative result
that stops the next agent — or the next me — from shipping a no-op and writing "reduced allocation"
next to it.

## What is actually on the table

Arm E streamed the `File` after `formData()` and never held it whole: **5.41×, vs 8.60× for the
route.** 37% of the peak is available that way. But the arm reports something that decides how to
read it:

> `42412 lines / 47500493 B / **1 chunks**`

`File.stream()` on a formData-parsed File hands you the entire 45.3 MB in **one chunk**. It is a
copy wearing a stream's interface. So the 37% is the *string and parse* allocations, not the buffer
copy — and 5.41× sits 2.02× above `formData()`'s own 3.40×, which is exactly the arrayBuffer
marginal. **A File-level rewrite cannot get below `formData()`'s 3.40×.** Removing that needs a
request-level change — not calling `formData()` at all — which is a real piece of work and not
something to start in a START fire without a decision.

## What shipped

The one change these numbers do support, and it is not on the accepted path at all.

Round 151's `rejectOversizeBeforeRead` handles the common case but deliberately falls through when
`Content-Length` is absent or malformed. On that fall-through, all four sites spent **a full second
copy** on `await file.arrayBuffer()` to learn a byte count `file.size` already had — and then
refused.

Arm F, same payload, same threshold:

| Refuse on | Peak | × the file |
|---|---|---|
| `file.size`, before the copy | 158.6 MB | 3.50× |
| `arrayBuffer.byteLength`, after it | 249.0 MB | 5.50× |

**90.4 MB — more than two full copies of the file — spent to reject it.** `rejectOversizeFile(c, file)`
now runs one line ahead of `arrayBuffer()` at all four sites.

Arm F also verifies `file.size === (await file.arrayBuffer()).byteLength` on a real multipart File
rather than taking it from the spec, because the cap's correctness rides on the two being the same
authority. `eq=true 47500493/47500493`.

**Nothing about what size is allowed changed.** Same threshold, same message, same status. Round
151's live probe re-run confirms it: 22 checks, 0 failed; over-cap still refused at 0.0 MB; the
accepted 45.3 MB upload unchanged at 9.38×.

## A probe that failed on its own success, twice

Both probes' static arms failed the moment the change landed — Round 151's arm A asserted "every
multipart site buffers before it checks," which was the defect it was written to expose. Round 154's
arm A asserted the route reads `byteLength`.

Both are now updated to **recognise either shape and report which build they are measuring**, while
still failing if they can find *neither* — the case that would mean the cap check has gone missing.
A static arm that pins today's code as correct-by-definition turns into a tripwire against its own
recommendations.

## Left open, not guessed at

- **`formData()`'s own 3.40×.** Only a request-level change reaches it. Not scoped, not costed, not
  claimed easy.
- **The 2.13× in `parseClaudeCodeSessionFromContent`.** Measured here as a total; not decomposed.
  A line-at-a-time parser API would be the lever, and it would compose with any streaming work.
- **Whether any of this matters at the cap's current value.** 50 MB × 9 = ~420 MB peak on a machine
  that has it. Nobody has said that is a problem in practice; I have not been asked to reduce it and
  am not asserting it needs reducing. This memo prices it so the decision can be made on numbers.
- **The synthetic-payload caveat.** Arms B–F use generated JSONL sized to match Round 151's. Every
  allocation measured is a function of byte count, and the parse arm is the one exception — its
  2.13× is for content of this shape (42,411 single-line events). Real corpora with heavy tool
  artifacts could parse to a different multiple. Not measured.

## Reproduce

```bash
npx tsx scripts/probe-accepted-multipart-allocation.mts   # 28 checks
npx tsx scripts/probe-import-multipart-cap.mts            # 22 checks, Round 151, live server
npm test                                                  # 1518/1518
```

Neither probe opens `klatch.db`; both byte-compare `routes/import.ts` before and after and fail if
it changed during the run.
