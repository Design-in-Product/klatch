# Ground-rules field — scope and sequencing

**Status:** Spec, nothing built. Written in response to Daedalus's 2026-11-16 memo
(`docs/mail/read/daedalus-to-calliope-...-13-days-unbuilt-...md`), which verified the
ruling still unbuilt (`groundRules|ground_rules` — 0 hits in `packages/`) and routed the
scoping decision here rather than taking it, per the ruling's own text: *"Called 'gut
sense,' direction to shape rather than a finished spec — scoping and sequencing are
this seat's."*

## The ruling (for reference, full text at `attention-rollup.md:317`)

xian, via Janus, 2026-11-03 — no defaults ship; the user's own rules become them:

1. **First klatch:** the ground-rules field is empty, guidance beside it (a safe
   example set now; scenario-specific suggestions later, explicitly an enhancement).
2. **On submit:** the user can save their rules as the default, or as a named template.
3. **Later klatches:** previous rules are offered — pre-filled as the default, or as a
   choice among templates.

## Correction to the framing: this is not a field with no precedent

Daedalus's memo is right that no `ground_rules` column or surface exists. But it would
be a mistake to read that as "nothing like this exists yet" — the klatch-creation form
(`ChannelSidebar.tsx`) already has a free-text field writing to `channels.system_prompt`,
rendered at layer 4 of the six-layer prompt assembly (`client.ts` §4, "Channel addendum").
**That field is labelled "Purpose — what is this klatch for? (optional)."** It answers a
different question than ground rules does: Purpose is *why this room exists*; ground
rules is *how participants should behave in it*. "Review Q4's architecture decisions"
is a purpose. "No jargon, challenge assumptions, assume everyone read the brief" is a
ground rule. Conflating them — reusing `system_prompt` for both, concatenated or
appended — would mean a future "offer previous ground rules" read-path also leaks
Purpose, and a "save as default" on one field silently saves the other.

**Decision: ground rules gets its own column, `channels.ground_rules TEXT`, nullable,
additive migration** — same `PRAGMA table_info` idiom Daedalus cited (`db/index.ts`
`runMigrations`, e.g. `:95-98`). Rendered at layer 4 as its own pushed part, alongside
Purpose rather than inside it (`assembleSystemPrompt`, step 4 in `client.ts`). This
confirms Daedalus's architecture read was correct in substance (additive column, cheap,
reversible) while sharpening what "the field" actually is.

## Decomposition into Gall's-law increments

The ruling's three numbered behaviors are not equally expensive, and two of them share
a dependency the ruling's own ordering obscures.

**Phase 1 — blank field + guidance. Ships alone. No new storage beyond the column.**
- `channels.ground_rules TEXT`, nullable, no backfill (same idiom as every other
  additive column in `runMigrations`).
- New textarea in the klatch-creation form, next to the existing Purpose field, blank by
  default. Static guidance beside it (a fixed safe-example string — not a dynamic
  feature; "scenario-specific suggestions" is explicitly the ruling's own enhancement,
  not phase 1).
- Rendered at layer 4 in `assembleSystemPrompt`, its own `parts.push(...)`, skipped when
  blank (same skip-when-empty pattern layer 4's existing Purpose check already uses).
- This alone satisfies the ruling's item 1 in full. **This is the increment to ship
  first if a single increment is wanted.**

**Phase 2 — save-as-default-or-template on submit. New storage, two shapes.**
The ruling phrases this as one choice ("default or template"), but the storage
underneath is two different shapes, not one:
- **Default** is a singleton — one value, since Klatch is single-user/no-auth
  (`CLAUDE.md`, "Conventions"). No new table: a one-row settings-shaped store (there
  isn't an existing generic settings table today — confirmed against the six tables
  `CLAUDE.md` lists — so this is the one genuinely new piece of schema).
- **Template** is one-to-many and named: a new small table (`ground_rules_templates` —
  id, name, body, created_at) is the natural shape, distinct from the default slot.
- The UI choice on submit can still present as one prompt ("Save these as your default?"
  / "Save as a named template, named ___?") — the two-shape split is a backend detail,
  not a UX one.

**Phase 3 — offer previous rules on later klatches. Depends entirely on phase 2.**
- Additive UI only, no new storage: at klatch-creation time, if a default exists,
  pre-fill the new field with it; if templates exist, offer them as a picker alongside
  the blank option.
- **Phase 3 without phase 2 is not a smaller increment — it is nothing.** There is
  nothing to offer until something has been saved. If sequencing work across sessions,
  phases 2 and 3 should be taken together or not at all; only phase 1 is independently
  shippable.

## The flagged question, answered: beside `DISCLOSURE_NORM`, not replacing it

Daedalus's memo named one question only this seat could answer and gave his own read
(beside, additive) while flagging it as a read rather than a measurement. Verified
directly against the code before answering, not taken on his word:

- `DISCLOSURE_NORM` (`carried-context.ts:120`) lives at **layer 6** of the prompt
  assembly (carried context), not layer 4. It is injected only when an entity actually
  has carried context to disclose (`client.ts` step 6, gated on
  `options.carriedContext?.trim()`), and its whole purpose, documented at length in its
  own file, is to correct a *specific false premise about the product* — "there is no
  third party in this room" — not to express a per-klatch stylistic preference.
- The planned ground-rules field lives at **layer 4** (channel addendum), fires on
  every message in every klatch regardless of whether any participant has carried
  context, and is a general user-authored field about room conduct.
- These are different mechanisms, at different layers, answering different questions.
  Nothing about the 2026-11-03 ruling touches `DISCLOSURE_NORM`'s text, its gating, or
  its layer. **The 11-03 ruling supersedes the 2026-09-24 ruling only at the policy
  level** — "a per-klatch setting is back in scope," reopening a question the 09-24
  ruling had explicitly left open for exactly this re-raise — not at the level of this
  specific shipped string. v174's rollup language ("directly supersedes") was correct
  about the policy question and should not be read as an instruction to edit or retire
  `DISCLOSURE_NORM`.
- This also means no conflict needs resolving in the prompt text itself: `DISCLOSURE_NORM`
  already carries a built-in carve-out — *"ordinary judgment still applies to material
  the owner asked to keep to one conversation"* — which is exactly the shape a user
  wanting a more private room would reach for in their own ground rules (e.g. "treat
  what's said here as confidential"). The two compose; neither needs to change for the
  other to exist.

## Open, non-blocking

Clone-from-klatch (`ChannelSidebar.tsx`'s "Copy setup from an existing klatch") already
prefills Purpose, agents, mode, and project from an existing klatch. Once ground rules
exist, it's a reasonable expectation that clone-from-klatch carries them too — a small,
additive follow-on to phase 1, not a blocker on any of it. Left for whoever builds
phase 1 to decide inline; no ruling needed.

— Calliope, 2026-11-16 (MID fire)
