// unit-512matchersubject arm, SECOND READER — Theseus, 2026-11-24 START fire.
//
// WHY THERE IS A SECOND READER, stated here and not in a footnote: the first reader
// (`arm-matchersubject.mjs`, capture `ARM.out`, kept unedited) extracted a `readFileSync` call's
// arguments with `readFileSync\s*\(([^)]*)\)`, which stops at the FIRST close paren. Every call in
// this corpus is `readFileSync(join(…), 'utf8')` or `readFileSync(resolve(…), 'utf8')`, so the
// captured arg list was `join(process.cwd(` and no path resolved. That manufactured
// **7 of 15 UNRESOLVED**, including all three sites in the one file the unit's §3 is about. The
// bucket being named `UNRESOLVED` rather than falling through to `FROZEN` is the only reason the
// defect was visible instead of being published as a finding.
//
// Two keys are sharpened here as well, and both make the LIVE figure SMALLER, i.e. they work
// against this unit's own thesis:
//   - A spawn counts as a GATE DRIVE only when its own statement names the gate, or names an
//     identifier bound to the gate path, or to a scratch copy written from the gate's source.
//     The first reader counted `spawnSync('git', …)` helpers as drive candidates merely because
//     the file mentioned the gate somewhere; that is a file-level smell, not a drive.
//   - A FROZEN read counts only when the path read is a committed capture of gate OUTPUT
//     (`.out`/`.json` under a `captures/` directory). Reading the gate's SOURCE, or a baseline
//     file, is not consuming gate output and cannot be the subject of a `tracked files read`
//     matcher.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const SRC = 'docs/research/unit-511readcountname-2026-11-24/captures/POSTHOC-MATCHER.json';
const GATE_BASENAME = 'verify-decl-body-slicers';
const UNIT = 'docs/research/unit-512matchersubject-2026-11-24';

const matchers = JSON.parse(readFileSync(`${ROOT}/${SRC}`, 'utf8')).matchers;
const sites = matchers.map((s) => {
  const i = s.lastIndexOf(':');
  return { site: s, file: s.slice(0, i), line: Number(s.slice(i + 1)) };
});

const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;

// paren-balanced argument span starting at the '(' that follows `from`
function argSpan(text, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    const c = text[i];
    if (c === '(') depth += 1;
    else if (c === ')') {
      depth -= 1;
      if (depth === 0) return text.slice(openIdx + 1, i);
    }
  }
  return null;
}

function callSites(text, name) {
  const out = [];
  const re = new RegExp(`\\b${name}\\s*\\(`, 'g');
  let m;
  while ((m = re.exec(text)) !== null) {
    const open = m.index + m[0].length - 1;
    const args = argSpan(text, open);
    if (args === null) continue;
    out.push({ lineNo: lineOf(text, m.index), args });
  }
  return out;
}

const trackedCache = new Map();
function tracked(p) {
  if (trackedCache.has(p)) return trackedCache.get(p);
  let r;
  try { execFileSync('git', ['ls-files', '--error-unmatch', p], { cwd: ROOT, stdio: 'pipe' }); r = true; }
  catch { r = false; }
  trackedCache.set(p, r);
  return r;
}

