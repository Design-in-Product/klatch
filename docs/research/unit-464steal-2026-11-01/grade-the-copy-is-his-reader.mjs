// unit-464steal — the gate on the parameterised copy.
//
// `base-rate-on-the-reachable-set.mjs` is Theseus's `base-rate-of-the-steal.mjs` with the corpus
// population parameterised. The whole value of the comparison depends on that being the ONLY
// functional difference: if my copy also swapped his reader, his exclusion rule or his
// thresholds, then `--pop=all` vs `--pop=head` would not isolate the population.
//
// So this grades the copy, not the measurement. It diffs the two files and asserts that every
// changed hunk is one of the four edits I declared, by location, and that nothing else moved.
//
// Run from the repo root:
//   node docs/research/unit-464steal-2026-11-01/grade-the-copy-is-his-reader.mjs
import { readFileSync } from 'node:fs';

const HIS = 'docs/research/unit-464grep-2026-11-01/base-rate-of-the-steal.mjs';
const MINE = 'docs/research/unit-464steal-2026-11-01/base-rate-on-the-reachable-set.mjs';

const his = readFileSync(HIS, 'utf8').split('\n');
const mine = readFileSync(MINE, 'utf8').split('\n');

// Every line of mine that is NOT a line of his, and vice versa — a multiset difference, so a
// line that merely MOVED does not count as a change and a line deleted twice counts twice.
const bag = (lines) => {
  const m = new Map();
  for (const l of lines) m.set(l, (m.get(l) ?? 0) + 1);
  return m;
};
const [hb, mb] = [bag(his), bag(mine)];
const onlyMine = [];
const onlyHis = [];
for (const [l, n] of mb) { const d = n - (hb.get(l) ?? 0); for (let i = 0; i < d; i++) onlyMine.push(l); }
for (const [l, n] of hb) { const d = n - (mb.get(l) ?? 0); for (let i = 0; i < d; i++) onlyHis.push(l); }

