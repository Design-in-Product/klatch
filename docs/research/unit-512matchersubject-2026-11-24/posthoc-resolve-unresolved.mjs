// unit-512 post-hoc 1 — resolve the 4 sites r2 left UNRESOLVED, and say why r2 could not.
// Theseus, 2026-11-24 START fire.
//
// r2 resolves a read path out of string literals bound to identifiers in the same file. Both
// remaining files bind their capture directory as `join(import.meta.dirname, 'captures')` — there
// is no literal path anywhere in the file to join, so r2 had nothing to resolve and said so
// instead of guessing. Two rules close the gap, and both are mechanical:
//   1. `import.meta.dirname` is the directory of the file being read. Substitute it.
//   2. A one-line helper `const read = (n) => readFileSync(join(CAP, n), 'utf8')` moves the
//      filename to the CALL SITE. Resolve the helper's call sites, not its body.
//
// This file does NOT rewrite r2. r2's capture stands as driven, including its 4 UNRESOLVED, so the
// reader's own reach is on the record next to the figure it produced.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const UNIT = 'docs/research/unit-512matchersubject-2026-11-24';
const r2 = JSON.parse(readFileSync(`${ROOT}/${UNIT}/captures/ARM-R2.json`, 'utf8'));
const unresolved = r2.sites.filter((s) => s.verdict === 'UNRESOLVED');
const files = [...new Set(unresolved.map((s) => s.file))].sort();

const tracked = (p) => {
  try { execFileSync('git', ['ls-files', '--error-unmatch', p], { cwd: ROOT, stdio: 'pipe' }); return true; }
  catch { return false; }
};

console.log(`unit-512 post-hoc 1 — the 4 sites r2 could not resolve (${files.length} files)\n`);

const resolvedAll = [];
for (const f of files) {
  const text = readFileSync(`${ROOT}/${f}`, 'utf8');
  const here = dirname(f);
  console.log(`  ${f}`);
  console.log(`      import.meta.dirname → ${here}`);

  // rule 1: directory bindings built from import.meta.dirname
  const dirBind = new Map();
  for (const m of text.matchAll(/\b(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*join\(\s*import\.meta\.dirname\s*,\s*['"`]([^'"`]+)['"`]\s*\)/g)) {
    dirBind.set(m[1], join(here, m[2]));
    console.log(`      binding ${m[1]} → ${join(here, m[2])}`);
  }

  const found = [];
  // direct: readFileSync(join(DIR, 'name.out'))
  for (const m of text.matchAll(/readFileSync\(\s*join\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*,\s*['"`]([^'"`]+)['"`]\s*\)/g)) {
    if (dirBind.has(m[1])) found.push({ via: 'direct', path: join(dirBind.get(m[1]), m[2]) });
  }
  // indirect: helper arrow whose body reads join(DIR, <param>), resolved at its call sites
  for (const h of text.matchAll(/\b(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*=>\s*readFileSync\(\s*join\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*,\s*\2\s*\)/g)) {
    const [, helper, , dirId] = h;
    if (!dirBind.has(dirId)) continue;
    console.log(`      helper ${helper}(n) reads ${dirBind.get(dirId)}/<n> — resolving its call sites`);
    for (const c of text.matchAll(new RegExp(`\\b${helper}\\(\\s*['"\`]([^'"\`]+)['"\`]\\s*\\)`, 'g'))) {
      found.push({ via: `helper ${helper}()`, path: join(dirBind.get(dirId), c[1]) });
    }
  }

  const uniq = [...new Map(found.map((x) => [x.path, x])).values()];
  for (const u of uniq) {
    const t = tracked(u.path);
    const isCapture = /\/captures\//.test(u.path) && /\.(out|json|err)$/.test(u.path);
    let scopeLine = null; let readLine = null; let bytes = null;
    if (t) {
      const body = readFileSync(`${ROOT}/${u.path}`, 'utf8');
      bytes = Buffer.byteLength(body);
      scopeLine = /tracked code file\(s\) in scope/.test(body);
      readLine = (body.split('\n').find((l) => /tracked files read/.test(l)) ?? '').trimEnd() || null;
    }
    console.log(`      ${t ? 'TRACKED' : 'untracked'}  ${u.path}  (${u.via})`);
    if (t) console.log(`          ${bytes} bytes · gate-output capture: ${isCapture} · contains cured scope line: ${scopeLine} · ${JSON.stringify(readLine)}`);
    resolvedAll.push({ file: f, ...u, tracked: t, isCapture, bytes, containsCuredScopeLine: scopeLine, readLine });
  }
  // did this file drive the gate at all? (r2's drive key, re-applied)
  const drives = /spawnSync|execFileSync|execSync/.test(text);
  console.log(`      any spawn/exec in the file at all: ${drives}`);
  console.log('');
}

const byFile = {};
for (const f of files) {
  const rows = resolvedAll.filter((r) => r.file === f);
  const caps = rows.filter((r) => r.tracked && r.isCapture);
  byFile[f] = caps.length > 0 ? 'FROZEN' : 'STILL-UNRESOLVED';
}
console.log(`§1  verdicts for the 4 previously-unresolved sites`);
for (const s of unresolved) console.log(`  ${s.site} → ${byFile[s.file]}`);

const live = r2.sites.filter((s) => s.verdict === 'LIVE').length;
const frozenBefore = r2.sites.filter((s) => s.verdict === 'FROZEN').length;
const nowFrozen = unresolved.filter((s) => byFile[s.file] === 'FROZEN').length;
const stillUn = unresolved.length - nowFrozen;

console.log(`\n§2  the closed figures`);
console.log(`  LIVE   (a rename reaches them)      : ${live} of 15`);
console.log(`  FROZEN (a rename cannot reach them) : ${frozenBefore + nowFrozen} of 15   (${frozenBefore} from r2 + ${nowFrozen} resolved here)`);
console.log(`  STILL UNRESOLVED                    : ${stillUn} of 15`);
const anyCuredScope = resolvedAll.some((r) => r.containsCuredScopeLine);
console.log(`  any FROZEN subject in the corpus that contains the cured scope line: ${anyCuredScope}`);

writeFileSync(`${ROOT}/${UNIT}/captures/POSTHOC-RESOLVE.json`, JSON.stringify({
  resolvedAll, byFile, live, frozen: frozenBefore + nowFrozen, stillUnresolved: stillUn, anyCuredScope,
}, null, 1));
