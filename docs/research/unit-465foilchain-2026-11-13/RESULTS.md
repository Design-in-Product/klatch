# Results — `unit-465foilchain-2026-11-13`

**Seat:** Theseus · **Fire:** 2026-11-13 WORK · **Model:** claude-opus-5
**Subject:** `docs/research/lib/attested-rounds.mjs` @ `a5667195` (blob `fb6278e1e826`, asserted
equal to the worktree file by `A-src`) — Daedalus's **cure 5**, `S6_FOIL_CHAIN` plus the
witness/order/identity loops in `selfTest()`.

| push | what |
|---|---|
| `1b32df6a` | PRE-REGISTRATION.md — 13 predictions, **before any arm in this unit existed** |
| `561b11e0` | `arm-foilchain-a.mjs` + `drive1.arma.out` / `.err` |

```
drive1.arma.out  VERDICT/1 RED legs=16 red=[D3] refused=[] preds=13 refuted=[P11] prefused=[]
drive1.arma.err  0 bytes
```

**12 of 13 predictions held. The single refutation is my own census key, not his cure** (§4).

## 1. What reproduces — his `D1` and his `D4` at length 2

`A0` is a matched baseline (byte-changed, semantics untouched): `selfTest() → true`, so every throw
below is attributable to its cripple. `A-land`: every patch applied **exactly once** — the patcher
throws on a match count other than 1 rather than returning an unchanged string, because a cripple
that did not land and a guard that is genuinely dead read identically from outside.

- `A1` — dropping `…workaround-2026-04-18.md` (the **present** case) throws
  `S6_FOILS.separatorTolerant has no witness that S6_FOILS.boundaryFree refuses`. His `D1`, reproduced.
- `A2` — dropping `…workaround2026-04-18.md` (the **synthetic** case) throws naming `boundaryFree`
  and **`the live key`**. The last link's successor really is the live boundary.
- `A3` — the 2-chain reversed throws via the **witness** check and the word `misordered` never
  appears. His `D4`, reproduced exactly as he declared it.

His cure works, and it works for the reason he gives: each link's witness is load-bearing, and the
first shape of the cure (`T4p`) could not have said that.

## 2. THE FINDING — the order check is dominated at length 3 too, so "kept for 3+" is false

His `D4` records the order check as *dominated at length 2* and **"kept for 3+ or non-nested
foils."** Arm B drives length 3 with a strictly nested family: `separatorTolerant` ⊃ `boundaryFree`
⊃ `workaroundOnly` (`/^docs\/mail\/.*workaround(\d+)/i`), plus one added synthetic near-miss
(`docs/mail/read/x-turnaround2026-04-18.md`) so the middle link has a witness of its own.

```
B0  three nested foils, CORRECT order      selfTest() → true            ← baseline, so B1 is attributable
B1  the adjacent pair MISORDERED           THROWS: "S6_FOILS.workaroundOnly has no witness
                                            that S6_FOILS.boundaryFree refuses"   · no "misordered"
```

**The mechanism, and why the length is irrelevant:** a misordered adjacent pair `(narrow, wide)`
with `narrow ⊂ wide` means every path `narrow` claims, `wide` claims too — so *"a case this link
claims and its successor refuses"* is **unsatisfiable at that link**, and the witness loop, which
runs first, throws there. This is true at **any** chain length, not just 2. Length was never the
variable; **nesting** was. The order check cannot fire for a nested misordering at 3, at 4, or at
any length — and nested is the only family the module has.

## 3. THE SECOND FINDING — the state that does reach the order check has no correct order

If nesting is what blinds it, the order check is live only for an **incomparable** (crossing) pair.
Arm C builds one — `mailDash: /^docs\/mail\/.*round-(\d+)/i` and
`researchRound: /^docs\/research\/[^\/]*\/round(\d+)/i` — and drives **both permutations**, which
for a two-element family is the exhaustive enumeration:

```
C1  [mailDash, researchRound]   THROWS "S6_FOIL_CHAIN is misordered: researchRound claims
                                 "docs/research/unit-999x/round999-notes.md" and mailDash does not"
C2  [researchRound, mailDash]   THROWS "S6_FOIL_CHAIN is misordered: mailDash claims
                                 "…workaround-2026-04-18.md" and researchRound does not"
```

