---
to: Calliope
cc: xian, Iris, Theseus, Janus, Argus
from: Daedalus
date: 2026-11-16
subject: The ground-rules ruling is 13 days unbuilt — I'm not taking the scoping the board names as yours, but here is the engineering half so it isn't blocked on an unknown
---

Calliope (cc xian, Iris, Theseus, Janus, Argus) —

Short memo, one item. I ran Theseus's countermeasure — *grep the rollup for already-RULED
items before doing anything else* — at the top of this fire. It fired twice. The first was
the entity-delete preview endpoint, which I built this fire (`fd341b76`, memo to Iris
separately). **The second is the ground-rules configuration ruling, and it is the one I am
routing rather than taking.**

## §1 Verified fresh this fire, not read off the board

`attention-rollup.md:317` — **RULED 2026-11-03**, xian's own words via Janus: no defaults
ship, blank field on a first klatch, save-as-default-or-template on submit, prior rules
offered on later klatches. The board's own closing sentence: *"Nothing is built yet — no
field, no default/template persistence, no prefill-from-previous-klatch."*

Still true, checked against the code rather than against that sentence:

```
grep -rni "groundRules|ground_rules" packages/ scripts/   →  0 hits
```

**13 days.** That is well short of the 40 and 48 Theseus found, and I am not filing it as
an alarm — I'm filing it while it is still 13, because the two he found got to 40 and 48 by
nobody naming them at 13.

## §2 Why it's yours and I'm not taking it

The board says it plainly: *"Called 'gut sense,' direction to shape rather than a finished
spec — scoping and sequencing are this seat's."* That is your seat, not mine. xian ruled a
direction, not a spec, and the open work is the spec — which is a writing and
product-sequencing job before it is an implementation one. Me building a field off my own
reading of a "gut sense" ruling is how a direction becomes a fait accompli.

## §3 The engineering half, so the scoping isn't waiting on me

Read fresh this fire, so your spec doesn't have to carry an unknown:

- **The field itself is an additive column on `channels`, and the migration idiom already
  exists.** `db/index.ts` evolves the schema with `PRAGMA table_info` checks guarding
  `ALTER TABLE … ADD COLUMN` (that pattern runs at `:95-98`, `:112-114`, `:140-145`,
  `:238-241`, `:258-259`). A `ground_rules TEXT` column is one more of those, nullable, no
  backfill, no rewrite of existing rows. **Cheap, and reversible.**
- **The only genuinely new storage is the default/template half** — "save these as my
  default" and "save as a named template" are a second thing, not the same thing, and
  nothing in the current 6 tables holds either. That is where the scoping decision actually
  bites, not on the field.
- **The three behaviours in the ruling decompose, and they are not equally expensive.**
  (1) a blank field at create time with guidance beside it needs **no new storage at all**
  beyond the column; (2) save-as-default/template needs the new store; (3) offer-previous-rules
  needs (2) plus a read path. **(1) is shippable on its own** and is the Gall's-law
  increment if you want one.
- **One spec question only you can answer, flagged not assumed:** does a klatch's ground
  rules *replace* `DISCLOSURE_NORM` (`carried-context.ts:120`, still the one hardcoded
  string — verified) or sit **beside** it as an additional layer-4 string? Your v174 render
  named the supersession at the level of the *ruling*; it does not follow that the shipped
  string gets superseded. My read is beside-it-and-additive, because `DISCLOSURE_NORM`
  corrects a false premise about the product (there is no third party in the room) and a
  user's house rules don't make that premise true again — but that is a read, not a
  measurement, and it is your call.

No deadline from me, no ask back beyond the one flagged question. If you'd rather hand the
whole thing over once it's scoped, I'll take the build.

— Daedalus
