#!/usr/bin/env node
// insert-coord-entry.mjs — unit-464authored, 2026-10-31 START fire (Daedalus).
//
// Inserts this fire's bullets into COORDINATION.md, anchored on the SECTION HEADING and
// not on a string: a string anchor put one of my inserts into Argus's section once, and a
// heading is the only thing in that file that identifies a seat. The insert point is the
// last `STOP-CONDITION VALUE` standing line inside my own section, which is where the
// newest fire entry has gone every fire.
//
// The anchor is keyed POSITIVELY on the newest dated fire entry and the insert goes
// immediately BEFORE it, newest-first like every other entry in the section. The first
// version of this script keyed on "the last STOP-CONDITION VALUE standing line in the
// section" and landed the entry at :486 — eleven standing lines down, in the middle of
// October — because "last in file order" is "oldest chronologically" in a newest-first
// list. A `last`-keyed anchor in a reverse-ordered file is wrong by construction.
//
// Refuses rather than guessing: if the section is not found, or no dated fire entry is
// inside it, nothing is written.

import { readFileSync, writeFileSync } from 'node:fs';

const PATH = '../../COORDINATION.md';
const SECTION = '### Daedalus (architecture & implementation)';
const lines = readFileSync(PATH, 'utf8').split('\n');

const start = lines.findIndex((l) => l.trim() === SECTION);
if (start === -1) {
  console.error(`REFUSED — section heading not found: ${SECTION}`);
  process.exit(2);
}
let end = lines.length;
for (let i = start + 1; i < lines.length; i += 1) {
  if (/^### /.test(lines[i])) {
    end = i;
    break;
  }
}
// The FIRST dated fire entry inside this section — the newest one. The insert goes
// immediately before it.
const FIRE_ENTRY = /^- \*\*\d\d\/\d\d [A-Z]+ fire/;
let anchor = -1;
for (let i = start + 1; i < end; i += 1) {
  if (FIRE_ENTRY.test(lines[i])) {
    anchor = i;
    break;
  }
}
if (anchor === -1) {
  console.error('REFUSED — no dated fire entry inside the Daedalus section');
  process.exit(2);
}

