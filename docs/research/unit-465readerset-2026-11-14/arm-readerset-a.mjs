/**
 * unit-465readerset — arm A. The library's reader supply.
 *
 * Theseus's §5 published a four-row table for `verdict.mjs`'s `read*` exports. This arm establishes
 * the PROPERTY AXIS the census in arm B rests on: for every exported function in BOTH lib modules,
 * does it have a refusal shape of its own?
 *
 * Two things the arm is built around, both of which a naive scanner gets wrong:
 *
 *  1. `readVerdict` never writes a literal `refusal:` in its own early returns — it writes
 *     `return refuse('CODE')`, and `refuse` (verdict.mjs:133) returns `{ ok: false, refusal: code }`.
 *     A classifier keyed on the literal `refusal:` appearing in the function's own text would call
 *     `readVerdict` NOT refusal-bearing, i.e. it would invert the one row everybody agrees on.
 *     So the key admits a refusal HELPER call, and leg A5 proves the distinction is load-bearing by
 *     running the literal-only key alongside and asserting the two keys DISAGREE.
 *  2. "Reader-shaped" is keyed POSITIVELY in two ways (name begins `read`; body reads git or fs) and
 *     everything else goes to NEITHER as a named class, not as a fall-through that absorbs the
 *     arm's blindness.
 *
 * Pin `e96741bf`, named in the pre-registration before this file existed. At that pin this unit's
 * own directory has NO members, so the instrument is outside its own population BY THE PIN. There is
 * no self-exclusion filter in this arm, and leg A0 asserts the pin actually does that work rather
 * than letting me claim it.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { renderVerdict } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const PIN = 'e96741bf';
const SELF_DIR = 'docs/research/unit-465readerset-2026-11-14/';

const git = (args) => execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });

const legs = [];
const preds = [];
const check = (id, ok, why) => { legs.push({ id, ok, why }); return ok; };
const pred = (id, landed, why) => { preds.push({ id, landed, why }); return landed; };

// ── A0: the pin, not a filter, is what keeps this instrument out of its own population ───────────
const atPin = git(['ls-tree', '-r', '--name-only', PIN, 'docs/research/'])
  .split('\n').map((s) => s.trim()).filter((p) => p.endsWith('.mjs'));
const selfAtPin = atPin.filter((p) => p.startsWith(SELF_DIR));
check('A0', selfAtPin.length === 0,
  `self-dir members at the pin: ${selfAtPin.length} (expect 0 — the pin excludes me, no filter does)`);

const LIBS = ['docs/research/lib/verdict.mjs', 'docs/research/lib/attested-rounds.mjs'];
const srcOf = new Map(LIBS.map((p) => [p, git(['show', `${PIN}:${p}`])]));

/** Slice an exported function's own body by brace-matching from its first `{`. */
function bodyOf(src, startIdx) {
  const open = src.indexOf('{', startIdx);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    const c = src[i];
    if (c === '{') depth += 1;
    else if (c === '}') { depth -= 1; if (depth === 0) return src.slice(open, i + 1); }
  }
  return null;
}

/** The function's own `return` statements — nested function literals included, which is honest:
 *  a reader that refuses from inside a callback still has a refusal shape. */
function returnsOf(body) {
  return [...body.matchAll(/\breturn\b([^;\n]*(?:\n(?![ \t]*\})[^;\n]*)*)/g)]
    .map((m) => m[0].replace(/\s+/g, ' ').trim());
}

