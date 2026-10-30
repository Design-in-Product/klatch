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
 * Carried forward from `unit-464t8-mapdecay-2026-10-29/insert-coord-entry.mjs`, same gates.
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
  "- **STOP-CONDITION VALUE (standing line, reported every fire) — UNCHANGED 10/30 START, and read"
  + " off a drive line in THIS fire's unit rather than retyped from yesterday's prose.**"
  + " `docs/research/unit-464mapkey-2026-10-30/drive11.FINAL-theseus-six-arms.out` prints the clean"
  + " `T2bSAT` payload verbatim on its own `KPSLICE` line:"
  + " `dirLast=464 selfLast=454 popMax=467 pinArm=dir(464) pinDistance=3 freeDistance=13"
  + " pinArmPinned=false freeArmPinned=false assertable=true key=>= selector=max(pins first)`."
  + " So: **dir key: last 464 → NOT FIRED** · **self-attested key: last 454, consecutive 12, N=5 →"
  + " FIRED** · **union key: still PINNED at the population ceiling, so `T8` still REFUSES**."
  + " **Adopted reading unchanged: FIRED at 12 against N=5**, quotable only with the key named."
  + " The cell was NOT re-driven this fire — the figures above are read off both seats' already"
  + " committed clean recordings, whose `VERDICT/1 RED legs=26 red=[T2b] refused=[T8] preds=10"
  + " refuted=[P7,P2] prefused=[]` lines are **byte-identical at two different revs** (`ec0db7f7`"
  + " mine, `b55e4d0b` his), so the cross-seat work below is not confounded by cell size."
  + " **`T2b`'s countdown is 3**, now sourced from a printed slice instead of memory — the"
  + " `KPSLICE` line exists because the first draft of this fire's RESULTS quoted `pinDistance=3`"
  + " with no drive line in its own unit to read it off.",

  "- **10/30 START — the item Theseus left unclaimed is BUILT, both seats' hand grades reproduce"
  + " machine-side, and the two halves of the cure turn out to be ORDERED rather than merely both"
  + " required.** Unit `docs/research/unit-464mapkey-2026-10-30/` (pre-registration `6364fac6`"
  + " committed **before** the instrument existed; work `dad68cf8`; memo `d0086b7e`). Deliverables:"
  + " **`docs/research/CRIPPLE-MAP-CONVENTION.md`** (v2, canonical — there was no such file before"
  + " it; 'the convention' was whatever the previous unit's map looked like, which is how it"
  + " drifted) and **`grade-filed-maps.mjs`** — 8 gates, 4 cripple arms each reddening exactly its"
  + " own gate and no other, 2 refusal probes, 17 recordings, every `.err` 0 bytes checked with"
  + " `statSync`. **(1) Reproduction before correction.** Theseus's published `T2bSAT` summary comes"
  + " out `3/5/1/3/0/3` with `t9-insensitive-leg` the single unmoved arm — identical, token for"
  + " token, off his own committed recordings; his three map rows' unnamed token sets reproduce"
  + " exactly. **(2) THE FINDING THAT GENERALISES: the captured-token half is the SECOND half.**"
  + " Under `--cripple=verdict-keyed-reach`, `tokensTyped` goes **1 → 0** — the token check only"
  + " examines rows for members in the *reached* set, and under the v1 verdict key the `[MEAS]` leg"
  + " carrying the only typed-token defect in the population is not reached. **Had I built his §3.4"
  + " and left the reach key alone, the instrument would have certified his hand-found defect as"
  + " absent.** This was a MISS in my own pre-registered cripple map (I predicted `tokensTyped`"
  + " unchanged under that arm) and is recorded as one, not tidied; it is now an ordering constraint"
  + " in the convention rather than a comment.",

  "- **10/30 START (the findings against my own work) — three of seven predictions FAILED and each"
  + " one sharpened the result.** **(a) P2 landed only after curing a laundering defect of mine that"
  + " reported the opposite.** My first typed-token key asked whether the quoted token occurs"
  + " anywhere in the arm's RECORDING, and printed **`tokensTyped=[] n=0`** — missing the single"
  + " defect the unit was built to catch (`drive1.theseus-maps-PRE-FIX.out`, kept). `pinned=true` is"
  + " quoted of `T2bSAT`, which never emits it, but **`T8CEIL` does, on its own detail line, with"
  + " the same value `true`** — so another member's token laundered the mis-spelling in the way"
  + " hardest to notice: the map's claim is *true of a different member*. **A join key must not"
  + " widen past the property it keys on.** Re-keyed per member; both keys now print side by side"
  + " under a containment gate (`GTYPED`) so the correction stays a comparison — member key 1,"
  + " superseded recording-wide key 0. **(b) P3 wrong in its number only, and the exception is"
  + " mine.** One map row in the whole six-map population scores `fullyNamed` — my `t8-unpinned`"
  + " map's `T2c` row — and it scores it **by PARAPHRASE**: the cell prints `active=3 (key=attested)`"
  + " and my map wrote *'active figure 3'*. `fullyCapturedCells=0` across all six maps, both seats,"
  + " so the one cell that looked better is an artefact of the weaker key. **(c) P4 wrong, and the"
  + " failure separated two axes I had conflated.** Under the v1 key the **membership** under-report"
  + " goes to **0 on every arm** (14 → 0) while the **token** under-report survives (10 → 8) — the"
  + " v1 convention grades itself clean on exactly one axis, and the combined figure I predicted on"
  + " cannot say which. The checker now prints `underReported = membership + tokens` and never as"
  + " one number. **And the membership axis is the LARGER half in both seats' maps** — 14 of 24 in"
  + " his, 14 of 18 in mine: the defect v1 could not see is bigger than the one it could."
  + " **(d) An eighth gate I did not have.** The first version satisfied `GREFUSE` on an absent"
  + " recording and still **exited 0**: a correct refusal is not a complete audit. `GCOMPLETE`"
  + " grades coverage separately now, and the refusal probe exits 1 on it alone.",

  "- **Drain (2026-10-30 START fire):** *Done, bounded* (Klatch is a recorded exception to the fleet"
  + " duty-cycle-drain baseline; CLAUDE.md — checklist, act, write it down, stop). Synced by the"
  + " wrapper; **authorship of the head commits read with `%an` before assuming any was mine** —"
  + " and it mattered again: all five commits at the head of my worktree carry '10/30 START fire'"
  + " subjects that read like mine and **none is** (Argus `902b54bc`, Calliope `db9fa472`, Janus"
  + " `440c7ba2`, Iris `321b8819`, Pard `ff0420e5`). `docs/COORDINATION.md` read."
  + " `docs/mail/` read on arrival, not batched — **one memo new to this seat** (Theseus's 10-29"
  + " STOP reply), it left **one** item explicitly unclaimed here, and **this fire is that item**,"
  + " acted on in the same turn as the read with the reply filed and pushed rather than promised."
  + " **One thread CLOSED and moved to `docs/mail/read/`:** Argus's 10-27 round307/C4 routing memo"
  + " and my 10-28 reply — closed only after **driving the probe this fire** rather than trusting"
  + " the reply: `probe-round307-…mts` exits 0 with `[C4] PASS`, plus `C4a` (minted known positive),"
  + " `C4b` (both JSDoc styles exercised by the live population) and `C4m` (per-module"
  + " characterisation) all PASS. Argus's board still showed that find routed here, so the close is"
  + " the signal. All four cross-repo mailboxes checked by mtime **and** by content grep of every"
  + " new file: designinproduct 0 new, mediajunkie 6 new, dispatch 3 new, piper-morgan-product 1096"
  + " new — **0 `klatch|daedalus` hits in filenames or bodies** across all of them. Nothing owed"
  + " from any. *Deferred, each with a named blocker:* **collapsing the population cell's inline"
  + " reader into the lib** — unchanged, wants a byte-identity gate against that cell's 13 recorded"
  + " drives, its own unit; **the SDK major bump** `0.122 → 1.3.0` — unchanged, wants its own unit"
  + " with the streaming path driven; **the 8 non-zero exits and the 2 `spawn`-hazard instruments"
  + " from Round 453** — unchanged, neither seat's, no new information this fire. **Not taken, no"
  + " blocker, named so it stays claimable:** **no cripple map has yet been AUTHORED under v2** —"
  + " all six in the population are v1 maps graded against a convention published after them, so the"
  + " first v2 map is the first test of whether the convention is *writable* as well as checkable,"
  + " and it wants writing by whichever seat opens the next round rather than retrofitting onto a"
  + " filed map; also **retro-grading the earlier units' maps** (the checker takes them; I drove only"
  + " these two). **Needs-you unchanged at 1:** whether the track stops and re-scopes — xian's, with"
  + " the `T2b` countdown at distance 3 surfaced in the standing line above. **Not run this fire:**"
  + " `npm test`, `npm run typecheck`, the sweep — `git status --porcelain -- packages/ scripts/`"
  + " **empty** at open and at close (recorded in the unit's `baseline.gitstatus.txt`), so every"
  + " commit is `docs/`-only and the new instrument sits outside the probe census by construction."
  + " The one thing driven under `scripts/` was the round307 probe, read-only. Nothing left running.",
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
