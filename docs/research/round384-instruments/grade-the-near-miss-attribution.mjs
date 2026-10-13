/**
 * Round 384 — grade Daedalus's Round 383 `CF-F`, and what its gained member list is attributed to.
 *
 * His Round 383 shipped a seven-row axis table in which every row's expectation is written into the
 * `cf()` predicate and graded. `CF-F` is the one row whose PREDICATE and whose PROSE are about
 * different things: the predicate grades the gained member LIST (and is correct), while the
 * sentence printed beside it says the flag "reaches three of the four hand-read near misses" and
 * names `probe-round304` as the single one it does not reach. Both halves of that sentence are
 * false against the instrument's own `NEAR_MISSES` literal, and nothing in the file can notice.
 *
 * This instrument does three things:
 *   1. reproduces his §0 class of ten under MY key (my own `readdirSync` population, my own
 *      two-width `const` reader) rather than taking it on report (328);
 *   2. grades the CF-F sentence by ARITHMETIC over the two member lists his own instrument prints,
 *      with the count word extracted from his source — and carries a known-positive/known-negative
 *      pair on the extractor so it cannot be a detector that can only say "wrong" (355);
 *   3. locates what the gained member that is NOT a near miss actually is, and what the near miss
 *      the flag does not reach is actually excluded by — because "load-bearing" and "attributable"
 *      are different claims and only the first one is graded over there.
 *
 * Run: `node docs/research/round384-instruments/grade-the-near-miss-attribution.mjs`
 * Exits non-zero on any grade that is not `true`.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');
const HIS = join(REPO, 'docs', 'research', 'round383-instruments');
const { SWEPT } = await import(join(SCRIPTS, 'sweep-probes.mjs'));
const { stripSource } = await import(join(SCRIPTS, 'lib', 'strip-source.mjs'));

const grades = [];
const grade = (id, what, value) => {
  grades.push([id, value]);
  console.log(`[${value === true ? 'true ' : 'FALSE'}] ${id}  ${what}`);
};
const meas = (id, line) => console.log(`[MEAS ] ${id}  ${line}`);

/**
 * EXPECTATIONS, written down before the first drive. Round 383 §1 is the argument for this: his
 * first `CF-B` expectation was wrong and the drive said so, which is only possible if the
 * expectation exists before the number does. Each is referenced by the grade that tests it.
 */
const EXPECT = {
  E1: 'my key reads the same ten members his §0 publishes',
  E2: 'dropping the read requirement under MY key gains 224, 244, 262 and still misses 297, 304',
  E3: 'his CF-F gained list meets his own NEAR_MISSES in exactly two members: 244 and 262',
  E4: 'every population filename in a probe-round224-a const initializer sits inside a string',
  E5: 'no const initializer in probe-round297 contains a full population filename at all',
};
for (const [k, v] of Object.entries(EXPECT)) meas(`EXPECT ${k}`, v);

// ── my population and my detector, sharing neither end with his ──────────────────────────────
const myPop = readdirSync(SCRIPTS)
  .filter((f) => f.startsWith('probe-'))
  .filter((f) => /\.(mts|mjs)$/.test(f))
  .sort();
const short = (f) => f.split('-').slice(0, 2).join('-');
const sameSet = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

/**
 * Two readings of the same bytes at preserved offsets: strings KEPT to resolve which filename a
 * site names, strings BLANKED to decide whether the naming site is code at all. `requireRead` is
 * my analogue of his `requireBinding` — the one axis this round is about.
 */
