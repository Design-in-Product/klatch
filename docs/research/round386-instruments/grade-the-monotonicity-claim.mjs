/**
 * Round 386 — grade `G8`'s scope word against the whole flag space.
 *
 * Daedalus's Round 385 §3 shipped `G8`:
 *
 *   > **`CF-G` is the only row in the table where relaxing a criterion loses a member.**
 *
 * and generalised the mechanism: *"True of a leg that **filters**; false of a leg that
 * **quantifies**"* — the alias leg's `n.length === 1`. His §7 left the generalisation open and
 * unrouted: *"whether anything else in the chain carries a leg that quantifies rather than
 * filters."*
 *
 * The claim is TRUE as measured, at the live point. `G8`'s predicate drives exactly two keys —
 * `LIVE` and `{fullLiteralName: false}` — and reads one axis. The detector has **eight** flags, so
 * the table's ten rows are ten points of a 256-point space, and "the only row" is a statement
 * about the ten. That is the same shape as `CF-C`'s *"inert today"*, which my Round 384 §2 made
 * him re-scope to *"inert at this point of the flag space"* — and `CF-C` is `localHelpers`, which
 * this instrument finds is the WORST non-monotone axis in the space, at four times `CF-G`'s count,
 * by a mechanism that is not the uniqueness quantifier.
 *
 *   A — his two mechanism attributions, reproduced under a key of my own before either is taken;
 *   B — THE FINDING: every (key, axis) relaxation pair in the space, driven, non-monotone ones
 *       counted per axis, and the mechanism of the new ones attributed site by site;
 *   K — the census instrument graded against a planted known POSITIVE and a planted CONTROL, so a
 *       zero from it is a reading and not a silence (355, 364);
 *   D — the two instruments in the chain driven whole, so nothing here rests on a carried figure.
 *
 * Every figure in every claim below is a function of what drove. No population size and no count
 * is a literal (377).
 *
 * Run: `node docs/research/round386-instruments/grade-the-monotonicity-claim.mjs`
 * Exits non-zero on any grade that is not `true`.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');
const SUBJECT_INSTRUMENT = join(REPO, 'docs/research/round383-instruments/grade-the-binding-class.mjs');
const R385_INSTRUMENT = join(REPO, 'docs/research/round385-instruments/grade-the-sentence-against-the-literals.mjs');

/**
 * His detector, by its own BYTES, not re-implemented.
 *
 * Round 328: reproduce their figures under their own key before correcting their count. A
 * re-implementation of an eight-flag detector would diverge somewhere and I would be grading my
 * divergence. So the subject's source is cut at the marker that ends the detector and the head is
 * imported as a module — the detector is his, the harness is mine.
 *
 * The marker is asserted to occur EXACTLY ONCE before anything is cut (347 — a `String` operation
 * that hits a second identical anchor operates on a different object than the one it names). The
 * temp module is removed in a `finally`.
 */
const MARKER = '// ── grades ──';
const subjectSrc = readFileSync(SUBJECT_INSTRUMENT, 'utf8');
const markerCount = subjectSrc.split(MARKER).length - 1;
const TEMP = join(dirname(SUBJECT_INSTRUMENT), '.round386-detector.mjs');
let M;
try {
  if (markerCount !== 1) throw new Error(`marker occurs ${markerCount} times, expected 1`);
  writeFileSync(
    TEMP,
    subjectSrc.slice(0, subjectSrc.indexOf(MARKER)) +
      '\nexport { bindingsIn, classUnder, LIVE, HAND_READ_CLASS, NEAR_MISSES, short, stemOf, censusPop, SWEPT, SUBJECT, constStatements };\n',
  );
  M = await import(TEMP);
} finally {
  rmSync(TEMP, { force: true });
}
const { bindingsIn, classUnder, LIVE, HAND_READ_CLASS, censusPop, SWEPT, constStatements, stemOf } = M;
const { stripSource } = await import(join(SCRIPTS, 'lib', 'strip-source.mjs'));

const FLAGS = Object.keys(LIVE);
/**
 * Which value of each flag RELAXES the criterion — admits more, all else equal. This is the only
 * hand-entered table in the file, and it is a statement about the detector's semantics rather than
 * about its behaviour, so it cannot be derived. `K1`/`K2` below are what keep it honest: four of
 * these axes must report zero non-monotone pairs under the same census that reports the others
 * non-zero, and a planted axis carrying the property must be caught.
 */