Both orders red. The witness loop passes in both (each key has a case the other refuses), so the
order check really is the guard that fires — and its message says `misordered`, which names a
remedy that **does not exist** for the only family that can reach it: there is no permutation of an
incomparable pair in which neither claims something the other refuses. The check is sound as a
*refusal* — a crossing family cannot be a chain, and saying so is right — but its reason string
tells the next hand to reorder, and reordering cannot help. The repair is a reason string, not a
predicate: *these two keys are incomparable, so they cannot form a chain; split them or drop one.*

**Stated as a limit:** this is a 2-member enumeration. It does not show that no 3+ family reaches
the order check with a correct order available; a family that is nested at one link and crossing at
another is not measured here.

## 4. THE THIRD FINDING — every link is guarded and the declaration is not

The chain asserts a witness per **declared** link. Nothing puts a floor under the declaration:

```
D1   S6_FOILS = { boundaryFree },   chain ['boundaryFree']   selfTest() → true
D2   S6_FOILS = {},                 chain []                 selfTest() → true
D2b  …and that same text still carries classifyPath's own sentence
     "Both foils are in `S6_FOILS` and `selfTest` requires a live case each one claims
     and this key refuses."                                   sentence present=true, foils declared=false
```

`D2` is green because every assertion is a quantifier over the declared set: the permutation check
(`0 === 0`, `every` over nothing), the witness loop, the order loop and the identity loop are all
**vacuously satisfied by the empty family**. This is `T4p` one surface up. His own comment argues the
set-key beats a count because *"a count in an assertion has to be edited by the same hand that adds
the foil it was supposed to catch"* — true on the **add** side, and the **remove** side is where a
count would have been the stronger guard. `S6_FOILS.length >= 2`, or a floor keyed on the two
rejected spellings by name, would redden on `D1` and `D2`; the set-key cannot.

**What is NOT lost, stated so the finding isn't oversold:** the live key's own coverage is untouched
by `D2` — `SOURCE_IDS` still declares `S6`, the per-case loop still grades the `round9` positive and
every near-miss, so the key is still tested. What vanishes silently is the **executable record of
what was rejected**, which is the whole thing cure 5 exists to hold, together with a live sentence
in `classifyPath` asserting it is still there.

## 5. The refuted prediction is mine, and it is a census key again

`P11`/`D3` predicted zero files naming `S6_FOILS`/`S6_FOIL_CHAIN` outside the module, his unit, this
unit and `docs/mail/`. **11 files name them at `a5667195`; 2 are outside that list** —
`docs/COORDINATION.md` and `docs/logs/2026-11-13-daedalus-log.md`. Both are prose records that
assert nothing and cannot redden, which is *why* the finding stands; but the exclusion list I wrote
was the list of surfaces I happened to think of, and a census whose key is "the places I expected"
is the shape I have now been refuted on twice in two fires. The repair is to key the exclusion on
the **property** (does this file execute?) and let prose fall out as a named class, not to add two
more paths to a literal list.

The three instruments that do read them are his own `arm-routecure-b/c/d.mjs`.

## Not driven, named rather than implied

`arm-routecure-d.mjs`'s `D0b` reads the **live** chain and asserts
`witnesses.every(Boolean) && new Set(witnesses).size === witnesses.length`, and its per-link loop is
`for (let i = 0; i < CHAIN.length; i += 1)`. Read off those literals, an empty live chain would make
`D0b` green on an empty array and emit **zero** per-link legs. **That is a reading of the source,
not a drive** — no arm in this unit ran his instrument against a crippled live module, and the
reading is therefore unverified. Claimable, no blocker: point a scratch copy of his arm at a
`D2`-crippled module and record what it publishes.

## Not claimed

- `A-gate`: `git status --porcelain docs/research/lib packages scripts` **empty** — the live module
  is **not edited** by this unit, no gate leg is owed and none is claimed. Everything new is under
  `docs/research/`, which `typecheck:scripts` does not cover and `readdirSync('scripts')` cannot see.
- Census hook **CENSUS OK — 155 / 45 / 110** on both pushes.
- Every cripple sourced from a **committed** rev (`a5667195`), with `A-src` asserting the sourced
  blob is byte-identical to the live file and `A-marker` asserting the cure is present in those
  bytes. This unit cures nothing, so the two-provenance hazard of his §3 does not apply — stated so
  the absence is recorded rather than assumed.
- Scratch under `docs/research/unit-465foilchain-2026-11-13/scratch/a/`, `git check-ignore`d via
  `.gitignore:60`.
- No commit subject in this unit names a round number.
- Delivery is the wrapper's to log, not mine to assert.
