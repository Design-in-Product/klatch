/**
 * The characterisation item is a registry with a two-sided pin — and Round 370's member list of
 * three is four, because a characterisation cell can declare itself on a surface no comment reaches.
 *
 * Round 371, Daedalus, 2026-10-11 (WORK fire). Builds the item Theseus's Round 370 §2 scoped,
 * measured and explicitly did not build ("the registry is **not built**… landing it in the same fire
 * that re-derived its scope is half of two things"). His scope, his detector, one correction to his
 * member list and three findings against my own first version of this probe's controls.
 *
 * ── The history, so the shape is not mistaken for a preference ────────────────
 *
 * Round 366 §3 scoped a SWEEP over every characterisation comment in the repo. Round 370 drove it
 * and the answer was negative for a measured reason, not a judgement about instrument taste: the
 * broad predicate matches 585 comment blocks across 181 of 329 files, because `rather than` and
 * `silently` are how this team writes; `for now` has zero members; and the one
 * `shape-rather-than-intent` member is a CURE quoting the defect it cured, verbatim. A live
 * characterisation and its own cured history are therefore the same text, and precision gets WORSE
 * as the class gets cured, because here a cure writes a longer and more quotable comment than the
 * defect ever did. At n=6 on the `characterising` leg: 3 true, 3 false, every false one a
 * commemoration.
 *
 * What is decidable is not the comment but the CELL — my own Round 366 R8 narrowing, which Theseus
 * under-rated at the time and then drove: don't ask whether a comment describes a defect, ask whether
 * a live cell still asserts the uncured shape. That is what `REGISTRY` in
 * `scripts/lib/characterisation-markers.mjs` declares, and what this probe grades.
 *
 * ── Round 371's correction: his member list of three is four ──────────────────
 *
 * Theseus published `probe-round224:635`, `:1483`, `:1555`, keyed on comment prose. Censused over the
 * comment-blanked source as well, there are TWO more declarations, and one of them is a finding his
 * list does not contain at all:
 *
 *   - `:1558` — cell Q2's own `check()` name, `'CHARACTERISATION (not a blessing — see Q3)…'`. Same
 *     finding as his `:1555`, declared a second time on the other surface.
 *   - `:2028` — cell R5, `'CHARACTERISATION (read only beside R6): three field paths arm Q records as
 *     having ZERO throwers throw on a `Symbol`…'`. A DISTINCT live characterisation, of a different
 *     mechanism (direct template interpolation, not the type-guard class), and its comment block
 *     never says `characteris*` anywhere. Keyed on the comment it is not missed, it is invisible.
 *
 * The mechanism is my own standing failure shape rather than a slip of his: the comment is OPTIONAL
 * metadata for a characterisation cell, what every member must have is a cell, and a population keyed
 * on optional metadata fails by returning a smaller number in silence (Round 352, same lesson, on
 * mail frontmatter). His own §3 correction one level up is the same shape — a marker straddling a
 * line wrap is unrepresentable against per-line spans — which is why `SURFACES.code` splits on `;`
 * at statement level rather than per line: a `check()` name is a `+`-concatenated run across several
 * lines, so a per-line key would split it exactly as per-line spans split his known positive.
 *
 * ── What this probe pins, both ways ───────────────────────────────────────────
 *
 *   - **Side A, liveness.** Every `live` entry's named cell(s) appear in `probe-round224`'s real
 *     stdout EXACTLY ONCE each and are PASS. A cell that stops passing means the defect was cured and
 *     the entry was not retired; a cell that disappears or goes ambiguous means the anchor no longer
 *     identifies it. All three red. The probe is driven as a subprocess and its rows are read — the
 *     claim is about what that probe actually prints, and nothing here re-implements it.
 *   - **Side B, completeness.** The marker-carrying member list over the population must EQUAL the
 *     declared set. An undeclared member reds (a characterisation landed without being declared); a
 *     declared entry matching nothing reds (the comment or cell name moved and the registry went
 *     stale). One-sided on a count would be one rename from unguarded.
 *   - **The key is an anchor, never a line number.** `probe-round224` is another seat's file and is
 *     edited most fires; a line-keyed registry would red on every edit above a declared line, for a
 *     reason that is not the finding. Lines are printed by the drive, matched by nothing.
 *
 * ── Three findings against my own first version, each caught by a control ─────
 *
 *   1. The `line` field on `SURFACES.code` members was a self-cancelling expression
 *      (`…length - …length`) that computed the statement's first line and then added zero. It printed
 *      a plausible number. Caught by reading the figure against `sed`, which is the weaker of the two
 *      ways to catch it; the registry does not key on it, which is the reason it cost nothing.
 *   2. The registry's first version had SEVEN entries and `:1558` was undeclared — my own census
 *      found it, two minutes after I had written a header claiming the member list was complete at
 *      four live entries. A finding declared on two surfaces needs two entries when the key is the
 *      declaration site, and it is keyed on the declaration site deliberately: a finding-level key
 *      would make me decide whether the Q docblock and Q2's one-liner are one characterisation or
 *      two, and that judgement does not belong in a denominator.
 *   3. Side A's matcher was graded only on the live output, where every cell passes. A matcher
 *      checked on nothing but the state it is supposed to accept cannot see its own false negatives
 *      — Round 369 arm A's lesson, one round old. Section G mutates the REAL captured output three
 *      ways and requires each mutation to red.
 *
 * Run:  npx tsx scripts/probe-round371-the-characterisation-item-is-a-registry-not-a-sweep.mts
 *
 * Zero model calls. No server, no port, no DB. Reads the tree and drives one other probe as a
 * subprocess; `packages/` is asserted untouched at exit.
 *
 * NOT claimed:
 *   - That a characterisation hiding inside THIS file would be caught. `SELF_EXCLUDED` removes it
 *     from the population — it discusses characterisations in nearly every comment and in its own
 *     check names, so unexcluded it would be the largest member and drown both sides. The exclusion
 *     is asserted to resolve to exactly one existing file, which guards it against widening; the hole
 *     itself is real and is not guarded by anything.
 *   - That the three `commemoration` entries are still accurately commemorations. They name cures
 *     that landed, so there is nothing uncured for a cell to assert, and they are declared only so
 *     that side B can red on a genuinely new member. If one of those cures regressed, the arm that
 *     notices is the one guarding the cure, in the file that holds it.
 *   - That the 585 broad members are hand-read. Arm D grades the relocated detector against the
 *     member list Theseus RECORDED in Round 370, which establishes the relocation is behaviour-
 *     preserving and says nothing about whether those 585 are true positives. They are not: that is
 *     the finding that made this a registry.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import {
  MARKERS,
  REGISTRY,
  SELF_EXCLUDED,
  SURFACES,
  commentBlocks,
  markersIn,
  population,
  reconcile,
  type RegistryEntry,
} from './lib/characterisation-markers.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const SUBJECT = 'scripts/probe-round224-a-skip-must-not-summarise-as-a-pass.mts';

const results: ProbeVerdict[] = [];
const check = (arm: string, check_: string, pass: boolean, detail = '') => {
  results.push({ arm, check: check_, pass, kind: 'regression' });
  console.log(`${pass ? '[ok]' : 'FAIL'} ${arm}  ${check_}${detail ? ` — ${detail}` : ''}`);
};
const meas = (arm: string, line: string) => {
  results.push({ arm, check: line, pass: true, kind: 'measurement' });
  console.log(`[MEAS] ${arm}  ${line}`);
};

const PACKAGES_BEFORE = execFileSync('git', ['-C', REPO, 'status', '--porcelain', 'packages'], { encoding: 'utf8' });

// ── The matcher, defined once so every arm — live and counterfactual — drives THIS ──
//
// Round 369 §2: a grader that re-spells its subject grades a copy against its author's expectations.
// So the mutation arms in section G call `sideA` on a mutated row list rather than re-deciding what
// a miss looks like.

type Row = { tag: string; arm: string; text: string };

/** `PASS [M] name — detail` rows only. The `REGRESSIONS:` echo has no tag and is deliberately out. */
function parseRows(stdout: string): Row[] {
  const rows: Row[] = [];
  for (const line of stdout.split('\n')) {
    const m = /^(PASS|FAIL|MEAS) \[([^\]]+)\] (.*)$/.exec(line);
    if (m) rows.push({ tag: m[1], arm: m[2], text: m[3] });
  }
  return rows;
}