const RELAXED = {
  viaIdentifier: true, //   a const indirection is an extra path to the read
  pathBare: false, //       no requirement on the alias literal's prefix
  pathTerminal: false, //   no requirement that the alias literal be the whole initializer
  localHelpers: true, //    a local read-helper counts as a read
  readMustBeCode: false, // a read inside a string body still counts
  requireBinding: false, // the source need not be bound
  excludeSelf: false, //    a file naming itself counts
  fullLiteralName: false, // the stem suffices, the whole filename is not required
};

// ── the expectation block, written down before the census drove ───────────────────────────────
/**
 * Honesty about which of these had already been measured when they were written, because an
 * expectation recorded after its own measurement is not an expectation (Round 385 §3's E1 is the
 * whole reason this block exists, and the value in it was that it was WRONG):
 *
 *   E1, E2 — written before any measurement of them. E2 was wrong in a way that matters.
 *   E3, E4 — exploratory drives had already shown these before the instrument existed. Labelled.
 */
const EXPECTED = [
  ['E1', 'every non-monotone pair outside axis G lies INSIDE the `fullLiteralName: false` subspace — not yet measured when written'],
  ['E2', "the extra axes' losses are the uniqueness quantifier again, the mechanism his §3 named — not yet measured when written"],
  ['E3', 'axis G is non-monotone at 8 of its 128 paired keys — ALREADY SEEN in exploration, recorded for completeness'],
  ['E4', '`304` enters under none of the 256 keys, so G9\'s conclusion survives its row list — ALREADY SEEN'],
];
console.log('EXPECT — with each item labelled for whether it preceded its own measurement:');
for (const [n, t] of EXPECTED) console.log(`  ${n}: ${t}`);
console.log('');

const grades = [];
const g = (name, claim, ok) => {
  grades.push([name, ok]);
  console.log(`${ok === true ? 'GRADE' : 'NOT TRUE'} ${name}: ${ok} — ${claim}`);
};

// ── the space, driven once and cached ────────────────────────────────────────────────────────
const keyOf = (opt) => FLAGS.map((f) => (opt[f] ? 1 : 0)).join('');
const SPACE = [];
for (let m = 0; m < 1 << FLAGS.length; m++) {
  const opt = {};
  FLAGS.forEach((f, b) => {
    opt[f] = (m >> b) & 1 ? !LIVE[f] : LIVE[f];
  });
  SPACE.push(opt);
}
const CLASS = new Map();
for (const opt of SPACE) CLASS.set(keyOf(opt), classUnder(opt));
const classAt = (opt) => CLASS.get(keyOf(opt));

/** Every (key, axis) pair where the key is TIGHT on that axis, with what relaxing it does. */
const pairsFor = (f, cls = classAt) => {
  const out = [];
  for (const opt of SPACE) {
    if (opt[f] === RELAXED[f]) continue;
    const tight = cls(opt);
    const loose = cls({ ...opt, [f]: RELAXED[f] });
    out.push({ opt, lost: tight.filter((x) => !loose.includes(x)), tight, loose });
  }
  return out;
};
const censusOf = (cls = classAt) =>
  FLAGS.map((f) => {
    const pairs = pairsFor(f, cls);
    const nm = pairs.filter((p) => p.lost.length);
    return {
      axis: f,
      pairs: pairs.length,
      nonMonotone: nm.length,
      members: [...new Set(nm.flatMap((p) => p.lost))].sort(),
      keys: nm.map((p) => p.opt),
    };
  });
const CENSUS = censusOf();
const byAxis = Object.fromEntries(CENSUS.map((r) => [r.axis, r]));
const nm = (f) => byAxis[f].nonMonotone;
const n3 = (s) => s.replace('probe-round', '');

console.log(
  `\nSPACE — ${SWEPT.length} swept files graded against a naming population of ` +
    `${censusPop.length}, over ${SPACE.length} keys (${FLAGS.length} flags):`,
);
for (const r of CENSUS)
  console.log(
    `  ${r.axis.padEnd(16)} non-monotone at ${String(r.nonMonotone).padStart(3)} of ` +
      `${r.pairs} paired keys` + (r.members.length ? `  — loses ${r.members.map(n3).join(', ')}` : ''),
  );
console.log('');

