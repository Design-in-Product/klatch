#!/usr/bin/env node
/**
 * unit-484popnarrow CRIPPLE — **P9: the span-extension loop is load-bearing, not decoration.**
 *
 * `blankLongStrings` seeds its spans on the bytes where the two readings DISAGREE. Inside a string
 * body, a byte that is already a space in the strings-kept reading — an ordinary space, or either
 * half of the two blanks an escape emits — is blank in both and seeds nothing. The extension loop
 * walks each seed outward through blank-in-both bytes so a body does not fragment at its own
 * spaces (`feedback_a_diff_based_span_test_is_blind_to_self_blanking_chars`).
 *
 * If deleting that loop moves nobody, the loop is decoration and the declared blindness paragraph
 * in the module is overstated. So it is deleted, on a SCRATCH COPY, and the population is
 * re-measured. R4: the tracked module is never edited for a cripple — this seat crippled a tracked
 * module mid-gate-run on 11/18 and that is the mistake being avoided.
 *
 * The cripple is applied by a replacement whose MATCH COUNT IS ASSERTED, so a silent no-op cripple
 * cannot read as "no effect" (`feedback_a_declared_cripple_no_hook_reads_makes_every_crippled_control_clean`).
 *
 * brace-slicer-deliberate: carries quoted brace comparisons as fixtures on purpose.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const SCRATCH = join(HERE, 'scratch');
mkdirSync(SCRATCH, { recursive: true });

const live = readFileSync(join(ROOT, 'scripts/lib/strip-source.mjs'), 'utf8');

/* ---- the cripple, with its match count asserted --------------------------------------------- */
const LOOP = `  for (let i = 0; i < n; i += 1) {
    if (!inBody[i]) continue;
    for (let j = i - 1; j >= 0 && blanked[j] === BLANK && !inBody[j]; j -= 1) inBody[j] = 1;
    for (let j = i + 1; j < n && blanked[j] === BLANK && !inBody[j]; j += 1) inBody[j] = 1;
  }
`;
const hits = live.split(LOOP).length - 1;
console.log(`=== the cripple: delete the span-extension loop. match count: ${hits} (must be exactly 1)`);
if (hits !== 1) {
  console.error('CRIPPLE-FAILED — the loop text was not found exactly once in the live module, so'
    + ' what follows would be a no-op reading as "no effect". Nothing published.');
  process.exit(3);
}
const crippledPath = join(SCRATCH, 'strip-source.CRIPPLED.mjs');
writeFileSync(crippledPath, live.replace(LOOP, '  // CRIPPLED: span-extension loop deleted.\n'));

const LIVE = await import(join(ROOT, 'scripts/lib/strip-source.mjs'));
const CRIP = await import(crippledPath);

/* ---- KP, REPAIRED — and the first spelling is kept because it was wrong in a nameable way ----
 *
 * **`drive5` is the first KP and it FAILED, on a fixture that carried the HARM instead of the
 * PROPERTY — one leg after this unit's own pre-registration quoted that very lesson from Theseus's
 * `unit-483` §5.** The fixture was `const fixture = "if (s[i] === '{') d += 1;";`, registered to
 * survive the cripple as a population member. It does not, and the reason is arithmetic rather than
 * incidental: without the extension the body fragments at its own spaces into `if`, `(s[i]`, `===`,
 * `'{')`, `d`, `+=`, `1;` — and **the fragment carrying the operand is 4 characters, still ≥
 * `minLen`, so it is blanked anyway.** The brace key's operand is a 3-byte run (quote, brace,
 * quote) that fragmentation can never push below 2, so **this key family cannot detect the loop's
 * absence at all.**
 *
 * So the property to assert is not a verdict but the READING: a span is the WHOLE body, and a body
 * of single characters separated by spaces is the one shape where fragmentation changes the
 * reading's own answer. `drive5` is kept, not deleted — a KP that fails for a reason is a
 * measurement of the key family, and this one measured the thing the pre-registration asked for.
 */