type SideA = {
  missing: { id: string; cell: string }[];
  ambiguous: { id: string; cell: string; hits: number }[];
  notPassing: { id: string; cell: string; tag: string }[];
};

function sideA(rows: Row[], registry: RegistryEntry[]): SideA {
  const out: SideA = { missing: [], ambiguous: [], notPassing: [] };
  for (const e of registry.filter((r) => r.status === 'live')) {
    for (const cell of e.cells) {
      const hits = rows.filter((r) => r.text.includes(cell));
      if (hits.length === 0) out.missing.push({ id: e.id, cell });
      else if (hits.length > 1) out.ambiguous.push({ id: e.id, cell, hits: hits.length });
      else if (hits[0].tag !== 'PASS') out.notPassing.push({ id: e.id, cell, tag: hits[0].tag });
    }
  }
  return out;
}

const clean = (a: SideA) => a.missing.length === 0 && a.ambiguous.length === 0 && a.notPassing.length === 0;

// ── Section G — the controls, which run FIRST and gate every live figure ──────
//
// Gated on `!== true` rather than on falsiness: a missing key scores `undefined`, and `undefined` is
// not `false` (Round 353/356 — a printed self-test that gates nothing, and a figure that still
// prints beside a guard that fired).

const gates: Record<string, boolean> = {};

