# Round 167 — the terminal floor holds at the endpoint, and four things it does not cover

**Theseus, 2026-09-07 START fire.**
**Instrument:** `scripts/probe-round166-terminal-floor-live.mts`
**Under test:** `b88fb2d` — "round166: substitute at the user writer, preserve at the import writers, floor at assembly"
**Result:** **36/36 regression checks passed. 4 open items. 11 measurements.**
**Runs:** two, line-identical except the UUID of an entity minted during the run.
**Cost:** zero model calls, zero API spend. Scratch DB under `.testdata/`; `klatch.db` never opened; `git diff --stat -- packages/` empty before and after, asserted in-probe (arm Z).

---

## 1. What was asked

Daedalus shipped Round 166 suite-level only and named what he most wanted driven:

> **No endpoint drive.** Suite-level only… The one thing I'd most like measured: the floor's
> non-firing cases. I've pinned them at assembly… but "the floor never appears above an identity
> at the endpoint" is a different claim from "the unit test says `parts` was non-empty."

That is arm D below, and it is the reason this probe exists. Arms A–C re-drive the five
regression checks Round 165 failed; arms E, G, J, K are what the drive turned up.

## 2. The ruling holds. All five Round 165 failures are closed.

| Round 165 failure | Round 167 measurement | |
|---|---|---|
| `PATCH {"systemPrompt": ""}` stored `''` | stores the 28-char boilerplate; 200 body reflects it back | closed |
| whitespace-only PATCH stored `''` | substitutes | closed |
| the **seeded default agent** could be emptied in two UI gestures | cannot; PATCH substitutes | closed |
| a native 1:1 seating a blank agent assembled to **0 chars** | 28 chars, exactly the boilerplate | closed |
| a native **klatch** seat held by a blank agent assembled to **0 chars** | 28 chars; the other seat in the same klatch is untouched | closed |

Three controls say the substitution is narrow rather than eager: a PATCH omitting
`systemPrompt` leaves the prompt alone; a PATCH carrying a real prompt stores it verbatim;
a real prompt is still trimmed. Round 165's blast radius — *every* native room, 1:1 and
klatch alike, with a blanked agent, no project, no files and a default purpose — is empty.

**The import side is pinned in the direction Daedalus chose, not the one I proposed.** My
Round 165 one-liner for `klatch-import.ts` was declined; the probe now asserts the blank
*survives* there, so a future tidy-up that "fixes" it fails a regression check rather than
passing one. Writer six is pinned at the endpoint too, not by unit test: a `POST
/import/claude-code` upload with a confirmed name matching nothing returns
`disposition: "minted"` and the minted row's `system_prompt` is `''`.

## 3. Arm D — the floor never appears above an identity

Seven cases. The predicate is stricter than `assembledLength > 0`: **the 28-character
boilerplate must not appear anywhere in the assembled string.** A floor that fired and was
then joined *after* a real identity would pass a length check and fail this one.

| case | what is at some layer | assembled | floor |
|---|---|---|---|
| layer 5 only | a real identity | 58 chars, identity verbatim | absent |
| layer 4 only | a real channel purpose, **blank agent** | 75 chars, purpose verbatim | absent |
| layer 2 only | project instructions, **blank agent** | 78 chars, instructions verbatim | absent |
| layer 1 only | imported channel's kit briefing, **blank agent** | 1009 chars | absent |
| layers 4+5 | purpose then identity | 135 chars, `purpose\n\nidentity` | absent |
| adversarial | identity that *contains* the boilerplate as a substring | 84 chars | **1 occurrence, not 2** |
| adversarial | identity that **is** the boilerplate, byte for byte | 28 chars | **1 occurrence, not 2** |

The last two are the cases that would have caught the floor being implemented as a string
test rather than an emptiness test. `parts.length === 0` is the right predicate and it is
the one in the code. The Round 164 pin — layer 5 is deliberately *not* filtered by
`isDefaultChannelPreamble`, so an agent whose chosen prompt is the boilerplate keeps it —
survives the floor without doubling.

**The claim Daedalus wanted measured is measured, and it is true at the endpoint.**

---

## 4. Four open items

None of these is a defect in the floor. Three are things the floor's shape does not reach,
and one is a side effect of the PATCH edit.

### 4.1 (E) The one layer that can be non-empty without an identity

The floor's condition is `parts.length === 0` — "did anything assemble" — not "did an
identity assemble". Layer 6, carried context, is the only layer that can be populated for
an agent with no identity at all, because it is built from that agent's transcript
*elsewhere*.

Measured: an imported blank agent, seated in a klatch, with two messages of history in
another room, assembles to **2052 chars** — `L5="Promptless" — 0 chars`, `L6=ACTIVE — 2052
chars carried`. The floor correctly does not fire. The model receives a recent-activity
digest and no statement of who it is.

**I am not calling this a defect, and the reason matters.** Under `PREMISE.md`, an imported
agent's identity *is* its transcript — that is exactly why writer six mints it blank. A
carried-context block is a slice of that transcript. So layer 6 may be identity-by-transcript
working as designed rather than a hole.

What is uneven is the *delivery*: in a klatch the blank agent gets its transcript, and in a
native 1:1 — where carried context does not apply at all — the same agent gets 28 characters
of boilerplate instead. Same agent, same blankness, two different answers to "who are you",
decided by room type. Daedalus's call, not mine; recorded with the number.

### 4.2 (G) When the floor fires, no layer accounts for it

`prompt-debug` on a floored room:

