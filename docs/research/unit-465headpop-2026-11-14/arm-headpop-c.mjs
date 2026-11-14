/**
 * unit-465headpop — arm C.
 *
 * Arm B refused: 159 of 254 sites UNCLASSIFIED (62.6%), over the pre-registered 10% ceiling, so its
 * other four figures are void by my own pre-reg. Arm B's recording stands as taken.
 *
 * Arm C does NOT force those sites to a verdict. It adds POSITIVELY KEYED classes for the two
 * things arm B could not see, and keeps UNCLASSIFIED as a real refusal bucket:
 *
 *   DEFERRED_TO_CALLER — the ref is a function parameter. The site is neither pinned nor unpinned;
 *                        pinned-ness is a property of its CALLERS, which a site census cannot read.
 *   DERIVED_REF        — the ref is an identifier bound to a non-literal expression (member access,
 *                        call result). Also not decidable at the site.
 *   NOT_A_CALL         — the subcommand literal is in a comment or a non-call position.
 *
 * The point of the split is that these are not milder versions of UNPINNED — they are a different
 * question, and folding them either way would manufacture the headline.
 */
import { execFileSync } from 'node:child_process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { renderVerdict } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const PIN = 'de144502';
const SELF_DIR = 'docs/research/unit-465headpop-2026-11-14/';

function git(args) {
  return execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });
}
const legs = [];
const preds = [];
const check = (id, ok, why) => { legs.push({ id, ok, why }); return ok; };
const pred = (id, landed, why) => { preds.push({ id, landed, why }); return landed; };

const paths = git(['ls-tree', '-r', '--name-only', PIN, 'docs/research/', 'scripts/'])
  .split('\n').map((s) => s.trim())
  .filter((p) => p.endsWith('.mjs'))
  .filter((p) => !p.startsWith(SELF_DIR));

function blobsAt(rev, list) {
  const input = list.map((p) => `${rev}:${p}`).join('\n') + '\n';
  const r = spawnSync('git', ['-C', ROOT, 'cat-file', '--batch'], { input, maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`cat-file exited ${r.status}`);
  const buf = r.stdout; const out = new Map(); let off = 0, i = 0;
  while (off < buf.length && i < list.length) {
    const nl = buf.indexOf(0x0a, off); if (nl < 0) break;
    const m = buf.slice(off, nl).toString('utf8').match(/^([0-9a-f]{40}) (\w+) (\d+)$/);
    if (!m) throw new Error(`cat-file refused for ${list[i]}`);
    const size = Number(m[3]);
    out.set(list[i], buf.slice(nl + 1, nl + 1 + size).toString('utf8'));
    off = nl + 1 + size + 1; i += 1;
  }
  if (out.size !== list.length) throw new Error(`got ${out.size} blobs for ${list.length}`);
  return out;
}
const texts = blobsAt(PIN, paths);

const SHA_RE = /^[0-9a-f]{7,40}$/;
const FLAGS = new Set(['-r', '--name-only', '-z', '--full-tree', '-d', '--cached', '-o', '--others',
  '--exclude-standard', '--error-unmatch', '-l', '--abbrev', '--long', '-t', '--full-name', '-m', '-c',
  '--deleted', '--modified', '--stage', '-s', '-u', '--directory', '--no-empty-directory', '-x', '-i']);

function sitesIn(src, sub) {
  const out = []; const needle = `'${sub}'`; let from = 0;
  for (;;) {
    const at = src.indexOf(needle, from); if (at < 0) break;
    from = at + needle.length;
    const line = src.slice(0, at).split('\n').length;
    const lineText = src.split('\n')[line - 1] ?? '';
    let depth = 0, open = -1;
    for (let i = at; i >= 0; i -= 1) {
      const c = src[i];
      if (c === ')') depth += 1;
      else if (c === '(') { if (depth === 0) { open = i; break; } depth -= 1; }
    }
    if (open < 0) { out.push({ sub, raw: null, line, lineText }); continue; }
    let close = -1; depth = 0;
    for (let i = open; i < src.length; i += 1) {
      const c = src[i];
      if (c === '(') depth += 1;
      else if (c === ')') { depth -= 1; if (depth === 0) { close = i; break; } }
    }
    out.push({ sub, raw: close > open ? src.slice(open + 1, close) : null, line, lineText });
  }
  return out;
}
function argTokens(raw) {
  const toks = []; const re = /'([^']*)'|`([^`$]*)`|([A-Za-z_$][\w$.]*)/g; let m;
  while ((m = re.exec(raw))) {
    if (m[1] !== undefined) toks.push({ kind: 'lit', v: m[1] });
    else if (m[2] !== undefined) toks.push({ kind: 'lit', v: m[2] });
    else toks.push({ kind: 'id', v: m[3] });
  }
  return toks;
}
function nearestBinding(src, id, line) {
  const lines = src.split('\n');
  const re = new RegExp(`\\b(?:const|let|var)\\s+${id.replace(/[.$]/g, '\\$&')}\\s*=\\s*(.+)$`);
  for (let i = Math.min(line, lines.length) - 1; i >= 0; i -= 1) {
    const m = lines[i].match(re); if (m) return m[1].trim();
  }
  return null;
}
/**
 * Every parameter name declared anywhere in the file. FILE-LEVEL, not scope-exact — declared as a
 * limit: a name that is a parameter in one function and a global const in another resolves as the
 * const (checked first), so this can only mislabel a site whose ref name is BOTH, and it reports
 * which name it matched so that case is visible.
 */