// G1 — the self-exclusion resolves to exactly one existing file, and it is this one.
const selfPath = join(REPO, SELF_EXCLUDED);
gates.G1 = SELF_EXCLUDED === relative(REPO, fileURLToPath(import.meta.url)).split('\\').join('/')
  && existsSync(selfPath);
check('G1', 'the self-exclusion names exactly this file, and that file exists — so the exclusion '
  + 'cannot widen to a second file without reddening here', gates.G1 === true,
  `${SELF_EXCLUDED} :: exists=${existsSync(selfPath)}`);

// G2 — the KNOWN POSITIVE and the CONTROL for the second surface, which is the whole correction.
//
// The known positive must CARRY the property (Round 355): the R5 cell of `probe-round224` is a live
// characterisation declared only in its check name. The control must MISS it: if the comment leg
// found it too, the code leg would be a second key over the same population and would agree
// vacuously. `R5` is a cell inside arm `R`, not an arm — `probe-round308` B1 reddened on the other
// spelling of this, in `characterisation-markers.mjs`, and the note there has the detail.
const subjectSrc = readFileSync(join(REPO, SUBJECT), 'utf8');
const R5 = 'CHARACTERISATION (read only beside R6)';
const codeFindsR5 = SURFACES.code(subjectSrc).some((m) => m.text.includes(R5));
const commentFindsR5 = SURFACES.comment(subjectSrc).some((m) => m.text.includes(R5));
gates.G2 = codeFindsR5 === true && commentFindsR5 === false;
check('G2', 'KNOWN POSITIVE + CONTROL: the code surface FINDS the R5 cell and the comment surface MISSES '
  + 'it — so the second leg reads text the first cannot reach, rather than agreeing with it',
  gates.G2 === true, `code=${codeFindsR5} comment=${commentFindsR5}`);

// G3 — side A graded by mutation, against the real captured output.
//
// The anchor is asserted to occur EXACTLY ONCE before anything is mutated (Round 347: a
// `String.replace` that hits a second identical string reddens the wrong cell and the intended
// target is never graded).
const subjectOut = execFileSync('npx', ['tsx', join(REPO, SUBJECT)], { cwd: REPO, encoding: 'utf8' });
const liveRows = parseRows(subjectOut);
const r5Rows = liveRows.filter((r) => r.text.includes(R5));
gates.G3anchor = r5Rows.length === 1;
check('G3a', 'the mutation target occurs exactly once in the real output, asserted BEFORE the '
  + 'mutations — otherwise a mutation lands on a twin and the intended cell is never graded',
  gates.G3anchor === true, `${r5Rows.length} row(s) carry the R5 anchor`);

const flipped = liveRows.map((r) => (r.text.includes(R5) ? { ...r, tag: 'FAIL' } : r));
const deleted = liveRows.filter((r) => !r.text.includes(R5));
const duplicated = [...liveRows, ...r5Rows];

