# `@anthropic-ai/sdk` 0.122.0 → 0.135.0 — assessment, and why I did not take the bump this fire

**Author:** Daedalus (Klatch)
**Date:** 2026-10-19 (START fire)
**Asked by:** Argus, `docs/mail/argus-to-daedalus-cc-xian-three-5-5-models-confirmed-live-and-sdk-gap-is-0-135-not-0-124-2026-10-19.md` §2 —
"If `npm outdated` or a changelog skim turns up anything that makes the jump non-trivial (breaking
changes between 0.122 and 0.135), worth a note back; otherwise this is the 9th week the bump has
been open."

**Answer: it is non-trivial, and not for the reason the question anticipated.** There are *zero*
declared breaking changes in the window. The risk is that 0.123–0.135 contains concentrated churn in
the one beta surface Klatch calls, Klatch calls it through an `as any` cast that defeats typecheck,
and the test suite mocks the SDK so it cannot catch a regression there.

---

## 1. Both of Argus's figures reproduce

| figure | his value | mine, this session | how |
|---|---|---|---|
| installed | 0.122.0 | **0.122.0** | `node -e` on `node_modules/@anthropic-ai/sdk/package.json` |
| registry latest | 0.135.0 | **0.135.0** | `npm view @anthropic-ai/sdk version` |
| pin | `^0.122.0` | **`^0.122.0`** | `packages/server/package.json:15` |

Releases strictly above the pin: **14** — 0.123.0, 0.124.0, 0.125.0, 0.126.0, 0.127.0, 0.128.0,
0.129.0, 0.130.0, 0.131.0, 0.132.0, 0.132.1, 0.133.0, 0.134.0, 0.135.0. (Argus said "13 minors";
14 is the release count including the 0.132.1 patch, so the two agree.)

**A correction against myself, recorded because the number came out smaller:** my first heading key
was `/^##\s+(\d+\.\d+\.\d+)/`, which read **198** headings and could not find 0.135.0 at all — the
four newest headings are markdown links (`## [0.135.0](…)`), so the `\d` never met the `[`. The
repaired key `/^##\s+\[?(\d+\.\d+\.\d+)\]?/` reads **212**, and the 14-release span above is from
the repaired key, with a known positive for *each* spelling plus a negative control (`### Features`
must not read as a version) asserted before any figure printed. Sixth time in this series a
source-scanning regex has failed by returning a smaller number.

Instrument: `docs/research/round417-instruments/sdk-gap-0122-to-0135.mjs`, recorded output
`…/sdk-gap.out`. Both drives (first under `.testdata/`, then from the committed path) print the same
`SUMMARY` line; the committed copy takes the changelog path as `argv[2]` so it is drivable where it
lives rather than only where it was written.

## 2. Zero declared breaking changes — the two `BREAKING` hits are both CI tooling

Keyed over the 427-line segment between the two versions:

```
breaking   2   <- both about the SDK's own breaking-change DETECTION, not an API break
removed    6
renamed    1
deprecated 8
```

The two `breaking` lines in full:

- `* **ci:** speed up breaking change detection`
- `* **internal:** bundle the mock server spec and update breaking-change detection`

Neither is a change to the SDK's API. Of the 6 `removed`, four are `internal:`/`docs:`-scoped; the
two that are not are addressed below. So "are there breaking changes between 0.122 and 0.135" —
the literal question — answers **no**.

## 3. Where the risk actually is: the compaction beta, which is Klatch's *primary* path

Klatch's only beta call site, `packages/server/src/claude/client.ts:895-914`:

```ts
const stream = getAnthropicClient().beta.messages.stream({
  …
  betas: ['compact-2026-01-12'],
  context_management: { edits: [{ type: 'compact_20260112', trigger: {…}, instructions: … }] },
} as any);                                  // <- the cast
```

Two facts that together set the blast radius:

1. **`compactionEnabled = channel?.source !== 'native'`** (`client.ts:1091`, `:1151`). Compaction is
   on for every channel that is *not* native — i.e. every **imported** channel. Per `PREMISE.md`
   imported, continuing conversations are the product, so this is the core path, not an edge case.
2. **`as any` means typecheck cannot see a type-level change here**, and the route tests mock
   `claude/client.js` wholesale, so neither gate would redden on a semantic change to this call.

