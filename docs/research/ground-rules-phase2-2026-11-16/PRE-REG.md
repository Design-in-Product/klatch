# Pre-registration — ground rules phase 2, server half (storage + API)

**Author:** Daedalus · **Date:** 2026-11-16 (STOP fire) · **Pushed before any of the code or
tests it predicts about existed.**

Subject: the storage and API half of **phase 2** of the 2026-11-03 ground-rules ruling
(`docs/operations/attention-rollup.md:319`), scoped by Calliope in
`docs/ux/ground-rules-scope-2026-11-16.md`. Phase 1 (the field, the column, the layer-4a prompt
part) shipped this afternoon — `77a45d66`, `619238e1`.

## What is being built, and what is deliberately not

**Built here:** a store and an HTTP surface for *saved* ground-rules sets — the thing phase 2's
"save these as my default / save as a named template" writes, and the thing phase 3's "offer
previous rules" reads.

**Not built here, and named rather than left implicit:**

- The **submit-time UI** ("save these as your default?" / "name this template") — client work,
  Iris's lane. Phase 2 is not user-visible until it exists.
- The **prefill/picker** at klatch-creation time (phase 3) — also client, and it reads this
  surface rather than needing new storage, exactly as the scope doc says.
- **Changing which saved set is the default after the fact.** The ruling's text asks for
  save-as-default on submit and offer-on-next-klatch; it does not ask for a manager. Not built.
- **Dedup.** Saving the same body twice makes two rows. Not built, not guarded.

## Divergence from the scope doc's storage shape, declared up front

Calliope's spec names **two** stores: a one-row settings-shaped slot for the default, plus a
`ground_rules_templates` table (id, name, body, created_at) for named templates, on the argument
that "default is a singleton, template is one-to-many" are two shapes.

I am building **one** table — `ground_rules_presets` (id, name NULL, body, is_default, created_at)
— where *default* is a **designation on a saved set** rather than a second store. Reasons, and the
cost named:

1. The ruling's own phase-3 sentence is *"offer previous ground rules(es) as option or default"* —
   **one list with one member marked**. Two stores would have to be unioned to render that list,
   and a default saved as its own copy of the body cannot be told apart from a template with the
   same text.
2. A separate default slot duplicates the body. Two rows holding the same string is the state where
   "which one did the user edit" stops having an answer.
3. A generic settings table for exactly one setting is speculative generality; Gall's law is the
   house rule.
4. **The table-count argument everyone would reach for here is void, and I checked rather than
   repeating it.** `CLAUDE.md` says "currently at 6" tables and "add Drizzle at 8+". The live
   schema has **eight** today (channels, messages, entities, channel_entities, message_artifacts,
   projects, files, file_refs — read off `grep -n 'CREATE TABLE IF NOT EXISTS'
   packages/server/src/db/index.ts` in this fire, eight hits, six in `initSchema` and two in
   `runMigrations`). The threshold is already reached; one table versus two cannot be decided on it. Routing the stale `CLAUDE.md` count rather than editing it.
5. **Cost of being wrong, stated:** migrations here are additive-forever. If the two-store shape is
   wanted later, this table does not become it — it stays, and a second store appears beside it.
   That is a real price and it is Calliope's call to overrule; the HTTP surface below is the part
   Iris codes against, and it does not change shape if the storage does.

## Predictions — four cripples, each written before it was run

Each cripple is a one-line edit to the built code, restored from a **committed** cure (so a restore
cannot discard an uncommitted fix — the 11/07 rule).

**C1 — drop the partial unique index** (`idx_ground_rules_presets_default`, `WHERE is_default = 1`).
Predict: **exactly one arm red** — the arm that asserts two defaults cannot coexist *at the storage
level*, driven by a raw `INSERT` that bypasses `createGroundRulesPreset`. Every behavioural arm
stays green, because the write path clears the previous default itself. If more than that arm
reddens, my arms are keying on the index where they mean to key on the write path.

**C2 — remove the `UPDATE … SET is_default = 0` clear inside the create transaction.** Predict:
the arm asserting "a second save-as-default moves the default" reddens. Secondary prediction, and
the one I am less sure of: with the index live, the second insert **throws a constraint error**
rather than returning a wrong value, so the arm fails as an error rather than as an assertion —
and any *other* arm that happens to save two defaults in sequence reddens too. I am recording the
count after the drive, not guessing it, but I predict **≥ 2 red**.

**C3 — route accepts a blank body** (delete the 400 on whitespace-only `body`). Predict: **exactly
one arm red**, the blank-refusal arm. A blank preset is the one thing this store must not hold:
phase 1 spent its whole argument keeping "no rules" a single state.

**C4 — `rowToPreset` returns `row.is_default` raw instead of `=== 1`.** Predict: the arms asserting
`isDefault === true` redden; the **raw-column** arm does not, because it reads
`SELECT is_default FROM ground_rules_presets` and never goes through the mapper. This cripple exists
**because of this morning's finding** — `rowToChannel`'s `row.ground_rules || undefined` collapsed
`''`, and 18 arms phrased on the mapped field could not see it. The rule I wrote then ("a claim
about what is *stored* cannot be measured through a mapper that normalises it") is applied here
prospectively: the storage-level claims get a raw-column arm from the start.

## HTTP surface (the contract Iris codes against)

- `GET /api/ground-rules/presets` → `{ presets: GroundRulesPreset[] }`, default first then
  newest-first. No separate `default:` key — one fact, one spelling.
- `POST /api/ground-rules/presets` `{ body, name?, makeDefault? }` → `201` + the preset.
  `400` on a blank/whitespace-only `body`; `400` on a `name` key present but blank (the user asked
  for a named template; silently storing it unnamed loses the request).
- `DELETE /api/ground-rules/presets/:id` → `{ deleted: true }`, `404` if absent.

— Daedalus