// resolve an expression to a tracked repo-relative path, using this file's own const string bindings
function resolvePath(expr, text) {
  const lits = [...expr.matchAll(/['"`]([^'"`]*)['"`]/g)].map((x) => x[1]).filter((s) => s && s !== 'utf8' && s !== 'buffer');
  const idents = [...expr.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g)].map((x) => x[1]);
  const bound = [];
  for (const id of new Set(idents)) {
    const dm = text.match(new RegExp(`\\b(?:const|let|var)\\s+${id}\\s*=\\s*[^;\\n]*?['"\`]([^'"\`]+)['"\`]`));
    if (dm) bound.push(dm[1]);
  }
  const parts = [...bound, ...lits];
  const cands = [];
  for (let i = 0; i < parts.length; i++) {
    for (let k = i; k < parts.length; k++) {
      const j = parts.slice(i, k + 1).join('/').replace(/\/+/g, '/').replace(/^\//, '').replace(/^\.\.\/\.\.\/\.\.\//, '');
      if (/\.[a-z0-9]+$/i.test(j)) cands.push(j);
    }
  }
  return cands.sort((a, b) => b.length - a.length).find((c) => tracked(c)) ?? null;
}

const files = [...new Set(sites.map((s) => s.file))].sort();
const perFile = new Map();

for (const f of files) {
  const text = readFileSync(`${ROOT}/${f}`, 'utf8');

  // identifiers bound to the gate path, or to a scratch copy written from the gate's source
  const gateIds = new Set();
  for (const m of text.matchAll(/\b(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([^;\n]*)/g)) {
    if (m[2].includes(GATE_BASENAME)) gateIds.add(m[1]);
  }
  // a scratch path identifier that is written with content derived from a gate read is a gate copy
  const copyIds = new Set();
  for (const w of [...callSites(text, 'writeFileSync'), ...callSites(text, 'copyFileSync')]) {
    const first = w.args.split(',')[0].trim();
    const id = first.match(/^([A-Za-z_][A-Za-z0-9_]*)$/)?.[1] ?? null;
    const readsGate = /\bsrc\b|\bgateSrc\b|\bGATE\b/.test(w.args) || gateIds.size > 0;
    if (id && readsGate && /scratch|copy|tmp|TMP|SCRATCH|COPY/i.test(id + w.args)) copyIds.add(id);
  }
  const driveIds = new Set([...gateIds, ...copyIds]);

  // gate drives
  const drives = [];
  for (const kind of ['spawnSync', 'execFileSync', 'execSync', 'spawn']) {
    for (const c of callSites(text, kind)) {
      const namesGate = c.args.includes(GATE_BASENAME)
        || [...driveIds].some((id) => new RegExp(`\\b${id}\\b`).test(c.args));
      if (namesGate) drives.push({ ...c, kind, why: c.args.includes(GATE_BASENAME) ? 'args name the gate' : `args name ${[...driveIds].filter((id) => new RegExp(`\\b${id}\\b`).test(c.args)).join('/')}` });
    }
  }

  // reads, resolved
  const reads = [];
  for (const c of callSites(text, 'readFileSync')) {
    const p = resolvePath(c.args, text);
    const isOutputCapture = Boolean(p) && /\/captures\//.test(p) && /\.(out|json|err)$/.test(p);
    reads.push({ lineNo: c.lineNo, args: c.args.replace(/\s+/g, ' ').slice(0, 72), path: p, isOutputCapture });
  }
  const captureReads = reads.filter((r) => r.isOutputCapture);

  let verdict;
  if (drives.length > 0) verdict = 'LIVE';
  else if (captureReads.length > 0) verdict = 'FROZEN';
  else verdict = 'UNRESOLVED';

  perFile.set(f, { verdict, drives, reads, captureReads, gateIds: [...gateIds], copyIds: [...copyIds] });
}

console.log(`unit-512 arm r2 — what each of Daedalus's 15 matcher sites actually consumes`);
console.log(`population sliced from ${SRC} → .matchers  (${sites.length} sites, ${files.length} files)`);
console.log(`LIVE = the instrument drives the gate (or a copy of its source) at run time, so a rename reaches it.`);
console.log(`FROZEN = it reads committed gate-output captures only, so a rename cannot reach it.\n`);

console.log(`§1  per-instrument provenance`);
for (const f of files) {
  const r = perFile.get(f);
  const mine = sites.filter((s) => s.file === f).map((s) => s.line);
  console.log(`\n  ${r.verdict.padEnd(7)} ${f}   [matcher line(s) ${mine.join(', ')}]`);
  for (const d of r.drives) console.log(`      DRIVE  :${d.lineNo} ${d.kind}(${d.args.replace(/\s+/g, ' ').slice(0, 56)})  — ${d.why}`);
  for (const c of r.captureReads) console.log(`      CAPTURE:${c.lineNo} readFileSync → ${c.path}`);
  for (const c of r.reads.filter((x) => !x.isOutputCapture)) {
    console.log(`      other  :${c.lineNo} ${c.path ? `→ ${c.path}` : `UNRESOLVED (${c.args})`}`);
  }
  if (r.verdict === 'UNRESOLVED') console.log(`      *** UNRESOLVED`);
}

const bySite = sites.map((s) => ({ ...s, verdict: perFile.get(s.file).verdict }));
const tally = {};
for (const s of bySite) tally[s.verdict] = (tally[s.verdict] ?? 0) + 1;
const reach = bySite.filter((s) => s.verdict === 'LIVE');
const unreach = bySite.filter((s) => s.verdict === 'FROZEN');

console.log(`\n§2  the figures, at the granularity of his claim ("cure R breaks all 15, silently")`);
console.log(`  sites: ${sites.length}   files: ${files.length}`);
console.log(`  tally by site: ${JSON.stringify(tally)}`);
const fileTally = {};
for (const f of files) fileTally[perFile.get(f).verdict] = (fileTally[perFile.get(f).verdict] ?? 0) + 1;
console.log(`  tally by file: ${JSON.stringify(fileTally)}`);
console.log(`  sites a rename REACHES (LIVE)        : ${reach.length} of ${sites.length}`);
console.log(`  sites a rename CANNOT reach (FROZEN) : ${unreach.length} of ${sites.length}`);
for (const s of unreach) console.log(`      unreachable: ${s.site}`);

console.log(`\n§3  the END-ANCHORED site — his §2 rests the cured line's SHAPE on this one site`);
const ANCH = 'docs/research/unit-500trackedcomplement-2026-11-22/posthoc-landing-condition.mjs';
for (const s of bySite.filter((x) => x.file === ANCH)) console.log(`  ${s.site}  provenance ${s.verdict}`);
const anchCaps = perFile.get(ANCH).captureReads.map((e) => e.path);
console.log(`  its subjects (${anchCaps.length}): ${anchCaps.join(', ') || '(none resolved)'}`);
let anchCanSeeCured = false;
for (const p of anchCaps) {
  const t = readFileSync(`${ROOT}/${p}`, 'utf8');
  const hasScope = /tracked code file\(s\) in scope/.test(t);
  if (hasScope) anchCanSeeCured = true;
  const readLine = (t.split('\n').find((l) => /tracked files read/.test(l)) ?? '').replace(/\r?$/, '');
  const lastCommit = execFileSync('git', ['log', '-1', '--format=%h %ad', '--date=short', '--', p], { cwd: ROOT, encoding: 'utf8' }).trim();
  console.log(`    ${p}`);
  console.log(`      ${Buffer.byteLength(t)} bytes · last touched ${lastCommit}`);
  console.log(`      contains the cured scope line: ${hasScope}`);
  console.log(`      read line: ${JSON.stringify(readLine)}`);
}
console.log(`  can the end-anchored matcher's subject contain text appended after the value? ${anchCanSeeCured}`);

// the counterfactual the anchor was used to refuse: append scope text after the value on the SAME line
const APPENDED = '  tracked files read: 1083 (1084 in scope, 1 excluded, 0 unreadable)';
const ANCHOR_RE = /^(\s*tracked files read: )(\d+)$/;
console.log(`\n§4  the refused rendering, applied to the anchor pattern directly`);
console.log(`  pattern   : ${ANCHOR_RE}`);
console.log(`  landed    : ${JSON.stringify('  tracked files read: 1083')} → match ${ANCHOR_RE.test('  tracked files read: 1083')}`);
console.log(`  appended  : ${JSON.stringify(APPENDED)} → match ${ANCHOR_RE.test(APPENDED)}`);
console.log(`  so the pattern really would refuse the appended form. The question this unit answers is`);
console.log(`  whether that pattern is ever applied to text that could CARRY the appended form.`);

writeFileSync(`${ROOT}/${UNIT}/captures/ARM-R2.json`, JSON.stringify({
  sites: bySite, tally, fileTally, reach: reach.length, unreach: unreach.length,
  anchSubjects: anchCaps, anchCanSeeCured,
  anchorRefusesAppended: !ANCHOR_RE.test(APPENDED),
}, null, 1));
