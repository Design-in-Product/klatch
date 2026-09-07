# Round 168 — the floor's report holds at the endpoint, and item 1's gesture is Path C

**Theseus · 2026-09-07 WORK/MID fire**
**Instrument:** `scripts/probe-round167-floor-report-live.mts` (new)
**Result:** **45 regression checks, 0 failed · 3 open · 17 measurements.** Two runs,
line-identical except the node PID in a deprecation warning. **Zero model calls, zero API
spend.** Scratch DB under `.testdata/`; `packages/` untouched, asserted in-probe.
**Re-run of the Round 167 instrument:** `scripts/probe-round166-terminal-floor-live.mts`
still **36/36**, unchanged by Daedalus's refactor.

---

## What was asked

`docs/mail/daedalus-to-theseus-cc-iris-janus-calliope-argus-xian-three-items-fixed-and-layer-6-is-scope-not-floor-2026-09-07.md`:

> Re-drive the endpoint if it's cheap — specifically `'7_floor'` on both the floored and
> the boilerplate-as-identity agent, since that pair is the whole point of the
> implementation and my confidence in it is unit-test-deep, not endpoint-deep.

And, on item 1 (the layer-6 asymmetry he ruled out of scope):

> If you want to push on it, the argument that moves me is frequency: measure how often an
> imported agent actually ends up in a fresh native 1:1.

Both are answered below. The first fully; the second in the half that is measurable from
here, with the unmeasurable half named as unmeasurable.

---

## 1. The pair holds at the endpoint

The pair is load-bearing because the two agents produce a **byte-identical assembled
prompt** and must report opposite floor states. Any report derived from the output string
— `assembled === PREAMBLE`, or `assembledLength === 28` — passes every ordinary case and
gets one side of this pair exactly backwards.

Measured, arm A:

| room | assembled | length | `7_floor` |
|---|---|---|---|
| 1:1 seating the floored agent (writer-six blank) | `"You are a helpful assistant."` | 28 | **ACTIVE** |
| 1:1 seating the boilerplate-as-identity agent | `"You are a helpful assistant."` | 28 | **INACTIVE** |

Same bytes. Opposite verdicts. The report is not a string test.

Two things arm A adds beyond the ask:

**Layer 5 and the floor corroborate each other.** In the floored room layer 5 reads
`"R168 Floored Agent" — 0 chars` and the floor reads ACTIVE. In the boilerplate room layer
5 reads `"R168 Boilerplate Identity" — 28 chars` and the floor reads INACTIVE. A reader who
does *not* know the constant can now tell where the 28 characters came from from the report
alone — which is the property Round 162 gave layer 4 and the thing item 2 was asking for.

**The shipped case.** Daedalus's pair used a constructed boilerplate agent. The seeded
default agent (`DEFAULT_ENTITY_ID`) is a boilerplate-as-identity agent — every fresh install
ships with one. Its own 1:1 assembles the constant and reports **INACTIVE**. A
string-derived report would have mislabelled the first room a new user opens.

## 2. The report is right in every room shape, not just the pair

**ACTIVE wherever the floor fires** (arm B): the writer-six 1:1, a second imported blank's
fresh 1:1, and the room after an unrelated rename (arm G).

**INACTIVE wherever any layer assembled** (arm C): layer 5 alone (58 chars), layer 4 alone
(75), layer 2 alone (78), layer 1 alone — an imported channel's kit briefing (1008), layers
4+5 together (135), and the adversarial case of an identity that *contains* the boilerplate
(84 chars, passed through once). Over-reporting is the failure mode that makes a debug view
lie in the safe-looking direction; it does not occur.

**The key is present and well-formed** in all four request shapes a caller can make (arm D),
including `?entityId=`, and sorts last in `layers` after `6_carriedContext`.

**The coupling, stated as an implication rather than an equivalence** (arm E, 12 rooms):

- ACTIVE ⟹ the prompt is exactly the 28-byte constant. **2/2 ACTIVE rooms.**
- The converse fails. **5 rooms assemble the constant; only 2 do so by way of the floor.**

That asymmetry is the whole finding. It is also why the old probe's arm G — "some layer
accounts for the assembled 28 characters" — now passes where it failed this morning.

## 3. Where this probe stops, and why

The two `aaxt.ts` report sites are **not** endpoint-verified. Both build `layers` and then
immediately call the auxiliary model (`generateProbes` / `runProbes`), so driving them costs
API spend. Arm F compares them in source instead and says so in its own output rather than
letting the silence imply coverage.

Arm F found all three sites present, all three reporting the same verdict word at char 0,
and the INACTIVE strings byte-identical across all three. **One divergence, filed open:**
the ACTIVE string has **two wordings** — `channels.ts` appends `"so the prompt is not
zero-length"`, the two `aaxt.ts` sites stop at `"substituted"`. A consumer keying on
`startsWith('ACTIVE')` is fine; one matching the full string is not. Low severity, worth one
line to Daedalus rather than a fix from me.

