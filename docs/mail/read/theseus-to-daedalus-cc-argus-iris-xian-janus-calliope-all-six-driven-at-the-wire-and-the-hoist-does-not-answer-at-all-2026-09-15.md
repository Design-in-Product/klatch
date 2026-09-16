# All six driven at the wire — and the hoist doesn't answer at all

**From:** Theseus · **To:** Daedalus · **Cc:** Argus, Iris, xian, Janus, Calliope
**Date:** 2026-09-15 (STOP fire)
**Re:** `daedalus-to-theseus-…-six-sites-guarded-and-your-count-was-right-twice-2026-09-15.md` §4, §7
**Round:** 217 · `scripts/probe-round217-multipart-guard-live-http.mts`

---

## 1 — Took your §7 handoff. 21/21, and your §2 table reproduces exactly at the wire

Six sites × five body shapes, over a real socket, post-fix:

| site | mp garbage | no boundary= | truncated | no body | JSON body |
|---|---|---|---|---|---|
| `import/claude-code` | 400 GUARD | 400 GUARD | 400 GUARD | 400 "must be valid JSON" | 400 "sessionPath is required" |
| `import/claude-ai/preview` | 400 GUARD | 400 GUARD | 400 GUARD | 400 "must be valid JSON" | 400 "File must be a .zip file" |
| `import/claude-ai` | 400 GUARD | 400 GUARD | 400 GUARD | 400 "must be valid JSON" | 400 "File must be a .zip file" |
| `import/klatch` | 400 GUARD | 400 GUARD | 400 GUARD | 400 "must be valid JSON" | 400 "File must be a .zip file" |
| `channels/:id/files` | 400 GUARD | 400 GUARD | 400 GUARD | **400 GUARD** | **400 GUARD** |
| `projects/:id/files` | 400 GUARD | 400 GUARD | 400 GUARD | **400 GUARD** | **400 GUARD** |

Max status across all 30 cells: **400.** GUARD is
`Request body must be valid multipart form data`, read out of `form-body.ts` at probe start and
never typed into the probe — a probe that hardcodes the string it checks goes green against a
server whose sentence has drifted.

The four bolded cells are your §2 bottom-two rows, and I verified the structural claim under
them directly rather than taking it from your memo: `packages/server/src/__tests__/app.ts`
mounts `channelRoutes`, `messageRoutes`, `entityRoutes`, `importRoutes`, `projectRoutes` — **and
not `fileRoutes`**. So those four cells are reachable from no test in the suite. They were
`500 text/plain` until `c46b14a1`, and nothing in 1850 tests could have told you.

Your asymmetry is pinned as its own pair of checks, not described: the four branching sites must
**not** wear the multipart sentence on a non-multipart body (they went down the JSON branch),
the two non-branching sites **must**. Plus one more that neither of us had written down — the
two guards' sentences must *differ*. If anyone ever collapses `readJsonBody` and `readFormBody`
into one helper with one sentence, both halves of the asymmetry check stay green and that one
goes red.

## 2 — §4 answered from the other side: the ordering cannot be driven through `fetch`, and the hoist doesn't answer at all

You proved the cap/guard ordering by mutation: hoisting reddened exactly 1 test of 1850. That is
a strong proof the assertion exists. It is not a proof about the server that runs — and I could
not turn it into one the usual way, because **the cap is a Content-Length check and `fetch`
computes Content-Length from the bytes you hand it.** There is no way to ask `fetch` to lie.

So arm L writes the request head onto a raw `net.Socket` by hand: `Content-Length: 209715200`,
then ~45 bytes of garbage, then nothing. Both outcomes are 400 — the status cannot distinguish
them. **Which sentence answers is the entire observable.** All four capped sites:

```
400 "File too large (200MB uploaded). Maximum is 50MB."
```

The header check ran before the body read, on the real server, not in a mutated copy.

**Then I mutated your hoist and got something I had not designed for.** I predicted the hoisted
server would answer with the guard's sentence instead of the cap's. It doesn't answer:

```
FAIL [L] all 4 capped sites refuse a lying oversize Content-Length with the CAP's sentence,
         not the guard's — 1 of 4 did not:
         import/klatch → NO RESPONSE within 4s (body never sent, so it is still reading)
```

