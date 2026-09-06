# Theseus session log — 2026-09-06 (MID fire)

Worktree: `/Users/xian/Development/klatch-worktrees/theseus` · branch `claude/theseus-cycle`

Earlier fire today: `docs/logs/2026-09-06-1047-theseus-opus-log.md` (Round 161).

---

## 14:47 PT — MID fire (Round 163). Briefing.

Synced at `0684043`. Read `docs/COORDINATION.md` (my section: Round 161, status available) and
`docs/mail/`. One new memo addressed to me:

- `daedalus-to-theseus-iris-cc-janus-calliope-argus-xian-your-arm-e-fix-would-not-have-fixed-it-2026-09-06.md`
  (Round 162, commit `aeef9f2`). Corrects my Round 161 arm-E routing: I sent the generic-preamble
  fix to Iris as a one-line client change; the substitution is server-side
  (`channels.ts` writes the same string when `systemPrompt` is absent), so the client fix would
  have changed the request body and nothing the model sees. He fixed it in assembly instead —
  `DEFAULT_CHANNEL_PREAMBLE` + `isDefaultChannelPreamble()` in `shared`, `buildSystemPrompt`
  layer 4 skips it, all three prompt-debug L4 reporters follow. Also hoisted the roster dedup so
  `entityIds: [X, X]` is 201-with-one-seat on a chat, matching the klatch.

**The routing correction is right and I accept it.** I checked `channels.ts:201` in the pre-change
tree (`git show 717bfb6:packages/server/src/routes/channels.ts`) rather than taking it on his word;
the line is `systemPrompt?.trim() || 'You are a helpful assistant.'`, server-side, exactly as he
says. My arm E measured the string correctly at the endpoint and then attributed it to the wrong
layer — the instrument was right and the routing was mine.

**Choosing the work unit.** Round 162 is code shipped three hours ago against consequences *I*
measured, verified by 12 unit tests and a negative control. Same shape as Round 161: the tests are
real but they are not the endpoint. And this time there is a specific claim to check, because his
memo and doc title both assert a *population*: "the fix reaches the imports too," and §2 point 1
says imported channels are "*exactly* the 'real identity at layer 5' case where the generic line
contradicts something."

That is a checkable claim about stored data, not about assembly. Taking it.

## 15:05 PT — Source read before writing any probe

- `git show aeef9f2` — five files: `shared/src/types.ts` (+39), `claude/client.ts` (+13),
  `routes/channels.ts` (+24), `routes/aaxt.ts` (+13), one new test file (+175).
- `client.ts:482` — layer 4 is now
  `if (channelPreamble?.trim() && !isDefaultChannelPreamble(channelPreamble)) parts.push(...)`.
- `types.ts:108` — `DEFAULT_CHANNEL_PREAMBLE`; the predicate trims before comparing.
- `channels.ts:194` — `distinctEntityIds = [...new Set(entityIds)]`, counted by the guard
  *and* passed to `createChannel`, so the guarded value and the used value cannot drift.
- `queries.ts:1292-1294` — **`importSession` writes `''` as `system_prompt`.** Not the
  boilerplate. That is the claim to test.
- `import/klatch-import.ts:264` — a **third** channel-insert path I missed on my first
  grep (I searched only `db/` and `routes/`). Writes `layer4 || ''`.
- `routes/entities.ts:81` — `systemPrompt?.trim() || 'You are a helpful assistant.'`. Same
  substitution, on the *entity*, at a layer the new predicate does not touch.
- `aaxt/probe-generator.ts:66` — `TRIVIAL_CONTENT_THRESHOLD = 40`, applied per layer via
  `LAYER_SPECS`, which includes `5_entityPrompt`.

Four hypotheses:

- **H1** — the fix holds at the endpoint and the control numbers land where Daedalus
  predicted (bound chat loses 30 chars, default 1:1 58 → 28).
- **H2** — the assembly fix covers a channel that already carries the stored string,
  without rewriting the row. This is his *stated reason* for fixing in assembly.
- **H3** — imported channels store `''`, so they were never affected and the fix does not
  reach them. Contradicts the memo's named population.
- **H4** — an entity created with a blank prompt puts the same 28 chars at layer 5, which
  the predicate does not filter.

## 15:35 PT — Probe built and run. Three full runs.

