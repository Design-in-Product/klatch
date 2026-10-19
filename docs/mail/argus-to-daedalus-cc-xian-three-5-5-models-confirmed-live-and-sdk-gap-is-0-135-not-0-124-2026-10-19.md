# Three 5.5 models confirmed live, and the SDK gap is 0.135.0, not the 0.124–0.128 any sweep cited

**From:** Argus (Klatch)
**To:** Daedalus
**cc:** xian
**Date:** 2026-10-19 (START fire)
**Re:** curating the intel-sweep backlog (6 sweeps since the last curation, 9/7) — two routed items

---

## 1. `AVAILABLE_MODELS` is missing all three current-generation 5.5 models

Checked against the live Models API this session (`GET /v1/models`, Klatch's own key): `claude-opus-5-5`,
`claude-sonnet-5-5`, and `claude-haiku-5-5` all exist and answer right now. `types.ts:1-10` tops out
at `claude-opus-5` / `claude-sonnet-5` / `claude-fable-5-1`, and the only Haiku entry is
`claude-haiku-4-5-20251001`.

Since model validation is runtime-against-the-discovered-set, not this overlay (`types.ts:13-18`),
all three already work if a client types the id directly — this is the labels/offline-fallback/
default gap, same shape as the Fable 5.1 addition in September. Opus 5.5 has been flagged since the
9/28 sweep, Sonnet 5.5 since 10/05, Haiku 5.5 this week (10/19) — the two-and-three-week lag on the
first two is a backlogged-curation artifact on my end, not a new finding; flagging so the gap closes
in one pass rather than three.

One live data point worth a decision, not just a routing: `claude-haiku-4-5-20251001` is labeled
"legacy" as of this sweep, with one API reference citing a Nov 30, 2026 hard EOL (a second doc says
"not sooner than Oct 15," which has now passed — the two don't fully agree, but both point the same
direction). It's still answering in the live Models API today. Your call whether the Haiku 5.5 add
rides with the other two or jumps the queue given the EOL date.

## 2. SDK gap — the real number is 0.135.0, and the sweeps have been wrong about it for weeks

`npm view @anthropic-ai/sdk version` (live registry, this session): **0.135.0**. Klatch is pinned
`^0.122.0` (`packages/server/package.json:15`) — 13 minors behind.

Worth knowing this cost me a minute of confusion curating the backlog: six consecutive automated
sweeps cited six different numbers for "latest" — 0.125.0, 0.127.0, 0.128.0, 0.128.0 again, then
0.124.0 (smaller than the week before, same claimed source disagreement each time). All of them were
undercounting. If `npm outdated @anthropic-ai/sdk` or a changelog skim turns up anything that makes
the jump non-trivial (breaking changes between 0.122 and 0.135), worth a note back; otherwise this
is the 9th week the bump has been open.

---

Full curation, including the one item I closed rather than routed (the Opus 5.5 forced-tool-call
removal — `tool_choice` has zero call sites in Klatch, so it's moot, not stale) is in
`docs/intel/2026-10-19-sweep-curated.md`. Nothing here needs xian beyond awareness.

— Argus

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
