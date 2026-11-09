/**
 * `unit-465rekey377` — grade the re-key, against its own pre-cure spelling.
 *
 * The cure is green on the tree it was written against (`drive-1-cured.txt`, All 13, exit 0). That
 * shows nothing by itself: a conjunct that cannot redden is a passed gate either way. What has to be
 * shown is that the cured spelling and the PRE-CURE spelling disagree on exactly one axis — the
 * legitimate move the family pass makes — and agree everywhere the arm must still go red.
 *
 * ## Where each spelling comes from
 *
 * - **PRE** — sliced out of `git show <baseline-rev>:<subject>`. Not re-typed.
 * - **CUR** — sliced out of the live subject file. Not re-typed.
 * - **SHP** — the rejected shape-only alternative. **Hand-typed, and labelled as such in every
 *   row**, because it is a counterfactual that was never shipped and so exists in no bytes to slice.
 *   It is here only to measure the reason it was rejected rather than assert it.
 *
 * Slicing is by anchor with uniqueness ASSERTED (`occ === 1`), the same discipline the subject's own
 * `once()` uses, so a predicate that had moved or been duplicated throws here instead of being
 * silently mis-sliced. `HEADLINE_SHAPE`'s initializer and `agrees`'s body are sliced out of the live
 * file too — if the grader re-typed either, it would be grading its own copy of the cure.
 *
 * Nothing is written and nothing is spawned.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SUBJECT =
  'scripts/probe-round377-the-cure-landed-on-the-two-reported-sites-and-the-mechanism-was-live-in-both-files.mts';
const BASE = readFileSync(join(HERE, 'baseline-rev.txt'), 'utf8').trim();

const grades = [];
const grade = (name, claim, pass) => {
  grades.push({ name, pass });
  console.log(`${pass ? '[ok]' : 'FAIL'} ${name}  ${claim}`);
};
const meas = (name, line) => console.log(`[MEAS] ${name}  ${line}`);

const occ = (hay, needle) => hay.split(needle).length - 1;
/** Slice the one line carrying `anchor`, stripped of its trailing `&&` / `,`, or throw (347). */
const sliceExpr = (src, anchor) => {
  const n = occ(src, anchor);
  if (n !== 1) throw new Error(`anchor not unique (${n}): ${anchor.slice(0, 60)}`);
  const line = src.split('\n').find((l) => l.includes(anchor));
  return line.trim().replace(/\s*(?:&&|,)$/, '');
};
/** Slice the initializer of `const NAME = <init>;`, or throw. */
const sliceInit = (src, decl) => {
  const n = occ(src, decl);
  if (n !== 1) throw new Error(`decl not unique (${n}): ${decl}`);
  const line = src.split('\n').find((l) => l.includes(decl));
  return line.slice(line.indexOf(decl) + decl.length).replace(/;\s*$/, '').trim();
};

const preSrc = execFileSync('git', ['-C', REPO, 'show', `${BASE}:${SUBJECT}`], { encoding: 'utf8' });
const curSrc = readFileSync(join(REPO, SUBJECT), 'utf8');

// ── The sliced material ───────────────────────────────────────────────────────

const PRE_A1 = sliceExpr(preSrc, 'e374.expect.source === String.raw');
const CUR_A1 = sliceExpr(curSrc, 'HEADLINE_SHAPE.test(e374.expect.source)');
const PRE_C1 = sliceExpr(preSrc, "c374Faithful.own === 'All 8 regression checks passed'");
const CUR_C1 = sliceExpr(curSrc, 'agrees(e374.expect, c374Faithful.own)');
// Hand-typed, rejected, never shipped — the one column that is not a slice.
const SHP_C1 = String.raw`/^All \d+ regression checks passed$/.test(c374Faithful.own ?? '')`;

const SHAPE_INIT = sliceInit(curSrc, 'const HEADLINE_SHAPE =');
const AGREES_BODY = curSrc
  .split('\n')
  .find((l) => l.includes('const agrees = (pin'))
  .replace(/^.*=>\s*/, '')
  .replace(/;\s*$/, '');

