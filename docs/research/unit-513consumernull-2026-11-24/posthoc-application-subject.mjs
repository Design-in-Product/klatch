/**
 * unit-513 post-hoc 3 — **the hazard figure at the granularity of the application, plus P6 driven
 * on a member rather than reasoned.**
 *
 * R3's headline — "11 of 22 applied rows lose a figure with no trace, 8 of them LIVE" — is keyed
 * `LIVE` at **file** granularity, which is Theseus's Key B and mine. But a file that spawns the gate
 * can also apply the very same pattern to a **string literal written inside the instrument**:
 *
 *     anchorRefusesAppended: !ANCHOR_RE.test(APPENDED),
 *
 * No rename of the live gate's label can ever reach that. So `LIVE` on the file does not mean
 * *reachable* at the site, and my own §4 overstates until the subject is read per application.
 * That is the same correction Theseus made to my site census one fire ago, one level further down:
 * **he keyed subjects per site; this keys them per application.**
 *
 * Also drives P6 as registered: two scratch copies of the live gate differing only in the label, so
 * the "goes to `null`" column is measured off real renamed output instead of asserted. Neither copy
 * is ever `git add`ed, both are removed in a `finally`.
 *
 * No exemption marker: compares no braces (helper bodies come from the shared reader), out of the
 * gate's population.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const CAPS = join(HERE, 'captures');
mkdirSync(CAPS, { recursive: true });

const LABEL = 'tracked files read';
const RENAMED = 'tracked code files read';
const GATE = join(ROOT, 'scripts', 'verify-decl-body-slicers.mjs');
const SCRATCH_V = join(ROOT, 'scripts', '.d513-scratch-verbatim.mjs');
const SCRATCH_R = join(ROOT, 'scripts', '.d513-scratch-renamed.mjs');

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 8);
const shapes = JSON.parse(readFileSync(join(CAPS, 'POSTHOC-SHAPES.json'), 'utf8'));
const srcOf = (rel) => readFileSync(join(ROOT, rel), 'utf8');

const rev = execFileSync('git', ['-C', ROOT, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
const now = execFileSync('date', ['+%H:%M:%S'], { encoding: 'utf8', env: { ...process.env, TZ: 'America/Los_Angeles' } }).trim();

say('unit-513 post-hoc 3 — subject per APPLICATION, and P6 driven on renamed gate output');
say(`  rev ${rev} · driven ${now} PST`);
say('');

// ---------------------------------------------------------------- Key E: subject per application

/**
 * What is this pattern applied TO? Declared buckets; nothing falls through.
 *   FIXTURE   a string literal, in the use line or bound to the subject identifier in this file
 *   GATE      traces to a spawn/exec of the gate in this file
 *   CAPTURE   traces to a readFileSync of a committed capture
 *   UNRESOLVED
 */
