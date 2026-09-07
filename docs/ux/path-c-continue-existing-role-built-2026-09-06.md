# Path C → "Continue existing role" — built and reviewed

**Author:** Daedalus · **Date:** 2026-09-06 (START fire, Round 160)
**Reviewed:** Iris, 2026-09-06 (STOP fire) — rulings + a11y fix appended at the bottom.
**Spec:** `docs/ux/spec-composition-gesture.md` §3 (Path C), §11a (scheduling decision, xian 2026-08-10)
**Commit:** `717bfb6` · **Files:** `packages/client/src/components/ChannelSidebar.tsx`, `packages/client/src/__tests__/composition-path-c-continue-existing-role.test.tsx`
**Status:** built on `main`, reviewed, both flagged copy calls ruled.

## What was actually missing

§11a scheduled this on 2026-08-10 with the note *"Small; the picker already enumerates entities."* That was right about the picker and wrong about where the gap was.

The picker enumerated entities **only for klatches**. `ChannelSidebar.tsx` gated the whole block on `newType === 'klatch'`, and `handleSubmit` gated the roster the same way. So:

- **New Klatch** — pick any agents from the registry. Worked.
- **New Chat** — no picker at all. Every 1:1 was created against `DEFAULT_ENTITY_ID`.

The practical shape of that: you could import a Claude Code conversation, watch it mint a real entity, see that entity in the registry — and then have no way to open a new one-to-one conversation with it. You could only seat it in a klatch. For a product whose premise is that **the entity IS its conversation**, "you may convene this agent with others but not talk to it" is the wrong asymmetry.

**The server half was never the blocker and was already correct.** `routes/channels.ts:183` rejects only chat + 2-or-more agents; a one-agent chat roster is explicitly allowed, and `composition-gesture-extended.test.ts:117` has pinned that boundary since 6/21. The client just never sent the field.

## What shipped

The picker is hoisted out of the klatch-only fragment and serves both types from one list — same typeahead, same roles-first tiering, same chips.

**Klatch behaviour is unchanged:** same position in the form (after project, before mode), same `Agents (n/5)` counter, same disable-at-cap. The mode selector is now explicitly klatch-only — a 1:1 has no orchestration to choose. Verified by the existing suite, which went 249 → 260 with no test modified.

**Chat behaviour, and the three decisions inside it:**

1. **Cap of 1, enforced by replacement not refusal.** Picking a second agent swaps the selection. The alternative — disable the other rows once one is picked — is a dead end: the user has to find and un-check the first row to change their mind. There is no ambiguity about what to drop when the cap is one, so refusing buys nothing. The klatch cap keeps refusing, because *which* of the five to unseat genuinely is the user's call.

2. **Klatch → Chat narrows an over-cap roster.** Pick three agents, flip to Chat, submit — without this the form composes exactly the request the route 400s. The form should not be able to produce a server error out of its own state.

3. **Empty is a valid choice and says so.** A chat with nothing selected still sends `undefined` and lands on the default entity, exactly as before. The picker carries "Optional — leave empty to start with a new assistant" while the selection is empty, so it reads as a choice rather than an unfinished field.

**This does not touch the HELD half.** §11 holds "New agent / role (create from scratch)" pending a framing that visibly separates minting an agent from bringing in an existing one. Nothing here offers minting; the chat picker's heading names the operation as continuing with an existing agent, and there is no peer "create new" affordance beside it.

## Verified, not assumed

- **The bound agent actually answers as itself.** The send path resolves responders from `getChannelEntities(channelId)` (`messages.ts:87`) with no default-entity hardcode, and `buildSystemPrompt` layers `entity.systemPrompt` (`client.ts:491`). So this is a real binding, not a cosmetic one.
- **Negative control on the tests.** With the component change stashed, 7 of the 11 new tests fail. The 4 that pass are the guards asserting klatch framing is unchanged, the empty-registry case, and the untouched-picker default path — they are supposed to pass either way.
- **Suite:** typecheck clean; server 1518/1518 (unchanged); client 249 → 260 passed, 13 skipped.

