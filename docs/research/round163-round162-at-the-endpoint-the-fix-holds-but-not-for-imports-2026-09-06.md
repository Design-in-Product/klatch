# Round 163 — Round 162 driven at the endpoint: the fix holds, the named population is wrong, and the string moved rather than left

**Theseus · 2026-09-06 (MID fire) · zero model calls, zero API spend**
**Instrument:** `scripts/probe-round162-preamble-drop-and-roster-live.mts`
**Under test:** `aeef9f2` (Daedalus, Round 162) and the claims in
`docs/mail/daedalus-to-theseus-iris-cc-janus-calliope-argus-xian-your-arm-e-fix-would-not-have-fixed-it-2026-09-06.md`

---

## Result

**30/30 regression checks passed · 1 open arm still open · 12 measurements · three
independent full runs, runs 2 and 3 byte-identical modulo entity UUIDs.**

Round 162's fix does what it says at the real HTTP endpoint. Both of my Round 161
consequences are closed in the code, and I have promoted Round 161's arm E from `open`
to `regression` so a re-introduction fails a probe rather than needing to be re-noticed.

Three things the unit tests could not reach, and one of them corrects a claim in the memo.

---

## 1. The fix holds, and the control number lands exactly where predicted

| | Round 161 | Round 163 |
|---|---|---|
| bound chat (Piper Morgan) | 97 chars, generic line at char 0, identity at char 71 | **67 chars, identity alone at char 0** |
| default 1:1 | 58 chars (the sentence, twice) | **28 chars** |
| L4 reporter, bound chat | `ACTIVE — 28 chars` | `EMPTY — default purpose, not sent` |

Daedalus predicted 28 for the default 1:1 in his memo. Measured: 28.

**Layer 5 is correctly *not* filtered.** The default 1:1's remaining 28 chars are exactly
`"You are a helpful assistant."` — the default entity's own seeded prompt
(`db/index.ts:84`), which is character-for-character the same string. A fix that had
over-reached into layer 5 would have produced a zero-length prompt, and that is asserted,
not assumed (`the default 1:1 still carries an identity at layer 5`). *(I measured the
assembled prompt, not the L5 reporter string, on this channel; the L5 reporter was
measured on the arm I channel below.)*

**The predicate's boundaries are tight** (arm K, five cases, all as designed):

| purpose sent | outcome | L4 reporter |
|---|---|---|
| `"You are a helpful assistant. Use TypeScript."` | survives | `ACTIVE — 44 chars` |
| `"  You are a helpful assistant.  "` | dropped | `EMPTY — default purpose, not sent` |
| `"you are a helpful assistant."` (lowercase) | survives | `ACTIVE — 28 chars` |
| `"You are a helpful assistant"` (no full stop) | survives | `ACTIVE — 27 chars` |
| `"This chat is about the parser rewrite."` | survives | `ACTIVE — 38 chars` |

Exact-match-after-trim, no prefix matching, no case folding. The failure mode a
content-matching predicate invites — eating a real purpose that happens to start with the
boilerplate — does not occur.

**The stated reason for fixing in assembly rather than at creation is verified** (arm G).
I wrote the boilerplate directly into an existing channel row via a second connection,
bypassing the create route entirely. Assembly dropped it, the bound agent's identity was
the whole prompt, and the row was left byte-identical. The fix reads; it does not migrate.

**The dedup is on the wire, including the ordering Daedalus flagged** (arm J).
`entityIds: [X, X]` on a chat is now 201 with exactly one seat (Round 161: 400). Two
*distinct* agents in a chat is still 400. And the ordering he called "the bit a future
refactor gets wrong" holds at the endpoint: `['no-such-entity', 'no-such-entity']` → 400,
and `[X, 'no-such-entity', X]` → 400. Dedup does not launder an unknown id.

**All three L4 reporters follow assembly** (arm L). `/prompt-debug` is checked live above;
the two AAXT reporters are checked by source identity rather than by calling
`/aaxt-probe` and `/aaxt-run`, because both of those routes generate probes with the
auxiliary model and this probe spends nothing. Three reporters found, three carrying both
`isDefaultChannelPreamble` and the `EMPTY — default purpose, not sent` string, and the
`buildSystemPrompt` layer-4 line uses the same predicate.

---

## 2. The named population is wrong: imported channels were never affected

This is the correction, and it is the reason the arm exists. From the Round 162 memo §2:

> the population you flagged in your own §2 — imported channels, always `type: 'chat'`
> bound to the minted entity (`queries.ts:1290`) — is *exactly* the "real identity at
> layer 5" case where the generic line contradicts something. A client fix leaves all of
> them as they were. **Assembly covers them today.**

And the research doc's title: *"the generic line was server-side, and the fix reaches
imports."*

**Measured at the endpoint** — imported a Claude Code session through
`POST /api/import/claude-code` with `entityName: 'Piper Morgan'`, then read the channel
row straight out of the file:

```
MEAS [H] what an imported channel actually stores as its purpose — "" (length 0)
MEAS [H] the L4 reporter on an imported channel — "EMPTY"
MEAS [H] the imported channel type and bound entity — type=chat · entityName="Piper Morgan"
```

`importSession` hardcodes the empty string as the channel's `system_prompt`
(`queries.ts:1292-1294`), and always has — the same literal is in the first import
implementation, `684de9e`. An empty string is falsy after trim, so **layer 4 skipped it
before Round 162 exactly as it does now.** The reporter says plain `EMPTY`, not
`EMPTY — default purpose, not sent`, which is the debug surface correctly distinguishing
"nothing was written" from "boilerplate was written and dropped."

Imported channels never carried the generic line. The fix does not reach them because
there was nothing there to reach.

**What this does and does not change.**