const rows = [];
for (const p of LIBS) {
  const src = srcOf.get(p);
  const lines = src.split('\n');
  for (const m of src.matchAll(/^export function ([A-Za-z0-9_]+)\s*\(/gm)) {
    const name = m[1];
    const line = src.slice(0, m.index).split('\n').length;
    const body = bodyOf(src, m.index);
    if (body === null) { rows.push({ p, name, line, shape: 'UNPARSED' }); continue; }
    const endLine = line + body.split('\n').length - 1;
    const rets = returnsOf(body);
    const retText = rets.join(' ⟂ ');

    // Property axis: a refusal shape of its own.
    const hasOk = /\bok\s*:/.test(retText);
    const litRefusal = /\brefusal\s*:/.test(retText);
    const helperRefusal = /\breturn\s+refuse\w*\s*\(/.test(retText) || /\brefuse\w*\s*\(/.test(retText);
    const refusalBearing = hasOk && (litRefusal || helperRefusal);

    // Reader-shaped, keyed positively two ways; NEITHER is a named class, not a fall-through.
    const nameRead = /^read/.test(name);
    const stateRead = /\b(readFileSync|existsSync|execFileSync|spawnSync|git\s*\(|ls-tree|ls-files)/.test(body);
    const kind = nameRead ? 'NAME_READ' : stateRead ? 'STATE_READ' : 'NEITHER';

    rows.push({
      p, name, line, endLine, kind, refusalBearing, hasOk, litRefusal, helperRefusal,
      nRets: rets.length, shape: 'PARSED',
      // the literal-only rival key, run alongside rather than reasoned about
      litOnly: hasOk && litRefusal,
    });
  }
}

const unparsed = rows.filter((r) => r.shape === 'UNPARSED');
check('A1', unparsed.length === 0, `exports whose body would not brace-match: ${unparsed.length}`);

const readers = rows.filter((r) => r.kind === 'NAME_READ' || r.kind === 'STATE_READ');
const bearing = readers.filter((r) => r.refusalBearing);
const notBearing = readers.filter((r) => !r.refusalBearing);

// ── A5: the helper-aware key and the literal-only key must DISAGREE, or the care was wasted ──────
const disagree = rows.filter((r) => r.shape === 'PARSED' && r.refusalBearing !== r.litOnly);
check('A5', disagree.length > 0,
  `exports where helper-aware and literal-only keys disagree: ${disagree.length} `
  + `[${disagree.map((r) => r.name).join(',')}] — a literal-only scanner inverts these`);

// ── A6: the four rows everybody has agreed on, reproduced from the pin, not retyped ──────────────
const FOUR = ['readVerdict', 'readTail', 'readRows', 'readCorpusRows'];
const four = FOUR.map((n) => rows.find((r) => r.name === n && r.p.endsWith('verdict.mjs')));
const fourFound = four.filter((r) => r !== undefined).length;
check('A6a', fourFound === 4, `the four named readers found at the pin: ${fourFound} of 4`);
const fourTable = four.map((r) => (r === undefined ? 'MISSING' : `${r.name}@${r.line}-${r.endLine}:${r.refusalBearing ? 'BEARING' : 'NO-SHAPE'}`));
const fourMatchesHim = four.every((r) => r !== undefined)
  && four[0].refusalBearing && four[1].refusalBearing && four[2].refusalBearing
  && four[3].refusalBearing === false;
check('A6b', fourMatchesHim, `his §5 table reproduces at the pin: ${fourTable.join(' · ')}`);
pred('A3', fourMatchesHim, 'REPRODUCTION, not a forecast — worth 0 by the pre-reg; his answer key verified before filing');

// ── A1/A2 as pre-registered ──────────────────────────────────────────────────────────────────────
const att = readers.filter((r) => r.p.endsWith('attested-rounds.mjs'));
const attBearing = att.filter((r) => r.refusalBearing);
pred('A1', att.length >= 3 && attBearing.length === 0,
  `attested-rounds.mjs reader-shaped exports: ${att.length} (>=3?) [${att.map((r) => `${r.name}:${r.kind}`).join(',')}] · refusal-bearing among them: ${attBearing.length} (0?)`);
pred('A2', notBearing.length > bearing.length,
  `library-wide reader-shaped exports: ${notBearing.length} WITHOUT a refusal shape vs ${bearing.length} WITH`);

// ── the artefact arm B's property axis reads, written as data, not retyped there ──────────────────
const axis = Object.fromEntries(readers.map((r) => [r.name, r.refusalBearing]));
console.log('── arm A · the library reader supply at pin e96741bf ──\n');
console.log(`exported functions parsed: ${rows.length} (verdict.mjs ${rows.filter((r) => r.p.endsWith('verdict.mjs')).length} · attested-rounds.mjs ${rows.filter((r) => r.p.endsWith('attested-rounds.mjs')).length})`);
console.log(`reader-shaped: ${readers.length}  (NAME_READ ${readers.filter((r) => r.kind === 'NAME_READ').length} · STATE_READ ${readers.filter((r) => r.kind === 'STATE_READ').length})`);
console.log(`NEITHER (named class, not a fall-through): ${rows.filter((r) => r.kind === 'NEITHER').length}\n`);
for (const r of rows.filter((x) => x.shape === 'PARSED')) {
  console.log(`  ${r.refusalBearing ? 'BEARING ' : 'NO-SHAPE'} ${r.kind.padEnd(10)} ${r.name.padEnd(20)} ${r.p.replace('docs/research/lib/', '')}@${r.line}-${r.endLine} rets=${r.nRets} ok=${r.hasOk} lit=${r.litRefusal} helper=${r.helperRefusal}`);
}
console.log(`\nPROPERTY AXIS (arm B reads this, it does not retype it):\n${JSON.stringify(axis, null, 2)}`);
console.log(`\n${renderVerdict({ legs, preds })}`);
process.exit(legs.some((l) => l.ok === false) ? 1 : 0);
