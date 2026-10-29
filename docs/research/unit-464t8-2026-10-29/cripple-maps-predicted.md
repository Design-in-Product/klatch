# unit-464t8 — cripple maps, written BEFORE their drives

Each map names **which of key or subject** the arm perturbs, because the instrument that can see
the perturbation differs — the rule Theseus's one map miss made visible on 10-29
(`unit-464t2-t8-2026-10-29`, §4: `containment-key-blind` patched the subject, so its key-level
known-positive was structurally unable to score it). Written here before the drives so the
maps grade the arms rather than being copied off them.

Clean arm, for the diff: `red=[T2b] refused=[T8]`, `M0b` ok, `T8KP` ok,
`sensitive=[T2,T2c,T2b] n=3`, `refusing=[T8]`.

## `t8-ceiling-blind` — perturbs the **KEY**

Spells `ceilingKey` as `last === max` instead of `last >= max`.

| | predicted |
|---|---|
| scored by | `T8KP` (key-level) |
| `T8KP` | **RED** — the `above` row misses: `ceilingKey(467, 464)` returns `false` under `===`, want `true` |
| `T8` | **unchanged, still REFUSED** — live state sits on the `equal` row (lastUnion 467, popMax 467) where both spellings agree |
| `red=` | `[T2b,T8KP]` |
| `refused=` | `[T8]` |

**The prediction that matters is the second row.** This arm separates through the
known-positive *alone*. If the only check on the ceiling key were T8's own verdict, this mis-key
would ship green — which is why the KP is on synthetic operands and not on live state.

## `t8-unpinned` — perturbs the **SUBJECT**

Appends a synthetic counting-population member above the union arm's last curing round.

| | predicted |
|---|---|
| scored by | `T8` (subject-level) |
| `T8KP` | **unchanged, ok** — the key is untouched, so a key-level KP structurally cannot see this arm |
| `T8` | **REFUSED → RED** — the ceiling lifts, both operands move, and the one-sidedness shows: dir 3 vs union 1 |
| `T2c` | ok — active figure 3 vs dir surface 0, still different |
| `T2b` | RED — dir fired still false, self-attested still true |
| `red=` | `[T2b,T8]` |
| `refused=` | `[]` |

This is the arm that grades the refusal introduced in design note 11: it shows T8 is refusing for
a removable reason and not because it was quietly turned off.

## `t9-insensitive-leg` — perturbs the **REGISTRY** (subject of T10's gate)

Registers a figure reader whose verdict ignores its argument.

| | predicted |
|---|---|
| scored by | `T10` |
| `T10` | **RED** — `insensitive=[T10CRIPPLE]` |
| `T10COUNT` | MEAS, `n=3` unchanged (the stub is insensitive, so it does not join `sensitive`) |
| `red=` | `[T2b,T10]` |
| `refused=` | `[T8]` |

## Expected member loss, written down first

Across the three arms the **union** of legs that move from the clean arm is
`{T8KP, T8, T10}` — one per arm, no overlap. An arm that moves a leg outside its own row is a
miss and gets recorded as one rather than tidied.
