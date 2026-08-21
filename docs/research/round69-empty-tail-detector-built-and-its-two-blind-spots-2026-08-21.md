# Round 69 — the empty-tail detector is built, and both of its blind spots are asserted rather than described

**Theseus · 2026-08-21 (WORK fire, 14:47 PT) · zero API calls, zero live runs, no server started**

New: `scripts/lib/recall-call-kind.mjs`, `scripts/verify-empty-tail-detector.mjs`.
Changed: `scripts/probe-recall-tool.mjs` (classifier extracted, detector wired, one additive
run-level field). **Nothing under `packages/` left changed** — one production mutation was run
as a control and reverted; `git diff --stat -- packages/` empty before committing.

---

## 0. What this closes

Round 68 established that the malformed-address error's slot copy, followed literally, is
recorded as `Searched own conversations: ` — an empty-tailed search sitting in the column a
recall arm's primary DV is scored from. Daedalus's 8/21 MID memo §4 assigns the detector to me
and explicitly does not reach for it:

> **Yours, untouched by me:** the empty-tail detector on `Searched own conversations: `.

This is it. It is a scoring-surface change, not a production change, and it costs nothing to
run.

## 1. Why the detector needed a module and a verifier rather than an `if`

The check itself is one comparison. Everything else here exists because of where it sits.

`createToolUseArtifact` (`db/queries.ts:1526`, read this session) writes `input_summary` and
nothing else — the raw `toolInput` is **not persisted anywhere**. So for a probe that reads
settled messages back over REST, the summary string *is* the record of the call, and the
classifier that reads it is load-bearing for every per-call number the arms report.

`probe-recall-tool.mjs` carried that classifier inline: an anchored `EXPAND_SUMMARY` regex and
a `.replace()` for the query. Moving it is an instrument change *between arms of a live
experiment*, which Round 58 refused to accept on argument. So the module ships with a verifier
that certifies two different things, and the distinction matters:

1. **Fidelity to the producer.** Every expectation in the table is checked against the string
   the *real* `toolUseInputSummary` emits for a real tool input — imported, not hand-written.
   If the production wording or `readExpandArg`'s typing moves, this goes red here rather than
   silently in a paid run's scoring.
2. **Inertness of the extraction.** The old inline block is frozen in the verifier and compared
   against the module over all 12 producer-generated cases. `every producer-generated case
   classifies identically — 12 cases`.

## 2. The table, and the two cases that carry the finding

All figures from `npx tsx scripts/verify-empty-tail-detector.mjs`, run this session.

| tool input | summary the producer emits | kind | `noQuery` |
|---|---|---|---|
| `{query: 'depot cipher'}` | `Searched own conversations: depot cipher` | search | false |
| `{expand: {conversation: 'design-review', from: 12, to: 38}}` | `Expanded own conversation: design-review 12–38` | expand | false |
| **`{expand: {conversation: '<name>', from: '<first position>', to: '<last position>'}}`** | **`Searched own conversations: `** | **search** | **true** |
| `{expand: {conversation: 'design-review', from: '12', to: '38'}}` | `Searched own conversations: ` | search | true |
| `{expand: {conversation: 'design-review', from: 12}}` | `Searched own conversations: ` | search | true |
| `{expand: null}` | `Searched own conversations: ` | search | true |
| `{}` | `Searched own conversations: ` | search | true |
| **`{query: ''}`** | **`Searched own conversations: `** | **search** | **true** |
| `{query: '   '}` | `Searched own conversations:    ` | search | false (`blankQuery`) |
| `{query: 'x', expand: {…well-typed}}` | `Expanded own conversation: design-review 1–2` | expand | false |
| **`{query: 'depot cipher', expand: {…slots}}`** | **`Searched own conversations: depot cipher`** | **search** | **false** |
| `{expand: {conversation: 'sprint 3–4', from: 44, to: 73}}` | `Expanded own conversation: sprint 3–4 44–73` | expand | false |

**Row 4 was not in the Round 68 write-up and is the case a model is most likely to produce
unprompted:** numbers as strings. `readExpandArg` rejects `'12'` for the same reason it rejects
`'<first position>'`, and it lands in the same column. The slot copy is one route into the
empty tail, not the route.

### The two blind spots, asserted in the verifier rather than described in prose

- **Row 8.** A model that genuinely calls with `query: ""` produces a byte-identical artifact.
  The detector *cannot* separate a dropped expand from an empty search. It is a marker for
  hand adjudication, not a diagnosis, and the module's docblock says so where the field is
  defined.
- **Row 11.** A dropped expand that *also* carried a query leaves **no empty tail at all**. The
  run reads as an ordinary search and the detector is blind to it. This is the one I would have
  missed by reasoning: it is not a weakening of row 3's claim, it is a second, quieter path
  that nothing currently sees.

Both are in the case table, so if a later change makes either of them detectable the verifier
goes red and someone has to update the claim deliberately.

## 3. The controls, including one that found something

**Everything passed on the first run**, which is when a check is least trustworthy — Round 67's
lesson, applied to my own instrument. Three controls:

**(a) Production mutation, the real chain.** `readExpandArg`'s type check loosened to
`from === undefined || to === undefined`, exactly as last fire.

```
5 FAILURE(S) — do not trust the empty-tail column.
```

Rows 3, 4 and 11 flip, and the run exits 1. Reverted; `git diff --stat -- packages/` empty and
`git status --porcelain` checked before continuing.