const ENTRY = [
  "- **STOP-CONDITION VALUE (standing line, reported every fire) — NOT RE-READ 10/31 START, and therefore NOT restated as current.** This fire drove no cell recording: all five drives plus the probe read already-committed recordings, and `grade-filed-maps.mjs` never recomputes the cell. The last driven reading stands as filed at 10/30 START — dir key `last 464 → NOT FIRED` · self-attested key `last 454, consecutive 12, N=5 → FIRED` · union key still PINNED so `T8` REFUSES; adopted reading **FIRED at 12 against N=5**, quotable only with the key named.",
  "- **10/31 START fire — both items my own 10/30 §7 left open are closed on ONE authored map, and the gate that closes one of them can see 1 of the 20 figures that map quotes.** `docs/research/unit-464authored-2026-10-31/` — pre-registration `fcb2eb30` **pushed to `main` before `V22-MAP.md` existed**, map + drives `5d82f1fb`, results + convention PIN `82961845`, memo `70724a40`. 5 drives + 1 rowless probe + 1 denominator reading, every `.err` 0 bytes with the child's `stdio` pinned, `drive5` byte-identical to `drive1`. Theseus routed **nothing** here, so I took my own two. **`V22-MAP.md` maps arm `t2-dir-only`, which no filed map covered** — not his map with anything done to it — authored under v2.2 including §3.4b throughout: `drive1` `MAPVERDICT/0 ok gates=16 red=[]`, `underReportedArmCaused=[]`, `fullyNamed=8 · fullyCaptured=8` of 10 rows. **§3.4b cost nothing on this map.** `GSUBJ` leg A now has its counterfactual off his map: `drive2` (`subject-blind`) `A/bite RED opportunities=1 but the live key withheld 0`; `drive3` (`subject-rows-only`) `B/non-collapse RED 3 of 10 union-bearing member(s) lost all context: [G1,T9,W1]`. **10 of 10 pre-registered predictions land** — and the pre-registration says in its own words that membership and token values were both read off committed recordings first (a rowless probe map, driven to read the reach set off the real instrument rather than a hand-rolled copy), so only `R1`/`R2`/`R4`/`R5` were genuinely open.",
  "- *The finding, and it is against my own gate:* **`GTYPEDDEF` reads 1 of the 20 distinct `name=value` names the conforming map quotes** — 2 of 30 on Theseus's `V21-MAP.md`, 3 of 31 on its pre-cure baseline, and it scores a map with **no rows at all** green. Cause: `tokensOf`'s left boundary `(?:^|\\s)` is correct on the **recording** side and cannot reach a name preceded by a backtick, which on the **map** side is every name — only the second-and-later tokens inside a multi-token span are visible, which is why `` `T9 moved=0` `` reddened and `` `moved=0` `` alone would not have. **So the red §3.4b was adopted on yesterday was one of three names the detector could see on a section that quotes 31.** Measured by `quoted-denominator.mjs`, whose reader is copied verbatim from the checker and therefore **gated** on the same real slice `GKP` uses, asserting the checker's own published `11 tokens` / `selector=max(pins first)`; it exits 2 and publishes no number if the copy drifts. `R2` is how this surfaced: it predicted the authored green would be non-vacuous, denominator came back **1**, so it lands by its letter and the number refutes what it was written to establish.",
  "- *Two consequences stated so neither is dropped:* **`GTYPEDDEF` has no `VACUOUS` branch** — `GSUBJ`, added the same fire, prints its empty denominator and mine does not, so a rowless map's green cannot be told from an inability to measure (fourth appearance of this class on this track, shipped in the gate added to cure that class); and **`--cripple=typed-ungated` cannot grade the wiring on a conforming map** (`would have flagged 0`), so `R9` landing confirms a limitation rather than grading a gate. **Not cured this fire, deliberately:** a unit that cures its own subject needs its baseline from git, and the `WIDE` reading prices the cure at 28 further exposed names on `V21-MAP.md` including `reachedArmCaused` on an unsubjected summary line — the honest expectation is that a backtick-aware boundary reddens `GTYPEDDEF` on **every filed map, this one included**.",
  "- *One thing no prediction covered:* **§3.4a is a precondition for §3.4b, not a neighbour of it.** `drive2` reddens two gates — `GTYPEDDEF RED 1 typed token(s) [t2-dir-only:n]`, the `n` out of `` `sensitive=[T2,T2c,T2b] n=3;` `` on `T10COUNT`'s row, an **unmoved** figure quoted on the row of the member that emits it. Under the live key: no defect. Under `subject-blind`: `T2b` picks up a typed-token defect it did not write. A §3.4b-conforming map is **defective under the pre-fix key**, which is the strongest case for Theseus's re-key either seat has produced.",
  "- *Corrections to lines below, which are left as written because they were measurements:* my 10/30 STOP \"**`GTYPEDDEF` has exactly one green cell in the repo and I manufactured it with a substitution — no map in the tree passes it unedited**\" is now false twice over (his `drive3.cured-live` at its real path, then this authored map), and so is \"`GSUBJ` leg A's RED branch is reachable only on Theseus's map\". `CRIPPLE-MAP-CONVENTION.md` §3.4b carries a dated **PIN** with the three-column table rather than a rewrite, and §4's `GTYPEDDEF` bullet carries the reach figure, because that bullet is what a map author actually reads. The pin's standing instruction: **§3.4b is writable from the start; do not cite the gate as evidence that anyone obeys it until the map-side boundary is cured.**",
  "- *Mail:* Theseus's 10/30 STOP memo read in full — it routes **nothing** to this seat (\"Yours, routed back from here: nothing\") and its §4 correctly refuses to let his cured map be filed as my authored-green item. All four cross-repo mailboxes checked with `find -newermt` against the 2026-10-30T17:35:20 checkpoint: `designinproduct` 0 new; `mediajunkie` 1 new (exec thanks-the-crew, grepped, 0 klatch/daedalus hits); `dispatch` 4 new (grepped, 0 hits); `piper-morgan-product/mailboxes` 864 new, content-grepped, 6 hits and all six are `MANIFEST.md` index lines tracing to the stale 2026-04/05 cluster already on record. **Nothing owed from any.**",
  "- **Needs-you (xian):** unchanged — whether the track stops and re-scopes. **Nothing this fire moves the verdict:** the cell was not edited and not driven. **Drain:** both unblocked items in my own bucket were taken and closed this fire; three are now open with **no blocker and no deadline** — the map-side token boundary in `tokensOf` (carrying this unit's `WIDE` figures as its price), a `VACUOUS` branch for `GTYPEDDEF` keyed on the quoted-span denominator, and whether §3.4b is writable on a **hard** map whose rows must quote another member's moved figure to explain their own. Deferred with named blockers, unchanged: the population cell's inline reader into the lib; the SDK `0.122 → 1.3.0` bump; the 8 non-zero exits and 2 `spawn`-hazard instruments from Round 453. **Not run this fire:** `npm test`, `npm run typecheck`, the sweep — the pre-commit census printed `CENSUS OK` on each commit, which is not the same thing and is not offered as a gate figure. Log: `docs/logs/2026-10-31-daedalus-log.md`.",
];

console.log(`ANCHOR  COORDINATION.md:${anchor + 1} — ${lines[anchor].slice(0, 90)}`);
lines.splice(anchor, 0, ...ENTRY);
writeFileSync(PATH, lines.join('\n'));
console.log(`INSERTED ${ENTRY.length} bullet(s) BEFORE COORDINATION.md:${anchor + 1} (section starts :${start + 1}, ends :${end})`);
