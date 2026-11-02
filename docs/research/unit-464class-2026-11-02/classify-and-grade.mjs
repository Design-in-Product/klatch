// unit-464class — stage 2: the detector, graded against the hand read, plus P2/P3/P4/P5.
//
// The hand read (`HAND-READ.tsv`, committed at 25b2e871, before this file existed) is the
// VERDICT. This detector's class count is never published on its own — it is scored as a 4-class
// confusion matrix against the hand read, both directions.
//
// Run from the repo root:
//   node docs/research/unit-464class-2026-11-02/classify-and-grade.mjs

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const ROOT = resolve('.');
const RES = join(ROOT, 'docs/research');
const SELF = 'unit-464class-2026-11-02';
const HAND = join(RES, SELF, 'HAND-READ.tsv');
const SPANS = join(RES, SELF, 'legs.spans.txt');
const g = (args) =>
  execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const REV = g(['rev-parse', 'HEAD']).trim();

const legs = [];
const check = (name, ok, note) => { legs.push({ name, ok: !!ok, note }); return !!ok; };

// ───────────────────────────────────────────────────────────── the hand read, parsed not retyped
const handRows = readFileSync(HAND, 'utf8').split('\n')
  .filter((l) => l.length > 0 && !l.startsWith('#'))
  .map((l) => {
    const [file, line, id, kind, cls, subkind, ...why] = l.split('\t');
    return { file, line: +line, id, kind, cls, subkind, why: why.join('\t') };
  });
const handKey = (r) => `${r.file}:${r.line}:${r.id}`;
const hand = new Map(handRows.map((r) => [handKey(r), r]));

// ───────────────────────────────────────────────────── the spans, re-sliced from the recording
// Read out of legs.spans.txt rather than re-walked, so this stage grades EXACTLY the population
// stage 1 published and cannot quietly select a different one.
const spanText = readFileSync(SPANS, 'utf8');
const spanRev = (spanText.match(/^rev ([0-9a-f]{40})$/m) ?? [])[1] ?? null;
const sites = [];
for (const chunk of spanText.split('──────── ').slice(1)) {
  const head = chunk.split('\n')[0];
  const m = head.match(/^(\S+)\s+(\S+)\s+(\S+)\s+(docs\/research\/\S+?):(\d+)\s*$/);
  if (!m) continue;
  const body = chunk.split('\n').slice(1).join('\n');
  const guardLine = body.match(/^GUARD: (.*)$/m);
  sites.push({
    id: m[1], kind: m[2], idiom: m[3], rel: m[4], line: +m[5],
    short: m[4].replace('docs/research/', ''),
    guard: guardLine ? guardLine[1] : null,
    span: body.replace(/^GUARD: .*\n/m, ''),
  });
}