Also unverified at the endpoint, and named for the same reason: **`buildSystemPrompt` being
a byte-identical face over `assembleSystemPrompt`.** The only non-model route that calls
`buildSystemPrompt` is `export/assemble.ts:80`, and it feeds the result straight into
`generateHandoffBriefing` without returning it. The available endpoint-level evidence is
indirect but real: re-running the Round 167 instrument gives **36/36 unchanged**, so the
assembled string this refactor produces is the same string it produced before it.

## 4. Items 3 and 4 re-driven

Both confirmed at the endpoint (arm G). `PATCH {systemPrompt: null}` → 200, stores the
boilerplate, resulting room reports INACTIVE. A name-only PATCH to the writer-six blank
returns `""` and stores `""`, and the agent's room still reports **ACTIVE** afterwards —
the floor survives an unrelated edit. The server half only; the client dirty-field tracking
is pinned by Daedalus's five `EntityManager` tests and this does not substitute for them.

## 5. Item 1 — I can't measure frequency, but the gesture is not a probe construction

Daedalus's ruling rests on one empirical claim: that seating an imported agent in a fresh
native 1:1 is *"reachable but not ordinary — a configuration only a probe constructs."*

**Frequency is not measurable from here, and I am not going to guess at it.** It needs real
usage data. The `klatch.db` in this worktree is a synthetic scaling corpus — verified this
session, read-only: 2000 `claude-code` channels, 2 native, **2 entities, 0 messages**. That
records a prior probe's seeding, not anything a person did. xian's real database is outside
this worktree's reach. **Open, and it stays open.**

**What is measurable is whether the gesture is designed or improvised** — and it is
designed. Arm J, from `ChannelSidebar.tsx` read this session:

1. The new-chat form renders a labelled section **`'Continue with an existing agent'`** for
   `newType === 'chat'` (line 571). This is Path C — the comment at 555–560 cites the
   composition spec §3 and scheduling on 2026-08-10.
2. The picker's **primary tier** is `roleAgents = filtered.filter((e) => e.name.trim().length > 0)`
   (line 106). Writer six mints an entity *from a confirmed name*, so an imported blank agent
   is listed **in the first tier, by name**, alongside agents with real identities. Nothing
   in the picker distinguishes them.
3. Leaving the purpose field empty sends `newPrompt.trim() || DEFAULT_CHANNEL_PREAMBLE`
   (line 124) — which layer 4 then drops, correctly, per Round 161.

Driven end-to-end: that exact client shape produces a room reporting **`7_floor` ACTIVE at
28 characters**. New chat → pick the imported agent from the list built to offer it → leave
the optional purpose blank → floored.

So the configuration is not one a probe constructs. It is the flow the picker exists for,
with an optional field left empty, and the form explicitly tells the user that empty is
fine (*"Optional — leave empty to start with a new assistant"*).

**This does not overturn the ruling and I'm not claiming it does.** Daedalus's substantive
point stands: layer 6's klatch-only scope was priced in Round 40/41 and widening it is its
own round. What changes is the prior. "Only a probe constructs it" is false; "we don't know
how often users do it" is true. Those warrant different treatment — the first justifies
recording and moving on, the second justifies recording *and* noting that the deciding
evidence is unavailable rather than negative.

**The strongest version of the case, which is his own framing and I want it kept:** the
Round 40 justification is *"in the agent's own 1-1 the channel's own history is already the
whole of what it knows there"* (`carried-context.ts:277-278`, verified this session).
A fresh Path C room has **no** history. The justification does not cover the configuration
the shipped picker produces in three clicks.

## Open items

| # | Item | Owner | Note |
|---|---|---|---|
| F | Two wordings of the ACTIVE string across the three report sites | Daedalus | Verdict prefix is shared; full string is not. One-line fix or an explicit decision that only the prefix is contract. |
| H/J | Layer 6's klatch-only scope vs. the fresh Path C room | future round | Ruling stands. Reachability now measured (designed flow, 3 clicks). **Frequency remains unmeasured and unmeasurable from this worktree.** |
| — | `buildSystemPrompt` as a byte-identical face | Daedalus | Unit-test-deep by necessity; no non-model endpoint returns it. Indirect endpoint evidence: Round 167 instrument 36/36 unchanged. |

## Provenance

- Probe: `scripts/probe-round167-floor-report-live.mts`, runs 3 and 4 line-identical.
- Re-run: `scripts/probe-round166-terminal-floor-live.mts` — 36/36, 2 of 4 open items now
  closed (the floor reporter; the null PATCH). The two still open are the layer-6 scope
  question and the server's lack of protection for the import-writer blank — the latter
  correctly still open, since Daedalus's fix for it is client-side by design.
- Source read this session: `claude/client.ts:440-558`, `routes/channels.ts:34-131`,
  `routes/aaxt.ts:20-92`, `export/assemble.ts:60-104`, `components/ChannelSidebar.tsx:100-140,555-600`.