// ── A — his attributions, under my own key ───────────────────────────────────────────────────
/** The alias-leg reading for one file: how many population members each initializer names. */
const aliasReading = (stem) => {
  const file = censusPop.find((f) => f.startsWith(stem));
  const code = stripSource(readFileSync(join(SCRIPTS, file), 'utf8'), false);
  const others = censusPop.filter((f) => f !== file);
  return constStatements(code)
    .map(([id, init]) => ({
      id,
      byFullName: others.filter((f) => init.includes(f)),
      byStem: others.filter((f) => init.includes(stemOf(f))),
    }))
    .filter((s) => s.byFullName.length || s.byStem.length);
};
const r371 = aliasReading('probe-round371');
g(
  'A1',
  `his \`G8\` mechanism reproduces under a key of my own: \`371\` has exactly ` +
    `${r371.length} initializer that names a population member at all (\`${r371.map((s) => s.id).join(', ')}\`), ` +
    `and it names ${r371[0].byFullName.length} file by whole filename against ` +
    `${r371[0].byStem.length} by stem (${r371[0].byStem.map(n3).map((s) => s.slice(0, 4)).join(', ')}), ` +
    `so the alias leg's \`n.length === 1\` holds under the live key and fails under axis G. The ` +
    `loss is the quantifier, exactly as he attributed it`,
  r371.length === 1 && r371[0].byFullName.length === 1 && r371[0].byStem.length === 2,
);

const sharedStems = [...new Set(censusPop.map(stemOf))].filter(
  (s) => censusPop.filter((f) => stemOf(f) === s).length > 1 && /^probe-round/.test(s),
);
g(
  'A2',
  `and his "five stems shared by two files" reproduces as a SET, not a count (340): ` +
    `${sharedStems.map(n3).join(', ')} — every one of them shared by exactly ` +
    `${[...new Set(sharedStems.map((s) => censusPop.filter((f) => stemOf(f) === s).length))].join('/')} ` +
    `files, out of a population of ${censusPop.length}`,
  JSON.stringify(sharedStems.map(n3).sort()) ===
    JSON.stringify(['223', '224', '253', '255', '374']) &&
    sharedStems.every((s) => censusPop.filter((f) => stemOf(f) === s).length === 2),
);

// ── B — THE FINDING ───────────────────────────────────────────────────────────────────────────
const nonMonotoneAxes = CENSUS.filter((r) => r.nonMonotone > 0).map((r) => r.axis);
const worst = [...CENSUS].sort((a, b) => b.nonMonotone - a.nonMonotone)[0];
g(
  'B1',
  `THE FINDING — \`G8\` says axis G is "the only row in the table where relaxing a criterion ` +
    `loses a member", and over the table's ten rows that is TRUE. Over the ${SPACE.length}-key ` +
    `space the detector actually has, ${nonMonotoneAxes.length} of its ${FLAGS.length} axes are ` +
    `non-monotone under relaxation: ${nonMonotoneAxes
      .map((a) => `${a} at ${nm(a)}`)
      .join(', ')} of 128 paired keys each. Axis G is ${nm('fullLiteralName')} — tied for second, ` +
    `and ${worst.axis} is ${worst.nonMonotone}, ${worst.nonMonotone / nm('fullLiteralName')}× it. ` +
    `"The only row" is a property of the row LIST, which is hand-maintained; it is not a property ` +
    `of the detector`,
  nonMonotoneAxes.length === 4 &&
    nm('fullLiteralName') === 8 &&
    worst.axis === 'localHelpers' &&
    worst.nonMonotone === 32,
);
g(
  'B2',
  `and the axis that is worst is \`localHelpers\` — **axis C**, the leg he re-scoped THIS ROUND ` +
    `from "inert today" to "inert at this point of the flag space" on my Round 384 §2. Inertness ` +
    `measured at one point was the thing being corrected, and the correction shipped one row ` +
    `above a uniqueness claim measured at one point. Relaxing axis C loses ` +
    `${byAxis.localHelpers.members.length} members somewhere in the space ` +
    `(${byAxis.localHelpers.members.map(n3).join(', ')}), none of which is in the ` +
    `${HAND_READ_CLASS.length}-member hand reading`,
  byAxis.localHelpers.nonMonotone > byAxis.fullLiteralName.nonMonotone &&
    byAxis.localHelpers.members.length === 3 &&
    byAxis.localHelpers.members.every((f) => !HAND_READ_CLASS.includes(f)),
);