// ───────────────────────────────────────────────────────────────────────────── the detector
//
// Evidence model. For each site the subject text is the predicate — the SPAN for a REGISTER, the
// GUARD for a REFUSE-SITE (never the message string). Identifiers in it are resolved ONE level
// against same-file `const` declarations, read from the whole file so a declaration BELOW the leg
// still resolves.
//
// FROZEN  — a recording path (driveN.*, *.out, *.err, *.json fixture) read from disk, or a read
//           of the subject at a PINNED 40-hex rev (`show <SHA>:`), or a variable whose
//           declaration does one of those.
// LIVE    — a read of the worktree (readFileSync of a non-recording path, `resolve('.')`-rooted),
//           a `git status`/`git log` on the live repo with no pinned rev, or a child process run.
//
// A site with neither resolves to UNMODELLED — never to GATE. A refusal is not the GATE value.
const FROZEN_RE = [
  /drive\d+[.\w-]*\.(out|err)/,
  /\.(out|err)\b/,
  /show['"`\s,\]]+.*[0-9a-f]{40}/,
  /\b(REC\d*|REC[0-9A-Z_]*|PRE_REV|PRECURE_REV|HIS_REV|rec\d+\w*)\b/,
  /\.json\b/,
];
const LIVE_RE = [
  /\bLIVE\b/,
  /\bpostSrc\b/, /\bcheckerNow\b/, /\bliveDirty\b/, /\bliveMatches\b/, /\blive\b/,
  /readFileSync\s*\(\s*(join\s*\(\s*LIVE|resolve)/,
  /status['"`\s,\]]+.*porcelain/,
  /execFileSync\s*\(\s*'node'/,
];

function declarationsOf(src) {
  const out = new Map();
  const re = /^\s*(?:const|let)\s+(?:\[([^\]]+)\]|([A-Za-z0-9_$]+))\s*=\s*([\s\S]*?);\s*$/gm;
  let m;
  while ((m = re.exec(src))) {
    const rhs = m[3];
    if (m[2]) out.set(m[2], (out.get(m[2]) ?? '') + ' ' + rhs);
    else for (const n of m[1].split(',').map((s) => s.trim())) out.set(n, (out.get(n) ?? '') + ' ' + rhs);
  }
  return out;
}

const srcCache = new Map();
const declCache = new Map();
const sourceOf = (rel) => {
  if (!srcCache.has(rel)) srcCache.set(rel, readFileSync(join(ROOT, rel), 'utf8'));
  return srcCache.get(rel);
};
const declsFor = (rel) => {
  if (!declCache.has(rel)) declCache.set(rel, declarationsOf(sourceOf(rel)));
  return declCache.get(rel);
};

// DEPTH is the identifier-closure depth. drive4 (kept) ran at the registered depth 1. Reporting a
// single depth would leave "the detector is inadequate" indistinguishable from "one level is not
// enough", so the closure is a parameter and the grade is a curve over it.
const DEPTH = Number(process.env.CLASS_DEPTH ?? 1);
const MAX_TEXT = 200_000;

function classify(site, depth = DEPTH) {
  const predicate = site.kind === 'REFUSE-SITE' ? site.guard : site.span;
  if (predicate === null) return { cls: 'UNMODELLED', why: 'no predicate resolved (REFUSE-SITE with no enclosing if)', frozen: [], live: [] };
  const decls = declsFor(site.rel);
  let text = predicate;
  const seen = new Set();
  let frontier = [predicate];
  for (let level = 0; level < depth; level++) {
    const next = [];
    for (const chunk of frontier) {
      for (const id of new Set(chunk.match(/[A-Za-z_$][A-Za-z0-9_$]*/g) ?? [])) {
        if (seen.has(id) || !decls.has(id)) continue;
        seen.add(id);
        const rhs = decls.get(id);
        if (text.length + rhs.length > MAX_TEXT) continue;
        text += '\n' + rhs;
        next.push(rhs);
      }
    }
    if (next.length === 0) break;
    frontier = next;
  }
  const frozen = FROZEN_RE.filter((r) => r.test(text)).map(String);
  const live = LIVE_RE.filter((r) => r.test(text)).map(String);
  if (frozen.length && live.length) return { cls: 'CROSS-STATE', why: `both resolve at depth ${depth} (${seen.size} ids closed)`, frozen, live, closed: seen.size };
  if (frozen.length || live.length) return { cls: 'GATE', why: `${frozen.length ? 'frozen' : 'live'} side only at depth ${depth} (${seen.size} ids closed)`, frozen, live, closed: seen.size };
  return { cls: 'UNMODELLED', why: `neither source resolved at depth ${depth} (${seen.size} ids closed)`, frozen, live, closed: seen.size };
}

const detected = sites.map((s) => ({ ...s, det: classify(s) }));

// ───────────────────────────────────────────────── P4 — does any CROSS-STATE leg have a RED on record?
// For every site the HAND READ classes CROSS-STATE, search the committed recordings of its own
// directory for a verdict line that reddens that leg name. Keyed on the recordings as committed,
// which is the only place a past red survives.
const crossHand = handRows.filter((r) => r.cls === 'CROSS-STATE');
const redHits = [];
let recFilesSearched = 0;
for (const r of crossHand) {
  const dir = r.file.split('/')[0];
  const dirPath = join(RES, dir);
  if (!existsSync(dirPath)) { redHits.push({ ...r, error: 'directory missing' }); continue; }
  const recs = readdirSync(dirPath).filter((f) => /\.(out|err)$/.test(f));
  for (const f of recs) {
    recFilesSearched++;
    const txt = readFileSync(join(dirPath, f), 'utf8');
    for (const l of txt.split('\n')) {
      const t = l.trim();
      if (!t.startsWith(r.id + ' ')) continue;
      if (/\bRED\b/.test(t)) redHits.push({ id: r.id, file: r.file, rec: `${dir}/${f}`, line: t.slice(0, 120) });
    }
  }
}

// ───────────────────────────────────────────────────────────────────── the confusion matrix
const CLASSES = ['PIN', 'GATE', 'CROSS-STATE', 'UNMODELLED'];
const matrix = {};
for (const h of CLASSES) { matrix[h] = {}; for (const d of CLASSES) matrix[h][d] = 0; }
const disagreements = [];
let matched = 0, unmatched = [];
for (const s of detected) {
  const h = hand.get(`${s.short}:${s.line}:${s.id}`);
  if (!h) { unmatched.push(`${s.short}:${s.line}:${s.id}`); continue; }
  matched++;
  matrix[h.cls][s.det.cls]++;
  if (h.cls !== s.det.cls) disagreements.push({ site: `${s.short}:${s.line}`, id: s.id, hand: h.cls, det: s.det.cls, why: s.det.why });
}

// ───────────────────────────────────────────────────────────────────────────────────── gates
const porcelain = g(['status', '--porcelain', '--', 'packages/', 'scripts/']);
check('GLIVECLEAN', porcelain.length === 0,
  `git status --porcelain -- packages/ scripts/ is ${porcelain.length} bytes`);

check('GSPANREV', spanRev !== null && /^[0-9a-f]{40}$/.test(spanRev),
  `the population was read from legs.spans.txt, stamped rev ${String(spanRev).slice(0, 8)} (this drive is at ${REV.slice(0, 8)})`);

// GHANDCOVER — every enumerated site has a hand-read row and every hand-read row is an enumerated
// site. A dropped site would shrink the matrix's denominator silently.
check('GHANDCOVER', unmatched.length === 0 && matched === handRows.length && matched === sites.length,
  `population and answer key are the same set: ${sites.length} sites, ${handRows.length} hand rows, ${matched} matched, ${unmatched.length} unmatched${unmatched.length ? ' — ' + unmatched.join(', ') : ''}`);

// GMATSUM — the matrix cells sum to the matched population. A `catch { continue }` that dropped a
// case would redden here rather than disappear.
const matSum = CLASSES.reduce((a, h) => a + CLASSES.reduce((b, d) => b + matrix[h][d], 0), 0);
check('GMATSUM', matSum === matched, `matrix cells sum to the matched population: ${matSum} vs ${matched}`);

// GREFUSABLE — the detector must be ABLE to refuse. Driven as a counterfactual on a real site: a
// predicate whose identifiers resolve to nothing must come out UNMODELLED, not GATE. Keyed on a
// site taken from the live population, with its text emptied, so the arm reaches the same code.
const refusalProbe = classify({ ...detected[0], kind: 'REGISTER', span: 'check(\'GX\', true, \'\')' });
check('GREFUSABLE', refusalProbe.cls === 'UNMODELLED',
  `an evidence-free predicate comes out ${refusalProbe.cls}, not GATE (the refusal value is not the GATE value)`);

// GP4REACH — P4's search must have READ something. A zero red count means nothing if no recording
// was opened. [[feedback_identical_runs_read_as_no_effect_when_all_three_are_dead]]
check('GP4REACH', crossHand.length > 0 && recFilesSearched > 0,
  `P4 searched ${recFilesSearched} committed recording(s) for ${crossHand.length} CROSS-STATE leg name(s)`);

// ─────────────────────────────────────────────── GDOCPIN — P6: the entry's figures, read from the doc
//
// This leg READS THE MARKDOWN's own literals and compares them to the figures measured above. It
// does not recompute what it grades: a pin that re-derives the number it is pinning holds nothing.
// A missing document is a RED, never a skip.
const DOC = join(ROOT, 'docs/research/LEG-CLASS-CONVENTION.md');
const handCountOf = (c) => handRows.filter((r) => r.cls === c).length;
const subOf = (k) => handRows.filter((r) => r.cls === 'CROSS-STATE' && r.subkind === k).length;
const depthCurve = (d) => {
  let ag = 0, found = 0, calledGate = 0;
  for (const s of sites) {
    const h = hand.get(`${s.short}:${s.line}:${s.id}`);
    if (!h) continue;
    const c = classify(s, d).cls;
    if (c === h.cls) ag++;
    if (h.cls === 'CROSS-STATE' && c === 'CROSS-STATE') found++;
    if (h.cls === 'CROSS-STATE' && c === 'GATE') calledGate++;
  }
  return { ag, found, calledGate };
};
const d1 = depthCurve(1), d5 = depthCurve(5), d8 = depthCurve(8);
const docPin = (() => {
  if (!existsSync(DOC)) return { ok: false, note: `${DOC} does not exist — the entry this unit exists to pin is absent` };
  const doc = readFileSync(DOC, 'utf8');
  const num = (re, label) => {
    const m = doc.match(re);
    return m ? { label, got: Number(m[1]) } : { label, got: null };
  };
  const want = [
    [num(/call sites hand-read:\s+(\d+)/, 'sites'), sites.length],
    [num(/hand read:\s+PIN (\d+)/, 'hand PIN'), handCountOf('PIN')],
    [num(/hand read:\s+PIN \d+ · GATE (\d+)/, 'hand GATE'), handCountOf('GATE')],
    [num(/hand read:.* · CROSS-STATE (\d+)/, 'hand CROSS-STATE'), handCountOf('CROSS-STATE')],
    [num(/hand read:.* · UNMODELLED (\d+)/, 'hand UNMODELLED'), handCountOf('UNMODELLED')],
    [num(/CROSS-STATE:\s+delta (\d+)/, 'delta'), subOf('delta')],
    [num(/CROSS-STATE:\s+delta \d+ · keyed (\d+)/, 'keyed'), subOf('keyed')],
    [num(/depth 1:\s+agreement (\d+)/, 'd1 agreement'), d1.ag],
    [num(/depth 1:.*CROSS-STATE found (\d+)/, 'd1 found'), d1.found],
    [num(/depth 1:.*called GATE (\d+)/, 'd1 calledGate'), d1.calledGate],
    [num(/saturation \(5\):\s+agreement (\d+)/, 'd5 agreement'), d5.ag],
    [num(/saturation \(5\):.*CROSS-STATE found (\d+)/, 'd5 found'), d5.found],
    [num(/saturation \(5\):.*called GATE (\d+)/, 'd5 calledGate'), d5.calledGate],
    [num(/Searching \*\*(\d+)\*\* committed recordings/, 'recordings searched'), recFilesSearched],
    [num(/leg names returns \*\*(\d+)\*\*/, 'recorded reds'), redHits.length],
    [num(/still calls \*\*(\d+) of the 12\*\*/, 'prose calledGate'), d5.calledGate],
  ];
  const bad = want.filter(([a, b]) => a.got !== b)
    .map(([a, b]) => `${a.label}: doc says ${a.got === null ? '(not found)' : a.got}, measured ${b}`);
  const saturated = d5.ag === d8.ag && d5.found === d8.found;
  if (!saturated) bad.push(`the doc claims depth 8 is identical to depth 5; measured d5 ${d5.ag}/${d5.found} vs d8 ${d8.ag}/${d8.found}`);
  return { ok: bad.length === 0, note: `${want.length} figures read out of the markdown, ${bad.length} mismatch(es)${bad.length ? ' — ' + bad.join('; ') : ''}` };
})();
check('GDOCPIN', docPin.ok, docPin.note);

const gatesOk = legs.every((l) => l.ok);

// ──────────────────────────────────────────────────────────────────────────────────── output
console.log('unit-464class — stage 2: the detector graded against the hand read');
console.log(`  rev:        ${REV}`);
console.log(`  population: ${sites.length} call sites, read from legs.spans.txt @ ${String(spanRev).slice(0, 8)}`);
console.log(`  answer key: HAND-READ.tsv, ${handRows.length} rows`);
console.log('');
console.log('GATES');
for (const l of legs) console.log(`  ${l.name.padEnd(12)} ${l.ok ? 'ok ' : 'RED'} — ${l.note}`);
console.log('');
if (!gatesOk) { console.log('REFUSED — a gate is RED, so nothing below is published.'); process.exit(1); }

const handCount = (c) => handRows.filter((r) => r.cls === c).length;
const detCount = (c) => detected.filter((s) => s.det.cls === c).length;
const sub = (k) => handRows.filter((r) => r.cls === 'CROSS-STATE' && r.subkind === k).length;

console.log('1. THE HAND READ — THE VERDICT');
for (const c of CLASSES) console.log(`   ${c.padEnd(12)} ${String(handCount(c)).padStart(2)}`);
console.log(`   of the CROSS-STATE: delta ${sub('delta')} · keyed ${sub('keyed')}   (UNREGISTERED split, see RESULTS §4)`);
console.log('');

console.log('2. P2 / P3 / P4 / P5');
const p2 = handCount('CROSS-STATE') >= 1;
console.log(`   P2  ${p2 ? 'LANDS  ' : 'REFUTED'}  CROSS-STATE occurs in my own instruments at ${handCount('CROSS-STATE')} site(s)`);
const growHand = hand.get('unit-464cure3-2026-11-01/grade-the-steal-cures.mjs:211:GROWREPRO');
const p3 = growHand && growHand.cls === 'GATE';
console.log(`   P3  ${p3 ? 'LANDS  ' : 'REFUTED'}  GROWREPRO predicted GATE, hand read says ${growHand ? growHand.cls + (growHand.subkind !== '-' ? ' (' + growHand.subkind + ')' : '') : '(not found)'}`);
const p4 = redHits.length === 0;
console.log(`   P4  ${p4 ? 'LANDS  ' : 'REFUTED'}  recorded REDs on a CROSS-STATE leg name: ${redHits.length} (searched ${recFilesSearched} recordings)`);
for (const h of redHits.slice(0, 12)) console.log(`         ${h.rec ?? h.file}  ${h.line ?? h.error}`);
const p5 = detCount('UNMODELLED') > 0;
console.log(`   P5  ${p5 ? 'LANDS  ' : 'REFUTED'}  the detector refused on ${detCount('UNMODELLED')} site(s)`);
console.log('');

console.log('3. THE DETECTOR, SCORED — hand read down, detector across');
console.log('                  ' + CLASSES.map((c) => c.slice(0, 11).padStart(12)).join(''));
for (const h of CLASSES) {
  console.log(`   ${h.padEnd(14)}` + CLASSES.map((d) => String(matrix[h][d]).padStart(12)).join(''));
}
const agree = CLASSES.reduce((a, c) => a + matrix[c][c], 0);
console.log(`   agreement ${agree}/${matched}; ${disagreements.length} disagreement(s)`);
for (const d of disagreements) {
  console.log(`     ${d.id.padEnd(12)} hand ${d.hand.padEnd(12)} det ${d.det.padEnd(12)} ${d.site}`);
  console.log(`        detector's reason: ${d.why}`);
}
console.log('');
console.log('4. THE CLOSURE DEPTH CURVE — is one level the limit, or is the class not locally decidable?');
console.log('   depth   agreement   CROSS-STATE found of 12   hand-CROSS-STATE called GATE   UNMODELLED');
for (const d of [1, 2, 3, 5, 8]) {
  let ag = 0, foundCross = 0, calledGate = 0, unmod = 0;
  for (const s of sites) {
    const h = hand.get(`${s.short}:${s.line}:${s.id}`);
    if (!h) continue;
    const c = classify(s, d).cls;
    if (c === h.cls) ag++;
    if (c === 'UNMODELLED') unmod++;
    if (h.cls === 'CROSS-STATE' && c === 'CROSS-STATE') foundCross++;
    if (h.cls === 'CROSS-STATE' && c === 'GATE') calledGate++;
  }
  console.log(`   ${String(d).padStart(5)}   ${String(ag).padStart(5)}/${matched}   ${String(foundCross).padStart(21)}   ${String(calledGate).padStart(28)}   ${String(unmod).padStart(10)}`);
}
console.log('');
console.log(`CLASSGRADE/${disagreements.length}  hand ${CLASSES.map((c) => `${c}=${handCount(c)}`).join(' ')} · ` +
  `det ${CLASSES.map((c) => `${c}=${detCount(c)}`).join(' ')} · agreement ${agree}/${matched} · rev ${REV.slice(0, 8)}`);
