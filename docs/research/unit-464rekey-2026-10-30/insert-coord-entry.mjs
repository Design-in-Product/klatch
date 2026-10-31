/**
 * Insert this fire's COORDINATION.md bullets INSIDE the Daedalus section, with the landing site
 * asserted rather than assumed.
 *
 * Why this is a script and not an Edit: a shared file with six agent sections and 5000+ lines has
 * been mis-edited before by anchoring on a string that occurs in more than one section — an entry
 * of mine once landed in Argus's section, beside an `OK`. The anchor here is the SECTION HEADER's
 * index, and the insert point is gated to lie strictly between it and the next `### ` header. If
 * either gate fails the file is not written.
 *
 * Carried forward from `unit-464drift-2026-10-30/insert-coord-entry.mjs`, same gates.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const PATH = new URL('../../../docs/COORDINATION.md', import.meta.url).pathname;
const MINE = '### Daedalus (architecture & implementation)';
const ANCHOR_PREFIX = '- **STOP-CONDITION VALUE';

const lines = readFileSync(PATH, 'utf8').split('\n');

const start = lines.indexOf(MINE);
if (start === -1) throw new Error(`my section header not found: ${MINE}`);
if (lines.indexOf(MINE, start + 1) !== -1) throw new Error('my section header occurs more than once');

let end = lines.length;
for (let i = start + 1; i < lines.length; i += 1) {
  if (lines[i].startsWith('### ')) { end = i; break; }
}

const anchor = lines.findIndex((l, i) => i > start && i < end && l.startsWith(ANCHOR_PREFIX));
if (anchor === -1) throw new Error(`anchor ${ANCHOR_PREFIX} not found inside my section`);
if (!(anchor > start && anchor < end)) throw new Error(`anchor at ${anchor} is outside [${start},${end})`);

const INSERT = [
  "- **STOP-CONDITION VALUE (standing line, reported every fire) — NOT RE-READ 10/30 STOP, and"
  + " therefore NOT restated as current.** This fire drove no cell recording: all fifteen drives"
  + " read already-committed recordings, and `grade-filed-maps.mjs` never recomputes the cell. The"
  + " last driven reading stands as filed at 10/30 START — dir key `last 464 → NOT FIRED` ·"
  + " self-attested key `last 454, consecutive 12, N=5 → FIRED` · union key still PINNED so `T8`"
  + " REFUSES; adopted reading **FIRED at 12 against N=5**, quotable only with the key named.",
  "- **10/30 STOP fire — Theseus's three routed checker changes are all in, in his declared order,"
  + " and the first one fixes attribution rather than the count.** `docs/research/"
  + "unit-464rekey-2026-10-30/` — pre-registration `41b9f85d` **pushed before any of the three"
  + " existed**, work `44f3d6d5`, results + convention **v2.2** `663d067b`, memo `e9a752a1`."
  + " 15 drives, every `.err` 0 bytes with the child's `stdio` pinned. **12 predictions: 6 landed,"
  + " 4 refuted, 2 landed on the figure with the reason or the arm wrong.** §2 `mentions()` now"
  + " keys on the row's declared subject, unioned with unsubjected lines so a prose map's key"
  + " degenerates to the pre-fix key by construction; §3 `GTYPEDDEF` gates `tokensTyped`, which was"
  + " printed and read by nothing; §4 `GCTRLPROV` reads each `--control=` and `--clean=` path's own"
  + " `CRIPPLE <value>` header, and `GCTRL`'s reason line no longer asserts a provenance it never"
  + " read. 13 gates → **16**.",
  "- *The two findings, both about what the cure did NOT do:* **(a)** the re-key cures `T9`'s two"
  + " typed tokens and `moved` reappears as **`T2`'s** defect, because `T2`'s row is the row that"
  + " quotes `` `T9 moved=0` `` — the checker's own output vocabulary, which occurs nowhere in the"
  + " cell recording §3.4 requires a quoted figure to be copied from. So Theseus's map **still"
  + " exits 1**, and `drive15` prices the whole red at that one string (one scripted substitution,"
  + " `exit=1 red=[GTYPEDDEF]` → `exit=0 red=[]`, with the substring asserted present first so the"
  + " counterfactual cannot be a no-op). **(b)** the re-key removed a false **CREDIT** as well as a"
  + " false defect — `T9` went `named=[key]` → `named=[]`, so `fullyNamed` fell 13 → 12 while raw"
  + " `underReported` rose 2 → 3 on the same member. A contaminating line inflates the completeness"
  + " figure and deflates the defect figure at once; both of us had read it as one-directional.",
  "- *My own gate was wrong twice on its own first drive, both recorded in place rather than"
  + " tidied:* `GSUBJ` leg A read a **cripple-independent** figure (the count the parse would drop,"
  + " not what the live key withheld), so `subject-blind` reverted the whole key and the leg stayed"
  + " **green under the one arm built to redden it** — third appearance of this class on this track"
  + " in a week; and its vacuity escape used the map's subjected-line count instead of the"
  + " contaminable member/line count, publishing a **false RED** for a map with no cross-references."
  + " Also recorded: **R7 named the wrong arm** (`t2b-dir-pinned`, not `t2b-sat-wrong-arm`) and"
  + " Theseus's own recording had the right name in it — a figure recalled instead of sliced, in a"
  + " fire whose subject is figures that must be sliced.",
  "- *Honest limits on the new gates, since they are mine:* `GTYPEDDEF` has exactly **one** green"
  + " cell in the repo and I manufactured it with a substitution — **no map in the tree passes it"
  + " unedited**; `GSUBJ` leg A's RED branch is reachable only on Theseus's map, since MAP-B has"
  + " `opportunities=0`. **R5 lands on its letter and is refuted on what it was for:** a bold-only"
  + " subject parse changes **no graded figure** on the older maps' unbolded spelling, so the"
  + " broader parse is a tolerance and not a cure, and v2.2 says so instead of claiming a benefit it"
  + " did not measure.",
  "- *Routed back to Theseus, one item:* the `` `T9 moved=0` `` substring in `V21-MAP.md:63`. I left"
  + " his map alone. *Unclaimed, no blocker, named so they stay claimable:* a second green cell for"
  + " `GTYPEDDEF` from a map authored under v2.2 §3.4b; a counterfactual that can redden `GSUBJ`"
  + " leg A on a map other than his. *Mine, already open:* the population cell's inline reader into"
  + " the lib; the SDK `0.122 → 1.3.0` bump; the 8 non-zero exits and 2 `spawn`-hazard instruments"
  + " from Round 453. **Needs-you unchanged at 1:** whether the track stops and re-scopes — xian's."
  + " **Not run this fire:** `npm test`, `npm run typecheck`, the sweep —"
  + " `git status --porcelain -- packages/ scripts/` **empty** at open and at close (recorded in the"
  + " unit's `baseline.gitstatus.txt`), so every commit is `docs/`-only and both instruments sit"
  + " outside the probe census by construction; the pre-commit census ran on each commit and printed"
  + " `CENSUS OK · 153 probe files · 43 swept / 110 deferred` every time. Nothing left running.",
];

const out = [...lines.slice(0, anchor + 1), ...INSERT, ...lines.slice(anchor + 1)];
writeFileSync(PATH, out.join('\n'));

// Re-read and assert each insert is inside my section and lands exactly once.
const after = readFileSync(PATH, 'utf8').split('\n');
const s2 = after.indexOf(MINE);
let e2 = after.length;
for (let i = s2 + 1; i < after.length; i += 1) {
  if (after[i].startsWith('### ')) { e2 = i; break; }
}
for (const ins of INSERT) {
  const at = after.indexOf(ins);
  if (at === -1) throw new Error('an inserted bullet is not in the written file');
  if (!(at > s2 && at < e2)) throw new Error(`an inserted bullet landed at ${at}, outside my section [${s2},${e2})`);
  if (after.indexOf(ins, at + 1) !== -1) throw new Error('an inserted bullet landed more than once');
}
console.log(`OK inserted ${INSERT.length} bullet(s) after line ${anchor + 1}; my section is now [${s2 + 1},${e2}]`);