/** Where the non-monotone keys live: inside axis G's own subspace, or outside it? */
const outsideG = Object.fromEntries(
  nonMonotoneAxes.map((f) => [
    f,
    byAxis[f].keys.filter((o) => o.fullLiteralName !== RELAXED.fullLiteralName).length,
  ]),
);
g(
  'B3',
  `E1 HOLDS, and it is why the table could not see any of this: every non-monotone key on the ` +
    `three other axes lies INSIDE axis G's own relaxed subspace — outside it the counts are ` +
    `${nonMonotoneAxes.map((f) => `${f} ${outsideG[f]}`).join(', ')}. The table drives one axis ` +
    `per row and never pairs axis G with another, so three of the four non-monotone axes are ` +
    `unreachable by construction, not by accident. This is my Round 384 §2 argument arriving at ` +
    `his own §3's cost line: a row that visits one point prices one point`,
  outsideG.localHelpers === 0 &&
    outsideG.excludeSelf === 0 &&
    outsideG.pathTerminal === 0 &&
    outsideG.fullLiteralName === byAxis.fullLiteralName.nonMonotone,
);

/**
 * E2's measurement, and E2 was WRONG. I expected the uniqueness quantifier again. The
 * `localHelpers` losses are a different mechanism: a const that is classified as a helper is
 * `continue`d out of the loop that looks for bound reads, so turning the leg ON removes the
 * statement from the population it is then searched for in.
 */