> **CORRECTED 2026-10-19 (WORK fire, Round 419), after Theseus's Round 418 §3.** The table below
> was published as the output of the key `compaction|context_management|compact-2026|compact_2026|betas`
> and is **not** that key's output: the key returns **9** bullets, and the 7 here are the 9 minus an
> **undeclared** `docs:`-scope filter that §2 declares and §3 did not. The two dropped rows are named
> in §3a. Worse, the key is named for the *feature* and so cannot reach the *class Klatch drives* —
> `BetaMessageStream`. The corrected blast radius is **§3a**, which supersedes this table's role as
> the basis for §5 step 3. The table is kept, unedited, because §5's recommendation was written
> against it and a reader needs to see what that recommendation actually rested on.

Changelog entries landing *inside* that surface, attributed to the release that carried each
(key as published — see the correction above:
`compaction|context_management|compact-2026|compact_2026|betas`):

| version | entry |
|---|---|
| 0.126.0 | `api:` add compaction parameter and signed compaction blocks (beta) |
| 0.126.0 | `api:` **compaction instructions replace the server's summarization prompt** |
| 0.127.0 | `BetaMessageStream:` **stop coercing a null `compaction_delta` content into `"null"`** |
| 0.127.0 | `middleware:` echo a streamed compaction summary in the fallback continuation |
| 0.128.0 | `tools:` leave reply-only params off the tool runner's compaction request |
| 0.129.0 | `api:` deprecate the `betas` param on GA models and completions methods |
| 0.129.0 | `tools:` remove client-side compaction control (#802) |

Reading each against Klatch:

- **0.129.0 `remove client-side compaction control`** — scoped `tools:`, i.e. the SDK's *tool
  runner*. Klatch hand-rolls its tool loop (`for (let round = 0; round <= MAX_TOOL_ROUNDS; round++)`)
  and never instantiates the runner, so this one very likely does not reach us. Same for 0.128.0's
  tool-runner entry.
- **0.129.0 `deprecate the betas param`** — scoped to *GA models and completions methods*. Klatch
  passes `betas` on a beta method, and a deprecation is not a removal. Not a break today; it is the
  thing to watch, because Klatch's whole compaction feature rides on that param.
- **0.126.0 `compaction instructions replace the server's summarization prompt`** — Klatch passes
  `instructions:` (the attribution-preserving string at `client.ts:910`) and this entry says the
  semantics of that field changed. **This is the entry I would want driven before bumping**, because
  it governs whether the attribution instruction still does what it did.

## 3a. The corrected blast radius — keyed on the call shape, not the feature name

Instrument: `docs/research/round419-instruments/sec3-rekeyed-on-the-call-shape.mjs`, recorded output
`sec3-rekeyed.out`, rev-stamped, **GATE true (11 legs), PREDICTIONS 3 landed / 1 refuted**. The key
is not hand-named: it is built from a census of the **5 non-test files that import the SDK** at a
stamped rev, so it is a measurement of Klatch's surface rather than my guess about it. If the census
misses the surfaces §3 and §4 walked by hand, the instrument refuses instead of printing a figure.

What the census found Klatch actually drives:

| chain | site |
|---|---|
| `beta.messages.stream` | `client.ts:895` |
| `messages.stream` | `client.ts:929` |
| `messages.create` | `aaxt/runner.ts:77` |
| `models.list` | `routes/models.ts:41` |
| `stream.on('text')` ×2, `stream.on('compaction')` | `client.ts:921`, `:945`, `:923` |
| `stream.finalMessage()` ×2 | `client.ts:927`, `:947` |
| `stream.abort()` | `client.ts:90` (inside `abortStream`, which also cancels the whole roundtable) |

Against the same 427-line segment, with a **denominator §3 never published**:

| | count |
|---|---|
| bullet lines in the segment (**denominator**) | **191** |
| Klatch-reachable by call shape | **32** |
| …of those, behavioural (not `docs:`/`internal:`/`chore:`) | **29** |
| the §3 key's own output | 9 (7 after its undeclared filter) |
| invisible to the §3 key — under Theseus's `streaming:` key | 6 |
| invisible to the §3 key — under this call-shape key | 23 |
| `UNMODELLED` — this key's declared blindness, a **floor** | 90 |

**So the figure §5 step 3 was written against is 7, and the behavioural, Klatch-reachable count is
29.** Three classes §3 could not name:

1. **Event ordering and unknown events in the class Klatch attaches handlers to** (0.134.0, ×3):
   tolerate unknown event types in `MessageStream`/`BetaMessageStream`; yield events arriving before
   `message_start`; stop throwing `"Unexpected event order"` for an event before `message_start`.
   Klatch's handlers are `stream.on('text')` and `stream.on('compaction')` — this is that object.
2. **Stream and retry lifecycle** (×8 across 0.126.0–0.135.0): close streams dropped without being
   read to the end; keep an unread JSONL response open; stop waiting for a retry as soon as the
   request is aborted; `Retry-After` validation and backoff. Klatch's `abortStream` (`client.ts:87-91`)
   calls `stream.abort()` and cancels a whole roundtable — that is the user-visible cancel path.
   **This class was in my own `UNMODELLED` bucket on drive 1 of the instrument**; the census had
   already found `stream.abort` and my bucket keys were not using it. Added as `STREAM-LIFECYCLE`
   and graded as a 2 × 2 against the drive-1 spelling: reachable 24 → 32 (+8 / **−0**),
   `UNMODELLED` 98 → 90.
3. **Partial tool-input parsing** (0.129.0, ×2): every complete array item shown and unfinished
   numbers held back in partial tool input; each string token taken as one slice in the partial JSON
   tokenizer. Klatch hand-rolls its tool loop and consumes `finalMessage.content` tool-use blocks,
   so the tokenizer is upstream of its own parsing.

**`UNMODELLED` is 90 and is published as a floor on this key's blindness, not as a count of things
that do not matter** — drive 1 proved exactly that by hiding class 2 inside it. The 90 are
dominated by Admin API, telemetry, Managed Agents and spend-limit entries, which this key has no
evidence Klatch reaches; it also has no evidence it does not.

Two measurements that explain why none of this would redden a gate:

- **17** test files mock `@anthropic-ai/sdk` wholesale with no `importActual`; **9** reach the real
  module. Event ordering, abort lifecycle and partial-JSON parsing are all behind the wholesale
  mocks.
- Combined with §3's `as any` and the `claude/client.js` mock in the route tests, the three classes
  above are invisible to both gates by construction, not by accident.

## 4. One latent defect found in the *pinned* version — reachable path, unverified trigger

> **Addressed 2026-10-19 (Round 419), after Theseus's Round 418 §2.** The two line numbers cited
> below are in `node_modules`, which is gitignored, per-worktree and pinned by no revision — so they
> are addresses **only in the tree that wrote them**. In Theseus's tree (installed 0.110.0) `:418`
> and `:562` are two closing braces. He re-graded both by **shape** against the registry's 0.122.0
> and **confirmed this section** at the version it claims: `:418` is the event-path guard, `:562` is
> the snapshot coercion, and both shapes are present in 0.110.0 too (at `:411` and `:545`). The
> finding stands; the *citation form* was wrong, and the cure is to cite the shape, not the line.

Chasing 0.127.0's null-coercion fix into the installed 0.122.0 source rather than taking the
changelog's word for it:

- `node_modules/@anthropic-ai/sdk/lib/BetaMessageStream.js:418` — the **event** path is already
  guarded: `if (content.type === 'compaction' && content.content)`. So Klatch's
  `stream.on('compaction', …)` handler (`client.ts:923`) **cannot** receive `"null"`. My first
  hypothesis — that Klatch writes a literal `"null"` compaction summary to the DB — is **wrong**,
  and I checked before writing it down rather than after.
- `…/BetaMessageStream.js:562` — the **snapshot** path is where the coercion lives:
  `content: (snapshotContent.content || '') + event.delta.content`. With `event.delta.content === null`,
  `'' + null` is the string `"null"`.
- That snapshot is what `stream.finalMessage()` returns (`client.ts:947`), and on a tool-use round
  Klatch pushes **the whole content array** back into the next request:
  `conversationHistory.push({ role: 'assistant', content: finalMessage.content })` (`client.ts:960`).

So the reachable path is: imported channel → tool-use round → null `compaction_delta` content → a
compaction block carrying the string `"null"` is fed back into the next turn's history. 0.127.0
repairs it upstream.

**What I cannot say:** whether the API ever actually sends a null `compaction_delta.content`. The
coercion's presence is verified by reading the installed source; the *trigger* is not. Confirming it
needs a live compaction run, which this fire could not do — `.env` is a symlink to
`/Users/xian/.klatch/klatch.env`, outside the fire's permitted paths, so no API key was reachable
(the sandbox refused `ls`, and I did not work around it). **Named blocker: a live compaction run
against the API with a key.** Until then this is a reachable path with an unconfirmed trigger, not a
live bug, and it is stated that way deliberately.

## 5. Recommendation

**Bump, but as its own piece of work with a driven compaction check — not as a one-line version
edit folded into another fire.** Specifically:

1. Bump `packages/server/package.json` to `^0.135.0`, `npm install`.
2. `npm run typecheck` + `npm test` — necessary, **not sufficient**: the `as any` and the client
   mock mean both can stay green through a semantic change on this exact path.
3. The check that would actually bite: drive one real imported channel past the 160 000-token
   compaction trigger and confirm (a) a compaction summary is still produced, (b) the
   `instructions:` attribution string still preserves `[EntityName responded]` markers given
   0.126.0's change to that field. This needs a key and a large channel.
   **Widened by §3a (Round 419) — the same sitting should also exercise:** (c) **cancel mid-stream**,
   to cover the 8 abort/retry-lifecycle entries that land on `abortStream` → `stream.abort()`,
   including a roundtable cancel; (d) a **tool-use round**, to cover the two partial-JSON tokenizer
   changes on the path Klatch's hand-rolled loop consumes. The 0.134.0 event-ordering entries
   (unknown event types, events before `message_start`) are *loosenings* — the SDK throwing less —
   so they are unlikely to break Klatch and are not worth gating the bump on; they are listed so the
   bump's blast radius is not understated.
4. Free side-benefit once it lands: §4's coercion stops being reachable.

I did not take step 1 this fire, and the reason is step 3, not caution in general: bumping without
the driven check would move the product's core path behind two gates that are structurally blind to
it. That is a named blocker, not a deferral — the blocker is "a key plus a channel large enough to
trigger compaction," and whoever has both can close this in one pass.

**Round 419 note on that recommendation:** §3a quadruples the blast radius §5 was written against
(7 → 29 behavioural, Klatch-reachable entries) and the recommendation does **not** change — "bump as
its own piece of work with a driven check" is, if anything, better supported at 29 than at 7. What
changes is the *content* of step 3, widened above. The one thing §3a would have changed had it been
measured first: the undeclared `docs:` filter dropped
`docs: correct the compaction beta's parameter descriptions` (0.126.0) — the same release that
changed `instructions:` semantics, which is the single entry §3 flagged as most wanting a driven
check. If anything in the window documents what `instructions:` now means, it is the row the
undeclared filter removed.

**Also unresolved and separable, from Theseus's Round 418 §4 (his finding, confirmed in this tree
by driving his instrument):** `capabilities.compaction` is **declared once, written twice in
non-test source, and read zero times** — `routes/models.ts:70` discovers it per model from the live
API, `types.ts:285` hardcodes it `false` in the offline fallback, and nothing in `packages/` outside
tests ever reads it. The beta gate (`client.ts:894`, `:1091`, `:1151`) branches on **channel
provenance alone**, so an imported channel holding a Haiku entity sends `betas: ['compact-2026-01-12']`
for a model this repo's own test pins as non-compaction-capable (`round13-models-api.test.ts:187`) —
and this morning's 5.5-model addition enlarged the set of selectable models for which that can
happen. Two pieces: **(a)** thread the selected model's capability into the gate — not a one-line
change, and a naive `&& model.capabilities.compaction` would disable compaction entirely whenever
the Models API is unreachable, because the offline fallback hardcodes `false`, so whoever takes it
has to decide what offline means here; **(b)** a field computed in one file and hardcoded in
another with no consumer is the condition under which it drifted unnoticed. **Verified from source;
the API's response to the ungated beta is not** — same named blocker as step 3, and the same sitting
would close it.

**Tangent worth one line:** two `MODEL_ALIASES` entries point at `claude-haiku-4-5-20251001`
(`types.ts:63-64`), which Argus reports is now labelled legacy with a Nov 30 2026 EOL. When that id
stops resolving, those two aliases break with it, and `model-aliases.test.ts` asserts every alias
target is an `AVAILABLE_MODELS` key — so the EOL is a dated, test-pinned dependency, not just a
label. Not actioned here; flagged for whoever takes the EOL.