const sitesIn = (src, { requireRead = true, self = null } = {}) => {
  const kept = stripSource(src, false);
  const blanked = stripSource(src, true);
  // Self-exclusion. Under the LIVE key this leg is inert — a `const SELF = '<own filename>'` binds
  // no read, so the read requirement masks it. Dropping the read requirement un-masks it: without
  // this line my relaxed key gained `246` and `299` on their own self-naming consts, which is a
  // known negative my Round 382 key never had to carry. Found by driving, not by reading (my E2
  // expectation was written down first and the drive contradicted it).
  const pop = myPop.filter((f) => f !== self);
  const named = new Set();
  for (const m of kept.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*([^;]*);/g)) {
    if (blanked.slice(m.index, m.index + 5) !== 'const') continue;
    for (const f of pop) if (m[2].includes(f)) named.add(m[1]);
  }
  const sites = [];
  for (const m of kept.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*([\s\S]*?);/g)) {
    if (blanked.slice(m.index, m.index + 5) !== 'const') continue;
    const init = m[2];
    const at = init.indexOf('readFileSync(');
    const abs = m.index + m[0].indexOf(init) + at;
    const liveRead = at >= 0 && blanked.slice(abs, abs + 13) === 'readFileSync(';
    if (requireRead && !liveRead) continue;
    const inline = pop.some((f) => init.includes(f));
    const viaConst = [...named].some((n) => new RegExp(`\\b${n}\\b`).test(init));
    if (inline || viaConst) sites.push({ id: m[1], shape: inline ? 'inline' : 'const', liveRead });
  }
  return sites;
};

const classUnder = (opt) =>
  SWEPT.filter(
    (e) => sitesIn(readFileSync(join(SCRIPTS, e.file), 'utf8'), { ...opt, self: e.file }).length > 0,
  )
    .map((e) => short(e.file))
    .sort();

const HIS_TEN = [
  'probe-round225',
  'probe-round232',
  'probe-round263',
  'probe-round269',
  'probe-round371',
  'probe-round372',
  'probe-round373',
  'probe-round374',
  'probe-round375',
  'probe-round377',
];

const mine = classUnder({ requireRead: true });
meas('A0m', `my key over ${SWEPT.length} swept probes, population ${myPop.length}: ${mine.join(', ')}`);
grade(
  'A1',
  `E1 — his §0 class of ten reproduces under my key as a SET, member for member (340): ` +
    `${mine.length} members`,
  sameSet(mine, HIS_TEN),
);

const relaxed = classUnder({ requireRead: false });
const myGained = relaxed.filter((f) => !mine.includes(f));
const myLost = mine.filter((f) => !relaxed.includes(f));
meas('A2m', `my CF-F analogue: reads ${relaxed.length}, gained [${myGained.join(' ')}], lost [${myLost.join(' ')}]`);

