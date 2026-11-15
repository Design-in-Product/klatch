/**
 * unit-466striplift — arm A
 *
 * Subject: published member lists in the `docs/research` corpus that are printed through a
 * path-stripping transform. The found instance (`unit-465p12site/arm-p12site-b.mjs:283`, the
 * `p12Members` publication through `p.replace('docs/research/', '')`) caused
 * `unit-466rhscap/arm-rhscap-a.mjs` to publish `members DIFFER` / `REFUTED P5` a day later —
 * a refutation on a prefix, not on a fact.
 *
 * ## What this arm measures, and the three-way class that is the point
 *
 * Not "did a strip happen" — strips are fine. The question is whether the published artefact is
 * keyed differently from the comparison the verdict rests on, and whether the published form can
 * be mapped back to the key **at all**:
 *
 *   NONLOSSY_NORMALISE  `relative(REPO, f)`                   → still uniquely identifies
 *   INVERTIBLE_PREFIX   `.replace('docs/research/', '')`       → recoverable by concatenation
 *   LOSSY_BASENAME      `basename(p)`, `p.split('/').pop()`    → NO inverse exists
 *
 * The found instance is `INVERTIBLE_PREFIX` (`P2`). If that lands, every published finding about
 * this defect to date is about the *recoverable* class, and the lossy class — strictly worse —
 * has never been implicated. That asymmetry is the unit's reason to exist.
 *
 * ## Reproducibility
 *
 * Population comes from `git -C <ROOT> ls-tree -r --name-only <PIN>` — not `ls-files`, which is
 * irreproducible from any rev, and `-C` is pinned because `ls-tree` resolves its pathspec against
 * the child's cwd (three prior units in this corpus shipped that bug; Daedalus shipped it again
 * today in `unit-466limitreach`'s `A0`, vacuously green). Every byte is read with
 * `git show <PIN>:<path>`. `A0a`/`A0b` are a **matched two-sided control** on that call: a file
 * that must be found, and a file that must NOT be (this unit's own pre-registration, committed
 * after `PIN`) — so a call that silently matches nothing cannot read green.
 *
 * Nothing here drives or edits any other unit. `unit-465p12site`'s arms are not re-driven and its
 * recordings are not touched, which honours this seat's own 11/14 caveat that its `B2` must be
 * re-pinned rather than re-run.
 */

import { execFileSync } from 'node:child_process';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const PIN = '70e58f2a3ac4c59fea20be77459bf2c177744aa7';
const PIN_SHORT = '70e58f2a';

// The found instance, from unit-466rhscap §2. Used as the key's known-positive.
const KP_FILE = 'docs/research/unit-465p12site-2026-11-14/arm-p12site-b.mjs';
const KP_LINE = 283;
// Committed AFTER PIN (at 11f647ba), so it must be absent from a correctly pinned ls-tree.
const POST_PIN_FILE = 'docs/research/unit-466striplift-2026-11-15/PRE-REGISTRATION.md';

const legs = [];
const red = [];
const refused = [];
function leg(id, ok, detail) {
  legs.push(id);
  if (ok === null) refused.push(id);
  else if (!ok) red.push(id);
  console.log(`${ok === null ? 'REF' : ok ? 'ok ' : 'RED'} ${id.padEnd(8)} ${detail}`);
}
const preds = [];
const refuted = [];
const prefused = [];
function pred(id, held, detail) {
  preds.push(id);
  if (held === null) prefused.push(id);
  else if (!held) refuted.push(id);
  console.log(`${held === null ? 'OPEN   ' : held ? 'LANDED ' : 'REFUTED'} ${id.padEnd(6)} ${detail}`);
}

