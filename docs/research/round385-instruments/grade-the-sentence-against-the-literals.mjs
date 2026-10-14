/**
 * Round 385 — grade the `CF-F` sentence against the literals it talks about.
 *
 * Theseus's Round 384 §1: `CF-F`'s PREDICATE is a member-list equality and it is right; the
 * SENTENCE printed beside it said "three of the four hand-read near misses" when the intersection
 * of that same list with `NEAR_MISSES` is two, named `304` as the only one unreached when `297` is
 * unreached too, and implied `224` is a near miss when it is in no near-miss list in the repo.
 *
 * Nothing connected the prose to the predicate, so nothing could catch it. This instrument:
 *   A — verifies his two attributions under a key of my own, before either is taken on report;
 *   B — CONTROL, grades the pre-cure sentence out of a PINNED commit by CONTENT, not by bytes;
 *   C — grades the cure BEHAVIOURALLY, by mutating `NEAR_MISSES` and requiring the printed
 *       sentence to move with it, so this is not a source regex recomputing what it grades (369);
 *   E — records the four expectations written down BEFORE anything drove, including the two that
 *       were wrong. The first one being wrong is where `G8` came from.
 *
 * Run: `node docs/research/round385-instruments/grade-the-sentence-against-the-literals.mjs`
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

const { census } = await import(join(SCRIPTS, 'sweep-probes.mjs'));
const { stripSource } = await import(join(SCRIPTS, 'lib', 'strip-source.mjs'));
const pop = census(SCRIPTS);
const fileFor = (stem) => pop.find((f) => f.startsWith(stem));

// ── the expectation block, printed before the first grade (Theseus, Round 384 §1 discipline) ──
const EXPECTED = [
  ['E1', 'CF-G alone (stem matching, every other flag live) reads 10 — gained [], lost []'],
  ['E2', 'CF-FG (binding requirement off AND stem matching) is what admits `297`'],
  ['E3', '`304` stays out under both'],
  ['E4', 'CF-E (binding requirement off, self-exclusion off) gains exactly `246` and `299`'],
];
console.log('EXPECT — written down before anything drove:');
for (const [n, t] of EXPECTED) console.log(`  ${n}: ${t}`);
console.log('');

const grades = [];
const g = (name, claim, ok) => {
  grades.push([name, ok]);
  console.log(`${ok === true ? 'GRADE' : 'NOT TRUE'} ${name}: ${ok} — ${claim}`);
};

// ── A — his two attributions, under my own key ───────────────────────────────────────────────
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
 * Two readings at two granularities, kept apart on purpose (345). `occurrences` counts every
 * textual naming of another population file anywhere in the source — that is the unit his
 * "eleven naming sites" is in. `statements` counts const initializers that name at least one —
 * that is the unit the detector works in. Conflating them is how a figure drifts between memos.
 */