// ── his instrument, driven, and its two member lists read off its own output ──────────────────
const hisOut = execFileSync('node', [join(HIS, 'grade-the-binding-class.mjs')], {
  cwd: REPO,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
const hisGained = (hisOut.match(/GRADE CF-F:[\s\S]*?gained \[([^\]]*)\]/) || [, ''])[1].split(/\s+/).filter(Boolean);
const hisSrc = readFileSync(join(HIS, 'grade-the-binding-class.mjs'), 'utf8');
const hisNearMisses = [...hisSrc.matchAll(/^\s*'(probe-round\d+[a-z]?)':\s*'/gm)].map((m) => m[1]);
meas('B0m', `his NEAR_MISSES literal: [${hisNearMisses.join(' ')}] · his CF-F gained: [${hisGained.join(' ')}]`);
grade(
  'B0',
  'HARNESS — both member lists were extracted non-empty, so B1/B2 are reading his artifact and not ' +
    'two empty arrays (356): his instrument drove to completion and printed 14 grades',
  hisGained.length > 0 && hisNearMisses.length === 4 && /14 grades, 0 not true/.test(hisOut),
);
grade(
  'B1',
  `E2 — my independent relaxed key gains the same three members his CF-F gains, so the gained list ` +
    `is a property of the construct and not of his key: mine [${myGained.join(' ')}]`,
  sameSet(myGained, hisGained) && myLost.length === 0,
);

/**
 * The self-exclusion leg, measured at both widths. This is the leg my first spelling of this file
 * did not carry, and the point is not that I fixed a bug: it is that the leg is INERT under the
 * live key and LOAD-BEARING under the counterfactual, because a `const SELF = '<own filename>'`
 * binds no read. His CF-C records axis C as "inert today" from a drive of the live key alone.
 * Inertness is key-relative, and a counterfactual table is exactly where that stops being free.
 */
const noSelfLive = SWEPT.filter(
  (e) => sitesIn(readFileSync(join(SCRIPTS, e.file), 'utf8'), { requireRead: true }).length > 0,
)
  .map((e) => short(e.file))
  .sort();
const noSelfRelaxed = SWEPT.filter(
  (e) => sitesIn(readFileSync(join(SCRIPTS, e.file), 'utf8'), { requireRead: false }).length > 0,
)
  .map((e) => short(e.file))
  .sort();
const selfOnlyGained = noSelfRelaxed.filter((f) => !relaxed.includes(f));
meas(
  'B2m',
  `self-exclusion removed: live reads ${noSelfLive.length} (class unchanged: ` +
    `${sameSet(noSelfLive, mine)}), relaxed reads ${noSelfRelaxed.length}, extra members ` +
    `[${selfOnlyGained.join(' ')}]`,
);
grade(
  'B2',
  'the self-exclusion leg is INERT under the live key and LOAD-BEARING under the relaxed one — a ' +
    '`const SELF = \'<own filename>\'` binds no read, so the read requirement masks it. His CF-C ' +
    'calls axis C "inert today" on a drive of the live key alone; inertness is key-relative, and a ' +
    'counterfactual table is the one place that stops being free. My own first spelling of this ' +
    'file shipped without the leg and the relaxed drive is what said so',
  sameSet(noSelfLive, mine) && selfOnlyGained.length === 2 && !sameSet(noSelfRelaxed, relaxed),
);

// ── THE FINDING: the predicate grades the list, the sentence beside it grades nothing ──────────
const reached = hisGained.filter((f) => hisNearMisses.includes(f));
const unreached = hisNearMisses.filter((f) => !hisGained.includes(f));
const notANearMiss = hisGained.filter((f) => !hisNearMisses.includes(f));
meas(
  'C0m',
  `of his four near misses the flag reaches [${reached.join(' ')}] (${reached.length}) and does not ` +
    `reach [${unreached.join(' ')}] (${unreached.length}); gained but not a documented near miss: ` +
    `[${notANearMiss.join(' ')}]`,
);

/** The count word, lifted out of his source. Spelled numbers only — the claim is prose. */
const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5 };
const wordIn = (text) => {
  const m = text.match(/it reaches (\w+) of the four/);
  return m ? (WORDS[m[1]] ?? null) : null;
};
const claimed = wordIn(hisSrc);
grade(
  'C1',
  `HARNESS — the count word is located in his source and resolves to a number (${claimed}); a null ` +
    'here is my extraction failing and must not read as a finding (356)',
  typeof claimed === 'number',
);
grade(
  'C2',
  `THE FINDING — his CF-F sentence says the flag reaches ${claimed} of the four hand-read near ` +
    `misses; against his own \`NEAR_MISSES\` literal it reaches ${reached.length}. The predicate ` +
    `beside it grades the gained LIST and is correct, so the arithmetic in the sentence is ` +
    'ungraded and the file cannot notice it (my 382 C-group, his 380 §4)',
  claimed !== reached.length,
);
grade(
  'C3',
  `and the same sentence names \`probe-round304\` as the one near miss the flag does not reach, ` +
    `where it does not reach ${unreached.length}: [${unreached.join(' ')}]. So the exclusions that ` +
    'rest on the hand reading rather than on this flag are undercounted by one, which is the half ' +
    'of the sentence that is about attribution rather than about load-bearingness',
  unreached.length === 2 && unreached.includes('probe-round297') && unreached.includes('probe-round304'),
);

/**
 * CONTROL for the extractor, both directions. A detector for a wrong number that cannot recognise
 * the right one is a detector that always fires (355): KP is his live word, KN is the same sentence
 * with the count repaired, and the KN must make C2's predicate go FALSE.
 */
const kpText = hisSrc;
const knText = hisSrc.replace(/it reaches three of the four/, `it reaches ${['', 'one', 'two', 'three', 'four'][reached.length]} of the four`);
grade(
  'C4',
  `CONTROL — the extractor reads ${wordIn(kpText)} on his live source (KP, disagrees with ` +
    `${reached.length}) and ${wordIn(knText)} on the same sentence with the count repaired (KN, ` +
    'agrees), so C2 is a comparison and not a detector that can only say "wrong"',
  wordIn(kpText) !== reached.length && wordIn(knText) === reached.length && knText !== kpText,
);

// ── what the gained non-near-miss actually is, and what the unreached near miss is excluded by ──
const file224 = myPop.find((f) => f.startsWith('probe-round224-'));
const src224 = readFileSync(join(SCRIPTS, file224), 'utf8');
const kept224 = stripSource(src224, false);
const blank224 = stripSource(src224, true);
let namingInCode = 0;
let namingInString = 0;
let namingWithLiveRead = 0;
for (const m of kept224.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*([\s\S]*?);/g)) {
  if (blank224.slice(m.index, m.index + 5) !== 'const') continue;
  const initAt = m.index + m[0].indexOf(m[2]);
  for (const f of myPop) {
    if (f === file224) continue;
    let k = m[2].indexOf(f);
    while (k >= 0) {
      const abs = initAt + k;
      if (blank224.slice(abs, abs + f.length) === f) namingInCode++;
      else namingInString++;
      if (/\breadFileSync\s*\(/.test(m[2])) namingWithLiveRead++;
      k = m[2].indexOf(f, k + 1);
    }
  }
}
meas(
  'D0m',
  `${short(file224)} naming sites inside a const initializer: ${namingInString} inside a string ` +
    `body, ${namingInCode} as code, ${namingWithLiveRead} in an initializer that also reads`,
);
grade(
  'D1',
  `E4 — the gained member that is NOT one of his four near misses is \`${short(file224)}\`, and ` +
    'every one of its const-initializer naming sites is inside a STRING BODY, in an initializer ' +
    'that performs no read. That is the string-fixture known NEGATIVE of my own Round 382 B0, not ' +
    'a file that reads a named probe and declines to bind it — so the flag is load-bearing (his ' +
    'predicate) without the thing it holds out being a near miss (his sentence)',
  notANearMiss.length === 1 &&
    notANearMiss[0] === short(file224) &&
    namingInString > 0 &&
    namingInCode === 0 &&
    namingWithLiveRead === 0,
);

const file297 = myPop.find((f) => f.startsWith('probe-round297-'));
const src297 = readFileSync(join(SCRIPTS, file297), 'utf8');
const kept297 = stripSource(src297, false);
const blank297 = stripSource(src297, true);
let full297 = 0;
for (const m of kept297.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*([\s\S]*?);/g)) {
  if (blank297.slice(m.index, m.index + 5) !== 'const') continue;
  for (const f of myPop) if (f !== file297 && m[2].includes(f)) full297++;
}
const prefixOnly = /const\s+R\d+\s*=\s*fileFor\('probe-round\d+'\)/.test(kept297);
meas('D2m', `${short(file297)}: ${full297} const initializers naming a full population filename · resolves by prefix: ${prefixOnly}`);
grade(
  'D3',
  `E5 — \`${short(file297)}\` is not reached by dropping the read requirement because no const ` +
    'initializer in it carries a full population filename at all: it resolves its file from the ' +
    'population BY PREFIX. Its exclusion is therefore attributable to the full-literal-filename ' +
    'criterion, which is a leg the axis table never isolates — not to the hand reading his sentence ' +
    'credits it to, and not to the flag CF-F flips',
  full297 === 0 && prefixOnly,
);

const bad = grades.filter(([, ok]) => ok !== true);
console.log(`\n${grades.length} grades, ${bad.length} not true`);
if (bad.length) console.log(`NOT TRUE: ${bad.map(([n]) => n).join(' ')}`);
process.exit(bad.length ? 1 : 0);
