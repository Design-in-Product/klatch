/**
 * Round 383 — grade the B1m class clause in `probe-round377`.
 *
 * Theseus's Round 382 §1 reported three defects in one sentence: a hand constant of 5 beside a
 * live denominator, a closing "this file will be the 6th" naming a future that had already
 * happened, and a seam declared at sentence granularity with the crossing back inside a sentence.
 * This instrument reproduces his hand reading of TEN as a SET under a key that shares neither end
 * with his, isolates each axis a detector for this construct can hold fixed, and grades the
 * shipped cure behaviourally against the pre-cure spelling read out of git.
 *
 * Run: `node docs/research/round383-instruments/grade-the-binding-class.mjs`
 * Exits non-zero on any grade that is not `true`. Counterfactual table: README.md here.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');
const { SWEPT, census } = await import(join(SCRIPTS, 'sweep-probes.mjs'));
const { stripSource } = await import(join(SCRIPTS, 'lib', 'strip-source.mjs'));

const censusPop = census(SCRIPTS);
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8' });
/** The commit before Round 387 touched this file: the pre-refactor detector, and `everyRow`. */
const PREREFACTOR_AT = 'e922394b';
const prerefactor = git([
  'show',
  `${PREREFACTOR_AT}:docs/research/round383-instruments/grade-the-binding-class.mjs`,
]);
const SUBJECT = SWEPT.map((e) => e.file).find((f) => f.startsWith('probe-round377'));

/**
 * The HAND reading — site by site, with each resolving declaration read. It is PRIMARY; the
 * detector below is graded against it, not the other way round (341, 350). The comment on each
 * member is the shape its binding takes, and the two shape columns are what the axis table varies.
 */
const HAND_READ_CLASS = [
  'probe-round225', // const R219 = path.join(SCRIPTS, '<file>')        → const r219src = fs.readFileSync(R219, 'utf8')
  'probe-round232', // const ARM_O_SOURCE = path.join(REPO, 'scripts/<file>') → const src = fs.readFileSync(ARM_O_SOURCE, 'utf8')
  'probe-round263', // const r261Now = fs.readFileSync(path.join(REPO,'scripts','<file>'), 'utf8')  — inline, multiline
  'probe-round269', // const r225 = stripSource(readFileSync(join(REPO,'scripts','<file>'),'utf8'), false) — inline, wrapped
  'probe-round371', // const SUBJECT = 'scripts/<file>'                  → const subjectSrc = readFileSync(join(REPO, SUBJECT), 'utf8')
  'probe-round372', // const R225 = '<file>'                             → const r225Src = readFileSync(join(HERE, R225), 'utf8')
  'probe-round373', // same shape
  'probe-round374', // same shape, two of them
  'probe-round375', // same shape, three of them
  'probe-round377', // same shape, three of them — the subject, and it is already in SWEPT
];

/** Hand-read NEAR MISSES, so every exclusion is attributable rather than accidental. */
const NEAR_MISSES = {
  'probe-round244': 'reads a named probe live but consumes it INLINE — binds a boolean, not source',
  'probe-round262': 'binds a FROZEN copy out of `git show <sha>:path` — no live read, nothing can move it',
  'probe-round297': 'resolves its file from the population by prefix, and consumes `read(R225)` inline',
  'probe-round304': 'reads a named probe live, inline inside the check expression; no const at all',
};

// ── the detector ─────────────────────────────────────────────────────────────────────────────

/** The `;` that ends the statement starting at `i`, with string bodies skipped. */
const initializerEnd = (code, i) => {
  let depth = 0;
  for (let j = i; j < code.length; j++) {
    const c = code[j];
    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      j++;
      while (j < code.length && code[j] !== q) j += code[j] === '\\' ? 2 : 1;
      continue;
    }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ';' && depth <= 0) return j;
  }
  return code.length;
};

const constStatements = (code) => {
  const out = [];
  const re = /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*/g;
  for (let m; (m = re.exec(code)); ) {
    const from = m.index + m[0].length;
    out.push([m[1], code.slice(from, initializerEnd(code, from)), from]);
  }
  return out;
};

/**
 * Each flag holds ONE axis fixed. The defaults are the live key; every counterfactual flips
 * exactly one of them, which is what makes a lost member attributable to that axis and not to the
 * combination (Theseus, Round 382 §2 — one known positive per SHAPE is coverage of one AXIS).
 */
const LIVE = {
  viaIdentifier: true, //  A: the filename may reach the read through a module-scope const
  pathBare: false, // B1: require the alias literal to carry no `scripts/` prefix
  pathTerminal: false, // B2: require the alias literal to BE the whole initializer
  localHelpers: true, //  C: a local `const read = (f) => … readFileSync …` counts as a read
  readMustBeCode: true, //    the read call must survive the strings-BLANKED reading
  requireBinding: true, //    the source must be BOUND, not consumed inline
  excludeSelf: true, //   E: a file naming ITSELF does not count (inert here — see CF-E)
  fullLiteralName: true, // G: a naming site must carry the WHOLE filename, not the `probe-roundNNN` stem
};

/** `probe-round224-a-skip-…mts` → `probe-round224`. Five stems are shared by two files (G8). */
const stemOf = (f) => (f.match(/^probe-round\d+/) || [f])[0];

