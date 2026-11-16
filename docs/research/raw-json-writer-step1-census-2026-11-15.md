# Step 1 of the raw-JSON ruling: which probes actually make a live model call

**Theseus, 2026-11-15 (STOP fire).** First step of the item I claimed this fire: xian's 2026-09-28
ruling (*"Yes that's fine"*, via Janus) that live-round per-run JSONs should be committed under
`docs/research/raw/roundNN/` rather than living only in the disposable scratch DB. Board:
`docs/operations/attention-rollup.md:209-211`. **Unbuilt 48 days**; verified absent this fire
(`ls docs/research/raw` → no such directory; one `grep -rln "research/raw"` hit across `scripts/`,
`packages/`, `docs/plans/`, and it is the plan doc that proposed it).

**Why a census and not a module first.** A writer with no call site is dead code. The ruling's
population is "live rounds" — so the thing that has to be established before any writer exists is
*which probes actually make a model call*, and that is a measurement, not a design choice.

## §1 The headline: the detector already existed, and mine was wrong three ways

I hand-rolled a key —
`ANTHROPIC_API_KEY|messages\.create|@anthropic-ai/sdk|api\.anthropic\.com|api/messages` — and got
**17 files**. Then I found `scripts/promote-probes.mts` already carries a `model` detector in its
`DETECTORS` map (line ~165), comment-blanked so prose cannot vote, and **two-sided validated against
known positives by `probe-round285`**, with its own prose documenting two prior corrections to
itself.

The authoritative reading, `npx tsx scripts/promote-probes.mts --list`:

```
promote-probes — 155 probe files · 45 SWEPT · 110 DEFERRED
  not driven (db): 81
  not driven (net): 55
  not driven (homedir): 29
  not driven (model): 12
  not driven (suite): 12
```

**12**, not 17. My key's three errors, each a named pattern this corpus has already measured:

1. **A substring match on a longer token.** `messages\.create` matched
   `inspect-klatch-db.mjs:128`'s `` `  messages.created_at  ${r.lo} .. ${r.hi}` `` — a column name in
   a console format string. Same family as the `rel`-matches-`unrelated` defect in my own
   `unit-466striplift` `A-lim2` this morning, and as Daedalus's `bba2aa3c` matching
   `[A-Za-z_$][\w$]*` this afternoon. Third instance in one day.
2. **Prose voted, and so did a deliberate absence.**
   `probe-round223-twenty-one-probes-against-a-stranger.mts` matched on a *comment* (line 298) and on
   line 301, `delete env.ANTHROPIC_API_KEY` — a probe that exists precisely to run **without** a
   model call matched a key for making one. The sign is inverted, not merely noisy.
3. **The instrument was captured as a subject.** `promote-probes.mts` matched because line 165
   *contains the detector regex itself*: `/\b(Anthropic|ANTHROPIC_API_KEY|messages\s*\.\s*create)\b/`.
   An instrument does not census its own source, and mine counted the very file whose answer I
   should have been reading.

**The lesson, stated as the mechanism and not as a scolding of myself:** a hand-rolled source key is
*cheap to write and reads as plausible*, and 17-vs-12 is close enough that neither number looks
wrong on its face. What separated them was not care — it was that one of them had been validated
against known positives by a committed probe and the other had been typed ten minutes earlier.
`scripts/lib` and `promote-probes.mts` get read **before** the next detector, not after.

## §2 What the live-round population actually looks like

Two sets, and `--list` names only the second:

- **12 probes classified `model` from their own source.** `--list` reports the count, not the
  members. **Declared limit: I have not named these 12**, and nothing below should be read as if I
  had.
- **6 named INADMISSIBLE**, inheriting `[model]` through a literal drive of
  `probe-round230-a-killed-probe-must-not-leave-its-server.mts` rather than owning the call:
  `probe-path-c-chat-binding-live.mts`, `probe-round162-preamble-drop-and-roster-live.mts`,
  `probe-round164-layer5-terminality-live.mts`, `probe-round166-terminal-floor-live.mts`,
  `probe-round167-floor-report-live.mts`, `probe-round213-reassign-live-http.mts`.

**The `-live` suffix on all six is the relevant signal:** these are the carried-context and
layer-assembly rounds the ruling was written about. The detector's own distinction — *owns a model
call* vs *drives something that does* — is exactly the distinction a writer has to respect, because
the per-run JSON exists in the **inner** process and the round's published document is written by the
**outer** one.

**Declared limit, load-bearing:** `12 + 6 = 18` is **not** asserted. `--list` does not name the 12,
so I cannot show the two sets are disjoint, and the six are flagged by a *different* rule (spawn
closure) than the twelve are counted by. Anyone quoting a single live-round population figure off
this document is quoting something I did not measure.

## §3 What this makes the next step, concretely

1. Get the 12 named — either a `--list` flag that prints members per detector class, or read the
   classifier's selection directly. **Not** by re-deriving the class with another hand key.
2. Decide the writer's seam from the owns-vs-drives split above, not from the probe filenames: the
   JSON has to be written where the reply object exists.
3. Only then the writer, with its call sites in the same commit — and a unit test that does not need
   a live call, since the ruling's end-to-end exercise does.

**Blocker status:** steps 1–3 have **no blocker**. The end-to-end exercise of a live round needs real
model calls, which a non-interactive fire cannot make; that is a limit on *verifying* the writer
against a real round, not on building or unit-testing it. Named here so it cannot later be used as a
blocker for the whole item.

— Theseus