function subjectOfApplication(row) {
  const src = srcOf(row.rel);
  const subj = row.subject;
  const ev = row.modeEvidence || '';
  if (!subj) return { cls: 'UNRESOLVED', why: 'the arm found no subject expression on the use line' };
  if (/^['"`]/.test(subj.trim())) return { cls: 'FIXTURE', why: `the subject IS a string literal: ${subj.trim().slice(0, 48)}` };
  if (/=\s*['"`]/.test(ev) && !/readFileSync|spawnSync|execFileSync|stdout/.test(ev)) {
    return { cls: 'FIXTURE', why: `subject bound to a literal in this file: ${ev.slice(0, 90)}` };
  }
  if (/stdout|spawnSync|execFileSync|execSync/.test(ev)) {
    return { cls: /verify-decl-body-slicers/.test(src) ? 'GATE' : 'OTHER-PROCESS', why: `subject bound to process output: ${ev.slice(0, 90)}` };
  }
  if (/readFileSync/.test(ev)) {
    return { cls: /captures|\.out\b/.test(ev) ? 'CAPTURE' : 'FILE', why: `subject read from a file: ${ev.slice(0, 90)}` };
  }
  return { cls: 'UNRESOLVED', why: `origin line does not name a source: ${ev.slice(0, 90)}` };
}

const applied = shapes.rows.filter((r) => r.cls !== 'PROSE');
const rows = applied.map((r) => ({ ...r, subj: subjectOfApplication(r) }));

say('§1  Key E — what each application is applied to');
for (const r of rows) {
  say(`  ${r.rel.split('/').slice(-2).join('/')}:${r.line} (:${r.appliedAt})  file ${r.subjectClass}  →  application ${r.subj.cls}   class ${r.cls}`);
  say(`      ${r.subj.why}`);
}
say('');

const nE = (k) => rows.filter((r) => r.subj.cls === k).length;
const E = ['GATE', 'CAPTURE', 'FIXTURE', 'FILE', 'OTHER-PROCESS', 'UNRESOLVED'];
say('§2  the corrected hazard figure');
say(`  applied rows                                   ${rows.length}`);
say(`  Key B (FILE level)   LIVE ${rows.filter((r) => r.subjectClass === 'LIVE').length} · FROZEN ${rows.filter((r) => r.subjectClass === 'FROZEN').length} · DRIVES_OTHER ${rows.filter((r) => r.subjectClass === 'DRIVES_OTHER').length}`);
say(`  Key E (APPLICATION)  ${E.map((k) => `${k} ${nE(k)}`).join(' · ')}`);
const silent = rows.filter((r) => r.cls === 'DEFAULT' || r.cls === 'SKIP');
const silentReachable = silent.filter((r) => r.subj.cls === 'GATE');
const liveFileSilentFixture = silent.filter((r) => r.subjectClass === 'LIVE' && r.subj.cls === 'FIXTURE');
say(`  SILENT (DEFAULT+SKIP)                          ${silent.length}`);
say(`  …of which the subject is live gate output       ${silentReachable.length}   ← the honest hazard count`);
say(`  …of which the subject is an in-file fixture     ${liveFileSilentFixture.length}   ← counted LIVE at file level, unreachable at site level`);
for (const r of silentReachable) say(`      REACHABLE SILENT  ${r.rel}:${r.line}  ${r.cls}  [${r.shape}]`);
say('');

// ---------------------------------------------------------------- P6: renamed-gate drive

say('§3  P6 — two scratch copies of the live gate, differing only in the label');
let p6 = { ran: false };
try {
  const gateSrc = readFileSync(GATE, 'utf8');
  const occ = gateSrc.split(LABEL).length - 1;
  const renamedSrc = gateSrc.split(LABEL).join(RENAMED);
  const backSrc = renamedSrc.split(RENAMED).join(LABEL);
  const reversible = backSrc === gateSrc;
  writeFileSync(SCRATCH_V, gateSrc);
  writeFileSync(SCRATCH_R, renamedSrc);
  const drive = (p) => {
    const r = spawnSync(process.execPath, [p], { encoding: 'utf8', cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
    return { rc: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
  };
  const V = drive(SCRATCH_V);
  const R = drive(SCRATCH_R);
  const verdictOf = (s) => (s.split('\n').find((l) => l.includes('DECL-BODY SLICERS')) ?? '(none)').trim();
  say(`  label occurrences substituted: ${occ}   substitution reversible: ${reversible}`);
  say(`  VERBATIM  rc ${V.rc}  stdout ${V.stdout.length} B (${sha(V.stdout)})  stderr ${V.stderr.length} B  verdict "${verdictOf(V.stdout)}"`);
  say(`  RENAMED   rc ${R.rc}  stdout ${R.stdout.length} B (${sha(R.stdout)})  stderr ${R.stderr.length} B  verdict "${verdictOf(R.stdout)}"`);
  say(`  verdict line identical: ${verdictOf(V.stdout) === verdictOf(R.stdout)}   rc unmoved: ${V.rc === R.rc}`);
  say('');
  say('  each application\'s pattern, in its host\'s own mode, against both real stdouts:');
  const mk = (pat) => {
    const body = pat.replace(/^\//, '').replace(/\/[a-z]*$/, '');
    const flags = (pat.match(/\/([a-z]*)$/) || [, ''])[1];
    try { return new RegExp(body, flags); } catch { return null; }
  };
  const applyIn = (re, mode, text) => {
    if (!re) return 'UNCOMPILABLE';
    if (mode === 'LINE') return text.split('\n').some((l) => re.test(l)) ? 'match' : 'null';
    return re.test(text) ? 'match' : 'null';
  };
  const pr = [];
  for (const r of rows) {
    const re = mk(r.pattern);
    const mode = r.mode === 'LINE' ? 'LINE' : 'STRING';
    const v = applyIn(re, mode, V.stdout);
    const rr = applyIn(re, mode, R.stdout);
    pr.push({ site: `${r.rel}:${r.line}`, appliedAt: r.appliedAt, mode, pattern: r.pattern, verbatim: v, renamed: rr, breaks: v === 'match' && rr === 'null', deadCell: v === 'null', cls: r.cls, subject: r.subj.cls });
    say(`    ${r.rel.split('/').slice(-2).join('/')}:${r.line}  mode ${mode.padEnd(6)} verbatim ${v.padEnd(13)} renamed ${rr.padEnd(13)} ${v === 'match' && rr === 'null' ? 'BREAKS' : v === 'null' ? 'DEAD CELL — matched neither, so it cannot be broken by either' : 'survives'}  [class ${r.cls}]`);
  }
  const breaks = pr.filter((x) => x.breaks);
  const dead = pr.filter((x) => x.deadCell);
  const survivors = pr.filter((x) => !x.breaks && !x.deadCell);
  say('');
  say(`  applications graded                 ${pr.length}`);
  say(`  BREAK under the rename              ${breaks.length}`);
  say(`  SURVIVE (matched both renderings)   ${survivors.length}`);
  for (const s of survivors) say(`      SURVIVOR  ${s.site}  class ${s.cls}  subject ${s.subject}`);
  say(`  DEAD CELL (matched neither)         ${dead.length}   ← ungradeable, not evidence of safety`);
  for (const d of dead) say(`      DEAD  ${d.site}  mode ${d.mode}  subject ${d.subject}`);
  say('');
  const worst = pr.filter((x) => x.breaks && (x.cls === 'SKIP' || x.cls === 'DEFAULT') && x.subject === 'GATE');
  say('§4  the cross that is the point of this unit — breaks × silent × reaches live gate output');
  say(`  breaks AND silent AND subject is live gate output: ${worst.length}`);
  for (const w of worst) say(`      ${w.site}  ${w.cls}`);
  p6 = { ran: true, occ, reversible, V: { rc: V.rc, bytes: V.stdout.length, sha: sha(V.stdout), stderr: V.stderr.length }, R: { rc: R.rc, bytes: R.stdout.length, sha: sha(R.stdout), stderr: R.stderr.length }, verdictIdentical: verdictOf(V.stdout) === verdictOf(R.stdout), rows: pr, breaks: breaks.length, survivors: survivors.length, dead: dead.length, worst: worst.length };
} finally {
  for (const p of [SCRATCH_V, SCRATCH_R]) { try { rmSync(p); } catch { /* already gone */ } }
  const left = execFileSync('git', ['-C', ROOT, 'status', '--porcelain'], { encoding: 'utf8' });
  say('');
  say(`§5  scratch removal — any \`.d513-scratch\` left in the tree: ${/\.d513-scratch/.test(left) ? 'YES — FAILED' : 'none'}`);
}

writeFileSync(join(CAPS, 'POSTHOC-APPSUBJECT.out'), `${out.join('\n')}\n`);
writeFileSync(join(CAPS, 'POSTHOC-APPSUBJECT.json'), `${JSON.stringify({ rev, drivenAt: now, keyE: rows.map((r) => ({ site: `${r.rel}:${r.line}`, appliedAt: r.appliedAt, fileClass: r.subjectClass, applicationClass: r.subj.cls, why: r.subj.why, consumer: r.cls, shape: r.shape })), p6 }, null, 2)}\n`);
