# unit-467importprice — RESULTS, arm B

The hop keyed on the **FILE**, the probe side keyed on the **IMPORT**. Continues `RESULTS.md`
(arm A) and takes arm A's own declared blind spot (§2 there) in the same fire rather than boarding
it.

**Pre-registration:** `PRE-REGISTRATION-B.md`, pushed to `origin/main` as **`9cb52037`** before
`arm-importprice-b.mts` existed.

| drive | verdict (verbatim from the captured file) | `.err` |
|---|---|---|
| 3 | `VERDICT/1 ok legs=9 red=[] refused=[] preds=6 refuted=[Q6] prefused=[]` | 0 bytes (`wc -c`) |
| 4 | `VERDICT/1 ok legs=10 red=[] refused=[] preds=6 refuted=[Q6] prefused=[]` | 0 bytes (`wc -c`) |

Same verdict on both drives, and **that is why both are kept**: drive 3's zero price was *vacuous*
and drive 4's is not. See §3.

## §1 `Q3` LANDED — the reach set is 3, re-derived at file level

`M = [claude/client.ts, routes/files.ts, routes/messages.ts]` over **46** non-test `.ts` files, with
the sites printed per file rather than counted: `routes/files.ts` at **189, 200**;
`routes/messages.ts` at **113, 137, 174, 254, 290**. That agrees with arm A §2's hand `grep`
**file-for-file and site-for-site** — so that correction is now a derived leg rather than a hand
read, and arm A's `S2 = 0` is confirmed as a reader artefact, not a product fact.

## §2 The live exposure is one probe, and it is already refused

**Exactly 1 of the 155** probes imports a member of `M`:

```
probe-round170-floor-frequency.mts:257
  const { assembleSystemPrompt } = await import('../packages/server/src/claude/client.js');
  hazards=[net+db]  nonExempt=[net]  drivable=true  MOVER=false
```

Two independent things make it harmless: it is already `not driven (net)` under today's detectors,
**and** what it imports is `assembleSystemPrompt` — a prompt builder, **not** a member of `S1` — so
it does not reach the model at all. `Q4` LANDED (the import side is not zero), `Q5` LANDED
(movers < hits), **`Q6` REFUTED — price 0**, the direction registered as expected: the import-route
cure is **prospective and free** at both granularities measured today.

## §3 FINDING AGAINST MY OWN INSTRUMENT, the second in one unit: the mover predicate was VACUOUS

Drive 3 carried arm A's mover test over unchanged —
`drivable && nonExempt.length === 0 && !literalOnly`. Arm A's key matches a **call**. Arm B's key
matches an **import specifier**, and *an import specifier IS a string literal*: blanking string
literals necessarily removes it, so `literalOnly` is **vacuously true for every hit this key can
ever produce**, and the `!literalOnly` conjunct made `movers` **structurally empty**. Drive 3's zero
was right by accident and **could not have come out any other way** — no corpus, no new probe and no
future regression could have moved it.

`B4b` now measures the vacuity instead of asserting it (`all 1 hit(s) are literalOnly`), and drive
4's corrected predicate (`drivable && no non-exemptible hazard`) reports the same 0 **for a reason
that can change**: the single hit is excluded because it carries `net`. `KEY_IMP` already requires
an import / `require` / dynamic-`import` **position** by construction, which is precisely the
distinction literal-blanking cannot make — the subject's own docblock makes this argument for
`suite` (`scripts/promote-probes.mts:201-211`, Round 296: *"a subprocess command is necessarily a
string literal, so literal-only cannot distinguish 'scanned corpus text' from 'the argv of a child
process'"*). **Same mechanism, new key shape, and I imported the defect by copying a predicate
across a change of key kind.**

## §4 What this means for the cure

At both granularities measured today the import route prices at **zero movers**, by two independent
keys over the same 155 — call-shape (arm A) and import-specifier (arm B). Argus can take an
import-route detector on exactly the terms he took the `stream` widening.

**Unmeasured and named, not claimed absent:** a two-hop route (probe → module → `M`), and any route
through a declaration form `fnsOf` cannot see — which arm B's file-level key sidesteps for the
*product* side but does not eliminate for the *probe* side.