meas('S1', `PRE A1 sliced as: ${PRE_A1}`);
meas('S2', `CUR A1 sliced as: ${CUR_A1}`);
meas('S3', `PRE C1 sliced as: ${PRE_C1}`);
meas('S4', `CUR C1 sliced as: ${CUR_C1}`);
meas('S5', `HEADLINE_SHAPE initializer sliced as: ${SHAPE_INIT}`);
meas('S6', `agrees body sliced as: ${AGREES_BODY}`);
meas('S7', `SHP, HAND-TYPED and never shipped: ${SHP_C1}`);

// eslint-disable-next-line no-new-func
const agrees = new Function('pin', 'own', `return (${AGREES_BODY});`);
// eslint-disable-next-line no-new-func
const HEADLINE_SHAPE = new Function(`return (${SHAPE_INIT});`)();
const evalIn = (expr, scope) =>
  // eslint-disable-next-line no-new-func
  new Function('e374', 'c374Faithful', 'HEADLINE_SHAPE', 'agrees', `return (${expr});`)(
    scope.e374,
    scope.c374Faithful,
    HEADLINE_SHAPE,
    agrees,
  );

// ── The cells ─────────────────────────────────────────────────────────────────

const H = (n) => `All ${n} regression checks passed`;
const entry = (expect) => ({ expect });
const drive = (own) => ({ status: own === null ? 1 : 0, failed: [], own });

/**
 * [name, pin, printed-headline, PRE, CUR, SHP] — the table pre-registered in RESULTS.md.
 *
 * **P3's PRE cell is the one correction made AFTER a drive, and it is recorded rather than
 * quietly patched.** The pre-registration said `false`; `grade-run-1.txt` returned `true` and the
 * mechanism is plain once seen: the pre-cure conjunct reads `own` against a FROZEN LITERAL and never
 * reads the registry at all, so in the state where the pin moved and the printed headline did not,
 * the printed headline still equals the literal and the old conjunct passes. I predicted at ARM level
 * while the cell grades ONE CONJUNCT. The corrected expectation makes the result stronger, not
 * weaker — see `P3b`, which closes the arm-level question the miss exposed.
 */
const C_CELLS = [
  ['P1 FAITHFUL', new RegExp(H(8)), H(8), true, true, true],
  ['P2 BUMPED', new RegExp(H(10)), H(10), false, true, true],
  ['P3 DISAGREE', new RegExp(H(10)), H(8), true, false, true],
  ['P4 VANISHED', new RegExp(H(8)), H(2), false, false, true],
  ['P5 RED DRIVE', new RegExp(H(8)), null, false, false, false],
];
for (const [name, pin, own, wantPre, wantCur, wantShp] of C_CELLS) {
  const scope = { e374: entry(pin), c374Faithful: drive(own) };
  const got = { PRE: evalIn(PRE_C1, scope), CUR: evalIn(CUR_C1, scope), SHP: evalIn(SHP_C1, scope) };
  grade(
    name,
    `pin ${pin.source} · printed ${own ?? '(red)'} → PRE ${got.PRE} (want ${wantPre}), CUR ` +
      `${got.CUR} (want ${wantCur}), SHP[hand-typed] ${got.SHP} (want ${wantShp})`,
    got.PRE === wantPre && got.CUR === wantCur && got.SHP === wantShp,
  );
}

/**
 * **P3b — the leg P3's missed prediction exposed, and the one that settles the cost RESULTS.md
 * names.** In the DISAGREE state (a registry pin hand-bumped with no arm added), the PRE file
 * reddens at `A1` and the CUR file reddens at `C1`. So the claim was not dropped by the re-key: it
 * MOVED from a source-text pin to a driven agreement pin, which is this 375/376/377 chain's own
 * thesis. Both versions catch the state; they catch it at different arms. Asserted as the pair of
 * values rather than as a disjunction, so a future change that silences either side has to come back
 * through this line.
 */
{
  const scope = { e374: entry(new RegExp(H(10))), c374Faithful: drive(H(8)) };
  const preAtA1 = evalIn(PRE_A1, scope);
  const curAtC1 = evalIn(CUR_C1, scope);
  grade(
    'P3b',
    `the DISAGREE state is caught by both versions at different arms: PRE's A1 conjunct ` +
      `${preAtA1} (so PRE reddens at A1), CUR's C1 conjunct ${curAtC1} (so CUR reddens at C1)`,
    preAtA1 === false && curAtC1 === false,
  );
}

