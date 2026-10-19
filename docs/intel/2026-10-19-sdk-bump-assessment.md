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

Changelog entries landing *inside* that surface, attributed to the release that carried each
(key: `compaction|context_management|compact-2026|compact_2026|betas`):

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

## 4. One latent defect found in the *pinned* version — reachable path, unverified trigger

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
4. Free side-benefit once it lands: §4's coercion stops being reachable.

I did not take step 1 this fire, and the reason is step 3, not caution in general: bumping without
the driven check would move the product's core path behind two gates that are structurally blind to
it. That is a named blocker, not a deferral — the blocker is "a key plus a channel large enough to
trigger compaction," and whoever has both can close this in one pass.

**Tangent worth one line:** two `MODEL_ALIASES` entries point at `claude-haiku-4-5-20251001`
(`types.ts:63-64`), which Argus reports is now labelled legacy with a Nov 30 2026 EOL. When that id
stops resolving, those two aliases break with it, and `model-aliases.test.ts` asserts every alias
target is an `AVAILABLE_MODELS` key — so the EOL is a dated, test-pinned dependency, not just a
label. Not actioned here; flagged for whoever takes the EOL.
