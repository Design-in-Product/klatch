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
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');
const { SWEPT, census } = await import(join(SCRIPTS, 'sweep-probes.mjs'));
const { stripSource } = await import(join(SCRIPTS, 'lib', 'strip-source.mjs'));

const censusPop = census(SCRIPTS);
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
  excludeSelf: true,
};

const bindingsIn = (file, opt = LIVE) => {
  const raw = readFileSync(join(SCRIPTS, file), 'utf8');
  const code = stripSource(raw, false); // comments and regex bodies blanked, strings KEPT
  const blank = stripSource(raw, true); // string bodies blanked too, same offsets (length-preserving)
  const others = censusPop.filter((f) => !opt.excludeSelf || f !== file);
  const stmts = constStatements(code);

  // axis B applies to the ALIAS leg only — how a const binds a PATH — which is where Theseus's
  // Round 378 v2 carried it. The inline leg names the file inside the read call, where neither
  // sub-axis can hold, and restricting it there loses `263` and `269` for the wrong reason.
  const names = (init, forAlias = false) =>
    others.filter((f) => {
      if (!init.includes(f)) return false;
      if (!forAlias) return true;
      const m = new RegExp(`(['"\`])([^'"\`]*)${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`).exec(init);
      if (opt.pathBare && (!m || m[2] !== '')) return false;
      if (opt.pathTerminal && (!m || m[0].trim() !== init.trim())) return false;
      return true;
    });

  const alias = new Map();
  if (opt.viaIdentifier)
    for (const [id, init] of stmts) {
      const n = names(init, true);
      if (n.length === 1 && !/readFileSync|\bread\s*\(/.test(init)) alias.set(id, n[0]);
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
  return bound;
};

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
const cf = (name, opt, claim, want) => {
  const got = classUnder({ ...LIVE, ...opt });
  const lost = HAND_READ_CLASS.filter((h) => !got.includes(h));
  const gained = got.filter((h) => !HAND_READ_CLASS.includes(h));
  const ok = want(got, lost, gained);
  grades.push([name, ok]);
  console.log(
    `${ok === true ? 'GRADE' : 'NOT TRUE'} ${name}: ${ok} — ${claim}; reads ${got.length}, ` +
      `lost [${lost.join(' ')}], gained [${gained.join(' ')}]`,
  );
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
  'axis C — the local read-helper leg removed. INERT today: the class is the same either way, and ' +
    'the leg is kept because the two near misses that use a helper are excluded for binding no ' +
    'SOURCE, which is a reason worth being able to state rather than to luck into',
  (_got, lost, gained) => lost.length === 0 && gained.length === 0,
);
cf(
  'CF-F',
  { requireBinding: false },
  'the bound-to-an-identifier criterion removed — load-bearing, and it reaches three of the four ' +
    'hand-read near misses. It does NOT reach `probe-round304`, whose naming site is in no ' +
    '`const` statement at all, so that exclusion rests on the hand reading and not on this flag',
  (_got, lost, gained) =>
    lost.length === 0 &&
    JSON.stringify(gained) ===
      JSON.stringify(['probe-round224', 'probe-round244', 'probe-round262']),
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

// ── the CONTROL: the pre-cure spelling, read out of git, and the shipped probe driven ─────────
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8' });
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

const bad = grades.filter(([, ok]) => ok !== true);
console.log(`\n${grades.length} grades, ${bad.length} not true`);
if (bad.length) console.log(`NOT TRUE: ${bad.map(([n]) => n).join(' ')}`);
process.exit(bad.length ? 1 : 0);