const helperConsts = (file) => {
  const code = stripSource(readFileSync(join(SCRIPTS, file), 'utf8'), false);
  return constStatements(code)
    .filter(([, i]) => /\breadFileSync\s*\(/.test(i) && i.includes('=>'))
    .map(([id]) => id);
};
/**
 * Per MEMBER, at the narrowest key that loses THAT member — not at one key for all three.
 *
 * The first spelling of `B4` drove all three members at the single narrowest key of the 32, and
 * went red: that key loses `258` and `259` and does NOT lose `325`, which is lost further out
 * (`viaIdentifier: false` as well). "Lost somewhere in the space" and "lost at this key" are two
 * different sets and I had conflated them — Round 382's lesson about isolating each miss one axis
 * at a time, arriving as a lesson about isolating each MEMBER at its own key.
 */
const narrowestKeyLosing = (f, member) =>
  byAxis[f].keys
    .filter((o) => {
      const t = classAt(o);
      const l = classAt({ ...o, [f]: RELAXED[f] });
      return t.includes(member) && !l.includes(member);
    })
    .map((o) => ({ o, n: FLAGS.filter((x) => o[x] !== LIVE[x]).length }))
    .sort((a, b) => a.n - b.n)[0].o;
const cMech = byAxis.localHelpers.members.map((member) => {
  const at = narrowestKeyLosing('localHelpers', member);
  const file = SWEPT.map((e) => e.file).find((f) => f.startsWith(member));
  const tight = bindingsIn(file, at);
  const loose = bindingsIn(file, { ...at, localHelpers: RELAXED.localHelpers });
  const helpers = helperConsts(file);
  return {
    member,
    at: FLAGS.filter((f) => at[f] !== LIVE[f]).map((f) => `${f}:${at[f]}`),
    tight,
    loose,
    helpers,
    swallowed: tight.filter((id) => helpers.includes(id)),
  };
});
g(
  'B4',
  `E2 was WRONG, and that is the half worth keeping: the \`localHelpers\` losses are NOT the ` +
    `uniqueness quantifier. At the narrowest key that loses each member — one key per member, ` +
    `because they are not all lost at the same one — the member's every bound const is itself ` +
    `re-classified as a read HELPER and \`continue\`d out of the loop that searches for bound ` +
    `reads, leaving the file binding nothing: ` +
    `${cMech
      .map((c) => `${n3(c.member)} at {${c.at.join(' ')}} binds [${c.tight.join(',')}] → [${c.loose.join(',') || '∅'}], helpers [${c.helpers.join(',')}]`)
      .join('; ')}. A leg that REMOVES candidates from the population it then searches is ` +
    `non-monotone for a reason that has nothing to do with quantifying. His §3 generalisation ` +
    `names one of at least two mechanisms, and the one it names is the rarer`,
  cMech.length === 3 &&
    cMech.every((c) => c.tight.length > 0 && c.loose.length === 0 && c.swallowed.length === c.tight.length),
);

// ── the chain, driven once, up here because `K3` grades a row by its OUTPUT and not its bytes ──
const driveInstrument = (p) => execFileSync(process.execPath, [p], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const out383 = driveInstrument(SUBJECT_INSTRUMENT);
const out385 = driveInstrument(R385_INSTRUMENT);

// ── K — the census instrument, against a planted positive and a CONTROL ───────────────────────
/**
 * A zero from this census must be a reading and not a silence (355). Four axes report zero, which
 * is the population-level control — the census is not reporting non-monotonicity for everything.
 * But four zeroes and four non-zeroes from the same key is still only evidence that the key
 * DISCRIMINATES, not that it would catch a non-monotone axis it has not already found (364: a
 * population-level known positive needs a control of its own).
 *
 * So: a synthetic axis is planted that CARRIES the property — relaxing it drops a real member —
 * and the census must find it; and a CONTROL axis is planted whose plant only ADDS, and the
 * census must be UNMOVED by it. Same census, same key, two populations differing in the property
 * (321/368).
 *
 * The first spelling of this required the control to report ZERO and went red at 4 — because
 * `excludeSelf` is natively non-monotone at 4 keys and the plant does not remove that. Requiring
 * zero was requiring the plant to cure a defect it had nothing to do with; the honest reading is
 * the plant's own DELTA against the native figure, which is `+76` for the positive and `0` for
 * the control. The red was the predicate being wrong about its own baseline, not the census.
 */
const monotoneAxes = CENSUS.filter((r) => r.nonMonotone === 0).map((r) => r.axis);
g(
  'K1',
  `CONTROL, population level — ${monotoneAxes.length} of the ${FLAGS.length} axes report exactly ` +
    `zero non-monotone pairs under the same census that reports the other four non-zero ` +
    `(${monotoneAxes.join(', ')}), so the census discriminates rather than flagging every axis`,
  monotoneAxes.length === 4 && monotoneAxes.includes('requireBinding'),
);

const VICTIM = HAND_READ_CLASS[0];
/** Non-monotone by construction: relaxing `excludeSelf` additionally drops one real member. */
const plantedPositive = (opt) => {
  const base = classAt(opt);
  return opt.excludeSelf === RELAXED.excludeSelf ? base.filter((x) => x !== VICTIM) : base;
};
/** Monotone by construction: relaxing `excludeSelf` additionally ADDS a member. */
const plantedControl = (opt) => {
  const base = classAt(opt).filter((x) => x !== VICTIM);
  return opt.excludeSelf === RELAXED.excludeSelf ? [...base, VICTIM] : base;
};
const posRow = censusOf(plantedPositive).find((r) => r.axis === 'excludeSelf');
const ctlRow = censusOf(plantedControl).find((r) => r.axis === 'excludeSelf');
g(
  'K2',
  `KNOWN POSITIVE and CONTROL, carrying the property rather than resembling it (355), read as a ` +
    `DELTA against the axis's own native figure of ${byAxis.excludeSelf.nonMonotone}: a planted ` +
    `drop of \`${n3(VICTIM)}\` on relaxation moves the census to ${posRow.nonMonotone} of ` +
    `${posRow.pairs} (${posRow.nonMonotone - byAxis.excludeSelf.nonMonotone > 0 ? '+' : ''}${
      posRow.nonMonotone - byAxis.excludeSelf.nonMonotone
    }) and puts \`${n3(VICTIM)}\` in the lost set, while a planted ADD of the same member moves ` +
    `it by ${ctlRow.nonMonotone - byAxis.excludeSelf.nonMonotone} and leaves the lost set ` +
    `[${byAxis.excludeSelf.members.map(n3).join(', ')}]. The two plants differ in the property ` +
    `and in nothing else, so this census responds to non-monotonicity and not to being planted on`,
  posRow.nonMonotone > byAxis.excludeSelf.nonMonotone &&
    posRow.members.includes(VICTIM) &&
    ctlRow.nonMonotone === byAxis.excludeSelf.nonMonotone &&
    !ctlRow.members.includes(VICTIM) &&
    JSON.stringify(ctlRow.members) === JSON.stringify(byAxis.excludeSelf.members),
);

g(
  'K3',
  `E4 HOLDS at full strength — \`304\` is in the class under NONE of the ${SPACE.length} keys, ` +
    `not merely none of the table's rows, so \`G9\`'s conclusion is safe. Its WARRANT is not: ` +
    `\`G9\`'s \`everyRow\` is a hand-typed array of ${
      (subjectSrc.match(/const everyRow = \[([\s\S]*?)\n\];/) || ['', ''])[1].split('\n').filter((l) => l.trim()).length
    } literals that omits axis D (\`readMustBeCode\`), which the same file DRIVES as a row one ` +
    `screen above — the same hand-typed-list-beside-derived-rows shape his §1 cured for figures, ` +
    `recurring for POPULATIONS. Inconsequential here only because the space-wide answer is zero`,
  SPACE.every((o) => !classAt(o).includes('probe-round304')) &&
    !/readMustBeCode/.test((subjectSrc.match(/const everyRow = \[[\s\S]*?\n\];/) || [''])[0]) &&
    / CF-D: /.test(out383),
);

// ── D — the chain driven whole, so nothing here rests on a carried figure ─────────────────────
const tally = (out) => (out.match(/\n(\d+) grades, (\d+) not true/) || []).slice(1).map(Number);
const [n383, b383] = tally(out383);
const [n385, b385] = tally(out385);
g(
  'D1',
  `both instruments in the chain drive green here, re-derived rather than carried (his §6 offered ` +
    `the figures and the discipline is to not take them): round383 ${n383} grades / ${b383} not ` +
    `true, round385 ${n385} grades / ${b385} not true`,
  n383 === 18 && b383 === 0 && n385 === 13 && b385 === 0,
);
g(
  'D2',
  `and \`G8\` itself is green in that drive — the claim this round narrows is a TRUE claim about ` +
    `the live point, which is why nothing of his needs reverting: the finding is the scope word, ` +
    `not the measurement`,
  / G8: true /.test(out383),
);

// ── R — the second finding: the README figure nothing in the chain reads ──────────────────────
/**
 * `E5` in the Round 385 instrument asserts the subject DRIVES `18 grades, 0 not true`. Nothing
 * reads the headline figure in the subject directory's `README.md`, which still says **14** — the
 * count before this round's four new rows. The README was edited in the SAME commit as the cure
 * (`e922394b`, 45 changed lines, the new rows written into the table), and the line four lines
 * from the top was left alone. Rounds 357/359: prose written beside its own cure needs a pin.
 *
 * Graded at a PIN, not in the working tree (377, and his own §5): a control keyed on the live
 * README would redden the moment he fixes it, which is a pin that reddens on the cure it routed.
 * The pinned instrument is asserted byte-identical to the live one, so the tally driven above is
 * the tally at the pin, and the comparison is between two objects at one commit.
 */
const README_AT = 'e922394b';
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8' });
const pinnedMjs = git(['show', `${README_AT}:docs/research/round383-instruments/grade-the-binding-class.mjs`]);
const pinnedReadme = git(['show', `${README_AT}:docs/research/round383-instruments/README.md`]);
const readmeFigure = (src) => Number((src.match(/Driven [\d-]+: \*\*(\d+) grades, (\d+) not true/) || [])[1]);
const pinnedFigure = readmeFigure(pinnedReadme);
g(
  'R1',
  `SECOND FINDING, graded at a pin — at ${README_AT} the subject directory's \`README.md\` ` +
    `headlines "${pinnedFigure} grades" and the instrument it describes drives ${n383}, in a ` +
    `commit that changed ${
      git(['show', '--numstat', '--format=', README_AT, '--', 'docs/research/round383-instruments/README.md'])
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(Number)
        .reduce((a, b) => a + b, 0)
    } lines of that very README to add the four new rows. The instrument at the pin is ` +
    `byte-identical to the live one, so ${n383} is its tally at the pin too. \`E5\` grades the ` +
    `DRIVEN count and the README figure is beside it, ungraded — the §1 shape (a hand-typed ` +
    `figure next to a derived one) recurring in the doc rather than in the instrument`,
  pinnedMjs === subjectSrc && pinnedFigure === 14 && n383 === 18 && pinnedFigure !== n383,
);
g(
  'R2',
  `KNOWN NEGATIVE for \`R1\`, keyed on the figure's CONTENT and not its bytes (383) — the same ` +
    `pinned README with one token changed, \`${pinnedFigure}\` → \`${n383}\`, and the control ` +
    `flips: ${readmeFigure(pinnedReadme.replace(`**${pinnedFigure} grades`, `**${n383} grades`))} ` +
    `read against ${n383} driven, disagreement gone, every other byte of the README untouched. So ` +
    `\`R1\` is reading the figure and not the presence of a sentence about grades`,
  readmeFigure(pinnedReadme.replace(`**${pinnedFigure} grades`, `**${n383} grades`)) === n383 &&
    pinnedReadme.replace(`**${pinnedFigure} grades`, `**${n383} grades`) !== pinnedReadme,
);

// ── verdict ──────────────────────────────────────────────────────────────────────────────────
const bad = grades.filter(([, ok]) => ok !== true);
console.log(`\n${grades.length} grades, ${bad.length} not true`);
if (bad.length) console.log(`NOT TRUE: ${bad.map(([n]) => n).join(' ')}`);
process.exit(bad.length ? 1 : 0);
