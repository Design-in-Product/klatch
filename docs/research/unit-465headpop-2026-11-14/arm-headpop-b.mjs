/**
 * unit-465headpop — arm B: census of unpinned-ref population selectors.
 *
 * Population pinned to a named rev; this unit's own directory sliced out (an instrument does not
 * census its own source, and this file contains every pattern it looks for).
 *
 * Classification is positively keyed with an explicit UNCLASSIFIED bucket. No fall-through: the
 * resolver must name a reason for every site, and refusals are published rather than absorbed.
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

// ----------------------------------------------------------------- population, at the named rev

const paths = git(['ls-tree', '-r', '--name-only', PIN, 'docs/research/', 'scripts/'])
  .split('\n')
  .map((s) => s.trim())
  .filter((p) => p.endsWith('.mjs'))
  .filter((p) => !p.startsWith(SELF_DIR));

function blobsAt(rev, list) {
  const input = list.map((p) => `${rev}:${p}`).join('\n') + '\n';
  const r = spawnSync('git', ['-C', ROOT, 'cat-file', '--batch'], { input, maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`cat-file exited ${r.status}`);
  const buf = r.stdout;
  const out = new Map();
  let off = 0, i = 0;
  while (off < buf.length && i < list.length) {
    const nl = buf.indexOf(0x0a, off);
    if (nl < 0) break;
    const m = buf.slice(off, nl).toString('utf8').match(/^([0-9a-f]{40}) (\w+) (\d+)$/);
    if (!m) throw new Error(`cat-file refused for ${list[i]}`);
    const size = Number(m[3]);
    out.set(list[i], buf.slice(nl + 1, nl + 1 + size).toString('utf8'));
    off = nl + 1 + size + 1;
    i += 1;
  }
  if (out.size !== list.length) throw new Error(`got ${out.size} blobs for ${list.length} paths`);
  return out;
}

const texts = blobsAt(PIN, paths);
console.log(`B-pop  .mjs under docs/research/ + scripts/ at ${PIN}, self-dir excluded = ${paths.length}`);

// --------------------------------------------------- site extraction: the git argv, not a window

const SHA_RE = /^[0-9a-f]{7,40}$/;

/**
 * Pull the comma-separated argument list of each call whose argv contains the subcommand literal.
 * Keyed on the call's own argument text, bounded by its parentheses — not a proximity window, so a
 * neighbouring call cannot contribute tokens ([[an_enclosing_call_absorbs_its_inner_calls_argv]] is
 * handled by taking the INNERMOST balanced span that still holds the subcommand literal).
 */
function sitesIn(src, sub) {
  const out = [];
  const needle = `'${sub}'`;
  let from = 0;
  for (;;) {
    const at = src.indexOf(needle, from);
    if (at < 0) break;
    from = at + needle.length;
    // walk left to the nearest unbalanced '(' — the opening paren of the enclosing call
    let depth = 0, open = -1;
    for (let i = at; i >= 0; i -= 1) {
      const c = src[i];
      if (c === ')') depth += 1;
      else if (c === '(') { if (depth === 0) { open = i; break; } depth -= 1; }
    }
    if (open < 0) { out.push({ sub, args: null, raw: null }); continue; }
    let close = -1; depth = 0;
    for (let i = open; i < src.length; i += 1) {
      const c = src[i];
      if (c === '(') depth += 1;
      else if (c === ')') { depth -= 1; if (depth === 0) { close = i; break; } }
    }
    const raw = close > open ? src.slice(open + 1, close) : null;
    const line = src.slice(0, at).split('\n').length;
    out.push({ sub, raw, line });
  }
  return out;
}

/** Tokenise an argv span into its string literals and bare identifiers, in order. */
function argTokens(raw) {
  const toks = [];
  const re = /'([^']*)'|`([^`$]*)`|([A-Za-z_$][\w$.]*)/g;
  let m;
  while ((m = re.exec(raw))) {
    if (m[1] !== undefined) toks.push({ kind: 'lit', v: m[1] });
    else if (m[2] !== undefined) toks.push({ kind: 'lit', v: m[2] });
    else toks.push({ kind: 'id', v: m[3] });
  }
  return toks;
}

/** Nearest preceding binding of `id` in `src` before `line`, as a literal if it is one. */
function nearestBinding(src, id, line) {
  const lines = src.split('\n');
  const re = new RegExp(`\\b(?:const|let|var)\\s+${id.replace(/[.$]/g, '\\$&')}\\s*=\\s*(.+)$`);
  for (let i = Math.min(line, lines.length) - 1; i >= 0; i -= 1) {
    const m = lines[i].match(re);
    if (m) return m[1].trim();
  }
  return null;
}

const FLAGS = new Set(['-r', '--name-only', '-z', '--full-tree', '-d', '--cached', '-o', '--others',
  '--exclude-standard', '--error-unmatch', '-l', '--abbrev', '--long', '-t', '--full-name', '-m', '-c',
  '--deleted', '--modified', '--stage', '-s', '-u', '--directory', '--no-empty-directory', '-x', '-i']);