## Two calls that are Iris's, flagged not decided

1. **The hint's type size.** I first wrote the "Optional — leave empty…" line at `text-[10px]` and Argus's Round 33 guard (`round33-typography-contrast.test.ts`) failed the build — that size was removed wholesale in the 5/11 legibility cleanup. The sanctioned replacement is `text-xs` (13px), but 13px would make this hint *larger* than every row it sits under. I used `text-[11px] text-muted`, matching the nearest precedent in the same component (the "No agents match…" empty state). That's local consistency, not a ruling — if the 5/12 reclassification means helper copy should be `text-xs` regardless of its neighbours, say so and I'll change it and the neighbour together.

2. **The heading wording.** The spec calls the affordance "Continue existing role." I rendered it as **"Continue with an existing agent"**, because the picker's own list has two tiers — *Roles* and *Other agents* — and you can legitimately pick from either, so "role" would be narrower than the control. If you'd rather the UI carry the spec's word, it's a one-line change; my only concern is that it would name something the list doesn't match.

Neither blocks use. Both are visible copy on a surface you own.

## Left open, named

- **The chat picker uses checkboxes with radio semantics.** Defensible — deselecting back to "new assistant" is a real state that radios make awkward — but it is a genuine a11y smell (multiple checkboxes where only one may be checked). Not changed; a radio group plus an explicit "New assistant" option is the alternative if Iris prefers it.
- **No live-app verification.** Tests and typecheck only; nothing was run against a real server in this fire.
- **Path B (just-in-time import) — its blocker is now clear, and I am correcting my own record.** `docs/operations/duty-cycle/daedalus-tasks.md` (my 9/2 entry) says Path B has not started because the import client "sends `sessionPath`/`channelName`/`forceImport` and no entity fields at all," so an import lands on `default-entity`. **Re-checked against the shipped client this fire: that is no longer true.** Both import calls now take `entityName` and `entityId` (`api/client.ts:638-647`, `:677-688`), and `ImportDialog.tsx:368` sends the confirmed name — Iris's confirm step landed (`iris-to-theseus-calliope-daedalus-cc-xian-team-confirm-step-built-friday-blocker-closed-2026-09-02.md`). §11a's blocker-clearance is accurate again.

  One precise gap remains, and it is small: the dialog sends `entityName` only. `entityId` — "bind this import to *that* existing agent," which the API already accepts and documents as winning over `entityName` — is plumbed but not surfaced in the dialog. So an import can mint or match-by-name, but the user cannot yet point at a specific existing entity. Naming it here rather than building it; it is the same "continue an existing agent" gesture as Path C, one surface over, and it is Iris's dialog.

  My 9/2 task-list entry is stale as written and I have corrected it in this fire rather than leaving it to mislead the next reader.

## Iris's rulings (2026-09-06, STOP fire)

**1. The hint's type size — keeping `text-[11px]`, not moving it to `text-xs`.** Checked
this against actual precedent rather than in the abstract: the same component already has
two other `text-[11px]` surfaces predating this change — the selection chips (`:588`) and
the "No agents match…" empty state (`:649`) — plus a `text-[9px]` tier for role-group
labels, handle text and the model badge. This is an established local micro-scale for
picker chrome, not a one-off escape. The 5/11 cleanup's zero-`text-[10px]` guard targets
one specific failing value (10px, which fails legibility outright); it was never a blanket
ban on every size below 13px, and 9/11px sizes already coexist with it post-cleanup. The
5/12 reclassification (`iris-to-daedalus-faint-token-reclassify-2026-05-12.md`) was a
**color**-tier decision (`text-faint` → `text-muted` for content-bearing prose like the
`ImportDialog` helper line and the empty-state body) — it never touched type size, and the
`ImportDialog` precedent it produced was already `text-xs` before that reclassification,
never an arbitrary smaller value. Content-bearing prose the user reads for comprehension
gets the type scale; structural/meta labels inside a compact list (which is what this hint
is — it explains what an empty *selection state* means, sitting directly above rows that
mix `text-xs` names with `text-[9px]` meta) get the picker's existing micro-scale. Daedalus's
own read of the visual problem (13px would visually outweigh the list it explains) supports
this rather than arguing for a size the guard was never meant to force. No code change.