function paramNames(src) {
  const names = new Set();
  const sigs = [
    /function\s+[\w$]*\s*\(([^)]*)\)/g,
    /(?:^|[\s,({])\(([^)]*)\)\s*=>/g,
    /(?:^|\s)([\w$]+)\s*=>/g,
  ];
  for (const re of sigs) {
    let m;
    while ((m = re.exec(src))) {
      for (const part of m[1].split(',')) {
        const n = part.trim().replace(/[={].*$/, '').replace(/^\.\.\./, '').trim();
        if (/^[A-Za-z_$][\w$]*$/.test(n)) names.add(n);
      }
    }
  }
  return names;
}

const rows = [];
for (const p of paths) {
  const src = texts.get(p);
  const params = paramNames(src);
  for (const sub of ['ls-tree', 'ls-files']) {
    for (const site of sitesIn(src, sub)) {
      const add = (cls, why) => rows.push({ p, sub, cls, why, line: site.line });
      const commentish = /^\s*(\*|\/\/|\/\*)/.test(site.lineText);
      if (site.raw === null) { add(commentish ? 'NOT_A_CALL' : 'UNCLASSIFIED', commentish ? 'subcommand literal in a comment line' : 'no enclosing call span and not a comment'); continue; }
      if (commentish) { add('NOT_A_CALL', 'subcommand literal in a comment line'); continue; }
      const toks = argTokens(site.raw);
      const subAt = toks.findIndex((t) => t.kind === 'lit' && t.v === sub);
      const after = toks.slice(subAt + 1);
      if (sub === 'ls-files') { add('NO_REF', 'ls-files takes no ref'); continue; }
      const cand = after.find((t) => !(t.kind === 'lit' && (FLAGS.has(t.v) || t.v.startsWith('-'))));
      if (!cand) { add('UNCLASSIFIED', 'no ref-position argument found'); continue; }

      let v = cand.v, via = cand.kind;
      if (cand.kind === 'id') {
        const b = nearestBinding(src, cand.v, site.line);
        if (b === null) {
          if (params.has(cand.v)) { add('DEFERRED_TO_CALLER', `ref is parameter ${cand.v}`); continue; }
          add('UNCLASSIFIED', `ref identifier ${cand.v}: no binding and not a parameter name`); continue;
        }
        const lit = b.match(/^['"`]([^'"`]*)['"`]/);
        if (!lit) { add('DERIVED_REF', `ref ${cand.v} = ${b.slice(0, 48)}`); continue; }
        v = lit[1]; via = `id:${cand.v}`;
      }
      const base = v.replace(/[\^~]\d*$/, '');
      if (/^HEAD$/.test(base)) add('UNPINNED_HEAD', `ref=${v} via ${via}`);
      else if (SHA_RE.test(base)) add('PINNED', `ref=${v} via ${via}`);
      else if (/^[A-Za-z][\w./-]*$/.test(base)) add('UNPINNED_NAMED', `ref=${v} via ${via}`);
      else add('UNCLASSIFIED', `ref=${v} unrecognised shape`);
    }
  }
}

const by = (c) => rows.filter((r) => r.cls === c);
const files = (rs) => new Set(rs.map((r) => r.p)).size;
const CLASSES = ['UNPINNED_HEAD', 'NO_REF', 'PINNED', 'UNPINNED_NAMED', 'DEFERRED_TO_CALLER', 'DERIVED_REF', 'NOT_A_CALL', 'UNCLASSIFIED'];
console.log(`C-pop  .mjs at ${PIN}, self-dir excluded = ${paths.length};  sites = ${rows.length}`);
for (const c of CLASSES) console.log(`C-cls  ${c.padEnd(19)} ${String(by(c).length).padStart(4)} sites  ${String(files(by(c))).padStart(3)} files`);

const decidable = [...by('UNPINNED_HEAD'), ...by('NO_REF'), ...by('PINNED'), ...by('UNPINNED_NAMED')];
const undecidable = [...by('DEFERRED_TO_CALLER'), ...by('DERIVED_REF')];
const unc = by('UNCLASSIFIED');
const graded = rows.length - by('NOT_A_CALL').length;
console.log(`C-split  decidable at the site = ${decidable.length} of ${graded} graded sites (${(100 * decidable.length / graded).toFixed(1)}%)`);
console.log(`C-split  defer to a caller or a derived ref = ${undecidable.length} (${(100 * undecidable.length / graded).toFixed(1)}%)`);
console.log(`C-split  still refused = ${unc.length} (${(100 * unc.length / graded).toFixed(1)}%)`);

const defective = [...by('UNPINNED_HEAD'), ...by('NO_REF')];
console.log(`C-def  UNPINNED_HEAD or NO_REF: ${defective.length} sites in ${files(defective)} files`);
console.log(`C-def  of those, under scripts/: ${defective.filter((r) => r.p.startsWith('scripts/')).length}`);
console.log('C-unc  every remaining UNCLASSIFIED site:');
for (const r of unc) console.log(`   ${r.p}:${r.line} ${r.sub} — ${r.why}`);

const uncRate = unc.length / graded;
check('C1', rows.length >= 254, `site extraction is not narrower than arm B's (${rows.length} vs 254)`);
check('C2', uncRate <= 0.10, `UNCLASSIFIED is ${(100 * uncRate).toFixed(1)}% of graded sites — pre-reg B5 ceiling is 10%`);
check('C3', by('UNPINNED_HEAD').filter((r) => r.p.includes('unit-465schemacollide-2026-11-14')).length >= 2,
  `known positive: my own schemacollide arms still classify UNPINNED_HEAD`);
check('C4', undecidable.length > 0, `the two new classes are non-empty (${undecidable.length}) — if they were empty, arm B's refusals were not what I said they were`);
check('C5', decidable.length + undecidable.length + unc.length === graded, `the classes partition the graded sites exactly (${decidable.length}+${undecidable.length}+${unc.length} = ${graded})`);

pred('P-C1', uncRate <= 0.10, `the parameter and derived-ref classes bring UNCLASSIFIED under the 10% ceiling (${(100 * uncRate).toFixed(1)}%)`);
pred('P-C2', undecidable.length > decidable.length, `MOST ls-tree sites in this corpus are not decidable at the site at all (${undecidable.length} vs ${decidable.length})`);

console.log(renderVerdict({ legs, preds }));
process.exit(legs.some((l) => l.ok === false) ? 1 : 0);