// ------------------------------------------------------------- the header block, derived POSITIONALLY
// CURED 2026-11-01 STOP (Theseus's §4). `header` used to be a DECLARED bucket whose `why` was a
// positional claim — "my own header block, ABOVE his verbatim one" — enforced by a syntactic
// predicate, `/^\/\//.test(l) || l === ''`. That matched 103 of the copy's 316 lines, so any
// column-0 comment added anywhere in the file was attributed to the header, in a tree where an
// instrument's comments carry its claims. His arm-c planted one and the gate absorbed it.
//
// The predicate now matches the claim: the header is the PREFIX of my copy above his file's first
// line, and it is attributed by a COUNTED BUDGET of those exact strings — the same mechanism as
// STRUCTURAL below. A `//` line added elsewhere can only be absorbed if it duplicates a header
// line AND that line's budget is unspent; the budget is exactly consumed by the real copy, so it
// cannot be.
const hdrEnd = mine.indexOf(his[0]);
const headerSpan = hdrEnd > 0 ? mine.slice(0, hdrEnd) : [];
const HEADER = new Map();
for (const l of headerSpan) HEADER.set(l, (HEADER.get(l) ?? 0) + 1);
const headerBudget = new Map(HEADER);
const takeHeader = (l) => {
  const left = headerBudget.get(l);
  if (!left) return false;
  headerBudget.set(l, left - 1);
  return true;
};
// The positional claim itself has to hold, or the budget is a set of arbitrary strings: his first
// line must occur exactly once in my copy, the span must be non-empty, and every line of it must
// be a comment. [[feedback_a_corpus_scope_label_is_not_a_censused_surface]]
const hisFirstOccurrences = mine.filter((l) => l === his[0]).length;
const headerPositional = hdrEnd > 0 && hisFirstOccurrences === 1
  && headerSpan.every((l) => /^\/\//.test(l));

// The three remaining declared edits. A line I added must be attributable to exactly one of these
// or to a counted budget, and the buckets are keyed POSITIVELY — there is no fall-through bucket
// to absorb an edit I forgot.
const DECLARED = [
  // CURED 2026-11-01 STOP (Theseus's §4). Was `/POP|--pop|POP_ARGS|REFUSED: --pop|a default
  // would|which is the exact defect/i` — case-insensitive on the bare substring `pop`, so
  // `population`, `popped` and `.pop()` all landed here. His arm-b was arm-a's real mutation plus
  // the trailing comment `// cap the population`, and the verdict flipped on that one word.
  // Re-aimed case-sensitively on the tokens this edit actually introduces, plus its own refusal
  // strings as literals, plus the marker comment that labels it.
  { key: 'pop-flag', why: 'the --pop parameter replacing the hardcoded --all',
    mine: (l) => /--pop=|\bPOP\b|POP_ARGS/.test(l)
      || /^ *console\.log\('? *A default would let a recording be attributed to the wrong population,/.test(l)
      || /which is the exact defect this copy exists to measure/.test(l)
      || /^\/\/ CHANGED FROM HIS FILE — the only functional edit\./.test(l),
    his: (l) => /const RAW = git\('log', '--all'/.test(l) },
  { key: 'label', why: 'the printed corpus label derived from POP instead of asserting --all',
    mine: (l) => /commits: {2}\$\{commits\.length\}|pop: {6}\$\{POP\}|every ref, his key|HEAD-reachable only, the population/.test(l)
      || /^\/\/ CHANGED FROM HIS FILE — the label is derived from POP/.test(l),
    his: (l) => /\(git log --all, %H/.test(l) },
  { key: 'artefact', why: 'the per-arm json filename',
    mine: (l) => /base-rate\.pop-\$\{POP\}|writeFileSync\(`\$\{HERE\}\/base-rate\.pop|pop: POP, popArgs: POP_ARGS,|cripple: CRIPPLE \|\| null, commits/.test(l)
      || /^\/\/ CHANGED FROM HIS FILE — the artefact is keyed on the arm\./.test(l)
      || /^\/\/ the last arm driven, and the two arms exist precisely to be compared\.$/.test(l),
    his: (l) => /writeFileSync\(`\$\{HERE\}\/base-rate\.json`|cripple: CRIPPLE \|\| null, commits/.test(l) },
];

// The first drive of this gate went RED on three lines, all genuinely mine and all structural
// rather than semantic: the `--pop` refusal block's own `process.exit(2);` and closing brace
// (his file has one such exit, mine has two), and the continuation line of the wrapped corpus
// label. The repair is a CLOSED, COUNTED allowlist of those exact strings — not a widened
// predicate. `/^\s*process\.exit/` would have absorbed any exit I added later; this cannot
// absorb anything but these three lines at these three counts, and an unused entry is itself a
// red, so the allowlist cannot be padded to make a future edit pass.
const STRUCTURAL = new Map([
  ['  process.exit(2);', 1],
  ['}', 1],
  ['  `%H/%ct/%s/%b, \\\\x1e and \\\\x1f delimited)`);', 1],
]);
const structuralBudget = new Map(STRUCTURAL);
const takeStructural = (l) => {
  const left = structuralBudget.get(l);
  if (!left) return false;
  structuralBudget.set(l, left - 1);
  return true;
};

const classify = (l, side) => DECLARED.filter((d) => d[side](l)).map((d) => d.key);
// Budgets are offered BEFORE the predicates, so a header line that also happens to satisfy a
// bucket predicate is still spent from the budget — otherwise the budget could end up unconsumed
// and GNOPAD would redden on a copy that is in fact correct.
const unattributedMine = onlyMine.filter((l) =>
  !takeHeader(l) && !takeStructural(l) && classify(l, 'mine').length === 0);
const unattributedHis = onlyHis.filter((l) => classify(l, 'his').length === 0);
const structuralUnused = [...structuralBudget].filter(([, n]) => n > 0);
const headerUnused = [...headerBudget].filter(([, n]) => n > 0);

// A gate must be able to go red on something the subject can move. Each declared edit therefore
// also has to be WITNESSED — if a bucket matched nothing, the copy does not contain the edit I
// say it contains, and the comparison below is about a file I have not described.
const witnessed = DECLARED.map((d) => ({
  key: d.key,
  inMine: onlyMine.filter((l) => d.mine(l)).length,
  inHis: onlyHis.filter((l) => d.his(l)).length,
}));

console.log('unit-464steal — is my copy his reader?');
console.log(`  his:   ${HIS}  (${his.length} lines)`);
console.log(`  mine:  ${MINE}  (${mine.length} lines)`);
console.log('');
console.log(`  lines present only in MINE: ${onlyMine.length}`);
console.log(`  lines present only in HIS:  ${onlyHis.length}`);
console.log('');
console.log(`  header block (positional, lines 0..${hdrEnd - 1}): ${headerSpan.length} lines, ` +
  `${HEADER.size} distinct, attributed by counted budget`);
console.log('');
console.log('  declared edit   added  removed');
for (const w of witnessed) {
  console.log(`  ${w.key.padEnd(15)} ${String(w.inMine).padStart(5)} ${String(w.inHis).padStart(8)}`);
}
console.log('');
if (unattributedMine.length) {
  console.log('  UNATTRIBUTED lines I added:');
  for (const l of unattributedMine) console.log('    + ' + l);
}
if (unattributedHis.length) {
  console.log('  UNATTRIBUTED lines I removed:');
  for (const l of unattributedHis) console.log('    - ' + l);
}

const legs = [
  ['GATTRIB', unattributedMine.length === 0 && unattributedHis.length === 0,
    `every changed line is attributable to a declared edit (${unattributedMine.length} added, ` +
    `${unattributedHis.length} removed unattributed)`],
  ['GNOPAD', structuralUnused.length === 0 && headerUnused.length === 0,
    `both counted budgets are fully consumed — structural ${structuralUnused.length} unused, ` +
    `header ${headerUnused.length} unused` +
    (structuralUnused.length ? ', structural: ' + JSON.stringify(structuralUnused) : '') +
    (headerUnused.length ? ', header: ' + JSON.stringify(headerUnused) : '')],
  ['GHEADER', headerPositional,
    `the header block is the positional prefix above his first line: ends at index ${hdrEnd}, ` +
    `his first line occurs ${hisFirstOccurrences}× in the copy, ${headerSpan.length} lines, ` +
    `all comments: ${headerSpan.every((l) => /^\/\//.test(l))}`],
  ['GWITNESS', witnessed.every((w) => w.inMine > 0) && HEADER.size > 0,
    `each of the ${DECLARED.length} declared edits is actually present in the copy, and the ` +
    `header budget holds ${headerSpan.length} lines in ${HEADER.size} distinct strings`],
  ['GALLGONE', !mine.some((l) => /const RAW = git\('log', '--all'/.test(l)),
    'the hardcoded `--all` corpus call is gone from the copy'],
  ['GREADER', ['const SEP', 'owner === selfIdx', 'const THRESHOLDS', 'const HEAD_T'].every(
    (needle) => his.some((l) => l.includes(needle)) && mine.some((l) => l.includes(needle))),
    'his delimiter, self-exclusion, thresholds and head-threshold lines are present in both'],
];
console.log('GATES');
for (const [n, ok, note] of legs) console.log(`  ${n.padEnd(9)} ${ok ? 'ok ' : 'RED'} — ${note}`);
const ok = legs.every(([, o]) => o);
console.log('');
console.log(ok
  ? 'VERDICT: the copy is his reader with the population parameterised, and nothing else.\n' +
    '         `--pop=all` vs `--pop=head` therefore isolates the population.'
  : 'VERDICT: REFUSED — the copy differs from his file in a way I have not declared, so no\n' +
    '         comparison between its two arms isolates the population.');
process.exit(ok ? 0 : 1);
