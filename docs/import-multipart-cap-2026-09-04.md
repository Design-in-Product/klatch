# The import cap does not guard what the multipart code says it guards

**Round 151 · Daedalus · 2026-09-04 (STOP fire)**
**Instrument:** `scripts/probe-import-multipart-cap.mts` · **Tests:** `packages/server/src/__tests__/round151-multipart-cap-rejects-before-read.test.ts`
**Answers:** the item Theseus left open and named as mine in `docs/import-large-session-2026-09-04.md`:

> "That is not an argument for removing it — it also guards the multipart upload path, which
> genuinely does buffer (`arrayBuffer.byteLength`), and **I did not measure that path.**"

Measured. The multipart path buffers, as he said. But the cap is not what stops it, and could not be.

---

## 1. The finding

`MAX_IMPORT_SIZE` is checked against `arrayBuffer.byteLength` at four multipart sites. That reads
as if the cap prevents the allocation. It does not: `c.req.formData()` reads the entire body
before any line of handler code runs, so by the time the cap is evaluated the memory is already
spent.

The discriminating run: send the **same 70.3 MB** twice, once so it is refused by the cap, once so
it is refused by the `.jsonl` extension check that sits *above* the cap. If the cap were doing the
protecting, the second should be cheaper. It is not — the two are indistinguishable.

| | rejected by | time | peak RSS over baseline |
|---|---|---|---|
| arm C | the size cap | 329 ms | **169.6 MB** (2.41× the file) |
| arm D | the `.jsonl` check, one check *earlier* | 277 ms | **170.5 MB** (2.43× the file) |
| arm E | path-based route (`stat()`) — control | 107 ms | **0.0 MB** |

Moving the refusal earlier in the handler bought nothing, because neither check is what does the
reading. The path-based route, which refuses on `stat()` without opening the file, is the contrast:
same bytes, no allocation.

**What the cap *does* buy on this path** — and this is the part that survives: it stops the
*second* and larger allocation. An accepted upload goes on to `Buffer.from(arrayBuffer)` and
`.toString('utf-8')`, then parses:

| | | time | peak RSS over baseline |
|---|---|---|---|
| arm F | 45.3 MB, under the cap, **accepted** | 633 ms | **419.2 MB** (9.25× the file) |

So the cap is not worthless on multipart — it bounds the 9× case. It just never bounded the 2.4×
case, which is the one the code's shape implies it was for. A 2 GB multipart body was fully resident
before the cap could say no.

## 2. What shipped

`rejectOversizeBeforeRead(c)` in `packages/server/src/routes/import.ts`, called at all four
multipart sites before `c.req.formData()`. It refuses on `Content-Length` alone.

Post-fix, same probe, same payloads:

| | before | after |
|---|---|---|
| arm C — 70.3 MB refused by cap | 329 ms, 169.6 MB | **95 ms, 0.0 MB** |
| arm D — 70.3 MB refused earlier | 277 ms, 170.5 MB | **109 ms, 0.0 MB** |
| arm E — path-based control | 107 ms, 0.0 MB | 116 ms, 0.0 MB (unchanged) |
| arm F — 45.3 MB **accepted** | 633 ms, 419.2 MB | 643 ms, 425.0 MB (**deliberately** unchanged) |

Arm F not moving is the point, not a miss: the guard only refuses what was already going to be
refused. It changes cost, never outcome.

Design notes, because each was a place to get it wrong:

- **`Content-Length` is present.** Not assumed — arm B sniffs the actual request head off the wire
  with a throwaway socket server: `content-length: 2097339` for a 2 MB part. If it is ever absent
  the guard falls through to existing behaviour rather than guessing.
- **A 1 MB envelope allowance.** `Content-Length` covers boundary lines and part headers, not just
  the file (measured overhead: 187 bytes). The guard refuses only above `cap + 1 MB`, so it can
  never refuse a file the exact downstream check would have allowed. The per-file check remains the
  authority.
- **The error says "70MB uploaded", not "70MB".** We measured the envelope, not the file, and the
  message should not claim otherwise.
- **The guard is orthogonal to the cap's value.** It does not change what size is allowed. If xian
  rules the cap up, down, or away, this stays correct.

Suite: **1512/1512, 94 files** (from 1504/93 — the 8 new tests, no regressions). `npm run typecheck`
clean. No existing test covered the size cap at all; these are the first.

## 3. A confound I hit, and got wrong before I got it right

The first run of this probe shared one server across all arms and reported arm D at **1.6 MB** —
and concluded from that "formData() is not buffering the whole part; the cap may still be doing
real work." **That was false.** V8 does not return pages to the OS, so arm D ran against a heap arm
C had already grown to 644 MB; it allocated nothing new because it did not have to. The probe now
starts a fresh server per arm, which is the only thing that fixes it — sleeping does not.

This is the same effect Theseus recorded in Round 150 ("~0 after, because V8's heap is already
sized"), which I had read that morning and still walked into from the other side. An RSS delta is
meaningful only against a cold baseline. The probe's `freshServer()` carries this reasoning in a
comment so the next reader does not have to rediscover it.

## 4. What this does and does not settle for the cap ruling

**Settles:** the "it guards the upload path" argument for keeping the cap at 50 MB was, as written,
not true of the memory it appeared to be about. It is true now — the guard makes it true — but it
was not true when the argument was made, and it is no longer a reason to keep the cap *low*,
because refusal is now free at any value.

**Does not settle:** what the cap's value should be. That is still xian's, and the number that
should drive it is arm F's, not arm C's — the cost of an **accepted** upload, ~9× the file on the
multipart path. At the current 50 MB cap the multipart worst case is roughly 460 MB; admitting PM's
70.3 MB `docs` head would put it near 650 MB. Whether that is acceptable on xian's machine is a
product call, and I am not making it.

**Unmeasured, deliberately:** the 9× multiplier itself is worth attacking — `Buffer.from(...)
.toString('utf-8')` makes a second full copy and a UTF-16 string before the parser sees anything,
and the path-based route avoids this entirely by streaming. Reducing 9× to something near the
path-based route's cost would change the ruling's inputs materially. I did not do it this fire and
am not claiming it is easy.

**Also still open** from Theseus's Round 150 list, untouched here: what the over-cap heads should
*do* instead of erroring (product, not measurement); whether a 5,218-artifact channel is readable
(Iris's); and Round 148's cold-figure gap.

## 5. Reproducing

```bash
npx tsx scripts/probe-import-multipart-cap.mts     # 22 checks, ~90 s, starts/stops its own servers
npx vitest run src/__tests__/round151-multipart-cap-rejects-before-read.test.ts   # from packages/server
```

The probe synthesizes its own payloads into `.testdata/` — no dependency on anyone's corpus, since
every arm it measures happens before any parse and so depends only on byte count. It reads
`MAX_IMPORT_SIZE` out of the source rather than hardcoding it, detects whether the guard is present
and phrases its conclusions accordingly, and guards `klatch.db` by size and mtime (it writes only to
a scratch DB via `KLATCH_DB`).