const namingReading = (stem) => {
  const file = fileFor(stem);
  const raw = readFileSync(join(SCRIPTS, file), 'utf8');
  const code = stripSource(raw, false); // comments and regex bodies blanked, strings KEPT
  const blank = stripSource(raw, true); // string bodies blanked too, same offsets
  const others = pop.filter((f) => f !== file);
  let occurrences = 0;
  for (const f of others) {
    let i = -1;
    while ((i = raw.indexOf(f, i + 1)) >= 0) occurrences++;
  }
  const statements = [];
  for (const [id, init, from] of constStatements(code)) {
    const named = others.filter((f) => init.includes(f));
    if (!named.length) continue;
    let inStringBody = true;
    let seen = 0;
    for (const f of named) {
      let i = -1;
      while ((i = init.indexOf(f, i + 1)) >= 0) {
        seen++;
        if (blank.slice(from + i, from + i + f.length) === f) inStringBody = false;
      }
    }
    statements.push({ id, named: named.length, seen, inStringBody, reads: /\breadFileSync\s*\(|\bread\s*\(/.test(init) });
  }
  return { file, occurrences, statements };
};

const r224 = namingReading('probe-round224');
g(
  'A1',
  `his "eleven naming sites" in \`224\` reproduces under my own key at the OCCURRENCE granularity ` +
    `— ${r224.occurrences} of them — and they sit in ${r224.statements.length} const initializers ` +
    `(${r224.statements.map((s) => s.id).join(', ')}), every one of them naming only inside ` +
    `STRING BODIES and none of them performing a read. So \`224\` is a fixture array of expected ` +
    `site labels, the string-fixture known NEGATIVE of his Round 382 \`B0\` — not a near miss. ` +
    `\`requireBinding\` is load-bearing exactly as \`CF-F\`'s predicate says; what it holds out ` +
    `there is a fixture`,
  r224.occurrences === 11 &&
    r224.statements.length === 3 &&
    r224.statements.every((s) => s.inStringBody && !s.reads) &&
    r224.statements.reduce((n, s) => n + s.seen, 0) === 11,
);

const r297 = namingReading('probe-round297');
const r304 = namingReading('probe-round304');
g(
  'A2',
  `and \`297\` and \`304\` are excluded by the SAME criterion, not two different ones: neither ` +
    `carries a full population filename inside any const initializer (${r297.statements.length} ` +
    `and ${r304.statements.length}), though each names one in an expression — \`297\` inside ` +
    `\`read(R225).includes('probe-round219-…')\`, \`304\` inside a \`.test(read(join(…)))\`. The ` +
    `pre-cure sentence credited only \`304\`'s exclusion to the hand reading`,
  r297.statements.length === 0 && r297.occurrences === 1 && r304.statements.length === 0,
);

// ── B — CONTROL: the pre-cure sentence, out of a pinned commit, graded by CONTENT ─────────────
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8' });
/**
 * A PINNED commit, not `HEAD` — a control read from `HEAD` is green now and red the moment the
 * cure lands (377, and Round 383's own `G6`). `a43a0c21` is the last commit before the cure.
 *
 * And it grades the CLAIM, not the bytes. This matters more here than it did in Round 383: the
 * cured `README.md` QUOTES "three of the four" in order to report the defect, so a control keyed
 * on those bytes being absent from the working tree would be red on a correct cure — the exact
 * false negative Round 383 §3 was about, and the one Theseus's `C4`/`C6` hit. What a quotation
 * cannot fake is the arithmetic: the number the pre-cure sentence published, next to the
 * intersection its own literals support.
 */
const PRECURE_AT = 'a43a0c21';
const preCureRaw = git(['show', `${PRECURE_AT}:docs/research/round383-instruments/grade-the-binding-class.mjs`]);
/**
 * Joined across the JS concatenation seams first. The first spelling of `B1` below keyed on
 * `it reaches (\w+) of the (\w+) hand-read near misses` and read `undefined`, because the source
 * spells that sentence `'…it reaches three of the four ' +\n    'hand-read near misses…'` and the
 * words are not adjacent in the BYTES. The claim lives in the concatenated sentence; a pin that
 * reads the bytes is reading a different object than the one the reader sees (344 — a span test
 * blind to what the transformation does to its own anchors).
 */
const preCure = preCureRaw.replace(/'\s*\+\s*\n\s*'/g, '');
const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5 };
/**
 * The whole reading, as a function of a source string, so the control can be driven against a
 * known NEGATIVE as well as the live positive (`B3`). `published === undefined` is reported as a
 * READ FAILURE and never as agreement — the first spelling of this returned `undefined` because
 * the sentence crosses a concatenation seam, and an `undefined !== 2` would have scored the
 * control GREEN for the wrong reason (353 — a missing key scores as `undefined`, so make the
 * figure refuse).
 */
const readSentence = (src) => {
  const nearMisses = [
    ...(src.match(/const NEAR_MISSES = \{[\s\S]*?\n\};/) || [''])[0].matchAll(/'(probe-round\d+)'/g),
  ].map((m) => m[1]);
  const gained = [
    ...(src.match(/'CF-F',[\s\S]*?\n\);/) || [''])[0].matchAll(/JSON\.stringify\(\[([\s\S]*?)\]\)/g),
  ].flatMap((m) => [...m[1].matchAll(/'(probe-round\d+)'/g)].map((x) => x[1]));
  const published = WORDS[(src.match(/it reaches (\w+) of the (\w+) hand-read near misses/) || [])[1]];
  const supported = nearMisses.filter((f) => gained.includes(f)).length;
  return { nearMisses, gained, published, supported, read: published !== undefined };
};
const pre = readSentence(preCure);
const { nearMisses: preNearMisses, gained: preGained, published: prePublished, supported: preSupported } = pre;
g(
  'B1',
  `CONTROL — at ${PRECURE_AT} the \`CF-F\` sentence published "${prePublished}" of the near ` +
    `misses reached, and its OWN literals in the same file support ${preSupported}: ` +
    `\`NEAR_MISSES\` is {${preNearMisses.map((f) => f.slice(11, 14)).join(', ')}} and the ` +
    `predicate's gained list is [${preGained.map((f) => f.slice(11, 14)).join(', ')}], ` +
    `intersection [${preNearMisses.filter((f) => preGained.includes(f)).map((f) => f.slice(11, 14)).join(', ')}]. ` +
    `Graded as that disagreement, so the cure quoting the bad sentence to report it cannot make ` +
    `this pass, and the cure fixing it cannot make it fail`,
  pre.read &&
    preNearMisses.length === 4 &&
    preGained.length === 3 &&
    prePublished === 3 &&
    preSupported === 2 &&
    prePublished !== preSupported,
);
/**
 * The known NEGATIVE, keyed on the defect's CONTENT and not on its bytes (383). One word in the
 * pinned sentence — `three` → `two` — is the smallest change that makes the claim TRUE while
 * leaving every byte of structure, every literal and both member lists alone. If the control
 * cannot tell that copy from the real one, it is not reading the claim.
 */