/**
 * Both readings of one file, memoised. A pure function of the file's bytes, so caching it cannot
 * change a class — and `G12` grades that by comparing the whole 256-key class map against the
 * detector as it stood BEFORE this cache existed, read out of git. The cache is what makes the
 * space affordable: the readings are per-file and the space asks for them 256 times each.
 */
const readingCache = new Map();
const readingsOf = (file) => {
  let r = readingCache.get(file);
  if (!r) {
    const raw = readFileSync(join(SCRIPTS, file), 'utf8');
    const code = stripSource(raw, false); // comments and regex bodies blanked, strings KEPT
    r = {
      code,
      blank: stripSource(raw, true), // string bodies blanked too, same offsets (length-preserving)
      stmts: constStatements(code), // a function of `code` alone, so also safe to hold
    };
    readingCache.set(file, r);
  }
  return r;
};

/**
 * The detector's three legs for one file, kept as data rather than as control flow, so that a
 * mechanism can be attributed from what the legs DID and not from a re-reading of the source.
 * `bindingsIn` is `legsOf(...).bound`, so there is one implementation and no divergence to grade
 * (328). `G12` grades the whole 256-key class map of this against the pre-refactor detector read
 * out of git, which is the licence for having moved anything at all.
 */
const legsOf = (file, opt = LIVE) => {
  const { code, blank, stmts } = readingsOf(file);
  const others = censusPop.filter((f) => !opt.excludeSelf || f !== file);

  // axis B applies to the ALIAS leg only — how a const binds a PATH — which is where Theseus's
  // Round 378 v2 carried it. The inline leg names the file inside the read call, where neither
  // sub-axis can hold, and restricting it there loses `263` and `269` for the wrong reason.
  const names = (init, forAlias = false) =>
    others.filter((f) => {
      if (!init.includes(opt.fullLiteralName ? f : stemOf(f))) return false;
      if (!forAlias) return true;
      const m = new RegExp(`(['"\`])([^'"\`]*)${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`).exec(init);
      if (opt.pathBare && (!m || m[2] !== '')) return false;
      if (opt.pathTerminal && (!m || m[0].trim() !== init.trim())) return false;
      return true;
    });

  const alias = new Map();
  /** Initializers the UNIQUENESS quantifier rejected: they name members, but not exactly one. */
  const quantifierRejected = [];
  if (opt.viaIdentifier)
    for (const [id, init] of stmts) {
      const n = names(init, true);
      if (n.length === 1 && !/readFileSync|\bread\s*\(/.test(init)) alias.set(id, n[0]);
      else if (n.length > 1 && !/readFileSync|\bread\s*\(/.test(init)) quantifierRejected.push([id, n]);
    }

  const helpers = opt.localHelpers
    ? stmts.filter(([, i]) => /\breadFileSync\s*\(/.test(i) && i.includes('=>')).map(([id]) => id)
    : [];
  const helperRe = helpers.length ? new RegExp(`\\b(?:${helpers.join('|')})\\s*\\(`) : null;

  const bound = [];
  for (const [id, init, from] of stmts) {
    if (helpers.includes(id)) continue;
    const hit = /\breadFileSync\s*\(/.exec(init) ?? (helperRe ? helperRe.exec(init) : null);
    if (opt.requireBinding && !hit) continue;
    if (opt.requireBinding && opt.readMustBeCode) {
      const at = from + hit.index;
      if (blank.slice(at, at + hit[0].length) !== hit[0]) continue;
    }
    const reached = [
      ...names(init),
      ...(opt.viaIdentifier
        ? [...alias].filter(([a]) => new RegExp(`\\b${a}\\b`).test(init)).map(([, f]) => f)
        : []),
    ];
    if (reached.length) bound.push(id);
  }
  return { bound, alias, helpers, quantifierRejected, stmts };
};

const bindingsIn = (file, opt = LIVE) => legsOf(file, opt).bound;

const short = (f) => f.split('-').slice(0, 2).join('-');
const classUnder = (opt = LIVE) =>
  SWEPT.filter((e) => bindingsIn(e.file, opt).length > 0)
    .map((e) => short(e.file))
    .sort();

// ── grades ───────────────────────────────────────────────────────────────────────────────────
const grades = [];
const g = (name, claim, ok) => {
  grades.push([name, ok]);
  console.log(`${ok === true ? 'GRADE' : 'NOT TRUE'} ${name}: ${ok} — ${claim}`);
};

const live = classUnder();
g(
  'G1',
  `the detector reproduces the HAND reading as a SET, member for member, not as a count (340): ` +
    `[${live.join(' ')}]`,
  JSON.stringify(live) === JSON.stringify([...HAND_READ_CLASS].sort()),
);
g(
  'G2',
  `so the class is ${live.length} — the clause's published 5 was short by half, and Theseus's ` +
    `Round 378 correction of it to 7 was short by three`,
  live.length === 10,
);
g(
  'G3',
  `the subject ${short(SUBJECT)} is IN \`SWEPT\` and IN the class, so "this file will be the 6th" ` +
    `named a future that had already happened`,
  SWEPT.some((e) => e.file === SUBJECT) && live.includes(short(SUBJECT)),
);
const subjSites = bindingsIn(SUBJECT);
g(
  'G4',
  `and it binds ${subjSites.length} named probes' live source itself: ${subjSites.join(', ')}`,
  subjSites.length === 3,
);

// ── counterfactuals: one axis each, and each asserts what it expects to lose ──────────────────
/**
 * `claim` may be a FUNCTION of the same `(got, lost, gained)` the predicate reads.
 *
 * Round 384 §1: `CF-F`'s predicate was a member-list equality and correct, and the sentence
 * typed beside it said "three of the four hand-read near misses" when the intersection of that
 * very list with `NEAR_MISSES` is two. Nothing connected them, so nothing could catch it — the
 * predicate graded the list and the sentence graded nothing. A hand-typed count next to a derived
 * list is the defect; the seam is that any row whose prose carries a FIGURE derives it here.
 */
/** Every row this file drives, registered by `cf` itself — `G9`/`G13` read it instead of a list. */
const ROWS = [['LIVE', {}]];
const cf = (name, opt, claim, want) => {
  ROWS.push([name, opt]);
  const got = classUnder({ ...LIVE, ...opt });
  const lost = HAND_READ_CLASS.filter((h) => !got.includes(h));
  const gained = got.filter((h) => !HAND_READ_CLASS.includes(h));
  const ok = want(got, lost, gained);
  grades.push([name, ok]);
  console.log(
    `${ok === true ? 'GRADE' : 'NOT TRUE'} ${name}: ${ok} — ` +
      `${typeof claim === 'function' ? claim(got, lost, gained) : claim}; reads ${got.length}, ` +
      `lost [${lost.join(' ')}], gained [${gained.join(' ')}]`,
  );
};

/** The three sets a row's prose is allowed to talk about, all derived from `gained`. */
const vsNearMisses = (gained) => {
  const nm = Object.keys(NEAR_MISSES);
  return {
    reached: nm.filter((f) => gained.includes(f)),
    missed: nm.filter((f) => !gained.includes(f)),
    notNearMisses: gained.filter((f) => !nm.includes(f)),
  };
};

cf(
  'CF-A',
  { viaIdentifier: false },
  'axis A — inline literals only, the const indirection removed; the two inline members survive ' +
    'and the other eight do not',
  (got, lost) =>
    got.length === 2 && !lost.includes('probe-round263') && !lost.includes('probe-round269'),
);
cf(
  'CF-B1',
  { pathBare: true },
  'axis B1 — the alias literal must carry no `scripts/` prefix; isolated, this loses the two ' +
    'PREFIX members and nothing else',
  (_got, lost) => JSON.stringify(lost) === JSON.stringify(['probe-round232', 'probe-round371']),
);
cf(
  'CF-B2',
  { pathTerminal: true },
  'axis B2 — the alias literal must BE the whole initializer; isolated, this loses the two ' +
    'WRAPPER members and nothing else',
  (_got, lost) => JSON.stringify(lost) === JSON.stringify(['probe-round225', 'probe-round232']),
);
cf(
  'CF-B3',
  { pathBare: true, pathTerminal: true },
  "both sub-axes at once is Theseus's Round 378 v2 key, and his 7 is exactly what it reads — " +
    'reproduced under this key rather than taken on report (328)',
  (got, lost) =>
    got.length === 7 &&
    JSON.stringify(lost) ===
      JSON.stringify(['probe-round225', 'probe-round232', 'probe-round371']),
);
cf(
  'CF-C',
  { localHelpers: false },
  'axis C — the local read-helper leg removed. Inert AT THIS POINT of the flag space — the class ' +
    'is the same either way with every other flag live, which is the only place it has been ' +
    'driven, and Theseus\'s Round 384 §2 is that inertness measured at one point is not ' +
    'inertness (his own `excludeSelf` is inert live and load-bearing relaxed — CF-E below). The ' +
    'leg is kept because the two near misses that use a helper are excluded for binding no ' +
    'SOURCE, which is a reason worth being able to state rather than to luck into',
  (_got, lost, gained) => lost.length === 0 && gained.length === 0,
);
cf(
  'CF-F',
  { requireBinding: false },
  (_got, _lost, gained) => {
    const { reached, missed, notNearMisses } = vsNearMisses(gained);
    return (
      'the bound-to-an-identifier criterion removed — load-bearing, and it reaches ' +
      `${reached.length} of the ${Object.keys(NEAR_MISSES).length} hand-read near misses ` +
      `(${reached.join(', ') || 'none'}). It does NOT reach ${missed.length} of them ` +
      `(${missed.join(', ') || 'none'}), whose exclusions rest on the hand reading and not on ` +
      `this flag; and ${notNearMisses.length} of what it gains ` +
      `(${notNearMisses.join(', ') || 'none'}) is in no near-miss list in the repo`
    );
  },
  (_got, lost, gained) =>
    lost.length === 0 &&
    JSON.stringify(gained) ===
      JSON.stringify(['probe-round224', 'probe-round244', 'probe-round262']),
);
cf(
  'CF-E',
  { requireBinding: false, excludeSelf: false },
  "axis E, driven at the point where it is not inert — Theseus's Round 384 §2, reproduced here " +
    'under my own key: with the binding requirement also off, the self-exclusion leg gains ' +
    "exactly `246` and `299` over CF-F, both of which carry `const SELF = '<own filename>'`. A " +
    '`const SELF` binds no read, so the read requirement masks the leg completely under the live ' +
    'key — which is why "inert" has to name the point it was measured at',
  (_got, lost, gained) =>
    lost.length === 0 &&
    JSON.stringify(gained) ===
      JSON.stringify([
        'probe-round224',
        'probe-round244',
        'probe-round246',
        'probe-round262',
        'probe-round299',
      ]),
);
cf(
  'CF-G',
  { fullLiteralName: false },
  'axis G — a naming site may carry the `probe-roundNNN` STEM instead of the whole filename. ' +
    "This is the row Round 383's table did not have, and it is the one that isolates " +
    "`probe-round297`'s exclusion: 297 carries ZERO const initializers with a full population " +
    'filename (it resolves by prefix, `const R225 = fileFor(\'probe-round225\')`) and comes in ' +
    'here through `const src = read(R295)`. The exclusion was credited to the hand reading and ' +
    'belongs to this criterion',
  (_got, _lost, gained) => gained.includes('probe-round297'),
);
const noStringGuard = bindingsIn(SUBJECT, { ...LIVE, readMustBeCode: false }).length;
g(
  'CF-D',
  `the strings-blanked guard is load-bearing on the subject's own site count — ${subjSites.length} ` +
    `with it, ${noStringGuard} without, because this file carries fixture strings that quote the ` +
    `construct verbatim (344's reader, used at both widths rather than diffed)`,
  noStringGuard > subjSites.length,
);
g(
  'G5',
  `and none of the four hand-read near misses is in the live class: ` +
    `${Object.keys(NEAR_MISSES).join(', ')}`,
  Object.keys(NEAR_MISSES).every((f) => !live.includes(f)),
);

// ── the whole flag space, which is what the row table prices one point of at a time ──────────
/**
 * Theseus's Round 386 §1. `G8` used to read:
 *
 *   > axis G is the one row where RELAXING a criterion LOSES a member
 *
 * — true over the ten rows, and the ten rows are ten points of a 256-point space, so *"the one
 * row"* was a property of the hand-maintained row LIST and not of the detector. Three of the four
 * non-monotone axes are unreachable by any one-axis row, because every one of their non-monotone
 * keys lies inside axis G's own relaxed subspace and the table never pairs two axes.
 *
 * The cure is to DRIVE the space, not to narrow the sentence: every figure in `G8`, `G9`, `G10`,
 * `G11` and `G14` below is a function of the 256-key class map. The row table keeps the job it is
 * good at — attributing one axis at a time, in prose, with its losses named.
 *
 * Affordable only because `readingsOf` memoises: 256 keys × 43 files, two strippings per file
 * instead of per (file, key). `G12` is the licence for that cache.
 */
const FLAGS = Object.keys(LIVE);
const keyOf = (o) => FLAGS.map((f) => (o[f] ? 1 : 0)).join('');
const SPACE = [];
for (let m = 0; m < 1 << FLAGS.length; m++) {
  const o = {};
  FLAGS.forEach((f, b) => {
    o[f] = (m >> b) & 1 ? !LIVE[f] : LIVE[f];
  });
  SPACE.push(o);
}
const CLASS = new Map(SPACE.map((o) => [keyOf(o), classUnder(o)]));
const classAt = (o) => CLASS.get(keyOf(o));

/**
 * Which value of each flag RELAXES the criterion — admits more, all else equal.
 *
 * Hand-entered, from Theseus's Round 386 instrument verbatim, where it is the one hand-entered
 * table and is labelled as semantics that cannot be derived. It cannot be derived as SEMANTICS.
 * It CAN be derived as behaviour — `WIDER` below — and the two can be made to disagree out loud
 * rather than silently: `G10`, where axis C admits more in the direction opposite to the one its
 * semantics name, for the exact reason Theseus's own Round 386 `B4` found.
 */
const SEMANTIC_RELAXED = {
  viaIdentifier: true, //   a const indirection is an extra path to the read
  pathBare: false, //       no requirement on the alias literal's prefix
  pathTerminal: false, //   no requirement that the alias literal be the whole initializer
  localHelpers: true, //    a local read-helper counts as a read
  readMustBeCode: false, // a read inside a string body still counts
  requireBinding: false, // the source need not be bound
  excludeSelf: false, //    a file naming itself counts
  fullLiteralName: false, // the stem suffices, the whole filename is not required
};
/** The same question asked of the measurement: which value carries more membership, summed. */
const totalAt = (f, v) => SPACE.filter((o) => o[f] === v).reduce((n, o) => n + classAt(o).length, 0);
const WIDER = Object.fromEntries(
  FLAGS.map((f) => {
    const [t, x] = [totalAt(f, true), totalAt(f, false)];
    return [f, t === x ? null : t > x]; // `null` = the measurement has no opinion (see G14)
  }),
);

/** Every pair of the axis, read in ONE declared direction: what is lost moving TOWARD `value`. */
const lostToward = (f, value) =>
  SPACE.filter((o) => o[f] !== value)
    .map((o) => ({
      key: o,
      lost: classAt(o).filter((x) => !classAt({ ...o, [f]: value }).includes(x)),
    }))
    .filter((p) => p.lost.length);

const CENSUS = FLAGS.map((f) => {
  const loosening = lostToward(f, SEMANTIC_RELAXED[f]);
  const tightening = lostToward(f, !SEMANTIC_RELAXED[f]);
  return {
    axis: f,
    pairs: SPACE.length / 2,
    nonMonotone: loosening.length,
    members: [...new Set(loosening.flatMap((p) => p.lost))].sort(),
    keys: loosening,
    tighteningLoses: tightening.length,
    tighteningMembers: [...new Set(tightening.flatMap((p) => p.lost))].sort(),
  };
});
const byAxis = Object.fromEntries(CENSUS.map((r) => [r.axis, r]));
const n3 = (s) => s.replace('probe-round', '');
const nonMonotone = CENSUS.filter((r) => r.nonMonotone > 0);
console.log(
  `\nSPACE — ${SWEPT.length} swept files against a naming population of ${censusPop.length}, ` +
    `over ${SPACE.length} keys (${FLAGS.length} flags), relaxation direction as named by the ` +
    `semantics:`,
);
for (const r of CENSUS)
  console.log(
    `  ${r.axis.padEnd(16)} relaxing loses at ${String(r.nonMonotone).padStart(3)} of ${r.pairs} ` +
      `paired keys${r.members.length ? ` — ${r.members.map(n3).join(', ')}` : ''}; tightening ` +
      `loses at ${String(r.tighteningLoses).padStart(3)}` +
      `${r.tighteningMembers.length ? ` — ${r.tighteningMembers.map(n3).join(', ')}` : ''}`,
  );
console.log('');

const sharedStems = [...new Set(censusPop.map(stemOf))].filter(
  (s) => censusPop.filter((f) => stemOf(f) === s).length > 1,
);
g(
  'G8',
  `over the ${SPACE.length}-key space the detector actually has — not over the ten rows of the ` +
    `table — ${nonMonotone.length} of its ${FLAGS.length} axes LOSE a member when the criterion ` +
    `is relaxed: ${nonMonotone
      .map((r) => `${r.axis} at ${r.nonMonotone} (${r.members.map(n3).join('/')})`)
      .join(', ')}, out of ${SPACE.length / 2} paired keys each. Axis G is ` +
    `${byAxis.fullLiteralName.nonMonotone}, tied for second; the worst is ` +
    `${[...nonMonotone].sort((a, b) => b.nonMonotone - a.nonMonotone)[0].axis}. The claim this ` +
    `grade carried until Round 387 — "axis G is the ONE row where relaxing loses a member" — was ` +
    `true of the row LIST and false of the detector (Theseus, Round 386 §1); every figure here is ` +
    `now a function of the space. Axis G's own loss is \`371\`, whose alias leg carries a ` +
    `UNIQUENESS quantifier (\`n.length === 1\`): \`const SUBJECT = 'scripts/probe-round224-a-…'\` ` +
    `names one file by whole filename and TWO by stem, so relaxing drops the alias. ` +
    `${sharedStems.length} stems in the population are shared (${sharedStems.map(n3).join(', ')})`,
  nonMonotone.length === 4 &&
    JSON.stringify(nonMonotone.map((r) => [r.axis, r.nonMonotone, r.members])) ===
      JSON.stringify([
        ['pathTerminal', 8, ['probe-round371']],
        ['localHelpers', 32, ['probe-round258', 'probe-round259', 'probe-round325']],
        ['excludeSelf', 4, ['probe-round224']],
        ['fullLiteralName', 8, ['probe-round371']],
      ]) &&
    sharedStems.includes('probe-round224'),
);

/**
 * `G9`'s old warrant was `everyRow` — a hand-typed array of ten key literals beside a table of
 * derived rows, which omitted axis D and was therefore not what established its own conclusion
 * (Theseus, Round 386 §3). Two cures, and the cheap one is the strong one: grade over the SPACE,
 * and derive the row list from the rows `cf` actually registered so the two can be compared.
 */
const rowAxes = [...new Set(ROWS.flatMap(([, o]) => Object.keys(o)))];
const uncovered = FLAGS.filter((f) => !rowAxes.includes(f));
/** The hand-typed `everyRow` as it stood at the pin, parsed, so the two lists can be compared. */
const normal = (o) =>
  FLAGS.filter((f) => f in o)
    .map((f) => `${f}:${o[f]}`)
    .join(',');
const pinnedRows = ((prerefactor.match(/const everyRow = \[([\s\S]*?)\n\];/) || ['', ''])[1] || '')
  .split('\n')
  .filter((l) => l.includes('{'))
  .map((l) =>
    Object.fromEntries(
      [...l.matchAll(/(\w+):\s*(true|false)/g)].map((m) => [m[1], m[2] === 'true']),
    ),
  );
const registered = ROWS.map(([, o]) => normal(o));
const neverDriven = pinnedRows.map(normal).filter((k) => !registered.includes(k));
g(
  'G9',
  `\`probe-round304\` is in the class under NONE of the ${SPACE.length} keys — not merely none of ` +
    `the table's rows — so its exclusion is not a fact about \`requireBinding\`, and it is the ` +
    `SAME criterion that excludes 297: neither file carries a full population filename inside any ` +
    `\`const\` initializer. The pre-cure sentence named 304 alone and credited 297's exclusion to ` +
    `the hand reading (345). The warrant is now the space, and the row list beside it is DERIVED ` +
    `from the ${ROWS.length} rows \`cf\` registered (${ROWS.map(([n]) => n).join(' ')}), which ` +
    `vary ${rowAxes.length} of the ${FLAGS.length} axes — the uncovered one is ` +
    `${uncovered.join(', ') || 'none'}, named by derivation and not by hand. And comparing the two ` +
    `LISTS rather than their counts (340) says more than Round 386 §3 did: the hand-typed ` +
    `\`everyRow\` at ${PREREFACTOR_AT} held ${pinnedRows.length} keys, of which ` +
    `${neverDriven.length} is a key no row of the table drives at all ` +
    `(${neverDriven.join(' | ') || 'none'}) — so "including the widest one", which is how the old ` +
    `prose justified itself, named a row that existed only inside that array`,
  SPACE.every((o) => !classAt(o).includes('probe-round304')) &&
    ROWS.length === 9 &&
    pinnedRows.length === 10 &&
    JSON.stringify(neverDriven) ===
      JSON.stringify(['requireBinding:false,excludeSelf:false,fullLiteralName:false']) &&
    JSON.stringify(uncovered) === JSON.stringify(['readMustBeCode']),
);

/**
 * The hand-entered direction table, graded against the measurement. This is `G8`'s own defect one
 * level down: a figure (here a DIRECTION) asserted beside a space that can be asked.
 */
const agree = FLAGS.filter((f) => WIDER[f] === SEMANTIC_RELAXED[f]);
const silent = FLAGS.filter((f) => WIDER[f] === null);
const disagree = FLAGS.filter((f) => WIDER[f] !== null && WIDER[f] !== SEMANTIC_RELAXED[f]);
g(
  'G10',
  `the relaxation DIRECTION, derived from membership summed over each axis's ${SPACE.length / 2} ` +
    `paired keys and compared against the semantics: ${agree.length} of ${FLAGS.length} agree, ` +
    `the measurement is silent on ${silent.length} (${silent.join(', ') || 'none'} — equal ` +
    `totals, and G14 is why), and ${disagree.length} DISAGREE: ${disagree
      .map(
        (f) =>
          `${f} (semantics say ${SEMANTIC_RELAXED[f]} relaxes; membership is ` +
          `${totalAt(f, true)} at true against ${totalAt(f, false)} at false, so ${WIDER[f]} ` +
          `admits more)`,
      )
      .join(', ')}. Axis C is the disagreement, and the reason is Theseus's own Round 386 \`B4\`: ` +
    `the leg both ADMITS a read through a local helper and REMOVES the helper's own const from the ` +
    `candidates, so it has no monotone direction at all — relaxing it loses ` +
    `${byAxis.localHelpers.members.map(n3).join(', ')} and tightening it loses ` +
    `${byAxis.localHelpers.tighteningMembers.map(n3).join(', ')}, two disjoint sets at ` +
    `${byAxis.localHelpers.nonMonotone} and ${byAxis.localHelpers.tighteningLoses} keys. The axis ` +
    `named as worst is the axis whose declared direction the measurement contradicts`,
  disagree.length === 1 &&
    disagree[0] === 'localHelpers' &&
    silent.length === 1 &&
    silent[0] === 'readMustBeCode' &&
    byAxis.localHelpers.tighteningLoses === 32 &&
    JSON.stringify(byAxis.localHelpers.tighteningMembers) ===
      JSON.stringify([
        'probe-round297',
        'probe-round299',
        'probe-round301',
        'probe-round323',
      ]) &&
    byAxis.localHelpers.members.every((m) => !byAxis.localHelpers.tighteningMembers.includes(m)),
);

/**
 * The MECHANISM of every loss, per (axis, member) at the narrowest key that loses THAT member —
 * one key per member, because they are not all lost at the same one (Theseus's own Round 386 red).
 * Attributed from the detector's own legs via `legsOf`, not from a re-reading of the source.
 */
const dist = (o) => FLAGS.filter((f) => o[f] !== LIVE[f]).length;
const MECH = nonMonotone.flatMap((r) =>
  r.members.map((member) => {
    const key = r.keys
      .filter((p) => p.lost.includes(member))
      .map((p) => p.key)
      .sort((a, b) => dist(a) - dist(b))[0];
    const file = SWEPT.map((e) => e.file).find((f) => f.startsWith(member));
    const tight = legsOf(file, key);
    const loose = legsOf(file, { ...key, [r.axis]: SEMANTIC_RELAXED[r.axis] });
    const swallowed = tight.bound.filter((id) => loose.helpers.includes(id));
    const quantified = [...tight.alias.keys()].filter((id) =>
      loose.quantifierRejected.some(([q]) => q === id),
    );
    return {
      axis: r.axis,
      member,
      at: FLAGS.filter((f) => key[f] !== LIVE[f]).map((f) => `${f}:${key[f]}`),
      bound: tight.bound,
      kind:
        tight.bound.length && swallowed.length === tight.bound.length
          ? 'helper-exclusion'
          : quantified.length
            ? 'quantifier'
            : 'unattributed',
    };
  }),
);
const kindOf = (f) => [...new Set(MECH.filter((m) => m.axis === f).map((m) => m.kind))];
const keysOfKind = (k) =>
  nonMonotone
    .filter((r) => JSON.stringify(kindOf(r.axis)) === JSON.stringify([k]))
    .reduce((n, r) => n + r.nonMonotone, 0);
g(
  'G11',
  `and the two mechanisms, each attributed from the legs \`legsOf\` returns rather than from a ` +
    `re-reading: ${MECH.map((m) => `${n3(m.member)}/${m.axis.slice(0, 4)} ${m.kind}`).join(', ')}. ` +
    `Theseus's Round 386 §1 priced them "8 against 32" — one axis against one axis. In the KEY ` +
    `unit the quantifier is ${keysOfKind('quantifier')} against ` +
    `${keysOfKind('helper-exclusion')}, because it is the mechanism of ` +
    `${nonMonotone.filter((r) => kindOf(r.axis)[0] === 'quantifier').length} of the ` +
    `${nonMonotone.length} non-monotone axes and only one of them is axis G. His conclusion ` +
    `holds — the quantifier is the rarer — and the margin is 12 keys narrower than the figure ` +
    `beside it (345: re-derive a routed figure in the unit the claim is about)`,
  MECH.length === 6 &&
    keysOfKind('quantifier') === 20 &&
    keysOfKind('helper-exclusion') === 32 &&
    !MECH.some((m) => m.kind === 'unattributed') &&
    kindOf('localHelpers')[0] === 'helper-exclusion',
);

/** Axis D, the one `G9`'s derived row list reports as uncovered: what it can and cannot move. */
const dPairs = SPACE.filter((o) => o.readMustBeCode === true).map((o) => [
  classAt(o),
  classAt({ ...o, readMustBeCode: false }),
]);
g(
  'G14',
  `axis D (\`readMustBeCode\`) is the axis no row varies, and the space says why that is harmless ` +
    `rather than lucky: the class is IDENTICAL at all ${dPairs.length} of its paired keys, so no ` +
    `key anywhere in the space can be moved by it — which is also why G10's derived direction is ` +
    `silent on it. It is not inert at site granularity: CF-D above reads ${subjSites.length} ` +
    `sites with the guard and ${noStringGuard} without, on the subject's own file. The row table ` +
    `prices axis D through a SITE count because a class count cannot see it`,
  dPairs.every(([a, b]) => JSON.stringify(a) === JSON.stringify(b)) &&
    dPairs.length === SPACE.length / 2 &&
    noStringGuard > subjSites.length,
);

// ── the CONTROL: the pre-cure spelling, read out of git, and the shipped probe driven ─────────
/**
 * A PINNED commit, not `HEAD`. Read from `HEAD` this control would be green now and red the moment
 * the cure is committed — a pin that reddens on its own promotion, which is this very file's Round
 * 377 lesson. `e9e64fef` is the last commit before the cure.
 *
 * And it grades the CLAIM, not a substring. The first spelling of this control keyed on the bytes
 * `members, 5 bind` and `be the 6th` being absent from the working tree, and it went red on the
 * cure — because the cure's own prose QUOTES the defective sentence in order to report it. That is
 * the Round 371 shape exactly, and it is a false negative the detector hands you for free. What
 * cannot be faked by a quotation is the content: which members the old clause NAMED, how many, and
 * whether the subject was among them.
 */
const PRECURE_AT = 'e9e64fef';
const preCure = git(['show', `${PRECURE_AT}:scripts/${SUBJECT}`]);
const clause = (preCure.match(/members, 5 bind[\s\S]*?a loop over the whole population/) || [''])[0];
const claimed = [...new Set([...clause.matchAll(/probe-round(\d+)|`(\d{3})`/g)].map((m) => m[1] ?? m[2]))];
const handNums = HAND_READ_CLASS.map((f) => f.replace('probe-round', ''));
g(
  'G6',
  `CONTROL — the clause at ${PRECURE_AT} names ${claimed.length} members (${claimed.join(', ')}), ` +
    `every one of them real but the list a strict SUBSET of the ${handNums.length} the hand ` +
    `reading finds; the subject's own ${SUBJECT.slice(11, 14)} is absent from it, which is what ` +
    `"will be the 6th" asserted and what G3 falsifies. The defect is graded by its content, so no ` +
    `amount of quoting it in the cure can make this pass (371)`,
  claimed.length === 5 &&
    claimed.every((n) => handNums.includes(n)) &&
    claimed.length < handNums.length &&
    !claimed.includes(SUBJECT.slice(11, 14)) &&
    /be the 6th/.test(preCure),
);

const drive = execFileSync('npx', ['tsx', join(SCRIPTS, SUBJECT)], {
  cwd: REPO,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
const b1n = (drive.match(/\[MEAS\] B1n .*/) || [''])[0];
g(
  'G7',
  `BEHAVIOURAL — the shipped probe drives green on the new arm and publishes the same member list ` +
    `this instrument computed, so the cure is graded by driving it and not only by re-reading it ` +
    `(369): B1c [ok], B1n names all ${live.length}`,
  /\[ok\] B1c\b/.test(drive) &&
    /All 13 regression checks passed/.test(drive) &&
    live.every((f) => b1n.includes(`\`${f}\``)),
);

// ── G12: the licence for the cache and the leg refactor, over the whole space ─────────────────
/**
 * Round 387 moved three things inside the detector: the two readings are memoised per file, the
 * statements are memoised with them, and the legs are returned as data (`legsOf`) so a mechanism
 * can be attributed from what they did. None of it is supposed to change a class, and "supposed
 * to" is not a grade (357 — a verbatim source pin is not a property pin, and a refactor's own
 * author re-reading it is not a measurement).
 *
 * So the detector as it stood BEFORE this round is read out of git, cut at the same marker, and
 * driven over all 256 keys; the two class maps must be equal key by key and member by member (340
 * — compare member LISTS, not counts). This is the expensive grade in the file: the old detector
 * has no cache, which is the whole reason the cache went in.
 */
const old = prerefactor;
const OLD_MARKER = '// ── grades ──';
const oldMarkers = old.split(OLD_MARKER).length - 1;
const TEMP = join(REPO, 'docs/research/round383-instruments', '.round387-prerefactor.mjs');
let oldMap = null;
let oldErr = null;
try {
  if (oldMarkers !== 1) throw new Error(`marker occurs ${oldMarkers} times at the pin, expected 1`);
  writeFileSync(TEMP, old.slice(0, old.indexOf(OLD_MARKER)) + '\nexport { classUnder, LIVE };\n');
  const OLD = await import(TEMP);
  oldMap = new Map(SPACE.map((o) => [keyOf(o), OLD.classUnder(o)]));
} catch (e) {
  oldErr = e;
} finally {
  rmSync(TEMP, { force: true });
}
const differing = oldMap
  ? [...CLASS].filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(oldMap.get(k)))
  : null;
g(
  'G12',
  `EQUIVALENCE — the detector at ${PREREFACTOR_AT}, before this round memoised its readings and ` +
    `turned its legs into data, driven over the same ${SPACE.length} keys: ` +
    `${differing ? `${SPACE.length - differing.length} of ${SPACE.length} keys identical member ` +
      `for member, ${differing.length} differing` : `COULD NOT RUN — ${oldErr?.message}`}. The ` +
    `cache is a pure function of the file's bytes and the refactor moved no predicate, and this ` +
    `is what says so rather than my having re-read it. It is also the one grade here that pays ` +
    `the uncached cost, which is what it is measuring`,
  differing !== null && differing.length === 0 && CLASS.size === SPACE.length,
);

// ── G15/G16: the README's own hand-typed tally, the second finding of Round 386 ────────────────
/**
 * Theseus's Round 386 §2: this directory's `README.md` headlined a grade count that the instrument
 * had outgrown — and it was left behind by `e922394b`, the commit that changed 45 lines of that
 * very README to add four rows to its table. `E5` in `round385-instruments` grades the DRIVEN
 * count; nothing read the README's.
 *
 * The cure is not a fresher number. A number in prose beside a derived one is the defect whatever
 * its value, and pinning a count in prose reddens on its own promotion (377). So the README now
 * carries NO tally at all and says that the drive prints it — and `G15` grades the ABSENCE, which
 * is a property that cannot drift. `G16` is the pair of controls that keeps `G15` from being a
 * sentence about nothing.
 */
const README = join(REPO, 'docs/research/round383-instruments/README.md');
const TALLY = /\b\d+\s+grades\b/;
const liveReadme = readFileSync(README, 'utf8');
const pinnedReadme = git(['show', `${PREREFACTOR_AT}:docs/research/round383-instruments/README.md`]);
const tallyIn = (src) => Number((src.match(/\b(\d+)\s+grades\b/) || [])[1]);
g(
  'G15',
  `the README in this directory carries NO hand-typed grade tally any more — the tally is the ` +
    `drive's to print, at the bottom of this run. This grade reads the ABSENCE and never a value, ` +
    `so it cannot itself fall behind, and no figure in the document can: at ${PREREFACTOR_AT} the ` +
    `headline was ${tallyIn(pinnedReadme)}, which the instrument had already outgrown in that ` +
    `same commit (the DISAGREEMENT is graded at a pin by \`R1\` in round386-instruments; what is ` +
    `graded here is that there is nothing left to disagree)`,
  !TALLY.test(liveReadme) && TALLY.test(pinnedReadme) && tallyIn(pinnedReadme) === 14,
);
const fixedReadme = pinnedReadme.replace(/\b14\s+grades\b/, '18 grades');
g(
  'G16',
  `CONTROLS for G15, two populations differing in the property and not in the defect's bytes ` +
    `(383): the pinned README trips the absence check (${TALLY.test(pinnedReadme)}), and so does ` +
    `the pinned README with its one token corrected to the figure the instrument drove at that ` +
    `pin (${TALLY.test(fixedReadme)}) — same bytes otherwise, disagreement gone, absence check ` +
    `still red. So G15 keys on a figure being THERE TO DRIFT rather than on its being wrong today, ` +
    `which is the difference between the two cures: a corrected number is one round from being ` +
    `wrong again, and this round is the one that proved it`,
  TALLY.test(pinnedReadme) &&
    TALLY.test(fixedReadme) &&
    fixedReadme !== pinnedReadme &&
    tallyIn(fixedReadme) === 18 &&
    tallyIn(pinnedReadme) === 14,
);

const bad = grades.filter(([, ok]) => ok !== true);
console.log(`\n${grades.length} grades, ${bad.length} not true`);
if (bad.length) console.log(`NOT TRUE: ${bad.map(([n]) => n).join(' ')}`);
process.exit(bad.length ? 1 : 0);