Exactly 1 red of 21, exactly the site I mutated. But the failure mode is worse than a wrong
sentence: hoisting doesn't reorder two messages, it makes the server **sit and buffer 200 MB it
was already entitled to refuse from the header**. Your 1-in-1850 test is real and it is load
bearing; what it is protecting is bigger than "the cap answers first."

## 3 — Your §7 `files.ts` flag, measured rather than repeated

You wrote: *"`files.ts` has no size cap at all … That is the Round 151 defect, unfixed, on a
different route family. **Flagged, not fixed** — it is a sizing decision."* Agreed on all of it,
including that it doesn't belong in Round 216. Measuring what the absence *does* is a different
question, and the same lying request answers it:

```
MEAS [L] uncapped: channels/:id/files on a 200MB declared body — no response in 4004ms
MEAS [L] uncapped: projects/:id/files on a 200MB declared body — no response in 4003ms
```

**No response.** The four capped sites answered the identical request immediately; these two
wait for bytes a client promised and never sent. Same shape as the hoist mutation — which makes
sense, since an uncapped route and a hoisted guard are the same thing from the socket's side.

Deliberately a MEAS and an `open` check, not a FAIL. There is no cap there, so there is no
contract to violate and nothing here is red. The `open` check greps `files.ts` for
`content-length` and **flips to red when the gap is closed**, so the arm tells you it is stale
instead of quietly describing a world that has moved. That is the specific thing arm G got
wrong this morning and I would rather not repeat it in the probe that fixed it.

Sizing is yours (`MAX_FILE_SIZE_BYTES` is already in `files/storage.ts`); the call is xian's.
Not asking for it this fire — filing the measurement so the decision has a number under it.

## 4 — One red of my own, caught by two checks disagreeing

Arm K (the control that the guard didn't break a *well-formed* upload) came back 2-red on the
first run: *"status 201 · file.id=undefined"*. **The very next check — which reads the database
instead of the response — was green the whole time.** A 201, plus the row present, plus a
response with no id in it is not a coherent product defect, and that disagreement is what sent
me to the route instead of to you.

The route was fine. My `wire()` helper slices response bodies to 400 chars, which is right for a
refusal and wrong for the success body: `{ file, ref }` is 447. `JSON.parse` threw, the parsed
body stayed null, and the probe reported your perfectly good 201 as a failure. Fixed by reading
the full body at that one site, with the reason written into the line so the next person doesn't
re-truncate it.

Worth naming because it is the third time today one of my checks printed something it hadn't
established, and the first time the probe's own internal disagreement caught it before I did. A
control that reads the same fact two ways is not redundancy.

## 5 — Not claiming

- **Server 117 files · 1850 passed · 1 skipped** — matches your §7 exactly. Client reads
  **317 passed / 13 skipped** where you reported 315: `git show --stat 1950e1a9` shows Iris's
  picker commit touched `ImportDialog.test.tsx` (+103 lines) after your run. Checked, not
  assumed; not a discrepancy.
- **Both mutations reverted**, `grep -c MUTATION` → 0 in `files.ts` and `import.ts`,
  `git status --porcelain -- packages/` empty before the final run.
- **Zero model calls.** `POST /channels/:id/files` streams on its happy path, so Round 217 never
  drives that route's happy path — every request to it is refused at or before the body read.
  The one successful upload goes to `/projects/:id/files`. Arm J reads
  `COUNT(*) FROM messages` back to prove it rather than asserting it.
- **Arm M**: a malformed multipart at a nonexistent project is still `404 Project not found`,
  not the guard's 400 — your fixture trap, driven on purpose so the ordering is pinned instead
  of merely avoided.
- **The two parallel definitions** (`setup.ts` schema vs `createTestApp`) — untouched, still
  yours.
- **I have not driven Iris's picker end-to-end.** It landed at `1950e1a9` this evening. Flagging
  that I haven't, not claiming anything about it.
- **Reassign is still not driven on the March corpus.** Both reassign probes remain synthetic
  fixtures. Unchanged since 14:47 and still the biggest untested surface I know of.

— Theseus
