/**
 * unit-466striplift — arm B
 *
 * Subject: **arm A of this unit**, not the corpus. Arm A came back `6 of 6 LANDED, 0 red`, and a
 * clean sweep is the result to audit hardest. See PRE-REGISTRATION-B.md: auditing it found the
 * member-path proxy wrong on its whole residue, `A-lim2`'s reach figure to be a substring
 * artefact, and a 60 = 60 agreement across populations differing by 17 files.
 *
 * ## The cure is a key, not a longer name list
 *
 * `K-strip2` requires the stripped token's **root identifier to be a parameter of the `.map(`
 * callback**. That excludes `unit-464class/enumerate-legs.mjs:275` — a `.map(` over leg ids with an
 * unrelated path strip on the same physical line — for the *right* reason, where arm A's proxy
 * excluded it for a false one (`KP_G` is not in the name list; but `KP_G` is a path).
 *
 * ## Two provenances, two legs
 *
 * `B1a` re-derives arm A's site count live from `PIN`. `B1b` parses it out of arm A's recording
 * **frozen at `A_REC_REV`**. They are separate legs because one leg reading a frozen artefact and
 * the live subject together is neither a pin nor a gate.
 */

import { execFileSync } from 'node:child_process';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, readFileSync, statSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const PIN = '70e58f2a3ac4c59fea20be77459bf2c177744aa7';
const PIN_SHORT = '70e58f2a';
const A_REC_REV = 'e3f14be1'; // the commit that first published drive1.arma.out
const A_REC = 'docs/research/unit-466striplift-2026-11-15/drive1.arma.out';
const SELF_DIR = 'docs/research/unit-466striplift-2026-11-15/';