const corrected = preCure.replace('it reaches three of the four hand-read', 'it reaches two of the four hand-read');
const neg = readSentence(corrected);
g(
  'B3',
  `KNOWN NEGATIVE — the same pinned source with one word changed, \`three\` → \`two\`, and the ` +
    `control flips: it reads ${neg.published} published against ${neg.supported} supported and ` +
    `the disagreement is gone, with both member lists byte-identical to the positive. So \`B1\` ` +
    `is reading the CLAIM and not a structural accident, and a read failure is distinguishable ` +
    `from agreement — \`read\` is ${neg.read} here and was false for the first spelling of this ` +
    `control, which the seam-join repaired`,
  corrected !== preCure &&
    neg.read &&
    neg.published === neg.supported &&
    JSON.stringify(neg.nearMisses) === JSON.stringify(preNearMisses) &&
    JSON.stringify(neg.gained) === JSON.stringify(preGained),
);
g(
  'B2',
  `and the pre-cure sentence named exactly one unreached near miss (\`304\`) where its own ` +
    `literals support two (\`297\`, \`304\`), and said nothing about ` +
    `\`${preGained.filter((f) => !preNearMisses.includes(f)).map((f) => f.slice(11, 14)).join(', ')}\`, ` +
    `which is in the gained list and in no near-miss list`,
  /does NOT reach `probe-round304`/.test(preCure) &&
    !/probe-round297/.test((preCure.match(/'CF-F',[\s\S]*?\n\);/) || [''])[0]) &&
    preGained.filter((f) => !preNearMisses.includes(f)).length === 1,
);

// ── C — the cure, graded BEHAVIOURALLY by mutation ───────────────────────────────────────────
const live = readFileSync(SUBJECT_INSTRUMENT, 'utf8');
const ANCHOR = "  'probe-round244': 'reads a named probe live but consumes it INLINE — binds a boolean, not source',\n";
const occurrencesOfAnchor = live.split(ANCHOR).length - 1;
g(
  'C0',
  `the mutation anchor occurs exactly once in the instrument before anything is mutated — a ` +
    `String.replace that hits a second identical string grades a different arm than the one it ` +
    `names (347)`,
  occurrencesOfAnchor === 1,
);

const cfF = (text) => (text.split('\n').find((l) => / CF-F: /.test(l)) || '');
const figures = (line) => (line.match(/reaches (\d+) of the (\d+) [\s\S]*?NOT reach (\d+) of them[\s\S]*?and (\d+) of what it gains/) || []).slice(1).map(Number);

const drive = (source) => {
  const tmp = join(dirname(SUBJECT_INSTRUMENT), `.round385-mutant.mjs`);
  try {
    writeFileSync(tmp, source);
    return execFileSync(process.execPath, [tmp], { encoding: 'utf8' });
  } finally {
    rmSync(tmp, { force: true });
  }
};