const rows = [];
for (const p of paths) {
  const src = texts.get(p);
  for (const sub of ['ls-tree', 'ls-files']) {
    for (const site of sitesIn(src, sub)) {
      if (site.raw === null) { rows.push({ p, sub, cls: 'UNCLASSIFIED', why: 'no enclosing call span', line: site.line }); continue; }
      const toks = argTokens(site.raw);
      const subAt = toks.findIndex((t) => t.kind === 'lit' && t.v === sub);
      const after = toks.slice(subAt + 1);

      if (sub === 'ls-files') { rows.push({ p, sub, cls: 'NO_REF', why: 'ls-files takes no ref', line: site.line }); continue; }

      // first argument after the subcommand that is not a known flag and not a pathspec
      const cand = after.find((t) => !(t.kind === 'lit' && (FLAGS.has(t.v) || t.v.startsWith('-'))));
      if (!cand) { rows.push({ p, sub, cls: 'UNCLASSIFIED', why: 'no ref-position argument found', line: site.line }); continue; }

      let v = cand.v, via = cand.kind;
      if (cand.kind === 'id') {
        const b = nearestBinding(src, cand.v, site.line);
        if (b === null) { rows.push({ p, sub, cls: 'UNCLASSIFIED', why: `ref is identifier ${cand.v}, no binding found`, line: site.line }); continue; }
        const lit = b.match(/^['"`]([^'"`]*)['"`]/);
        if (!lit) { rows.push({ p, sub, cls: 'UNCLASSIFIED', why: `ref ${cand.v} binds to non-literal ${b.slice(0, 40)}`, line: site.line }); continue; }
        v = lit[1]; via = `id:${cand.v}`;
      }

      const base = v.replace(/[\^~]\d*$/, '');
      if (/^HEAD$/.test(base)) rows.push({ p, sub, cls: 'UNPINNED_HEAD', why: `ref=${v} via ${via}`, line: site.line });
      else if (SHA_RE.test(base)) rows.push({ p, sub, cls: 'PINNED', why: `ref=${v} via ${via}`, line: site.line });
      else if (/^[A-Za-z][\w./-]*$/.test(base)) rows.push({ p, sub, cls: 'UNPINNED_NAMED', why: `ref=${v} via ${via}`, line: site.line });
      else rows.push({ p, sub, cls: 'UNCLASSIFIED', why: `ref=${v} unrecognised shape`, line: site.line });
    }
  }
}

const by = (c) => rows.filter((r) => r.cls === c);
const filesOf = (rs) => new Set(rs.map((r) => r.p));
const HEADr = by('UNPINNED_HEAD'), NOREF = by('NO_REF'), PINr = by('PINNED'),
  NAMEDr = by('UNPINNED_NAMED'), UNC = by('UNCLASSIFIED');

console.log(`B-cls  sites=${rows.length}  UNPINNED_HEAD=${HEADr.length}  NO_REF=${NOREF.length}  PINNED=${PINr.length}  UNPINNED_NAMED=${NAMEDr.length}  UNCLASSIFIED=${UNC.length}`);
const defective = [...HEADr, ...NOREF];
const defFiles = filesOf(defective);
console.log(`B-files  files with >=1 UNPINNED_HEAD or NO_REF = ${defFiles.size}  (of ${paths.length} .mjs)`);
console.log(`B-files  NO_REF files = ${filesOf(NOREF).size}`);
const scriptsDef = defective.filter((r) => r.p.startsWith('scripts/'));
console.log(`B-scripts  defective sites under scripts/ = ${scriptsDef.length} in ${filesOf(scriptsDef).size} files`);

console.log('B-unc  every UNCLASSIFIED site, with its reason:');
for (const r of UNC) console.log(`   ${r.p}:${r.line} ${r.sub} — ${r.why}`);

console.log('B-head  UNPINNED_HEAD sites:');
for (const r of HEADr) console.log(`   ${r.p}:${r.line} — ${r.why}`);

// ------------------------------------------------------------------------------------ the legs

const uncRate = rows.length === 0 ? 1 : UNC.length / rows.length;
check('B1', defFiles.size >= 1, `B-pop: census ran and found ${defFiles.size} files with an unpinned population selector`);
check('B2', rows.length > 0, `sites found = ${rows.length}`);
check('B3', uncRate <= 0.10, `B5: UNCLASSIFIED is ${(uncRate * 100).toFixed(1)}% of ${rows.length} sites (<=10% required for this to be a measurement)`);

// my own two arms must be in the UNPINNED_HEAD set — known by construction, used as a known positive
const MINE = HEADr.filter((r) => r.p.includes('unit-465schemacollide-2026-11-14'));
check('B4', MINE.length >= 2, `known positive: my own schemacollide arms appear as UNPINNED_HEAD (${MINE.length} sites)`);

pred('P-B1', defFiles.size >= 20, `B1 — >=20 distinct files carry an UNPINNED_HEAD or NO_REF site (got ${defFiles.size})`);
pred('P-B2', NOREF.length >= 30 && filesOf(NOREF).size >= 24, `B2 — NO_REF >=30 sites across >=24 files (got ${NOREF.length} / ${filesOf(NOREF).size})`);
pred('P-B3', HEADr.length > PINr.length, `B3 — UNPINNED_HEAD outnumbers PINNED (${HEADr.length} vs ${PINr.length})`);
pred('P-B4', scriptsDef.length >= 1, `B4 — >=1 defective site under scripts/ (got ${scriptsDef.length})`);
pred('P-B5', uncRate <= 0.10, `B5 — UNCLASSIFIED <=10% (got ${(uncRate * 100).toFixed(1)}%)`);

console.log(renderVerdict({ legs, preds }));
process.exit(legs.some((l) => l.ok === false) ? 1 : 0);
