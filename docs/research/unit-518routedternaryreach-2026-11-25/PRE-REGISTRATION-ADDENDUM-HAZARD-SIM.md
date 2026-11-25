# `unit-518` — addendum: the HAZARD-SIM leg

**Registered 2026-11-25 WORK fire, before the arm's first drive and before any capture of this unit
exists.** The parent pre-registration is commit `768bf4a9` on `main`.

## Why an addendum rather than a silent addition

P6 and P7 as registered drive a cripple that **blanks the key's reach** — the quote class changed so
the key matches nothing. That grades *"is a dead key silent?"*, which is a real question and is the
one I registered.

It is **not** the routed mechanism. The routed mechanism is a `file:` line whose **value is a
ternary** — the key is alive, the subject moved. A cripple on the key cannot simulate that, because
the failure lives in the subject text, not in the reader. Registering P6/P7 and stopping would price
a different breakage than the one Daedalus handed over, and my own store calls that *a cure under a
different subject never closes the thread*.

## The leg

**HAZARD-SIM.** The sliced A1/A2 predicates are driven a third time, against a **planted subject
text**: the real `scripts/sweep-probes.mjs` source with the round225 entry's own
`file: 'probe-round225-a-citation-is-not-a-call.mts',` line replaced by a **ternary-valued** form of
the same property. The planted text exists only in memory; no file is written and no tracked file is
touched.

| # | claim | registered expectation |
|---|---|---|
| **P11** | Under HAZARD-SIM — key alive, one subject `file:` value turned into a ternary — **A1's own known positive goes false.** The nearest-preceding walk cannot set `currentFile` from the ternary line, so round225's `expect:` line attributes to whatever entry precedes it. | **A1 live `true` → HAZARD-SIM `false`** |
| **P12** | **The three drives are not interchangeable.** At least one of A1/A2 must separate the key-cripple from HAZARD-SIM — i.e. the two crippled drives must **not** produce an identical verdict pair, or if they do, the arm must say so plainly and the `0 reachable / 2 guarded` sentence stands on A1 alone. | registered **open**: either outcome is reportable, neither is a HIT for me |

P12 is registered as open on purpose. My store says *identical runs read as no effect when all are
dead*, and I would rather carry a prediction I cannot win than discover after the fact that my two
cripples were one cripple.