const m1 = sideA(flipped, REGISTRY);
const m2 = sideA(deleted, REGISTRY);
const m3 = sideA(duplicated, REGISTRY);
gates.G3 = m1.notPassing.length === 1 && m2.missing.length === 1 && m3.ambiguous.length === 1;
check('G3b', 'all three mutations of the real output red, each in its own leg: PASS→FAIL reddens '
  + '`notPassing` (cured, entry not retired); the row deleted reddens `missing` (cell renamed or '
  + 'gone); the row duplicated reddens `ambiguous` (anchor no longer identifies one cell)',
  gates.G3 === true,
  `flip→notPassing ${m1.notPassing.length}, delete→missing ${m2.missing.length}, dup→ambiguous ${m3.ambiguous.length}`);

// G4 — side B graded by mutation of the REGISTRY, which is the other direction.
const withoutR5 = REGISTRY.filter((e) => e.id !== 'r224/R5-the-symbol-paths');
const bogus: RegistryEntry[] = [...REGISTRY, {
  id: 'control/an-entry-matching-nothing',
  file: SUBJECT,
  surface: 'comment',
  status: 'commemoration',
  anchor: 'a string that is not in this repository anywhere at all',
  claim: 'a control, not a finding',
  cells: [],
}];
const b1 = reconcile(REPO, withoutR5);
const b2 = reconcile(REPO, bogus);
gates.G4 = b1.undeclared.length === 1 && b1.undeclared[0].text.includes(R5)
  && b2.unmatched.length === 1 && b2.unmatched[0].id === 'control/an-entry-matching-nothing';
check('G4', 'side B reds in both directions under a mutated registry: drop the R5 entry and R5 is '
  + 'reported UNDECLARED by name; add an entry matching nothing and it is reported UNMATCHED by name '
  + '— a member list each way, not a count', gates.G4 === true,
  `undeclared ${JSON.stringify(b1.undeclared.map((u) => `${u.file}:${u.line}`))} / unmatched ${JSON.stringify(b2.unmatched.map((u) => u.id))}`);

const GATE_OK = Object.values(gates).every((g) => g === true);
console.log(`\nGATE: ${GATE_OK ? 'PASSED' : 'REFUSED'} — ${JSON.stringify(gates)}\n`);
if (GATE_OK !== true) {
  // The figures below are not printed at all when a control fails. Round 356: a self-test that
  // prints its verdict and then prints its figure anyway is a figure with no gate on it, and the
  // reader reaches the figure first.
  summariseAndExit({
    probeName: 'probe-round371',
    results,
    skipped: ['every live figure: a section-G control did not pass, so no reading is published'],
  });
}

// ── Section A — side A, liveness, over the live tree ─────────────────────────

const live = sideA(liveRows, REGISTRY);
check('A1', 'every `live` entry\'s named cell appears exactly once in `probe-round224`\'s real '
  + 'stdout and is PASS — the defect each entry declares is still uncured, read off a cell rather '
  + 'than off a comment', clean(live), JSON.stringify(live));
meas('A2', `${liveRows.length} tagged row(s) read from the subject's real output; `
  + `${REGISTRY.filter((e) => e.status === 'live').length} live entries naming `
  + `${new Set(REGISTRY.flatMap((e) => e.cells)).size} distinct cell(s)`);

// ── Section B — side B, completeness, over the live tree ─────────────────────

const recon = reconcile(REPO);
check('B1', 'no UNDECLARED member: every marker-carrying member of the population is in the '
  + 'registry', recon.undeclared.length === 0,
  JSON.stringify(recon.undeclared.map((u) => `${u.surface} ${u.file}:${u.line}`)));
check('B2', 'no UNMATCHED entry: every declared anchor still matches a member, so the registry has '
  + 'not gone stale against a reflowed comment or a renamed cell', recon.unmatched.length === 0,
  JSON.stringify(recon.unmatched.map((u) => u.id)));
check('B3', 'no AMBIGUOUS anchor: each declared anchor matches at most one member in its file, so '
  + 'the key identifies a member rather than silently picking a side',
  recon.ambiguous.length === 0, JSON.stringify(recon.ambiguous));

// ── Section C — the measurements, and the delta against Round 370's list ─────

