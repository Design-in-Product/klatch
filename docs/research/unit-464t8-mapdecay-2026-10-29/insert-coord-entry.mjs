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
 * Carried forward from `unit-464t8-2026-10-29/insert-coord-entry.mjs`, same gates.
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
  "- **STOP-CONDITION VALUE (standing line, reported every fire) — RE-DRIVEN 10/29 STOP, independently"
  + " of Theseus's WORK drive, and UNCHANGED.** Driven, not retyped"
  + " (`docs/research/unit-464t8-mapdecay-2026-10-29/drive1.clean.out` at the rev in that unit's"
  + " `baseline.rev`, `ec0db7f7`): **dir key: last 464, consecutive 2, N=5 → NOT FIRED** ·"
  + " **self-attested key: last 454, consecutive 12, N=5 → FIRED** · **union key: last 467,"
  + " consecutive 0 — still PINNED at the population ceiling, so `T8` still REFUSES.** The whole"
  + " verdict line is byte-identical to Theseus's `unit-464t2b-sat-2026-10-29/drive2.clean` at"
  + " `2cf37348`: `VERDICT/1 RED legs=26 red=[T2b] refused=[T8] preds=10 refuted=[P7,P2] prefused=[]`."
  + " **Adopted reading unchanged: FIRED at 12 against N=5**, quotable only with the key named."
  + " **The countdown Theseus raised is reproduced here: `T2b`'s pin arm sits 3 below the population"
  + " ceiling** — three more attested rounds above 464 with no gated cure make the leg the standing"
  + " line is quoted from refuse, and `T2bSAT` prints that distance on every drive so it cannot arrive"
  + " unannounced.",

  "- **10/29 STOP — Theseus's §5 stamp item done, and the finding is that a verdict-keyed cripple map"
  + " under-reports at its OWN filing rev, not only after it.** Unit"
  + " `docs/research/unit-464t8-mapdecay-2026-10-29/` (commits `8b5f570f` pre-registration, `17d57504`"
  + " the work, `b92bd98b` the memo): 4 re-drives of the cell, 3 footprint drives, 1 cripple arm on my"
  + " own instrument, 5 predictions filed in their own commit **before** anything ran. (1) **His §3"
  + " table reproduces at a different rev** — I drove at `ec0db7f7`, he drove at `2cf37348`: `+T2bKP`"
  + " under `t8-ceiling-blind`, `+P12` under `t8-unpinned`, `t9-insensitive-leg` identical, and I"
  + " checked `t9` at the *figures its map named* as strings rather than at the verdict line. (2) **The"
  + " stamp is on** `unit-464t8-2026-10-29/cripple-maps-predicted.md`: filing rev `df8c3b5f`, cell size"
  + " at filing `legs=22 preds=8`, both deltas, pointer to the new unit; the three recorded tables"
  + " unchanged, the stamp above them. (3) **The finding.** I filed an 18-cell hand reading (6 new"
  + " members × his 3 arms) and drove an instrument to grade it: **18 of 18 match**, and verdict"
  + " movement is a **strict subset** of detail movement — `verdictMoved=2 detailMoved=4 violations=[]`."
  + " The 2 cells a verdict-keyed map cannot name are both `T2bSAT`, a `[MEAS]` leg with **no verdict to"
  + " move**, whose detail line moves under both `t8` arms. Every map in both seats' units is keyed on"
  + " `red=`/`refused=`/`refuted=`, so the under-report is a property of the **key**, present at the"
  + " filing rev, and **invisible to exactly the re-drive-and-compare his §3 prescribes for staleness**."
  + " The two deficiencies run in opposite directions: a stale map over-reports, a verdict key"
  + " under-reports. (4) **I went looking for a hole in his new `T2bORACLE` and there isn't one** —"
  + " predicted in writing that it would not move under `t8-ceiling-blind` and that this was correct:"
  + " the oracle recomputes the token (count-above, threshold at N), never calls `ceilingKey`, and the"
  + " guard is `T2bKP`'s to grade, which it does. Recorded as a landed prediction because a non-moving"
  + " leg nobody keyed on reads the same as one that stopped working.",

  "- **10/29 STOP — my own new instrument was blind to every REFUSED leg, and the gate it was green"
  + " under is a shape in both seats' units.** The first version of `map-decay-footprint.mjs` listed six"
  + " of the cell's seven printed status labels and omitted **`REF `** (branch literals at"
  + " `grade-the-stop-condition.mjs:1678` legs / `:1684` predictions), so it could not see `T8` — the"
  + " leg this entire round is about. Caught by its own printed count disagreeing with the cell's: `29`"
  + " against `22+8=30`, `35` against `26+10=36`. **The carry-forward: `GDELTA` was green under the"
  + " blindness and still is.** A blind reader is off by the same constant in both recordings, so the"
  + " error cancels in a difference — two counts taken with one blind reader agree **vacuously**, and a"
  + " delta gate written to check my population against the subject's own delta could not have failed."
  + " `GABS` (the **absolute** count per recording) is what catches it, and"
  + " `--cripple=labels-miss-refused` drives the distinction rather than asserting it:"
  + " `drive7.cripple-labels-miss-refused.out` prints `GABS RED` beside `GDELTA ok`. **Any gate that"
  + " compares a reader's delta against the subject's delta is immune to a constant blindness in that"
  + " reader** — and the re-drive comparisons this round rests on are deltas. The `KP` row that reddens"
  + " is keyed on `ALL_STATUS_LABELS`, never on the crippled list: a row built from the same list the"
  + " reader uses tests the crippled list against itself and is green under the cripple it exists to"
  + " catch. One sentence of my pre-registration's rationale was also wrong — I wrote that the reader"
  + " over-counted; it under-counted — corrected in `RESULTS.md` §4 and flagged above the unchanged"
  + " rows in `predicted.md`, not edited into them.",

  "- **Drain (2026-10-29 STOP fire):** *Done, bounded* (Klatch is a recorded exception to the fleet"
  + " duty-cycle-drain baseline; CLAUDE.md — checklist, act, write it down, stop). Synced by the"
  + " wrapper; **authorship of the head commits read with `%an` before assuming any was mine** — and it"
  + " mattered again: the three commits at the head of my worktree (`ec0db7f7`, `a1abf9ba`, `a7c44cb7`)"
  + " are **Calliope**'s and **Theseus**'s, all carrying '10/29' subjects that read like my own; my last"
  + " commit before this fire was `271d6ef9` at 13:32. `docs/COORDINATION.md` read. `docs/mail/` read on"
  + " arrival, not batched — **one memo new to this seat** (Theseus's 10-29 WORK reply, filed 14:58,"
  + " after my MID fire closed), it routed **one** item here and **this fire is that item**, acted on in"
  + " the same turn as the read with the reply filed and pushed rather than promised. Thread left"
  + " **open** in `docs/mail/` rather than moved to `read/`: open items on both sides — his `C3`,"
  + " `xcheck-wrong-figure`, `G7`; mine the map-convention re-key, named claimable rather than claimed."
  + " *Deferred, each with a named blocker:* **collapsing the population cell's inline reader into the"
  + " lib** — blocker unchanged, wants a byte-identity gate against that cell's 13 recorded drives, its"
  + " own unit; **the SDK major bump** `0.122 → 1.3.0` — blocker unchanged, wants its own unit with the"
  + " streaming path driven; **the 8 non-zero exits and the 2 `spawn`-hazard instruments from Round"
  + " 453** — unchanged, neither seat's, no new information this fire. **Not taken, no blocker, named so"
  + " it stays claimable:** re-keying the cripple-map convention so a map names *reached* members"
  + " (detail movement) rather than *verdict* members, with the `legs=`/`preds=` stamp machine-checked"
  + " at compare time rather than read by eye — §3 of his memo gives the shape, this unit gives the"
  + " instrument, nobody has changed the convention. **Needs-you unchanged at 1:** whether the track"
  + " stops and re-scopes — xian's, and the `T2b` countdown at distance 3 is now surfaced in both the"
  + " standing line above and §4 of the memo so it is visible before that call rather than after it."
  + " **Not run this fire:** `npm test`, `npm run typecheck`, the sweep —"
  + " `git status --porcelain -- packages/ scripts/` **empty** (verified), so every commit is"
  + " `docs/`-only. Nothing left running.",
];

const out = [...lines.slice(0, anchor + 1), ...INSERT, ...lines.slice(anchor + 1)];
writeFileSync(PATH, out.join('\n'));

// Re-read and assert the insert is inside my section and nowhere else.
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
