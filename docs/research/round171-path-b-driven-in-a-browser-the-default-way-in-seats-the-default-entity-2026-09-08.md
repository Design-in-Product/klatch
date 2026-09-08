# Round 171 — Path B driven in a real browser: the default way in seats the default entity

**Author:** Theseus · **Date:** 2026-09-08 (START fire)
**Instrument:** `scripts/probe-round171-path-b-jit-import-browser.mts` (Playwright + real server, **zero model calls**)
**Under test:** `32e00a0` (Path B, Daedalus, same day) · **Build note:** `docs/ux/path-b-jit-import-built-2026-09-08.md`
**Screenshots:** `docs/research/round171-shots/` (three kept in-repo; the full set is under the gitignored `.testdata/round171-path-b/shots/`)

---

> **Correction, added 2026-09-08 (MID fire) by Theseus.** One line of this report is
> over-read and I am marking it here rather than only in the follow-up.
>
> Where this doc says *"the imported session's identity marker is **absent from the assembled
> prompt**"* and offers it as evidence for the binding defect: the measurement is accurate,
> the reading is not. `buildCarriedContextBlock` returns `undefined` unless
> `channel.type === 'klatch'` (`packages/server/src/claude/carried-context.ts:304`) — a
> deliberate, documented scoping. Arm C composed a **Chat**, and a 1-1 cannot carry a
> transcript *no matter which agent is bound*. The marker would have been absent with the
> correct binding too, so it was over-determined and does not bear on the defect.
>
> **The binding defect itself stands and is unaffected** — `chips=["Claude"]`,
> `entityId=default-entity` at `prompt-debug`, mechanism traced through five files, fixed by
> Daedalus in `70b9ba1`. What is corrected is the implication that the imported conversation
> was being *lost*; what was demonstrated is that the wrong agent was being *asserted*.
>
> Round 172 drives the question where it can actually be answered (a klatch) and it comes
> back green: `docs/research/round172-path-b-redrive-the-fix-holds-and-one-line-of-mine-was-over-read-2026-09-08.md`.

---

## Why this probe exists

Daedalus shipped Path B this morning and named his own coverage limit twice — in the build note and in the memo:

> "The 15 tests cover `ChannelSidebar` and `ImportDialog` directly. **They do not cover the `App.tsx` wiring**: compose-mode routing, the suppressed navigation, the entity refresh, and the `fetchChannelEntities` fallback on the duplicate path are each driven by hand-read code and typecheck only."

He asked for an endpoint drive and named the three things he wanted confirmed: the agent arrives selected, creating the chat binds it, and the pre-existing sidebar import path still navigates. That is what this is.

The distinction Round 141 arm F established still holds and is why this is worth a probe rather than a code read: `entityGuess` was typed, populated and unit-tested against mocked fetch, and would have shipped a permanently-blank field because the route never spread it. A component test that hands `onImportAgent` a mock and asserts the mock fired cannot see what a real import hands back.

## Result in one line

**Seventeen of seventeen regression checks pass. The gesture works exactly as built. And the path a user reaches first seats the wrong agent, silently.**

## The finding

Import a Claude Code session from inside the New Chat form, using the manual path input the dialog opens on. The form comes back with one chip selected. **The chip reads "Claude."**

Not Piper Morgan — the agent whose session was just imported. Claude, the shared default entity. No notice, no warning; the ordinary explanatory line is still sitting under the button. `docs/research/round171-shots/03-B-form-after-seat.png` is that screen.

Create the chat from that form and the binding follows the chip:

```
MEAS [C] the composed chat resolves to — entityId=default-entity entityName="Claude"
OPEN [C] a Path B chat binds the imported agent, not the default entity — entityId=default-entity
OPEN [C] the imported session's own identity text reached the assembled prompt — marker present=false
```

The imported session's first-turn identity marker is **absent from the assembled prompt**. The composed chat is a plain default-entity chat wearing the name of an import.

### Why it happens — the chain, read at source and confirmed on screen

1. `ImportDialog.handleSubmit` (`ImportDialog.tsx:124`) calls `importClaudeCodeSession(sessionPath.trim(), channelName.trim() || undefined)` — **no `entityName`, no `entityId`**. The confirm step Iris built lives only in the *Browse* panel; the manual path input never reaches it.
2. `resolveImportEntity` (`import/entity-resolve.ts:77-80`) returns `{ disposition: 'default' }` when the confirmed name is blank.
3. `routes/import.ts:388-390` spreads `entityId` into the response **only if one resolved**, so `ImportResponse.entityId` is `undefined`.
4. `importSession` (`db/queries.ts:1280`) binds `params.entityId || DEFAULT_ENTITY_ID` — so the imported channel *does* get an entity: the default one.
5. `App.tsx` `onImported`, seeing no `result.entityId`, falls back to `fetchChannelEntities(result.channelId)` — which faithfully returns the default entity — and seats it.

Step 5 is the one that turns a recoverable situation into a silent wrong answer. The fallback was written for the duplicate path, where `ImportConflict` genuinely carries no entity and the channel genuinely knows the answer. On this path the channel does not know the answer; it knows the *placeholder*. The fallback cannot tell those apart, so "no agent came back with it" — which the form is fully prepared to say — never gets said.

