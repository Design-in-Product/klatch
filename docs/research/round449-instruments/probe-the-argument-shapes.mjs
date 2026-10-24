/**
 * Round 449, probe 1 — WHAT SHAPES ARE ACTUALLY THERE.
 *
 * Exploratory, run BEFORE the resolver was designed, and committed as the record of that ordering.
 * Round 447's lesson was that designing a key from the diff rather than from the terrain got three
 * of my keys wrong; so this probe only *reports*, it grades nothing and it has no verdict line.
 *
 * It prints, for every `writeFileSync(` call site in the population, the first argument's raw text
 * normalised to its SHAPE — identifiers collapsed, literal bodies collapsed — so the bucket set of
 * the real instrument can be read off a measured frequency table instead of imagined.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const REV = git('rev-parse', 'HEAD').trim();
const SHORT = REV.slice(0, 8);
const SELF_REL = relative(REPO, fileURLToPath(import.meta.url));

// `ls-tree -z` at a stamped rev: a population keyed on the working tree is irreproducible from any
// rev (386), and NUL-delimited because a grep/newline split drops a name containing one (289).
const all = git('ls-tree', '-r', '--name-only', '-z', REV, 'docs/').split('\0')
  .filter((f) => f.endsWith('.mjs'));
const pop = all.filter((f) => f !== SELF_REL);

const TOKEN = 'writeFileSync(';

// The argument-list span of the call whose `(` is at `open`, found by paren balance over the
// BLINDED text (so a paren inside a string or comment cannot move the depth) and sliced out of the
// RAW text (stripSource is length-preserving, which is what makes the two indices interchangeable).
// Shape taken from round394's reader rather than re-invented.
const argSpan = (raw, blind, open) => {
  let depth = 0;
  let i = open;
  for (; i < blind.length; i += 1) {
    if (blind[i] === '(') depth += 1;
    else if (blind[i] === ')') { depth -= 1; if (depth === 0) break; }
  }
  if (depth !== 0) return null;
  return raw.slice(open + 1, i);
};

// The first argument of an argument list: split on the top-level comma only.
const firstArg = (args, blindArgs) => {
  let depth = 0;
  for (let i = 0; i < blindArgs.length; i += 1) {
    const c = blindArgs[i];
    if (c === '(' || c === '[' || c === '{') depth += 1;
    else if (c === ')' || c === ']' || c === '}') depth -= 1;
    else if (c === ',' && depth === 0) return args.slice(0, i);
  }
  return args;
};

// Collapse to a shape: quoted bodies → `'…'`, template bodies → `` `…` ``, identifiers → `ID`,
// whitespace squeezed. Two sites with the same shape differ only in names and literal text.
const shapeOf = (s) => s
  .replace(/'[^']*'/g, "'…'")
  .replace(/"[^"]*"/g, "'…'")
  .replace(/`[^`]*`/g, '`…`')
  .replace(/\b[A-Za-z_$][A-Za-z0-9_$]*\b/g, 'ID')
  .replace(/\s+/g, ' ')
  .trim();

const sites = [];
for (const f of pop) {
  const raw = git('show', `${REV}:${f}`);
  const blind = stripSource(raw, true);
  if (blind.length !== raw.length) { sites.push({ f, shape: 'LENGTH-NOT-PRESERVED', arg: '' }); continue; }
  let from = 0;
  for (;;) {
    const at = blind.indexOf(TOKEN, from);
    if (at === -1) break;
    from = at + TOKEN.length;
    const open = at + TOKEN.length - 1;
    const args = argSpan(raw, blind, open);
    if (args === null) { sites.push({ f, shape: 'UNBALANCED', arg: '' }); continue; }
    const blindArgs = blind.slice(open + 1, open + 1 + args.length);
    const a = firstArg(args, blindArgs).trim();
    sites.push({ f, shape: shapeOf(a), arg: a.replace(/\s+/g, ' ') });
  }
}

const byShape = new Map();
for (const s of sites) {
  if (!byShape.has(s.shape)) byShape.set(s.shape, []);
  byShape.get(s.shape).push(s);
}
const rows = [...byShape.entries()].sort((a, b) => b[1].length - a[1].length);

console.log(`REV: ${SHORT}`);
console.log(`population: tracked .mjs under docs/ at the rev = ${all.length}, self-excluded ${all.length - pop.length}, censused ${pop.length}`);
console.log(`STRING-AND-COMMENT-BLIND \`${TOKEN}\` call sites: ${sites.length} in ${new Set(sites.map((s) => s.f)).size} file(s)`);
console.log(`distinct first-argument SHAPES: ${rows.length}`);
console.log('');
for (const [shape, members] of rows) {
  console.log(`${String(members.length).padStart(4)}×  ${shape}`);
  // Up to two real examples per shape, so the bucket key can be written against real text.
  for (const m of members.slice(0, 2)) console.log(`        e.g. ${m.arg.slice(0, 110)}   [${m.f}]`);
}

// The comment-blind-only figure, for the direction check: blanking strings as well must come out
// SMALLER or equal, and a source scanner that fails does so by returning a smaller number (344) —
// so the two are printed side by side rather than one of them alone.
let commentBlindOnly = 0;
for (const f of pop) {
  const raw = git('show', `${REV}:${f}`);
  commentBlindOnly += stripSource(raw, false).split(TOKEN).length - 1;
}
console.log('');
console.log(`comment-blind only (strings KEPT): ${commentBlindOnly} · and string-blind too: ${sites.length} · strings account for ${commentBlindOnly - sites.length}`);