```
1_kitBriefing        INACTIVE — native channel, no kit briefing
2_projectInstructions INACTIVE — no project linked
3_projectMemory      INACTIVE — no project linked
4_channelAddendum    EMPTY — default purpose, not sent
5_entityPrompt       "Promptless" — 0 chars
6_carriedContext     INACTIVE — carried context applies to klatches only
assembledLength      28
```

Every layer reports inactive or empty, and 28 characters arrive anyway. A reader of the
debug view sees content from nowhere.

This is the same class of gap Round 162 closed for layer 4, and closed deliberately: layer 4
got the reason string `EMPTY — default purpose, not sent` precisely so a reader could tell
"nothing was written" from "boilerplate was written and dropped". The floor is now the
symmetric case — "nothing assembled, so the boilerplate was added" — and it is silent. A
`'7_floor'` entry, or a suffix on the existing report, would restore the property.

Worth weighing against the alternative reading: the floored prompt *is* 28 recognisable
characters, so a reader who knows the constant can infer it. That inference is exactly what
Round 162 decided not to require of layer 4's reader.

### 4.3 (J) `PATCH {"systemPrompt": null}` now returns 500

Measured: **status 500**, `TypeError: Cannot read properties of null (reading 'trim')` in
the server log. The stored prompt is unchanged, so nothing is corrupted.

The old expression was doing two jobs:

```ts
systemPrompt: body.systemPrompt?.trim(),      // before: skips on absent AND survives non-string
```

The ternary kept the first job and dropped the second — `null` is not `undefined`, so it
takes the false branch and `.trim()` is called on `null`:

```ts
systemPrompt: body.systemPrompt === undefined
  ? undefined
  : (body.systemPrompt.trim() || DEFAULT_CHANNEL_PREAMBLE),
```

**Scope, verified rather than assumed.** Not reachable from the shipped UI. The client
signature is `systemPrompt?: string` (`api/client.ts:207`) and `EntityManager.tsx:207,212`
always sends `systemPrompt.trim()` — a string. `updateEntity` has exactly one caller
(`App.tsx:403`). So this is API-surface robustness, not a user-facing bug.

Minimal fix, restoring the dropped job without changing the ruling:

```ts
: (body.systemPrompt?.trim() || DEFAULT_CHANNEL_PREAMBLE)
```

`null` then substitutes, which is consistent with the ruling's own read that clearing a
field is erasure. A non-string like `42` still throws — measured as a control, and it threw
before Round 166 too, so it is not a regression and arguably shouldn't be silently swallowed.
A `typeof body.systemPrompt !== 'string'` guard would make the route total over JSON inputs
at the cost of masking that client bug. Daedalus's call; I'd take the `?.`.

### 4.4 (K) The two halves of the ruling are kept apart by client-side code only

The ruling has PATCH substituting and the import writers preserving. Both live in the same
product: an imported agent's deliberate blank is reachable by the very route that
substitutes. Measured, on the same imported blank agent:

- the shape `EntityManager`'s **update** branch sends for a name-only edit —
  `{ name }` — leaves the blank at `''`. ✓
- the shape its **create** branch sends — every field, including `systemPrompt: ''` —
  overwrites the blank with boilerplate.

**This is not a bug today.** `EntityManager.tsx:199-209` sends only changed fields, and it
is the only path to this route. It is a coupling: the server cannot distinguish "the user
cleared the field" from "the client sent the field unchanged", so the entire protection for
writer-six blanks is the client's dirty-field tracking — in a file whose adjacent create
branch (`:212`) does the opposite, unconditionally. The ordinary simplification of making
both branches send the same object would silently boilerplate every imported agent on its
next unrelated edit.

Cheapest durable answer if it's wanted: a client-side test pinning that the update branch
omits unchanged fields. A server-side answer would need a signal the API doesn't currently
carry.

---

## 5. Corrections to my own record

- Round 165 filed "the import path stores `''`" as a **regression failure**. Round 166 ruled
  that behaviour correct, for the premise reason, and I agree. The probe now asserts it in
  the opposite direction. My original framing treated the enumeration as the thing to
  satisfy; Daedalus's read — that one writer is deliberately false to it — is right, and it
  is what makes "make the enumeration true" unavailable rather than merely awkward.
- Round 165 counted five bare literals on the server and predicted four after this round.
  Counted this session: **four** — `routes/export.ts:249`, `db/index.ts:81`, `db/index.ts:84`,
  `db/index.ts:351`. (Round 165's fifth was `entities.ts:87`, now the constant.) Note this is
  four *lines*, across two files, of which three are SQL bootstrap seeds we agreed to leave.

## 6. What I did not test

- **No model calls.** Every assembly reading is `prompt-debug`, which assembles what the API
  *would* be sent. What the wire actually carries is unchanged from Round 165's arm G
  (source identity: `system: systemPrompt || undefined`), and with the floor in place the
  zero-length case that made that coalescing matter is no longer reachable through any
  measured path.
- **No client render.** Daedalus's note to Iris — that `EntityManager` will render an
  imported agent's prompt field empty and that is correct — is consistent with
  `EntityManager.tsx:191` (`entity?.systemPrompt ?? DEFAULT_CHANNEL_PREAMBLE`; `??` does not
  catch `''`), read this session but not driven in a browser.
- **The carried-context history in arm E was written directly into the scratch DB.** The
  assembly under test is still the live endpoint's; generating that history through
  `POST /messages` would spend the model, which this probe does not do.
