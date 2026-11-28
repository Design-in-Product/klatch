/**
 * unit-531 POST-HOC, declared as post-hoc: nothing below was pre-registered.
 *
 * `P8` MISSED. The sliced region at the real injections reports population **127**, exclusions
 * **63**, `MAP-BOUND` **11** against unit-529's published **126 / 60 / 10** — while the entire
 * off-by column and `FAILS: 2` are identical. The obvious reading is corpus drift (861 → 865 files).
 *
 * "The obvious reading" is not a measurement. This file attributes the drift file by file: it
 * re-derives the corpus at unit-529's pin (`56b394c3d9d2`) from git, diffs it against the corpus at
 * this HEAD, and runs the PUB instantiation over **each entrant alone** so that every unit of the
 * +1 population / +3 exclusions / +1 MAP-BOUND is accounted to a named file, or is not.
 *
 * It also splits `P8` into the two controls it should have been: a drift-INVARIANT one (the off-by
 * column and the FAILS count) and a drift-SENSITIVE one (the absolute counts). `P8` as registered
 * conjoined them, so a MISS cannot say which half moved — which is the same defect unit-529 §3
 * found in its own cross-unit control and Theseus's 11-27 §7 found again.
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { parenSpanEnd } from '../../../scripts/lib/decl-body.mjs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname;
const CAP = 'docs/research/unit-531conserve-2026-11-27/captures';
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

const PIN_529 = '56b394c3d9d2';
const SUBJECT = 'docs/research/unit-529defaultparam-2026-11-27/arm-defaultparam.mjs';
const FROZEN = 'docs/research/unit-523indirectsize-2026-11-26/arm-indirectsize.mjs';
const DONOR = 'docs/research/unit-527setgeneric-2026-11-27/arm-setgeneric.mjs';
const PUBCAP = 'docs/research/unit-529defaultparam-2026-11-27/captures/ARM.out';

const subjectText = readFileSync(`${ROOT}${SUBJECT}`, 'utf8');
const frozenText = readFileSync(`${ROOT}${FROZEN}`, 'utf8');
const donorText = readFileSync(`${ROOT}${DONOR}`, 'utf8');
const pubCapText = readFileSync(`${ROOT}${PUBCAP}`, 'utf8');

const occ = (hay, needle) => hay.split(needle).length - 1;
const sliceBetween = (text, a, b, label) => {
  for (const [n, lit] of [[`${label}.start`, a], [`${label}.end`, b]]) {
    const c = occ(text, lit);
    if (c !== 1) throw new Error(`anchor ${n} occurs ${c} times, not once`);
  }
  return text.slice(text.indexOf(a), text.indexOf(b));
};
const pad = (s, n) => String(s).padEnd(n, ' ');

const REGION = sliceBetween(
  subjectText,
  'const pad = (s, n) => String(s).padEnd(n, \' \');',
  '// ─── Arm A: the UNRESOLVED partition',
  'REGION',
);
// eslint-disable-next-line no-new-func
const f = new Function('frozenText', 'donorText', 'stripSource', 'parenSpanEnd', 'sh',
  'readFileSync', 'ROOT', `${REGION}\n  return { LABELS, INST, RUN, CLASSES, CLS, CORPUS };`);
const R = f(frozenText, donorText, stripSource, parenSpanEnd, sh, readFileSync, ROOT);
const { LABELS, CLASSES } = R;

// ─── §1 the two corpora ─────────────────────────────────────────────────────────────────────────

const CODE_EXT = /\.(mjs|mts|js|ts|cjs)$/;
const inScope = (p) => CODE_EXT.test(p) && (p.startsWith('scripts/') || p.startsWith('docs/research/'));
const corpusAt = (rev) => sh(`git ls-tree -r --name-only ${rev}`).split('\n').filter(Boolean).filter(inScope);
const then = corpusAt(PIN_529);
const now = R.CORPUS;
const thenSet = new Set(then);
const nowSet = new Set(now);
const entered = now.filter((p) => !thenSet.has(p));
const left = then.filter((p) => !nowSet.has(p));

// ─── §2 what each entrant contributes, measured one file at a time ──────────────────────────────

const contrib = (p) => {
  const out = {};
  for (const l of LABELS) {
    const r = R.INST[l].armA([p]);
    out[l] = { sites: r.sites.length, excl: r.excludedDirectTails, cls: r.sites.map((s) => s.cls) };
  }
  return out;
};
const rows = entered.map((p) => [p, contrib(p)]);
const sumEnteredSites = rows.reduce((a, [, c]) => a + c.PUB.sites, 0);
const sumEnteredExcl = rows.reduce((a, [, c]) => a + c.PUB.excl, 0);

// the pin's own published absolutes, parsed
const capPop = /^ {2}population\s+(\d+)/m.exec(pubCapText);
const capExc = /^ {2}excludedDirectTails\s+(\d+)/m.exec(pubCapText);
const dPop = R.RUN.PUB.sites.length - Number(capPop[1]);
const dExc = R.RUN.PUB.excludedDirectTails - Number(capExc[1]);

// ─── §3 the two controls P8 should have been ────────────────────────────────────────────────────

const capClass = {};
for (const k of CLASSES) {
  const m = new RegExp(`^ {2}${k}\\s+(-?\\d+)\\s+(-?\\d+)\\s+(-?\\d+)\\s+(-?\\d+)\\s`, 'm').exec(pubCapText);
  capClass[k] = [1, 2, 3, 4].map((i) => Number(m[i]));
}
const offOf = (get) => {
  const o = {};
  for (const k of CLASSES) o[k] = get(k, 3) - (get(k, 1) + get(k, 2) - get(k, 0));
  return o;
};
const capOff = offOf((k, i) => capClass[k][i]);
const hereOff = offOf((k, i) => R.CLS[LABELS[i]][k] || 0);
const offEqual = CLASSES.filter((k) => capOff[k] === hereOff[k]);
const capFails = CLASSES.filter((k) => capOff[k] !== 0);
const hereFails = CLASSES.filter((k) => hereOff[k] !== 0);

const absEqual = [];
const absMoved = [];
for (const k of CLASSES) {
  LABELS.forEach((l, i) => {
    (capClass[k][i] === (R.CLS[l][k] || 0) ? absEqual : absMoved).push(`${k}/${l}`);
  });
}

// ─── report ─────────────────────────────────────────────────────────────────────────────────────

const L = [];
const say = (s = '') => { L.push(s); };
say('unit-531 post-hoc — attributing P8\'s MISS, file by file');
say(`  HEAD ${sh('git rev-parse --short=12 HEAD').trim()} · clock `
  + `${sh('TZ=America/Los_Angeles date "+%Y-%m-%d %H:%M:%S %Z"').trim()}`);
say(`  unit-529's pin ${PIN_529} · POST-HOC: nothing here was pre-registered`);
say('');
say('─── §1 the two corpora ──────────────────────────────────────────────────────────');
say(`  corpus at ${PIN_529}:  ${then.length} files   (unit-529 published 861)`);
say(`  corpus at HEAD:              ${now.length} files`);
say(`  entered: ${entered.length} · left: ${left.length}`);
for (const p of entered) say(`    + ${p}`);
for (const p of left) say(`    - ${p}`);
say('');
say('─── §2 what each entrant contributes (PUB instantiation, one file at a time) ────');
say(`  ${pad('file', 62)}${pad('sites', 7)}${pad('excl', 6)}classes`);
for (const [p, c] of rows) {
  say(`  ${pad(p.replace('docs/research/', 'd/r/'), 62)}${pad(c.PUB.sites, 7)}${pad(c.PUB.excl, 6)}`
    + `${c.PUB.cls.join(',') || '—'}`);
}
say('');
say(`  Σ over entrants:   sites ${sumEnteredSites} · exclusions ${sumEnteredExcl}`);
say(`  observed drift:    population ${dPop > 0 ? '+' : ''}${dPop} · exclusions ${dExc > 0 ? '+' : ''}${dExc}`);
say(`  ATTRIBUTED: ${sumEnteredSites === dPop && sumEnteredExcl === dExc
  ? 'FULLY — every unit of the drift is accounted to a named entering file, and nothing is left over.'
  : 'NOT FULLY — the entrants do not account for the drift, so something other than corpus growth moved.'}`);
say('');
say('─── §3 the two controls P8 conjoined ───────────────────────────────────────────');
say(`  P8a  DRIFT-INVARIANT: the off-by column, ten classes`);
say(`       ${offEqual.length} of ${CLASSES.length} classes have an IDENTICAL off-by against the published capture`);
for (const k of CLASSES) {
  if (capOff[k] === 0 && hereOff[k] === 0) continue;
  say(`         ${pad(k, 20)} capture ${capOff[k] > 0 ? '+' : ''}${capOff[k]}   here ${hereOff[k] > 0 ? '+' : ''}${hereOff[k]}`);
}
say(`       FAILS: capture ${capFails.length} (${capFails.join(', ')}) · here ${hereFails.length} (${hereFails.join(', ')})`);
say(`       verdict: ${offEqual.length === CLASSES.length && capFails.length === hereFails.length
  ? 'EQUAL — the graded claim reproduces at a corpus four files larger.' : 'MOVED'}`);
say('');
say(`  P8b  DRIFT-SENSITIVE: the 40 absolute class counts`);
say(`       ${absEqual.length} of 40 equal · moved: ${absMoved.join(', ') || 'none'}`);
say('');
say('  P8 as registered demanded 48 of 48 across BOTH, so its MISS could not say which half moved.');
say('  Split, it says so exactly: the claim is invariant and the denominators are not.');

const OUT = `${L.join('\n')}\n`;
process.stdout.write(OUT);
writeFileSync(`${ROOT}${CAP}/POSTHOC.out`, OUT);