function git(...args) {
  return execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

// ──────────────────────────────────────────────────────────────── population, with a matched control

const treeFiles = git('ls-tree', '-r', '--name-only', PIN, '--', 'docs/research')
  .split('\n').map((s) => s.trim()).filter(Boolean);

leg('A0a', treeFiles.includes(KP_FILE),
  `matched POSITIVE control — the pinned ls-tree FINDS ${KP_FILE}: ${treeFiles.includes(KP_FILE)} ` +
  `(total paths under docs/research at ${PIN_SHORT}: ${treeFiles.length})`);
leg('A0b', !treeFiles.includes(POST_PIN_FILE),
  `matched NEGATIVE control — this unit's own pre-registration, committed after ${PIN_SHORT}, is ` +
  `absent: ${!treeFiles.includes(POST_PIN_FILE)}. A call reading HEAD, or matching nothing, cannot ` +
  `satisfy A0a and A0b together.`);

const srcFiles = treeFiles.filter((p) => /\.(mjs|mts)$/.test(p));
leg('A1', srcFiles.length > 0,
  `source population at ${PIN_SHORT}: ${srcFiles.length} .mjs/.mts of ${treeFiles.length} files ` +
  `under docs/research`);

const text = new Map();
for (const p of srcFiles) text.set(p, git('show', `${PIN}:${p}`).split('\n'));

// ──────────────────────────────────────────────────────────────── K-strip: the five spellings

// Each spelling is its own mechanism and is never fused with another. `V` is split on its first
// argument below, because `relative(REPO, f)` and `relative('docs/research', p)` are two different
// mechanisms wearing one name — fusing them is the undifferentiated-containment-match defect.
const SPELL = {
  R: /\.replace\(\s*[`'"/][^)]*docs\/research[^)]*\)/,
  L: /\.slice\(\s*\w+\.length\s*\)/,
  V: /\brelative\s*\(/,
  B: /\bbasename\s*\(/,
  S: /\.split\(\s*['"`]\/['"`]\s*\)\s*\.\s*pop\s*\(/,
};
const MAPSTRIP = /([A-Za-z_$][\w$.[\]']*)\s*\.\s*map\s*\(/;

// Token extraction, per spelling, so the member-path proxy argues from the thing actually stripped
// rather than from the mapped identifier. ALL occurrences on the line are extracted and printed;
// a line whose tokens cannot be extracted lands in UNEXTRACTED, which is printed separately from
// NOT_A_MEMBER_PATH rather than being absorbed into it.
function tokensOf(line) {
  const out = [];
  for (const m of line.matchAll(/([A-Za-z_$][\w$.[\]']*)\s*\.\s*replace\(\s*[`'"/][^)]*docs\/research/g)) out.push(['R', m[1]]);
  for (const m of line.matchAll(/([A-Za-z_$][\w$.[\]']*)\s*\.\s*slice\(\s*\w+\.length\s*\)/g)) out.push(['L', m[1]]);
  for (const m of line.matchAll(/\brelative\s*\(\s*([^,]+?)\s*,\s*([A-Za-z_$][\w$.[\]']*)/g)) out.push(['V', m[2], m[1]]);
  for (const m of line.matchAll(/\bbasename\s*\(\s*([A-Za-z_$][\w$.[\]']*)/g)) out.push(['B', m[1]]);
  for (const m of line.matchAll(/([A-Za-z_$][\w$.[\]']*)\s*\.\s*split\(\s*['"`]\/['"`]\s*\)\s*\.\s*pop\s*\(/g)) out.push(['S', m[1]]);
  return out;
}

const CLASS_RANK = { NONLOSSY_NORMALISE: 0, INVERTIBLE_PREFIX: 1, LOSSY_BASENAME: 2 };
function classOf(code, firstArg) {
  if (code === 'B' || code === 'S') return 'LOSSY_BASENAME';
  if (code === 'R' || code === 'L') return 'INVERTIBLE_PREFIX';
  // V — decided by the first argument, and the captured argument is printed per site.
  if (/docs\/research/.test(firstArg ?? '')) return 'INVERTIBLE_PREFIX';
  return 'NONLOSSY_NORMALISE';
}

const PATHISH = /^(p|f|path|rel|abs|file|fp|target|subject)$/i;
function proxyMemberPath(tok) {
  const last = tok.split(/[.[\]]/).filter(Boolean).pop() ?? tok;
  return PATHISH.test(last);
}

const CMP = [
  ['strictEq', (id) => new RegExp(`${id}\\s*[!=]==`)],
  ['eqStrict', (id) => new RegExp(`[!=]==\\s*${id}\\b`)],
  ['stringify', (id) => new RegExp(`JSON\\.stringify\\(\\s*${id}\\s*[,)]`)],
  ['includes', (id) => new RegExp(`${id}\\s*\\.\\s*includes\\s*\\(`)],
  ['setOf', (id) => new RegExp(`new Set\\(\\s*${id}\\s*\\)`)],
  ['everySome', (id) => new RegExp(`${id}\\s*\\.\\s*(every|some)\\s*\\(`)],
];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sites = [];
for (const p of srcFiles) {
  const lines = text.get(p);
  lines.forEach((line, i) => {
    const spellings = Object.keys(SPELL).filter((k) => SPELL[k].test(line));
    if (spellings.length === 0) return;
    const m = line.match(MAPSTRIP);
    if (!m) return;
    const toks = tokensOf(line);
    const classes = toks.length
      ? toks.map((t) => classOf(t[0], t[2]))
      : spellings.map((c) => classOf(c, undefined));
    const worst = classes.reduce((a, b) => (CLASS_RANK[b] > CLASS_RANK[a] ? b : a), 'NONLOSSY_NORMALISE');
    const memberPath = toks.length === 0 ? 'UNEXTRACTED' : (toks.some((t) => proxyMemberPath(t[1])) ? 'MEMBER_PATH' : 'NOT_A_MEMBER_PATH');
    sites.push({
      p, line: i + 1, id: `${p}:${i + 1}`, ident: m[1], spellings, toks, classes, worst, memberPath,
      text: line.trim(),
    });
  });
}

leg('A2', sites.length > 0,
  `K-strip enumerated ${sites.length} site(s) — a <ident>.map( line carrying at least one of the ` +
  `five strip spellings — across ${new Set(sites.map((s) => s.p)).size} file(s). ` +
  `The pre-registration's scoping figure was 60; THIS is the figure.`);

// The known positive for the whole key. If K-strip cannot see the one instance we know published a
// false REFUTED, the key is broken and every count below is uninterpretable.
const kp = sites.find((s) => s.id === `${KP_FILE}:${KP_LINE}`);
leg('A-kp', !!kp,
  `known-positive — the found instance ${KP_FILE}:${KP_LINE} is enumerated by K-strip: ${!!kp}` +
  (kp ? ` [ident=${kp.ident} spellings=${kp.spellings.join('')} class=${kp.worst}]` : ''));

// ──────────────────────────────────────────────────────────────── the ceiling, before any tally

const unextracted = sites.filter((s) => s.memberPath === 'UNEXTRACTED');
const notMember = sites.filter((s) => s.memberPath === 'NOT_A_MEMBER_PATH');
const members = sites.filter((s) => s.memberPath === 'MEMBER_PATH');
const notMemberPct = sites.length === 0 ? 0 : (notMember.length / sites.length) * 100;
const ceilingHeld = notMemberPct <= 25;

console.log(`\nUNEXTRACTED (printed, NOT folded into NOT_A_MEMBER_PATH): ${unextracted.length}` +
  (unextracted.length ? `\n  ${unextracted.map((s) => s.id).join('\n  ')}` : ''));
console.log(`NOT_A_MEMBER_PATH members (the category-error bucket, printed in full): ${notMember.length}` +
  (notMember.length ? `\n  ${notMember.map((s) => `${s.id} [${s.ident}] toks=${JSON.stringify(s.toks.map((t) => t[1]))}`).join('\n  ')}` : ''));

leg('A3', ceilingHeld,
  `pre-registered CEILING: NOT_A_MEMBER_PATH = ${notMember.length} of ${sites.length} = ` +
  `${notMemberPct.toFixed(1)}% (ceiling 25%). Class tally is ${ceilingHeld ? 'PUBLISHABLE' : 'VOID by my own terms'}. ` +
  `No sixth spelling and no fourth class was added to clear it.`);

// ──────────────────────────────────────────────────────────────── per-site rows (the evidence)

console.log(`\n── per-site rows — the evidence; the tally below is a roll-up of these ──`);
for (const s of sites) {
  console.log(`  ${s.worst.padEnd(19)} ${s.memberPath.padEnd(17)} ${s.spellings.join('')}  ${s.id.replace('docs/research/', '')}`);
  console.log(`      ident=${s.ident}  toks=${JSON.stringify(s.toks.map((t) => (t[2] ? `${t[0]}:${t[1]}(arg1=${t[2]})` : `${t[0]}:${t[1]}`)))}`);
  console.log(`      ${s.text.slice(0, 160)}`);
}

// ──────────────────────────────────────────────────────────────── second axis, per site not per file

for (const s of sites) {
  const lines = text.get(s.p);
  const base = (s.ident.split(/[.[\]]/).filter(Boolean).pop() ?? s.ident);
  const ev = [];
  for (const cand of [s.ident, base]) {
    const e = esc(cand);
    lines.forEach((l, i) => {
      if (i + 1 === s.line) return;
      for (const [name, mk] of CMP) {
        if (mk(e).test(l)) { ev.push({ n: i + 1, name, cand, t: l.trim().slice(0, 110) }); return; }
      }
    });
  }
  s.cmp = ev;
  s.sameFileUnstripped = ev.length > 0;
}
const withCmp = sites.filter((s) => s.sameFileUnstripped);
leg('A4', true,
  `SAME_FILE_UNSTRIPPED, computed and reported PER SITE (a per-file verdict would mis-state a ` +
  `per-site question): ${withCmp.length} of ${sites.length} site(s) have a comparison on the same ` +
  `identifier elsewhere in the same file. Evidence lines printed below, so the key is auditable; ` +
  `this is a FILE-WIDE key and over-reports where one identifier is reused for two purposes.`);

console.log(`\n── SAME_FILE_UNSTRIPPED evidence (first 2 lines per site) ──`);
for (const s of withCmp) {
  console.log(`  ${s.id.replace('docs/research/', '')} [${s.ident}] → ${s.cmp.length} line(s)`);
  for (const e of s.cmp.slice(0, 2)) console.log(`      :${e.n} via ${e.name} on \`${e.cand}\`  ${e.t}`);
}

// ──────────────────────────────────────────────────────────────── the tally

const tally = {};
for (const s of members) tally[s.worst] = (tally[s.worst] ?? 0) + 1;
const spellTally = {};
for (const s of members) for (const c of s.spellings) spellTally[c] = (spellTally[c] ?? 0) + 1;
const vSplit = { INVERTIBLE_PREFIX: 0, NONLOSSY_NORMALISE: 0 };
for (const s of sites) for (const t of s.toks) if (t[0] === 'V') vSplit[classOf('V', t[2])]++;

console.log(`\n── class tally over MEMBER_PATH sites (n=${members.length}) ──`);
console.log(`  ${JSON.stringify(tally)}`);
console.log(`  per-spelling (sites may carry more than one; not fused): ${JSON.stringify(spellTally)}`);
console.log(`  V split on its first argument: ${JSON.stringify(vSplit)}`);

const lossy = members.filter((s) => s.worst === 'LOSSY_BASENAME');
const lossyPct = members.length === 0 ? 0 : (lossy.length / members.length) * 100;
pred('P1', !ceilingHeld ? null : lossyPct >= 50,
  `LOSSY_BASENAME is the majority class among member-path sites: ${lossy.length} of ${members.length} ` +
  `= ${lossyPct.toFixed(1)}% (threshold ≥50%)`);

pred('P2', !kp ? null : kp.worst === 'INVERTIBLE_PREFIX',
  `the found instance ${KP_FILE.replace('docs/research/', '')}:${KP_LINE} classes INVERTIBLE_PREFIX, ` +
  `not LOSSY_BASENAME: got ${kp ? kp.worst : 'NOT ENUMERATED'}. If LANDED, every published finding ` +
  `about this defect to date is about the RECOVERABLE class.`);

const lossyAndCmp = members.filter((s) => s.worst === 'LOSSY_BASENAME' && s.sameFileUnstripped);
pred('P3', !ceilingHeld ? null : lossyAndCmp.length >= 1,
  `at least one site is LOSSY_BASENAME and SAME_FILE_UNSTRIPPED — the §2 shape in the strictly ` +
  `worse class, which no finding has named: ${lossyAndCmp.length} ` +
  `${JSON.stringify(lossyAndCmp.map((s) => s.id.replace('docs/research/', '')))}`);

// P4 — the same member list published under two classes inside unit-465p12site.
const norm = (s) => s.toLowerCase().replace(/_/g, '').split(/[.[\]]/).filter(Boolean).pop();
const inP12 = sites.filter((s) => s.p.includes('unit-465p12site-2026-11-14/'));
const groups = new Map();
for (const s of inP12) {
  const k = norm(s.ident);
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(s);
}
const twoClass = [...groups.entries()].filter(([, g]) => new Set(g.map((x) => x.worst)).size >= 2);
pred('P4', twoClass.length >= 1,
  `the same member list is published under two different strip classes inside unit-465p12site, so ` +
  `no single inverse recovers both: ${twoClass.length} group(s) — ` +
  `${JSON.stringify(twoClass.map(([k, g]) => `${k}: ${g.map((x) => `${basename(x.p)}:${x.line}=${x.worst}`).join(' + ')}`))}`);

// ──────────────────────────────────────────────────────────────── P5 — the hazard's reach

const byBase = new Map();
for (const p of treeFiles) {
  const b = basename(p);
  if (!byBase.has(b)) byBase.set(b, []);
  byBase.get(b).push(p);
}
const collidingFiles = [...byBase.values()].filter((v) => v.length > 1).reduce((a, v) => a + v.length, 0);
const collPct = (collidingFiles / treeFiles.length) * 100;
const topColl = [...byBase.entries()].filter(([, v]) => v.length > 1).sort((a, b) => b[1].length - a[1].length).slice(0, 6);
console.log(`\n── P5: reach of the LOSSY_BASENAME hazard, measured over what the population HAS ──`);
console.log(`  files under docs/research at ${PIN_SHORT}: ${treeFiles.length} · distinct basenames: ${byBase.size}`);
console.log(`  worst colliding basenames: ${JSON.stringify(topColl.map(([b, v]) => `${b} ×${v.length}`))}`);
pred('P5', collPct > 10,
  `>10% of corpus files share a basename with another file: ${collidingFiles} of ${treeFiles.length} ` +
  `= ${collPct.toFixed(1)}%. This is the reach: a basename-published member list is ambiguous for ` +
  `this fraction of possible members, with NO inverse available.`);

const cmpPct = members.length === 0 ? 0 : (withCmp.filter((s) => s.memberPath === 'MEMBER_PATH').length / members.length) * 100;
pred('P6', !ceilingHeld ? null : cmpPct < 50,
  `SAME_FILE_UNSTRIPPED is true for a MINORITY of member-path sites: ${cmpPct.toFixed(1)}% ` +
  `(threshold <50%) — i.e. most strips are display-only and the hazard is concentrated`);

// ──────────────────────────────────────────── declared limits, each with its reach MEASURED

// A-lim1 — the key is single-line. Measured reach, with the missed sites' paths printed, because a
// count alone states a number and implies a reach (this seat's own 11/14 finding).
const anySpell = (l) => Object.keys(SPELL).some((k) => SPELL[k].test(l));
const missedMultiline = [];
for (const p of srcFiles) {
  const lines = text.get(p);
  lines.forEach((line, i) => {
    if (!MAPSTRIP.test(line) || anySpell(line)) return;
    for (let k = 1; k <= 3; k++) {
      const nxt = lines[i + k];
      if (nxt === undefined) break;
      if (MAPSTRIP.test(nxt)) break;
      if (anySpell(nxt)) { missedMultiline.push(`${p}:${i + 1}→+${k}`); return; }
    }
  });
}
leg('A-lim1', true,
  `DECLARED LIMIT 1, reach MEASURED not implied — K-strip is single-line. Sites with a .map( whose ` +
  `strip lands within the next 3 lines: ${missedMultiline.length}. Against ${sites.length} enumerated, ` +
  `the key sees ${sites.length === 0 ? 'n/a' : `${((sites.length / (sites.length + missedMultiline.length)) * 100).toFixed(1)}%`} ` +
  `of the single-plus-multiline population.`);
console.log(`      missed (paths printed, not just counted): ${JSON.stringify(missedMultiline.slice(0, 20).map((x) => x.replace('docs/research/', '')))}` +
  (missedMultiline.length > 20 ? ` …+${missedMultiline.length - 20} more` : ''));

// A-lim2 — basename under another name, or wrapped in a helper.
const renamed = [];
const helpers = [];
for (const p of srcFiles) {
  const lines = text.get(p);
  lines.forEach((line, i) => {
    if (/import\s*\{[^}]*\bbasename\s+as\s+\w+/.test(line)) renamed.push(`${p}:${i + 1}`);
    const fn = line.match(/^\s*(?:const|function)\s+(\w*(?:strip|short|display|pretty|rel|base)\w*)\s*[=(]/i);
    if (fn) helpers.push(`${p}:${i + 1} ${fn[1]}`);
  });
}
leg('A-lim2', true,
  `DECLARED LIMIT 2, reach MEASURED — basename renamed on import: ${renamed.length} ` +
  `${JSON.stringify(renamed.map((x) => x.replace('docs/research/', '')))} · local strip-named helpers ` +
  `(a PROXY, declared as one — name-keyed, so it neither proves nor excludes a stripping body): ` +
  `${helpers.length} ${JSON.stringify(helpers.slice(0, 12).map((x) => x.replace('docs/research/', '')))}`);

leg('A-lim3', true,
  `DECLARED LIMIT 3 — SAME_FILE_UNSTRIPPED is keyed on one file, so the CROSS-FILE case, which is ` +
  `the one that actually fired on 11/14 (producer arm-p12site-b, consumer arm-rhscap-a, different ` +
  `units), is out of scope BY CONSTRUCTION. P2 is what carries the found instance. The cross-unit ` +
  `producer/consumer join is BOARDED, not measured, and this leg is the declaration of that, not a pass.`);

// ──────────────────────────────────────────────────────────────── gate + verdict

const gate = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('A-gate', gate === '', `git status --porcelain packages scripts docs/research/lib → ${JSON.stringify(gate)}`);

console.log(
  `VERDICT/0 ${red.length === 0 ? 'GREEN' : 'RED'} legs=${legs.length} red=${JSON.stringify(red)} ` +
  `refused=${JSON.stringify(refused)} preds=${preds.length} refuted=${JSON.stringify(refuted)} ` +
  `prefused=${JSON.stringify(prefused)}`);
process.exit(red.length === 0 ? 0 : 1);