const pop = population(REPO);
meas('C1', `population ${pop.files.length} file(s) — ${pop.tests.length} test, ${pop.probes.length} `
  + `probe — less ${SELF_EXCLUDED.split('/').pop()} = ${recon.pop.length} read`);

const byMarker: Record<string, number> = {};
let blocks = 0;
for (const f of recon.pop) {
  for (const b of commentBlocks(readFileSync(join(REPO, f), 'utf8'))) {
    blocks += 1;
    for (const k of markersIn(b.text)) byMarker[k] = (byMarker[k] ?? 0) + 1;
  }
}
meas('C2', `the BROAD predicate, reproduced: ${blocks} comment block(s), `
  + `${JSON.stringify(byMarker)} — ${MARKERS.length} legs, and the two large ones are why this is a `
  + 'registry and not a sweep');

const THESEUS_370 = ['635', '1483', '1555'];
const mine = recon.found.map((m) => `${m.surface}:${m.file === SUBJECT ? m.line : `${m.file}:${m.line}`}`);
const liveDecls = REGISTRY.filter((e) => e.status === 'live');
meas('C3', `Round 370's comment-keyed LIVE list was ${THESEUS_370.length} (probe-round224 `
  + `${THESEUS_370.join(', ')}), out of 6 precise comment members of which he read 3 as `
  + `commemorations; this fire's census over BOTH surfaces declares ${liveDecls.length} live and `
  + `${REGISTRY.length - liveDecls.length} commemorations, ${recon.found.length} declarations in `
  + `total — ${mine.join(' | ')}`);
meas('C4', 'of the two code-surface declarations, :1558 restates a finding already on his list (Q2, '
  + 'from its own check name) and :2028 (R5) is a finding absent from it entirely — so the delta is '
  + '2 declarations and 1 finding');

// ── Section D — the relocated detector reproduces Round 370's RECORDED member list ──
//
// Not a count: a member list. `characterisation-sweep-rows.json` is Theseus's recorded output from
// his own drive at `72886c0b`, so this grades the relocation against an artifact that was written
// before it existed. Files added since are out of his population by construction and are compared
// over the intersection of the two file sets, which is stated rather than silently dropped.

const ROWS_JSON = 'docs/research/round370-instruments/characterisation-sweep-rows.json';
const recorded: { file: string; line: number; markers: string[] }[] = JSON.parse(readFileSync(join(REPO, ROWS_JSON), 'utf8'));
const recordedFiles = new Set(recorded.map((r) => r.file));

/**
 * ROUND 396 RE-KEY — the absolute line number is not part of the property this grades.
 *
 * Keyed on `file:line:markers`, D1 went RED at `4a2fccf5` for a reason that had nothing to do with
 * the relocation it grades: Daedalus's `02e395f4` added 16 lines and removed 5 in
 * `probe-round303`, which shifted that file's two `rather-than` markers by +11 (149→160,
 * 657→668) and read as two lost and two gained members while the total stood at 585 = 585 (found
 * by Argus, 10/15 WORK fire; re-driven by Daedalus and by me before this edit). The frozen
 * recording is NOT re-pinned: it was taken at `72886c0b`, before the relocation existed, and
 * editing it to match today's tree converts the control into a restatement of the tree.
 *
 * The key is now file + per-file occurrence INDEX + markers, with both sides ordered by line.
 * Multiplicity and order within a file are kept — a member that disappears, appears, changes its
 * marker set, or changes its position among its file's members still moves the list — and a pure
 * reflow of surrounding lines does not. `D1a` below grades the two keys against each other on the
 * one file this fire's shift is in, so the drop is stated and not silent.
 */
type MemberRow = { file: string; line: number; markers: string[] };
const lineKey = (r: MemberRow) => `${r.file}:${r.line}:${r.markers.join('+')}`;
const indexKeys = (rows: MemberRow[]) => {
  const byFile = new Map<string, MemberRow[]>();
  for (const r of rows) byFile.set(r.file, [...(byFile.get(r.file) ?? []), r]);
  const out: string[] = [];
  for (const [f, rs] of byFile) {
    [...rs]
      .sort((a, b) => a.line - b.line)
      .forEach((r, i) => out.push(`${f}:#${i}:${r.markers.join('+')}`));
  }
  return out;
};

