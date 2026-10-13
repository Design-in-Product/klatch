# Round 380 instruments

Theseus, 2026-10-12 STOP fire. Grading Daedalus's Round 379 (`5350623e`) — his B1m repair and the
new check `B1` in
`scripts/probe-round377-the-cure-landed-on-the-two-reported-sites-and-the-mechanism-was-live-in-both-files.mts`.

All three are runnable from the repo root, print `GRADE <name>: true|false` lines, and **exit
non-zero if any grade is not `true`** (356) — a figure printed under a failed self-test is not a
reading.

| file | what it does | verdict when driven at `0728e188` |
|---|---|---|
| `measure-b1-legs.mjs` | Re-derives all four of his published figures and both member lists under a key that shares neither his SELECTION (`startsWith` over my own `readdirSync`, not `census()`) nor his DETECTION (scan each source once for `probe-`-initial tokens and intersect with the population, rather than asking the text N questions). KP + KN on the tokeniser. | `ALL 12 GRADES TRUE` — 17/122, 20/153, +3, 0, member list identical |
| `grade-b1-under-rekeys.mjs` | Drives his real file under a control and three mutations, whole-line anchored with the line count asserted `=== 1`, each asserting a predicted observable move so an inert mutation cannot read as "the check cannot catch this". Plus 40 random sub-populations as a monotonicity characterisation. | `ALL 16 GRADES TRUE` — C0 12/12; M1 re-key → **B1 green**; M2 census re-key → B1 sole red on non-emptiness; M3 shape change → B1 sole red on nesting |
| `drive-b1m-history-clause-population.mjs` | Changes **no byte of his file**: copies the whole real `scripts/` tree and edits only OTHER files. Case A breaks one character of every occurrence of one population filename inside `probe-round232` (3 of them). Case B does the same to both only-wider referents tree-wide (21 occurrences, 12 files), which is his §3's first question asked as a known positive. | `ALL 19 GRADES TRUE` — case A: exit 0, 12/12, B1 green, B1m's historical clause prints "published 19 … +2 from 16, which lands on 19"; case B: B1 the sole red at only-wider 0 |

Scratch output lands in `.testdata/round380/` and `.testdata/round380-pop/` (gitignored); each drive
writes its full stdout+stderr beside it, because a verdict read from a pipe is not a verdict (the
`| tail` lesson).

**Note on `grade-b1-under-rekeys.mjs`.** The M2 mutation anchors on the *relocated* import line, not
the line as it appears in `scripts/`. Anchoring on the original spelling threw
`line anchor not unique (0)` on the first drive — the assert catching a mutation that would otherwise
have been a silent no-op, which is the whole reason it counts lines instead of substrings.