/** The A1 axis: the registry read alone, so there is no printed headline in scope. */
const A_CELLS = [
  ['P6 A1 BUMPED', new RegExp(H(10)), false, true],
  ['P7 A1 NOT A HEADLINE', /Done: 8 checks/, false, false],
  ['P8 A1 A STRING', H(8), false, false],
];
for (const [name, pin, wantPre, wantCur] of A_CELLS) {
  const scope = { e374: entry(pin), c374Faithful: drive(H(8)) };
  const got = { PRE: evalIn(PRE_A1, scope), CUR: evalIn(CUR_A1, scope) };
  grade(
    name,
    `pin ${pin instanceof RegExp ? pin.source : `(string) ${pin}`} → PRE ${got.PRE} (want ` +
      `${wantPre}), CUR ${got.CUR} (want ${wantCur})`,
    got.PRE === wantPre && got.CUR === wantCur,
  );
}

// ── Structural legs: that the one graded conjunct stands for its siblings ──────

/**
 * P1–P5 grade the `round374` conjunct of `C1`. The other three cured C-conjuncts are claimed to be
 * the same shape — and that claim is CHECKED here by substitution rather than asserted, because one
 * known positive per shape is coverage of one axis.
 */
const SIBLINGS = [
  ['agrees(e375.expect, c375Faithful.own)', [['374', '375']]],
  ['agrees(e374.expect, c374Renamed.own)', [['Faithful', 'Renamed']]],
  ['agrees(e375.expect, c375Renamed.own)', [['374', '375'], ['Faithful', 'Renamed']]],
];
for (const [sibling, subs] of SIBLINGS) {
  let derived = CUR_C1;
  for (const [from, to] of subs) derived = derived.split(from).join(to);
  const present = occ(curSrc, sibling) === 1;
  grade(
    `S-${sibling}`,
    `is the graded conjunct under ${JSON.stringify(subs)} (derived \`${derived}\`) and occurs ` +
      `${occ(curSrc, sibling)} time(s) live`,
    derived === sibling && present,
  );
}

/**
 * And that the six sites are GONE from code rather than merely from the lines quoted in the memo —
 * read through the repo's own shared reader (`stripSource`, comments blanked, strings KEPT), which
 * is the reading that answers 'is this literal in a string position in live code?'. Regex bodies are
 * blanked in both of that module's readings, so `HEADLINE_SHAPE` itself cannot be counted here. The
 * three surviving raw occurrences are docblock prose describing the cure, and the gap between the
 * two numbers is the check.
 */
const { stripSource } = await import(join(REPO, 'scripts', 'lib', 'strip-source.mjs'));
const LITERAL = /All \d+ regression checks passed/g;
const countIn = (s) => (s.match(LITERAL) ?? []).length;
const preLive = countIn(stripSource(preSrc, false));
const curLive = countIn(stripSource(curSrc, false));
meas(
  'L1',
  `headline literals in the subject: raw ${countIn(preSrc)} → ${countIn(curSrc)}, and through ` +
    `stripSource(src, false) ${preLive} → ${curLive}`,
);
grade(
  'L2',
  `every hard-typed headline literal is out of live code — ${preLive} before, ${curLive} after — ` +
    `while ${countIn(curSrc)} remain raw, all of them comment prose describing this cure`,
  preLive > 0 && curLive === 0 && countIn(curSrc) > 0,
);

const bad = grades.filter((g) => !g.pass);
console.log('');
console.log(
  bad.length === 0
    ? `All ${grades.length} grades true.`
    : `${bad.length} of ${grades.length} FAILED: ${bad.map((g) => g.name).join(' ')}`,
);
process.exit(bad.length === 0 ? 0 : 1);