- It does **not** weaken the argument for fixing in assembly. That argument is
  "every channel that already exists carries the stored string," and arm G verifies it
  directly. The population it is true of is **native channels** — every channel created
  through the New Chat form, because the client sends the fallback and the route
  substituted it server-side anyway. That is a large, real population and a
  creation-time fix would indeed have missed all of it.
- It **does** remove the sharpest illustration. The reason imports looked like the worst
  case is that they are the one population guaranteed to have a real identity at layer 5.
  They are also the one population that never had the contradiction.
- The bound-chat case that motivated the fix is a **native** channel created through
  Path C, which is what my Round 161 arm E actually measured.

**Three channel-insert paths exist**, not two — worth writing down because I got this
wrong myself mid-fire by grepping only `db/` and `routes/`:

| path | what it writes as `system_prompt` | affected by the boilerplate? |
|---|---|---|
| `db/queries.ts:182` (`createChannel`, native) | route substitutes `DEFAULT_CHANNEL_PREAMBLE` when blank | **yes — this is the population** |
| `db/queries.ts:1292` (`importSession`, Claude Code + Claude.ai) | `''`, hardcoded since `684de9e` | no, never |
| `import/klatch-import.ts:264` (klatch package) | `layer4 \|\| ''` — carries whatever was exported | only if a native channel was exported; covered by assembly |

---

## 3. The string moved rather than left: `entities.ts:81` is the fifth literal, and it is the one still on the wire

Round 162 names the string once in `shared` and skips it at layer 4. `routes/entities.ts:81`
substitutes the identical string into an **entity's own** system prompt when the field is
left blank, and layer 5 has no predicate.

Measured (arm I) — created an entity through `POST /api/entities` with no `systemPrompt`,
then bound a chat to it:

```
MEAS [I] an entity created with no prompt stores — "You are a helpful assistant."
MEAS [I] a chat bound to that agent assembles to — 28 chars — "You are a helpful assistant."
MEAS [I] its L4 vs L5 reporters — L4="EMPTY — default purpose, not sent" · L5="\"Unnamed Helper\" — 28 chars"
```

So a user who creates an agent and leaves its prompt blank, then opens a chat with it,
gets **exactly the 28 characters Round 162 removed** — from layer 5, where the predicate
does not apply. The headline "the boilerplate preamble is not sent" is true of layer 4 and
not of the system.

**I am not calling this a defect and I am not routing it as one.** There is a real argument
that it is correct: an entity with no prompt has no identity, and *some* default is more
defensible at layer 5 than at layer 4. Layer 4 was wrong because it *contradicted* a real
identity; layer 5 here is the only identity there is. What I am recording is that the
convention Round 162 established — "this string is boilerplate, not content" — is now
enforced in one of the two places the server writes it, and the asymmetry should be
deliberate rather than incidental.

**The AAXT exposure is already covered.** `probe-generator.ts`'s
`TRIVIAL_CONTENT_THRESHOLD` is 40 chars and applies per layer via `LAYER_SPECS`, which
includes `5_entityPrompt`. The L5 reporter reads `"Unnamed Helper" — 28 chars`, below the
threshold, so the Round 28 false-positive Phantom cannot recur through this route either.
That was the specific risk Daedalus named for the L4 reporters and it holds for L5 by the
threshold rather than by a predicate.

---

## 4. Arm F — the continuity asymmetry, unchanged and still xian's call

Re-measured so the state stays measured rather than remembered. Deliberately untouched by
Round 162, correctly so.

```
MEAS [F] layer 6 in the bound 1:1 — "INACTIVE — carried context applies to klatches only"
MEAS [F] layer 6 in a klatch seating the same agent —
         "ACTIVE — 1978 chars carried from \"Piper Morgan\"'s other channels
          (2 message(s) from 1 conversation(s), no older history)"
```

This run makes the point better than Round 161 did, by accident of fixture ordering: the
"other channel" the klatch carried from is the **imported** one from arm H. So the system
read an imported 1:1's history into a klatch, and would not read it into a 1:1 with the
same agent. Same agent, same conversation, carried one direction and not the other. That
is bidirectionality — open question 2, unanswered since 2026-07-19 — in one measurement.

Still in front of xian. Not patched, not defaulted.

---

## Method notes

- **Zero model calls.** Every assembly arm reads `/api/channels/:id/prompt-debug`, which
  assembles the prompt the API *would* be sent and returns it without sending it. The two
  AAXT routes were deliberately not called (they generate probes with the auxiliary model)
  and are checked by source identity instead — stated in the probe header, not silently.
- **Scratch DB** under `.testdata/round162-preamble-drop/` via `KLATCH_DB`; `klatch.db`
  never opened, asserted at exit.
- **`git diff --stat -- packages/`** captured before and after and asserted equal in-probe
  (arm Z) — empty both times. No product code was touched this fire.
- **Constants read from source**, not retyped: `DEFAULT_ENTITY_ID` and
  `DEFAULT_CHANNEL_PREAMBLE` from `shared/src/types.ts`, the client fallback from
  `ChannelSidebar.tsx`. A rename cannot stale the probe into a false pass.
- **Reproducibility:** three full runs. Runs 2 and 3 compared line-by-line after
  normalising entity UUIDs — identical, 46 result lines each.

## Open, carried forward

- **Bidirectionality** (arm F) — xian's, since 2026-07-19.
- **`entities.ts:81`** (arm I) — recorded above, routed to Daedalus as a convention
  question, explicitly not as a defect.
- **Iris's four client literals** and the import dialog's `entityId` — hers, from
  Round 160/162, untouched here.
- **The stale channel-row model** (`client.ts:800`) — named open in Daedalus's Round 162
  doc, not investigated by either of us.
- **The zero-channel floor question** — still parked on Daedalus's three re-open triggers.
  None fired this fire.
