#!/usr/bin/env node
/**
 * **Drive 6 — why Q7 is refuted, measured rather than re-diagnosed.**
 *
 * Q7 registered the one `gate=GUARDED ∧ 469=UNGUARDED` member as a LOCALITY failure: the gate's
 * paren keys match the file while the nearest preceding paren comparison sits beyond the 469 arm's
 * 400-char window. Drive 5 refuted it — the nearest preceding paren comparison is **26 chars**
 * before the brace comparison, well inside the window.
 *
 * Arm B printed `Math.max(lparen, rparen)`, which cannot tell "one of the two is close" from "both
 * are close", and the 469 guard is a **conjunction** of the two. This probe prints the two indices
 * separately, on both sides of the brace match, using the same keys captured out of the 469 arm and
 * the gate. Arm B is NOT edited; it is driven and its red stands.
 */

import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const ARM469 = join(ROOT, 'docs/research/unit-469braceslice-2026-11-17/arm-braceslice-a.mjs');
const GATE = join(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const SUBJECT = 'docs/research/round401-instruments/census-the-branch-polarity-axis.mjs';

const armSrc = readFileSync(ARM469, 'utf8');
const agrab = (n) => {
  const m = armSrc.match(new RegExp(`^const ${n} = \\/(.*)\\/;$`, 'm'));
  if (!m) { console.log(`CAPTURE-FAILED — ${n}`); process.exit(3); }
  return new RegExp(m[1], 'g');
};
const OPEN_CMP = agrab('OPEN_CMP');
const LPAREN_CMP = agrab('LPAREN_CMP');
const RPAREN_CMP = agrab('RPAREN_CMP');
const WINDOW = Number(armSrc.match(/^const WINDOW = (\d+);/m)[1]);

const gateSrc = readFileSync(GATE, 'utf8');
const cmp = new Function('ch', `return ${gateSrc.match(/^const cmp = \(ch\) => (new RegExp\(.*\));$/m)[1]};`);
const gLPAREN = cmp(gateSrc.match(/^const LPAREN = cmp\('(.+?)'\);$/m)[1]);
const gRPAREN = cmp(gateSrc.match(/^const RPAREN = cmp\('(.+?)'\);$/m)[1]);
const gCOLON = cmp(gateSrc.match(/^const COLON = cmp\('(.+?)'\);$/m)[1]);

const raw = readFileSync(join(ROOT, SUBJECT), 'utf8');
const code = stripSource(raw, false);
OPEN_CMP.lastIndex = 0;
const idx = OPEN_CMP.exec(raw).index;
const all = (re, s) => { const out = []; re.lastIndex = 0; let m; while ((m = re.exec(s))) out.push(m.index); return out; };
const L = all(LPAREN_CMP, raw);
const R = all(RPAREN_CMP, raw);
const beforeMax = (a) => { const b = a.filter((i) => i < idx); return b.length ? Math.max(...b) : null; };
const afterMin = (a) => { const b = a.filter((i) => i > idx); return b.length ? Math.min(...b) : null; };

console.log(`drive 6 — locality probe · subject ${SUBJECT}`);
console.log(`  469 WINDOW = ${WINDOW} chars · open-brace comparison (RAW text) at char ${idx}`);
console.log(`  LPAREN comparisons: ${L.length} total · nearest BEFORE ${beforeMax(L)} · nearest AFTER ${afterMin(L)}`);
console.log(`  RPAREN comparisons: ${R.length} total · nearest BEFORE ${beforeMax(R)} · nearest AFTER ${afterMin(R)}`);
console.log(`  469 guard is a CONJUNCTION over the preceding text:`);
console.log(`      LPAREN before the brace: ${beforeMax(L) !== null} · RPAREN before the brace: ${beforeMax(R) !== null} → guardedAll=${beforeMax(L) !== null && beforeMax(R) !== null}`);
console.log(`  gate guard is file-level, unordered:`);
console.log(`      LPAREN=${gLPAREN.test(code)} RPAREN=${gRPAREN.test(code)} COLON=${gCOLON.test(code)} → GUARDED`);
const mech = beforeMax(R) === null && afterMin(R) !== null
  ? `ORDER, not distance: the RPAREN comparison the gate credits is at char ${afterMin(R)}, which is ${afterMin(R) - idx} chars AFTER the brace comparison the slice starts from.`
  : beforeMax(L) === null && afterMin(L) !== null
    ? `ORDER, not distance: the LPAREN comparison the gate credits is at char ${afterMin(L)}, ${afterMin(L) - idx} chars AFTER the brace comparison.`
    : 'neither order nor distance explains it — unresolved, and said so.';
console.log(`\nMECHANISM: ${mech}`);
console.log(`Q7 stays REFUTED. The registered mechanism was distance; the measured one is ${mech.startsWith('ORDER') ? 'ORDER' : 'UNRESOLVED'}.`);