const nowRows: MemberRow[] = [];
for (const f of [...recordedFiles].sort()) {
  if (!existsSync(join(REPO, f))) continue;
  for (const b of commentBlocks(readFileSync(join(REPO, f), 'utf8'))) {
    const ms = markersIn(b.text);
    if (ms.length) nowRows.push({ file: f, line: b.line, markers: ms });
  }
}
const his = new Set(indexKeys(recorded));
const now = new Set(indexKeys(nowRows));
const lost = [...his].filter((k) => !now.has(k));
const gained = [...now].filter((k) => !his.has(k));
check('D1', 'the relocated detector reproduces Round 370\'s recorded member list over the files that '
  + 'list covers, member-for-member and not by count — so the relocation to `scripts/lib/` is '
  + 'behaviour-preserving, graded against an artifact recorded before it existed. Keyed on file + '
  + 'per-file occurrence index + markers (Round 396): multiplicity and order kept, absolute line '
  + 'numbers dropped, because a reflow of an unrelated comment in a swept file is not a change in '
  + 'what this detector finds',
  lost.length === 0 && gained.length === 0,
  `${his.size} recorded / ${now.size} now :: lost ${JSON.stringify(lost.slice(0, 4))} gained ${JSON.stringify(gained.slice(0, 4))}`);

// The drop, stated rather than silent: under the OLD key the same two lists disagree, and the
// disagreement is exactly the file whose length moved. If this ever reads 0 under both keys the
// re-key has stopped doing anything and can go; if it ever reads a file the live tree has not
// reflowed, the line component was carrying something after all.
const hisLines = new Set(recorded.map(lineKey));
const nowLines = new Set(nowRows.map(lineKey));
const lineOnly = [...[...hisLines].filter((k) => !nowLines.has(k)), ...[...nowLines].filter((k) => !hisLines.has(k))];
const lineOnlyFiles = [...new Set(lineOnly.map((k) => k.split(':')[0].split('/').pop()))];
meas('D1a', `under the OLD \`file:line:markers\` key the same two lists differ by ${lineOnly.length} `
  + `member(s) across ${lineOnlyFiles.length} file(s) — ${JSON.stringify(lineOnlyFiles)} — while the `
  + 'occurrence-index key differs by '
  + `${lost.length + gained.length}; totals ${hisLines.size} = ${nowLines.size} either way, which is `
  + 'what makes the difference a reflow and not a content change');
meas('D2', `his recorded list spans ${recordedFiles.size} file(s) and ${his.size} member(s); `
  + `${[...recordedFiles].filter((f) => !existsSync(join(REPO, f))).length} of those files no longer exist`);

// ── Section E — the one thing a reader of the comment alone would get wrong ───
//
// A cheap, two-sided restatement of G2 at the level of the member list rather than one anchor: the
// code surface must contribute exactly the declared code-surface entries, and the comment surface
// exactly the declared comment-surface ones. If a future edit moves a declaration from one surface to
// the other, B2 reds on the anchor and this reds on the split, and the pair localises it.

const declaredBySurface = (s: string) => REGISTRY.filter((e) => e.surface === s).length;
const foundBySurface = (s: string) => recon.found.filter((m) => m.surface === s).length;
check('E1', 'the two surfaces contribute exactly the entries declared on each — comment and code '
  + 'counted separately, because a single total would let one surface lose a member while the other '
  + 'gained one', declaredBySurface('comment') === foundBySurface('comment')
  && declaredBySurface('code') === foundBySurface('code'),
  `comment ${foundBySurface('comment')}/${declaredBySurface('comment')}, code ${foundBySurface('code')}/${declaredBySurface('code')}`);

// ── Section Z ────────────────────────────────────────────────────────────────

const PACKAGES_AFTER = execFileSync('git', ['-C', REPO, 'status', '--porcelain', 'packages'], { encoding: 'utf8' });
check('Z', 'packages/ untouched by this run', PACKAGES_AFTER === PACKAGES_BEFORE,
  JSON.stringify({ before: PACKAGES_BEFORE.length, after: PACKAGES_AFTER.length }));

summariseAndExit({ probeName: 'probe-round371', results });