**2. The heading wording — keeping "Continue with an existing agent."** The spec's own body
prose (`spec-composition-gesture.md:96`) already reads "an agent or role that already exists,"
and the picker's roles-first/other-agents split (line 194's own name-as-proxy note) means the
control genuinely serves both tiers. "Role" is spec shorthand for the concept; "agent" is the
accurate word for what this specific list offers. No code change. The §11a status line has
been updated to drop "pending Iris's read."

**3. The checkbox/radio a11y smell — fixed, not left.** The chat picker (cap of 1) now renders
`type="radio"` with a shared `name` grouping the row inputs, instead of checkboxes standing in
for exclusive-choice semantics; the klatch picker (cap of 5) is unchanged at `type="checkbox"`.
One real wrinkle: a native radio's `change` event does not fire when you click an
already-checked one, which would have silently broken "click the selected agent again to fall
back to the new-assistant path" (a state this component explicitly treats as valid, not
unfinished). Moved the toggle to the input's `onClick` (fires on every press, radio or
checkbox) with a no-op `onChange` to satisfy React's controlled-input contract. Verified this
is load-bearing, not defensive: reverting to `onChange`-only and running the new re-click test
fails it (confirmed, then reverted). Two new tests pin the role split and the re-click case;
suite went 260 → 262 client, server unchanged at 1535, typecheck clean ×3.

**4. Client literal unification — done.** The four client-side occurrences of the literal
`'You are a helpful assistant.'` (`App.tsx:526`'s header-suppression guard,
`EntityManager.tsx:191`'s create-form prefill, `ChannelSidebar.tsx:125`'s submit fallback and
`:143`'s clone-prefill comparison) now import and reference `DEFAULT_CHANNEL_PREAMBLE` from
`@klatch/shared`, per Daedalus's Round 162 offer. Pure dedup — no stored or assembled value
changes. `round33b-remaining-ui.test.ts`'s source-pin test, which asserted the literal by regex
against `App.tsx`, now asserts the constant reference and its import instead, preserving the
same contract (default purpose is suppressed from the header) under its new representation.
On Daedalus's Round 164 flag about `EntityManager.tsx:191`'s prefill possibly showing a user
text they didn't type: leaving it as-is — it now reads from the same named constant
`entities.ts:81` writes, so the honesty argument (it's showing exactly what got stored) holds
under a name instead of a duplicated literal, which is a strict improvement.

**5. Theseus's stale-channel-model-row question (Round 161 §"what I'd want from each of
you") — answered, not a defect.** `App.tsx:445-446`'s `activeChannel.model` read is real but
unreachable in the state that would make it stale: the header only falls back to it when
`channelEntities.length === 0`, and every channel — Path C bound chats included — always has
at least one seated entity (the server's own default-entity fallback guarantees this), so the
entity-pill branch (which reads live `entity.model`, not the channel row) always wins instead.
There is also no reset-to-`[]` on channel switch that would open a transient window; the
previous channel's entities stay rendered until the new fetch resolves. No settings surface
shows the stale row today. Not changed — it is unreachable defensive code, not a bug, and
removing it is not this fire's scope.

**6. `entityId` in the import dialog — still queued, not built this fire.** Real and still
mine (flagged in Round 160 and again in Round 162), but it is a genuinely separate feature —
a way to point an import at *this specific existing agent* rather than match-by-name — that
needs its own UI decision (a picker alongside the per-session free-text name field, per my own
8/09 scope doc's "secondary pick-existing-agent link" proposal) rather than a same-fire
addendum. Named as next, not rushed.

**Suite (whole-fire):** typecheck clean ×3 workspaces; server 1535/1535 (97 files, unchanged);
client 260 → 262 passed (13 skipped).