const KP_S = 'const s = "a b";\n';
const liveS = LIVE.blankLongStrings(KP_S, 2);
const cripS = CRIP.blankLongStrings(KP_S, 2);
const bodyOf = (s) => s.slice(s.indexOf('"') + 1, s.lastIndexOf('"'));
const allBlank = (s) => /^ +$/.test(s);
console.log('\n=== KP-S — the READING-level property: a span is the whole body ===');
console.log(`  body under the live reader:     ${JSON.stringify(bodyOf(liveS))}  all blank: ${allBlank(bodyOf(liveS))}   (want true)`);
console.log(`  body under the crippled reader: ${JSON.stringify(bodyOf(cripS))}  all blank: ${allBlank(bodyOf(cripS))}   (want false)`);
if (!allBlank(bodyOf(liveS)) || allBlank(bodyOf(cripS))) {
  console.error('\nKP-FAILED — the cripple does not change the reading at all, so the loop is'
    + ' decoration and nothing below is published.');
  process.exit(4);
}
// And the fixture that failed, kept as a LIVE assertion of why it failed rather than as prose.
const KP_HARM = 'const fixture = "if (s[i] === \'{\') d += 1;";\n';
const key = /[=!]==?\s*['"`]\{['"`]|['"`]\{['"`]\s*[=!]==?/;
const harmLive = key.test(LIVE.blankLongStrings(KP_HARM, 2));
const harmCrip = key.test(CRIP.blankLongStrings(KP_HARM, 2));
console.log('\n=== drive5\'s failed KP, re-driven as an assertion about the KEY FAMILY ===');
console.log(`  the quoted fixture matches the key — live ${harmLive}, crippled ${harmCrip}`);
console.log(`  both false means the operand's 3-byte run cannot fragment below minLen: ${!harmLive && !harmCrip}`);
if (harmLive || harmCrip) {
  console.error('\nCAPTURE-FAILED — drive5\'s diagnosis does not reproduce. Nothing published.');
  process.exit(3);
}

/* ---- the measurement: the population under each ---------------------------------------------- */
const GATE = join(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const gateSrc = readFileSync(GATE, 'utf8');
const capture = (label, re) => {
  const m = gateSrc.match(re);
  if (!m) { console.error(`CAPTURE-FAILED — ${label}`); process.exit(3); }
  return m[1];
};
const cmpSrc = capture('cmp factory', /const cmp = (\(ch\) => new RegExp\([\s\S]*?\));\n/);
// eslint-disable-next-line no-eval
const cmpRaw = eval(cmpSrc);
const OB = cmpRaw(capture('OPEN_BRACE', /const OPEN_BRACE = cmp\('(.)'\)/));
const CB = cmpRaw(capture('CLOSE_BRACE', /const CLOSE_BRACE = cmp\('(.)'\)/));
const EXTS = new Set(capture('EXTS', /const EXTS = new Set\(\[([^\]]*)\]\)/)
  .split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));
const SELF = new Set(capture('SELF', /const SELF = new Set\(\[([\s\S]*?)\]\)/)
  .split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));

const tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean);
const inPop = (code) => OB.test(code) && CB.test(code);
let popLive = 0, popCrip = 0;
const extra = [];
for (const rel of tracked) {
  if (SELF.has(rel) || !EXTS.has(extname(rel))) continue;
  let raw; try { raw = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  const l = inPop(LIVE.blankLongStrings(raw, 2));
  const c = inPop(CRIP.blankLongStrings(raw, 2));
  if (l) popLive += 1;
  if (c) popCrip += 1;
  if (c && !l) extra.push(rel);
  if (l && !c) extra.push(`LOST (unexpected direction): ${rel}`);
}
console.log('\n=== P9 — the population under the live reader and the crippled one ===');
console.log(`  population, live reader:      ${popLive}`);
console.log(`  population, extension deleted: ${popCrip}`);
console.log(`  members the cripple RETAINS that the live reader drops: ${extra.length}   (P9 registered >= 1)`);
for (const e of extra) console.log(`      ${e}`);
console.log(`\n  P9, VERDICT level: ${extra.length >= 1 ? 'HIT' : 'REFUTED'} — registered >= 1, measured ${extra.length}.`);
console.log('  P9, READING level: HIT — KP-S above, asserted on the reader\'s own output.');
console.log('\n  The two halves disagree, and the disagreement is the finding: the loop is'
  + ' load-bearing for\n  what the READING means (a span is the whole body) and NOT for this key'
  + ' family\'s verdicts,\n  because the brace key\'s operand is a 3-byte run that fragmentation'
  + ' cannot push below minLen.\n  The module\'s declared-blindness paragraph needs that scope, and'
  + ' did not have it.');
// rc reports the READING-level claim, which is the one the loop exists for. The verdict-level
// number is published either way and is not folded into this exit code: a leg that conjoins two
// claims in one rc cannot say which of them reddened.
process.exit(0);