`scripts/probe-round162-preamble-drop-and-roster-live.mts`. Nine arms (A, E, F, G, H, I,
J, K, L, Z). Zero model calls — every assembly arm reads `/prompt-debug`; `/aaxt-probe`
and `/aaxt-run` deliberately **not** called, because both generate probes with the
auxiliary model, and arm L checks those two reporters by source identity instead with the
probe header saying so. Scratch DB under `.testdata/round162-preamble-drop/`; `klatch.db`
never opened. `git diff --stat -- packages/` captured before and after and asserted equal
in-probe (arm Z) — empty both times.

**30/30 regression · 1 open arm still open · 12 measurements.** Runs 2 and 3 compared
line-by-line after normalising entity UUIDs: 46 result lines each, identical.

### H1 confirmed — the fix holds, and his number is exact

Bound chat **97 → 67 chars**, generic line absent, identity at char 0. Default 1:1
**58 → 28** — the number Daedalus predicted. L4 reporter `EMPTY — default purpose, not
sent`. Layer 5 correctly *not* filtered, asserted rather than assumed (an over-reach would
have produced a zero-length prompt). Dedup verified on the wire including the ordering he
called refactor-fragile. Predicate boundaries tight across five cases — a purpose merely
*starting* with the string survives at `ACTIVE — 44 chars`.

Promoted Round 161's arm E from `open` to `regression`. A re-introduction now fails a
probe instead of needing to be re-noticed.

### H2 confirmed — arm G, the one that mattered

Wrote the boilerplate straight into an existing channel row via a second connection,
bypassing the create route entirely. Assembly dropped it; the bound agent's identity was
the whole prompt; the row came back byte-identical. His stated reason for fixing in
assembly rather than at creation is now verified at the endpoint rather than argued.

### H3 confirmed — the memo's named population was never affected

```
what an imported channel stores as its purpose — "" (length 0)
the L4 reporter on an imported channel        — "EMPTY"
```

`''` is falsy after trim, so layer 4 skipped imports before Round 162 as well. Checked the
history rather than the current line: `684de9e`, the first import implementation, has the
same literal. The reporter correctly distinguishes "nothing was written" (`EMPTY`) from
"boilerplate was written and dropped" (`EMPTY — default purpose, not sent`).

**Framing corrected while writing it up, in his favour:** this does not weaken the
argument for fixing in assembly — arm G proves that argument directly. It relocates the
population from imports to *native* channels, which is larger and which a creation-time
fix would have missed entirely. What it removes is the illustration, not the reasoning.

### H4 confirmed — the string moved rather than left

An entity created with no prompt stores the identical 28 chars; a chat bound to it
assembles to exactly the 28 chars Round 162 removed, from layer 5. Routed to Daedalus
**explicitly not as a defect** — there is a real argument it is correct, since layer 4 was
wrong because it *contradicted* an identity and here it is the only identity there is.
What I put in front of him is that the convention is now enforced in one of the two places
the server writes it. AAXT exposure there is already covered by the Round 28 threshold,
which I checked rather than assumed.

### Arm F — unchanged, still xian's

`INACTIVE — carried context applies to klatches only` in the bound 1:1 against
`ACTIVE — 1978 chars carried from "Piper Morgan"'s other channels` in a klatch seating the
same agent. By accident of fixture ordering this run illustrates it better than Round 161
did: the channel the klatch carried *from* is the imported one from arm H. The system read
an imported 1:1's history into a klatch and would not read it back into a 1:1.

### Deliverables

- `scripts/probe-round162-preamble-drop-and-roster-live.mts`
- `docs/research/round163-round162-at-the-endpoint-the-fix-holds-but-not-for-imports-2026-09-06.md`
- `docs/mail/theseus-to-daedalus-cc-iris-janus-calliope-argus-xian-162-holds-at-the-endpoint-but-imports-were-never-affected-2026-09-06.md`
- COORDINATION.md Theseus section: Round 163 status, 161 demoted to Prior.

### Mail

Replied in the same fire the memo was read. Pushed to `main` in its own commit ahead of
the work commit, per the worktree mail rule.

Moved to `docs/mail/read/`: my own Round 161 outbound, which Daedalus answered in full.
**Left open, deliberately:** his Round 162 memo and my Round 163 reply — they carry live
items (Iris's four client literals and her `entityId`, the `entities.ts:81` question now
back with Daedalus, and arm F with xian). Also left `daedalus-to-iris-...-path-c-built-two-copy-calls-are-yours`
alone; Iris has open calls on it and it is not mine to close.

### One correction to myself

Mid-fire I read "two channel-insert paths" off a grep scoped to `db/` and `routes/`. There
are three — `import/klatch-import.ts:264` is the klatch-package path. Caught before it
reached the doc; written down in both the doc and the memo because the same scoped-grep
mistake is easy to repeat.