**The unlooked-for part.** Under that mutation, row 3's summary becomes
`Expanded own conversation: <name> <first position>–<last position>` — which matches *neither*
form, because the expand regex requires `\d+–\d+`. The module returns `kind: 'unknown'`. The
**old inline block would have returned `kind: 'search'` with the entire prose string as the
query**, handed it to the tokenizer, and scored a lookup as a keyword miss. That is precisely
the confusion the probe's own Round 56 comment says the anchored pattern exists to avoid, one
mode further out — and it turns out the `unknown` branch, which I added for a hypothetical third
recall mode, is reachable from a plausible production edit. It was not a hypothetical.

**(b) and (c), in-script and repeatable.** A detector that never fires must disagree with the
table; a classifier holding a stale prefix must stop recognising searches. Both fire. These are
local stand-ins rather than the imported module, and the script says so: the question a negative
control answers is "would this table notice a broken detector", and for that a broken detector
has to be constructed. What proves the *real* module is under test is the equivalence block,
which imports it.

## 4. Tier two — specified, and deliberately not built this fire

The detector above is necessary-not-sufficient because the artifact is all the probe reads.
**The exact discriminator exists and is free.** Verified by reading the code this session, not
recalled:

- `client.ts:896-903` emits the `tool_use` event with `toolInput: toolUse.input` — the raw,
  model-supplied input, before `readExpandArg` touches it.
- `types.ts:400` declares `toolInput?: Record<string, unknown>` on `StreamEvent`, so it is a
  contract and not an accident.
- `routes/messages.ts:382` forwards emitter events with `stream.writeSSE({ data:
  JSON.stringify(event) })` — verbatim, no field filtering.

So a subscriber to `GET /messages/:id/stream` sees whether `expand` was present-but-rejected,
which separates row 3 from row 8 exactly. The probe does not subscribe: it POSTs and then polls
`GET /channels/:id/messages?include=artifacts` until nothing is `streaming` (`settle()`,
`probe-recall-tool.mjs:200`). The route already handles a late subscriber — it waits for the
emitter to appear and falls back to the DB row — so the race is designed for.

**Not built this fire, and the reason is not effort.** It is a change to the *live* path of a
running experiment, and it cannot be exercised without spend: `--dry` never reaches the live
turn, and there is no offline way to prove the tap actually captures a real `tool_use` frame.
Landing an unexercised live-path change into an instrument whose next use is five opus runs is
the wrong order. If the distance arm is authorised, the tap should be built and validated on
the first arm's first run before its numbers are quoted.

## 5. What changed in the probe, and what deliberately did not

**Changed:**

- Classifier replaced by `readCallKind` from the module. One import, one `.map()`.
- `kind: 'unknown'` joins `'expand'` in the null-scoring branch — tokens, rows, neighbourhood
  and `hitTheAnswer` all `null`, so it cannot be aggregated as a miss.
- A per-call warning line printed **next to the query**, not in a footer, because the thing a
  reader must not skim is that *this row's* empty query may not be a query.
- Run-level `unscorableCalls`, in the console output and in the per-run JSON — the JSON matters
  because a later fire reads a stored run, not the console of the fire that produced it.
- `reconstructionFabricated` on an `unknown` call: the probe does not know which function the
  route called, so its reconstruction is a fabrication. It still renders through the search path
  rather than nulling, because every downstream field reads `c.rendered.*` and a null would turn
  a stale-vocabulary warning into a crash that loses a paid run.

**Deliberately not changed — `hitTheAnswer` stays `false` on an empty query.** Nulling it is
the tempting move and it is wrong here. The two causes are indistinguishable in the artifact, so
`null` would lose information in the genuine-empty-search case; and the field has been scored
this way since Round 56, for a case that could have occurred in earlier rounds without being
labelled. Changing it would be a mid-experiment instrument change to make a flag prettier. The
flag is additive; adjudication is by hand. Same rule `referentAmbiguity` followed at arm L and
`offerChoice` at Round 63.

`kind` did not grow a third *scored* value for the same reason — `unknown` is an
instrument-health state, not an arm outcome, and `lib/offer-choice.mjs` sees it only as
"not an expand", which is what it already did.

## 6. Verified this fire

- `npx tsx scripts/verify-empty-tail-detector.mjs` → **DETECTOR VERIFIED**, exit 0. Under the
  production mutation → **5 FAILURE(S)**, exit 1.
- `npm test` → server **1404 / 1404 (84 files)**, client **239 passed / 13 skipped**. Matches
  Daedalus's 8/21 MID figures exactly, which is how the mutation revert is proved rather than
  asserted.
- `npm run typecheck` → clean across shared, server, client.
- `node --check` on all three touched scripts; the probe itself loaded, resolved the new import
  and ran to its first network call. **No `--dry` run was completed** — `--dry` needs the
  scratch server, and the edited block sits entirely *after* the live turn, so a `--dry` would
  have exercised none of it. Recorded as a limit rather than papered over.
- `git status --porcelain` and `git diff --stat -- packages/` before committing.

## 7. Open

- **The distance arm's go/no-go is xian's** — `F=17, L=20, G=8`, 80 rows, five opus runs.
  **Nothing in this round adds to the case for spending it.** This fire built a scoring surface;
  a scoring surface is not a reason to run an arm.
- Tier-two `toolInput` capture (§4) — mine, specified, unbuilt, and it should be built *with*
  the arm rather than before it.
- Unchanged and still open: per-condition reporting; the K-vs-J miss case; the 0/12
  non-expansion path; the per-run JSON ruling, option (2) and the backfill (all xian).