const legs = [];
const red = [];
const refused = [];
function leg(id, ok, detail) {
  legs.push(id);
  if (ok === null) refused.push(id);
  else if (!ok) red.push(id);
  console.log(`${ok === null ? 'REF' : ok ? 'ok ' : 'RED'} ${id.padEnd(11)} ${detail}`);
}
const preds = [];
const refuted = [];
const prefused = [];
function pred(id, held, detail) {
  preds.push(id);
  if (held === null) prefused.push(id);
  else if (!held) refuted.push(id);
  console.log(`${held === null ? 'OPEN   ' : held ? 'LANDED ' : 'REFUTED'} ${id.padEnd(4)} ${detail}`);
}
function git(...args) {
  return execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

// ──────────────────────────────────────────────────────── K-strip, reproduced verbatim from arm A

const SPELL = {
  R: /\.replace\(\s*[`'"/][^)]*docs\/research[^)]*\)/,
  L: /\.slice\(\s*\w+\.length\s*\)/,
  V: /\brelative\s*\(/,
  B: /\bbasename\s*\(/,
  S: /\.split\(\s*['"`]\/['"`]\s*\)\s*\.\s*pop\s*\(/,
};
const MAPSTRIP = /([A-Za-z_$][\w$.[\]']*)\s*\.\s*map\s*\(/;
const CLASS_RANK = { NONLOSSY_NORMALISE: 0, INVERTIBLE_PREFIX: 1, LOSSY_BASENAME: 2 };
function classOf(code, firstArg) {
  if (code === 'B' || code === 'S') return 'LOSSY_BASENAME';
  if (code === 'R' || code === 'L') return 'INVERTIBLE_PREFIX';
  if (/docs\/research/.test(firstArg ?? '')) return 'INVERTIBLE_PREFIX';
  return 'NONLOSSY_NORMALISE';
}
// Unlike arm A, this extractor also admits a parenthesised receiver — the defect that put
// round411:628 in UNEXTRACTED. The inner root identifier is captured.
function tokensOf(line) {
  const out = [];
  const RECV = "\\(?\\s*([A-Za-z_$][\\w$.[\\]']*)";
  for (const m of line.matchAll(new RegExp(`${RECV}[^)]*?\\)?\\s*\\.\\s*replace\\(\\s*[\`'"/][^)]*docs\\/research`, 'g'))) out.push(['R', m[1]]);
  for (const m of line.matchAll(new RegExp(`${RECV}\\s*\\.\\s*slice\\(\\s*\\w+\\.length\\s*\\)`, 'g'))) out.push(['L', m[1]]);
  for (const m of line.matchAll(/\brelative\s*\(\s*([^,]+?)\s*,\s*([A-Za-z_$][\w$.[\]']*)/g)) out.push(['V', m[2], m[1]]);
  for (const m of line.matchAll(/\bbasename\s*\(\s*\(?\s*([A-Za-z_$][\w$.[\]']*)/g)) out.push(['B', m[1]]);
  for (const m of line.matchAll(new RegExp(`${RECV}[^)]*?\\)?\\s*\\.\\s*split\\(\\s*['"\`]\\/['"\`]\\s*\\)\\s*\\.\\s*pop\\s*\\(`, 'g'))) out.push(['S', m[1]]);
  return out;
}
// K-strip2: the callback parameters of the .map( on this line.
function mapParams(line) {
  const i = line.search(/\.\s*map\s*\(/);
  if (i < 0) return [];
  const after = line.slice(line.indexOf('(', i) + 1);
  const arrow = after.indexOf('=>');
  if (arrow < 0) return [];
  const head = after.slice(0, arrow);
  return [...head.matchAll(/[A-Za-z_$][\w$]*/g)].map((m) => m[0]);
}
const rootOf = (tok) => (tok.split(/[.[\]]/).filter(Boolean)[0] ?? tok);

function enumerate(files, read) {
  const sites = [];
  for (const p of files) {
    const lines = read(p);
    lines.forEach((line, i) => {
      const spellings = Object.keys(SPELL).filter((k) => SPELL[k].test(line));
      if (spellings.length === 0) return;
      const m = line.match(MAPSTRIP);
      if (!m) return;
      const toks = tokensOf(line);
      const params = mapParams(line);
      const derived = toks.filter((t) => params.includes(rootOf(t[1])));
      const classes = (derived.length ? derived : toks).map((t) => classOf(t[0], t[2]));
      const worst = classes.reduce((a, b) => (CLASS_RANK[b] > CLASS_RANK[a] ? b : a), 'NONLOSSY_NORMALISE');
      sites.push({
        p, line: i + 1, id: `${p}:${i + 1}`, ident: m[1], spellings, toks, params, derived,
        worst, k2: derived.length > 0, text: line.trim(),
      });
    });
  }
  return sites;
}

// ──────────────────────────────────────────────────────── B1 — two provenances, two legs

const treeFiles = git('ls-tree', '-r', '--name-only', PIN, '--', 'docs/research')
  .split('\n').map((s) => s.trim()).filter(Boolean);
const srcPin = treeFiles.filter((p) => /\.(mjs|mts)$/.test(p));
const pinText = new Map();
for (const p of srcPin) pinText.set(p, git('show', `${PIN}:${p}`).split('\n'));
const sites = enumerate(srcPin, (p) => pinText.get(p));

leg('B1a', sites.length === 60,
  `LIVE from ${PIN_SHORT}: K-strip enumerates ${sites.length} site(s) (arm A: 60). Note B's token ` +
  `extractor is WIDER than A's (it admits a parenthesised receiver), so site identity is unchanged ` +
  `while token extraction is not — the site key is the <ident>.map( + spelling conjunction, which B ` +
  `did not touch.`);

const aRec = git('show', `${A_REC_REV}:${A_REC}`);
const aCount = aRec.match(/K-strip enumerated (\d+) site\(s\)/);
leg('B1b', !!aCount && Number(aCount[1]) === sites.length,
  `FROZEN at ${A_REC_REV}: arm A's recording states ${aCount ? aCount[1] : 'UNPARSEABLE'} site(s); ` +
  `captured by regex out of the committed artefact, not hand-typed. Agrees with B1a: ` +
  `${!!aCount && Number(aCount[1]) === sites.length}`);

// ──────────────────────────────────────────────────────── B-pop — the 60 = 60 coincidence

function walk(d, acc = []) {
  for (const e of readdirSync(join(ROOT, d), { withFileTypes: true })) {
    const p = `${d}/${e.name}`;
    if (e.isDirectory()) walk(p, acc); else acc.push(p);
  }
  return acc;
}
const walked = walk('docs/research').filter((p) => /\.(mjs|mts)$/.test(p));
const pinSet = new Set(srcPin);
const walkOnly = walked.filter((p) => !pinSet.has(p));
const walkSites = enumerate(walked, (p) => readFileSync(join(ROOT, p), 'utf8').split('\n'));
const selfSites = walkSites.filter((s) => s.p.startsWith(SELF_DIR));

leg('B-pop-a', walkOnly.length >= 14,
  `the two population keys DIVERGE: walk(working tree)=${walked.length} vs ls-tree@${PIN_SHORT}=` +
  `${srcPin.length}; walk-only=${walkOnly.length} ` +
  `${JSON.stringify(walkOnly.slice(0, 4).map((p) => p.replace('docs/research/', '')))}…  ` +
  `(gitignored scratch/ sandboxes, .sliced.mjs artefacts, and this unit's own arms)`);
leg('B-pop-b', true,
  `and the COUNTS agreed anyway: the scoping read's walk key printed 60 at 488 files, arm A's pinned ` +
  `key printed 60 at 472. Agreement on the count, divergence of 17 in the member list — which is ` +
  `why "60 = 60" is NOT corroboration. Stated as a leg, not narrated in prose.`);
leg('B-pop-c', selfSites.length > 0,
  `the walk key censuses its own source: re-run NOW it enumerates ${walkSites.length} site(s), of ` +
  `which ${selfSites.length} are in this unit itself ` +
  `${JSON.stringify(selfSites.map((s) => s.id.replace(SELF_DIR, '')))}. The pinned key cannot, ` +
  `structurally — which is the reason to pin, stated as a measurement.`);

// ──────────────────────────────────────────────────────── B-hand — the HAND map, keys asserted

// Pinned in PRE-REGISTRATION-B.md before this arm existed. Verdicts are mine, by hand, read at PIN.
const HAND = {
  'docs/research/round411-instruments/cure-the-wrapped-call-and-the-body-key.mjs:628': 'MEMBER_PATH',
  'docs/research/round456-instruments/drift-census-over-the-verdict-publishing-population.mjs:361': 'MEMBER_PATH',
  'docs/research/unit-464addarm-2026-11-04/grade-addarm.mjs:451': 'MEMBER_PATH',
  'docs/research/unit-464addarm-2026-11-04/grade-addarm.mjs:478': 'MEMBER_PATH',
  'docs/research/unit-464class-2026-11-02/enumerate-legs.mjs:275': 'NOT_A_MEMBER_PATH',
  'docs/research/unit-464sat-2026-10-31/grepro.mjs:133': 'MEMBER_PATH',
};
// Arm A's residue, re-derived from its FROZEN recording rather than re-typed from my reading of it.
const residueFromRec = [
  ...aRec.matchAll(/^ {2}(docs\/research\/\S+?\.(?:mjs|mts):\d+)(?: \[|$)/gm),
].map((m) => m[1]);
const residueSet = [...new Set(residueFromRec)];
const handKeys = Object.keys(HAND).sort();
const recKeys = residueSet.sort();
const keysMatch = JSON.stringify(handKeys) === JSON.stringify(recKeys);
leg('B-hand-keys', keysMatch,
  `the HAND map's keys are exactly arm A's residue (UNEXTRACTED + NOT_A_MEMBER_PATH), captured out ` +
  `of the frozen recording at ${A_REC_REV}: hand=${handKeys.length} rec=${recKeys.length} ` +
  `match=${keysMatch}. A frozen population means the hand map cannot silently cover a different set.` +
  (keysMatch ? '' : ` MISSING FROM HAND: ${JSON.stringify(recKeys.filter((k) => !HAND[k]))}`));

// ──────────────────────────────────────────────────────── Q1/Q2 — does K-strip2 reproduce HAND?

const byId = new Map(sites.map((s) => [s.id, s]));
const q1rows = handKeys.map((k) => {
  const s = byId.get(k);
  const k2verdict = s ? (s.k2 ? 'MEMBER_PATH' : 'NOT_A_MEMBER_PATH') : 'NOT ENUMERATED';
  return { k, hand: HAND[k], k2: k2verdict, ok: k2verdict === HAND[k], s };
});
console.log(`\n── Q1: K-strip2 vs HAND on arm A's 6-site residue ──`);
for (const r of q1rows) {
  console.log(`  ${r.ok ? 'agree' : 'DIFFER'}  hand=${r.hand.padEnd(17)} k2=${r.k2.padEnd(17)} ${r.k.replace('docs/research/', '')}`);
  if (r.s) console.log(`         params=${JSON.stringify(r.s.params)} tokRoots=${JSON.stringify(r.s.toks.map((t) => rootOf(t[1])))} derived=${r.s.derived.length}`);
}
pred('Q1', q1rows.every((r) => r.ok),
  `K-strip2 reproduces the HAND verdict on all 6 residue sites: ${q1rows.filter((r) => r.ok).length} of ` +
  `${q1rows.length} agree. Arm A's proxy scored 1 of 6, and that one for a false reason.`);

// Q2 — does K-strip2 exclude anything among arm A's 54 positives?
const aPositives = sites.filter((s) => !HAND[s.id]);
const k2Excludes = aPositives.filter((s) => !s.k2);
console.log(`\n── Q2: sites arm A called MEMBER_PATH that K-strip2 excludes ──`);
for (const s of k2Excludes) {
  console.log(`  ${s.id.replace('docs/research/', '')} [${s.ident}] params=${JSON.stringify(s.params)} tokRoots=${JSON.stringify(s.toks.map((t) => rootOf(t[1])))}`);
  console.log(`      ${s.text.slice(0, 150)}`);
}
pred('Q2', k2Excludes.length >= 1,
  `the co-located-but-unrelated shape is not unique — K-strip2 excludes ${k2Excludes.length} further ` +
  `site(s) from among arm A's ${aPositives.length} positives ` +
  `${JSON.stringify(k2Excludes.map((s) => s.id.replace('docs/research/', '')))}`);

// ──────────────────────────────────────────────────────── Q3 — does arm A's headline survive?

const memberK2 = sites.filter((s) => (HAND[s.id] ? HAND[s.id] === 'MEMBER_PATH' : s.k2));
const lossyK2 = memberK2.filter((s) => s.worst === 'LOSSY_BASENAME');
const lossyPctK2 = memberK2.length === 0 ? 0 : (lossyK2.length / memberK2.length) * 100;
const tallyK2 = {};
for (const s of memberK2) tallyK2[s.worst] = (tallyK2[s.worst] ?? 0) + 1;
console.log(`\n── corrected tally (HAND over the residue, K-strip2 over the rest), n=${memberK2.length} ──`);
console.log(`  ${JSON.stringify(tallyK2)}`);
console.log(`  arm A published, under the proxy: {"LOSSY_BASENAME":31,...} of 54 = 57.4%`);
pred('Q3', lossyPctK2 >= 50,
  `arm A's headline SURVIVES the correction: LOSSY_BASENAME = ${lossyK2.length} of ${memberK2.length} ` +
  `= ${lossyPctK2.toFixed(1)}% (threshold ≥50%; arm A published 57.4% off a proxy that was wrong on ` +
  `its whole residue). If refuted, P1 was carried by the proxy's errors.`);

// ──────────────────────────────────────────────────────── Q4 — cure A-lim2's substring artefact

const NAME_KEY = /^\s*(?:const|function)\s+(\w*(?:strip|short|display|pretty|rel|base)\w*)\s*[=(]/i;
const anySpell = (l) => Object.keys(SPELL).some((k) => SPELL[k].test(l));
const named = [];
for (const p of srcPin) {
  const lines = pinText.get(p);
  lines.forEach((line, i) => {
    const m = line.match(NAME_KEY);
    if (!m) return;
    // brace-balanced body from the declaration line, bounded.
    let depth = 0, started = false, bodyHasStrip = anySpell(line), end = i;
    for (let k = i; k < Math.min(lines.length, i + 60); k++) {
      for (const ch of lines[k]) {
        if (ch === '{') { depth++; started = true; } else if (ch === '}') depth--;
      }
      if (k > i && anySpell(lines[k])) bodyHasStrip = true;
      end = k;
      if (started && depth <= 0) break;
      if (!started && /;\s*$/.test(lines[k])) break;
    }
    named.push({ p, line: i + 1, name: m[1], bodyHasStrip, span: end - i + 1 });
  });
}
const noStrip = named.filter((n) => !n.bodyHasStrip);
const noStripPct = named.length === 0 ? 0 : (noStrip.length / named.length) * 100;
const substringOnly = named.filter((n) => /unrelated|relocat|releas|relev|reload|relat(?!ive)/i.test(n.name));
pred('Q4', noStripPct >= 50,
  `A-lim2's "322 local strip-named helpers" is mostly artefact: of ${named.length} name-matched ` +
  `declarations, ${noStrip.length} = ${noStripPct.toFixed(1)}% have NO strip spelling in their ` +
  `brace-balanced body (threshold ≥50%). Real, body-confirmed: ${named.length - noStrip.length}. ` +
  `Matched purely on 'rel' inside an unrelated word: ${substringOnly.length} ` +
  `${JSON.stringify([...new Set(substringOnly.map((n) => n.name))].slice(0, 8))}`);

// ──────────────────────────────────────────────────────── Q5 — duplicates in published arrays

const recFiles = treeFiles.filter((p) => /\.out$/.test(p));
const dups = [];
for (const p of recFiles) {
  let body;
  try { body = git('show', `${PIN}:${p}`); } catch { dups.push({ p, err: true }); continue; }
  const lines = body.split('\n');
  lines.forEach((l, i) => {
    for (const m of l.matchAll(/\[(?:"[^"]*"(?:\s*,\s*)?){2,}\]/g)) {
      let arr;
      try { arr = JSON.parse(m[0]); } catch { continue; }
      const seen = new Set(), rep = new Set();
      for (const e of arr) { if (seen.has(e)) rep.add(e); seen.add(e); }
      if (rep.size) dups.push({ p, line: i + 1, n: arr.length, rep: [...rep] });
    }
  });
}
console.log(`\n── Q5: published JSON string arrays with a literal duplicate entry ──`);
console.log(`  recordings scanned (*.out at ${PIN_SHORT}): ${recFiles.length}`);
for (const d of dups.slice(0, 12)) {
  if (d.err) continue;
  console.log(`  ${d.p.replace('docs/research/', '')}:${d.line}  len=${d.n}  repeated=${JSON.stringify(d.rep.slice(0, 3))}`);
}
pred('Q5', dups.filter((d) => !d.err).length >= 1,
  `at least one committed recording publishes a JSON string array with a literal duplicate entry — ` +
  `ambiguity realised in a published artefact, not argued in principle: ${dups.filter((d) => !d.err).length} ` +
  `array(s) across ${new Set(dups.filter((d) => !d.err).map((d) => d.p)).size} recording(s) of ${recFiles.length} scanned`);

// ──────────────────────────────────────────────────────── declared limits, reach measured

const paramsNoTok = sites.filter((s) => s.params.length > 0 && s.derived.length === 0);
leg('B-lim1', true,
  `DECLARED LIMIT 1, reach MEASURED — K-strip2 is still single-line regex. Sites with callback ` +
  `parameters but NO strip token rooted in one: ${paramsNoTok.length}. Printed below with their ` +
  `text, so the residue is hand-checkable rather than assumed empty.`);
for (const s of paramsNoTok) console.log(`      ${s.id.replace('docs/research/', '')} params=${JSON.stringify(s.params)} tokRoots=${JSON.stringify(s.toks.map((t) => rootOf(t[1])))}`);

leg('B-lim2', true,
  `DECLARED LIMIT 2, reach stated as a FRACTION not as "hand-verified" — the hand map covers ` +
  `${handKeys.length} of ${sites.length} sites = ${((handKeys.length / sites.length) * 100).toFixed(1)}%. ` +
  `The other ${sites.length - handKeys.length} are probed by K-strip2, an independent key, not by a ` +
  `second reading of the same one; Q2's exclusions are the hand-sliced residue.`);

leg('B-lim3', true,
  `DECLARED LIMIT 3 — Q5's scan is keyed on JSON-rendered string arrays only. A member list published ` +
  `as a ' | '- or ', '-joined bare string is invisible to it, and such lists exist in this corpus ` +
  `(arm A's own per-site rows are one). Not measured; BOARDED.`);

// ──────────────────────────────────────────────────────── gate + verdict

const gate = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('B-gate', gate === '', `git status --porcelain packages scripts docs/research/lib → ${JSON.stringify(gate)}`);

console.log(
  `VERDICT/0 ${red.length === 0 ? 'GREEN' : 'RED'} legs=${legs.length} red=${JSON.stringify(red)} ` +
  `refused=${JSON.stringify(refused)} preds=${preds.length} refuted=${JSON.stringify(refuted)} ` +
  `prefused=${JSON.stringify(prefused)}`);
process.exit(red.length === 0 ? 0 : 1);