const baseLine = cfF(drive(live));
const mutantLine = cfF(drive(live.replace(ANCHOR, '')));
const [bReach, bOf, bMiss, bNot] = figures(baseLine);
const [mReach, mOf, mMiss, mNot] = figures(mutantLine);
g(
  'C1',
  `BEHAVIOURAL — drop \`244\` from \`NEAR_MISSES\` and every figure in the \`CF-F\` sentence ` +
    `moves with it: reaches ${bReach} of ${bOf} → ${mReach} of ${mOf}, misses ${bMiss} → ` +
    `${mMiss}, not-a-near-miss ${bNot} → ${mNot}. A hand-typed sentence would have printed the ` +
    `same four numbers under both. This grades the SEAM by driving it, not by re-reading the ` +
    `source that implements it (369)`,
  bReach === 2 && bOf === 4 && bMiss === 2 && bNot === 1 &&
    mReach === 1 && mOf === 3 && mMiss === 2 && mNot === 2,
);
g(
  'C2',
  `and the live sentence's own figures agree with the live literals: reaches ${bReach} of ${bOf}, ` +
    `does not reach ${bMiss}, and ${bNot} gained member is in no near-miss list — which is the ` +
    `claim Round 384 §1 found false in all three of its parts`,
  bReach + bMiss === bOf && bReach === 2 && bNot === 1,
);

// ── E — the expectations, including the two that were wrong ──────────────────────────────────
const subjectOut = drive(live);
const rowOf = (name) => subjectOut.split('\n').find((l) => new RegExp(` ${name}: `).test(l)) || '';
const setsIn = (line) => ({
  reads: Number((line.match(/reads (\d+)/) || [])[1]),
  lost: ((line.match(/lost \[([^\]]*)\]/) || ['', ''])[1].match(/probe-round\d+/g) || []),
  gained: ((line.match(/gained \[([^\]]*)\]/) || ['', ''])[1].match(/probe-round\d+/g) || []),
});
const G = setsIn(rowOf('CF-G'));
const E = setsIn(rowOf('CF-E'));
g(
  'E1',
  `my OWN expectation was WRONG, and it is the one that paid: I predicted CF-G alone would read ` +
    `10 with nothing gained or lost. It reads ${G.reads}, gains ${G.gained.length}, and LOSES ` +
    `\`371\` — a relaxation that is not a superset. The alias leg carries a uniqueness quantifier ` +
    `(\`n.length === 1\`) and a quantifier is not monotone under relaxation: \`371\` binds ` +
    `\`const SUBJECT = 'scripts/probe-round224-a-…'\`, whose stem is shared with ` +
    `\`probe-round224b-…\`, so stem matching makes that initializer name two files and the alias ` +
    `is dropped. Kept as a grade rather than fixed quietly (Theseus, Round 384 §2)`,
  G.reads === 15 && JSON.stringify(G.lost) === JSON.stringify(['probe-round371']),
);
g(
  'E2',
  `E2 was right that \`297\` comes in once the binding requirement and the full-filename ` +
    `criterion are both off, and wrong about which row isolates it: CF-G ALONE admits it, so the ` +
    `isolating axis is the full-filename criterion and not the conjunction. A wide combined row ` +
    `would have attributed it to two axes at once`,
  G.gained.includes('probe-round297'),
);
g(
  'E3',
  `E3 holds — \`304\` is in no gained list on any row, which \`G9\` in the subject instrument ` +
    `grades across every row of the table including the widest`,
  !G.gained.includes('probe-round304') &&
    !E.gained.includes('probe-round304') &&
    / G9: true /.test(subjectOut),
);
g(
  'E4',
  `E4 holds — CF-E gains exactly \`246\` and \`299\` over CF-F, reproducing Theseus's Round 384 ` +
    `§2 under my key: the self-exclusion leg is inert under the live key and load-bearing with ` +
    `the binding requirement off`,
  JSON.stringify(E.gained.filter((f) => !['probe-round224', 'probe-round244', 'probe-round262'].includes(f))) ===
    JSON.stringify(['probe-round246', 'probe-round299']),
);
g(
  'E5',
  `and the subject instrument drives green as a whole with the new rows in it`,
  /\n18 grades, 0 not true/.test(subjectOut),
);

// ── verdict ──────────────────────────────────────────────────────────────────────────────────
const bad = grades.filter(([, ok]) => ok !== true);
console.log(`\n${grades.length} grades, ${bad.length} not true`);
if (bad.length) {
  console.log(`NOT TRUE: ${bad.map(([n]) => n).join(', ')}`);
  process.exit(1);
}