**This is the exact outcome §11a says Path B must not produce.** Daedalus's own 9/2 finding was that the real blocker was the confirm step, "because before it the client sent no entity fields and a just-in-time import would have bound the new agent to `default-entity` — delivering an agent with no identity, which is the exact broken thing §11a says the path must not do." The confirm step shipped, and the blocker cleared for the *browse* route. The manual route was never wired to it, so on that route the pre-2026-09-02 behaviour is still live — now with a chip that positively asserts an agent was seated.

### It is not one path — it is two

Arm F drove the duplicate case Daedalus flagged as most likely to be wrong. Re-importing an already-imported session from inside the form raises "Already imported"; "View existing" keeps the user in the form (good, and confirmed) and seats — `chips=["Claude"]`, `notice=null`. Same defect, same mechanism.

### And the route that *does* mint a real agent hands back nothing

Arm D drove the Browse panel from inside the compose form. It works: the registry came back `["Claude","Piper Morgan","Vesper"]` — two identified agents minted through the confirm step, exactly as designed. The form after it: `chips=[] · notice=null`.

Multi-select browse import completes through `handleImportSelected` → `onBulkImported`, and `onBulkImported` never touches `jitImport`. So the composition form gets nothing back and says nothing about it.

**Stated limit:** I drove the multi-select case only (the panel pre-selects every not-yet-imported session, so multi-select is what you get by default with more than one session present). A browse import of exactly one session may route through `onImported` instead and behave correctly. I have not driven that and am not claiming either way.

## What is confirmed working — driven, not read

| | |
|---|---|
| Compose-mode copy | "Use this agent", not "Go to channel" — confirmed on a real screen |
| No navigation | The half-composed form is still mounted after the import completes |
| Entity refresh | The imported agent appears in the picker without a reload (arm D: registry grew and rendered) |
| Sidebar path unchanged | Arm E: still reads "Go to channel", still navigates — the imported transcript's assistant turn is on screen. **This is the regression Daedalus most wanted checked, and it holds.** |
| Roster-at-cap | Arm G: five seated, import a sixth → roster stays at five and the form says *"Imported — the roster is full (5). Remove an agent to seat it."* Nothing silently displaced. |

## Iris's shape question is moot as posed

Daedalus asked Iris to rule on the empty-registry form: "a lone dashed import button under the name field with no picker above it, and I have not seen that state on a real screen."

Arm A is that screen, on a genuinely fresh database. **The state is not reachable.** A fresh install seeds one entity — Claude — so `entities.length > 0` is true from the first boot and the picker always renders. `docs/research/round171-shots/01-A-fresh-install-form.png` shows the real fresh-install form: picker, then the dashed import button, then the explanatory line. No orphan.

The decision to put the affordance outside the gate is still right for the reason §3 gives; it just isn't load-bearing for the state Iris was asked about. **Not checked:** whether the default entity can be deleted, which is the only way I can see to reach the orphan state. If it can, the question comes back.

## Isolation — asserted, not claimed

Two guards, both green:

- **`KLATCH_DB`** points at `.testdata/round171-path-b/scratch.db`. xian's `klatch.db` is never opened.
- **`CLAUDE_CONFIG_DIR`** points at a synthetic `projects/-tmp-r171-probe/` tree, so the dialog's own Browse scanner enumerates only my fixtures and **cannot reach `~/.claude/projects`**. Arm S asserts the scan count matches the fixtures written so far, exactly: `totalSessions=1 (expected 1); projects=1`. If the real tree were visible that number would not be 1.
- `git diff --stat -- packages/` identical before and after.
- Zero model calls. Binding is read from `/api/channels/:id/prompt-debug`, which assembles the prompt the API *would* be sent and returns it unsent — the same instrument Round 161 used on Path C.

## Two probe bugs I fixed rather than reported

Both produced red that was not the product's, and both are worth recording because they are the shape of mistake this instrument invites:

1. **Arm D's bulk import swallowed arm E's fixture.** The browse panel pre-selects every not-yet-imported session, so a fixture created up front for a later arm was gone by the time that arm ran, and arm E hit a duplicate conflict that looked like a navigation failure. Fixtures are now written immediately before the arm that consumes them.
2. **`locator.isVisible()` does not wait.** It answers about this instant; passing it a timeout reads as if it doesn't. Two arms recorded failures that were only ever "the import had not finished yet." Everything that needs to wait now goes through a `waitFor` helper.

Neither made it into a finding. Recording them so the next person driving a browser here doesn't rediscover them.

## What I am not claiming

That the responder *speaks* as the bound agent. Daedalus asked for that specifically; I substituted `prompt-debug`, which reports the assembled system prompt without sending it. That is a stronger check than a single model reply for the question at hand — it shows the identity text is absent rather than inviting an inference from one answer's tone — but it is a substitution and I would rather name it than let it pass as the thing that was asked for. A live model call is one API call away if xian wants the literal version.

## The ask

The fix is not mine to specify, but the decision is small and there are two obvious shapes:

- **Thread the confirm step into the manual path** — the honest fix; the manual path is the only import route in the dialog that skips identity confirmation, and Path B is a second reason it shouldn't.
- **Make the fallback able to tell a placeholder from an answer** — `App.tsx` could refuse to seat `DEFAULT_ENTITY_ID` and let the "Imported, but no agent came back with it" notice do its job. Cheaper, and it converts a silent wrong answer into the true one, but it leaves the manual path unable to mint an identified agent at all.

I'd take the first, with the second as the guard behind it. Routed to Daedalus with Iris cc'd on the copy consequences.
