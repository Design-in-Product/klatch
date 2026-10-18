/**
 * Round 411 — **the hand read, first.** Lists every KP-shaped declaration in the corpus with its
 * stratum under the Round 409 key UNCHANGED, so the citations the graded instrument carries are
 * chosen off a real listing rather than guessed (341/408: a KP is declared as the source line it
 * occurs in, and the detector grades the hand read — not the other way round).
 *
 * This file publishes no verdict and grades nothing. It exists so that the `{path, line, ident}`
 * citations in `cure-the-wrapped-call-and-the-body-key.mjs` — in particular the OTHER-DERIVED
 * control, whose whole job is to stay put under the cure — are sliced out of the corpus rather
 * than invented. Output recorded as `listing-under-the-409-key.out`.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const REPO = fileURLToPath(new URL('../../..', import.meta.url));
const git = (args) =>
  execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const SELF = relative(REPO, fileURLToPath(import.meta.url)).split('\\').join('/');

const EXEC = /\.(mjs|mts)$/;
const CORPUS = git(['ls-files', 'docs/research', 'scripts']).split('\n')
  .filter((f) => EXEC.test(f)).sort();
const KP_NAME = /^(KP|KNOWN_POSITIVE|KNOWN_NEGATIVE|CONTROL)[A-Za-z0-9_]*$/;

function literalBodies(src) {
  const blanked = stripSource(src, true);
  const out = [];
  let i = 0;
  while (i < blanked.length) {
    const c = blanked[i];
    if (c === "'" || c === '"') {
      const j = blanked.indexOf(c, i + 1);
      if (j === -1) break;
      out.push({ body: src.slice(i + 1, j), at: i + 1, quote: c });
      i = j + 1;
      continue;
    }
    if (c === '`') {
      let j = i + 1, interp = 0, tmpl = 0;
      for (; j < blanked.length; j++) {
        const d = blanked[j];
        if (d === '$' && blanked[j + 1] === '{') { interp++; j++; continue; }
        if (d === '}' && interp > 0) { interp--; continue; }
        if (d === '`') {
          if (interp === 0 && tmpl === 0) break;
          if (interp > 0) { tmpl += tmpl > 0 ? -1 : 1; continue; }
        }
        if (interp === 0 && (d === "'" || d === '"')) {
          const k = blanked.indexOf(d, j + 1);
          if (k !== -1) j = k;
        }
      }
      if (j >= blanked.length) break;
      out.push({ body: src.slice(i + 1, j), at: i + 1, quote: '`' });
      i = j + 1;
      continue;
    }
    i++;
  }
  return out;
}

function slicesSource(src) {
  const code = stripSource(src, true);
  return /readFileSync|git\(\[|execFileSync/.test(code)
    && /literalBodies|stripSource|\.slice\(|\.exec\(|\.match\(|matchAll/.test(code);
}

function declarations(src) {
  const code = stripSource(src, false);
  const lines = code.split('\n');
  const srcLines = src.split('\n');
  const out = [];
  const re = /(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/g;
  for (let n = 0; n < lines.length; n++) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(lines[n])) !== null) {
      if (!KP_NAME.test(m[1])) continue;
      out.push({
        name: m[1],
        line: n + 1,
        init: srcLines[n].slice(m.index + m[0].length),
        initCode: lines[n].slice(m.index + m[0].length),
        // the three code lines FOLLOWING the declaration, comments already blanked. Collected
        // here and not used by the 409 key, so this listing is the 409 key exactly.
        after: lines.slice(n + 1, n + 4),
      });
    }
  }
  return out;
}

// ─── the Round 409 key, copied unchanged ───────────────────────────────────────────────────────
const READER_CALL = /^\s*([A-Za-z_$][A-Za-z0-9_$.]*)\s*\(\s*(String\.raw\s*)?[`'"]/;
const TYPED_START = /^\s*(String\.raw\s*)?[`'"]/;
const FROM_FILE = /readFileSync|git\(\[|atRev|fromFile|sliceAt|readAll|SRC\b|\bsrc\b/;

function stratum409(d) {
  const init = d.initCode;
  if (READER_CALL.test(init)) return 'TYPED-THEN-SLICED';
  if (TYPED_START.test(init)) {
    const ls = literalBodies(d.init);
    return ls.length > 0 ? 'TYPED-LITERAL' : 'UNMODELLED';
  }
  if (FROM_FILE.test(init)) return 'SLICED-FROM-FILE';
  if (/^\s*$/.test(init)) return 'UNMODELLED';
  return 'OTHER-DERIVED';
}

const SOURCES = CORPUS.map((p) => [p, readFileSync(join(REPO, p), 'utf8')]);
const ROWS = [];
for (const [p, src] of SOURCES) {
  const slicer = slicesSource(src);
  for (const d of declarations(src)) {
    ROWS.push({ path: p, name: d.name, line: d.line, slicer, s: stratum409(d),
                init: d.initCode.trim().slice(0, 72), after: d.after });
  }
}

const P = ROWS.filter((r) => r.path !== SELF);
console.log(`listing at ${git(['rev-parse', 'HEAD']).trim().slice(0, 8)} — `
  + `${P.length} declaration(s) outside this file, ${CORPUS.length} corpus file(s)\n`);
for (const s of ['TYPED-LITERAL', 'TYPED-THEN-SLICED', 'SLICED-FROM-FILE', 'OTHER-DERIVED',
                 'UNMODELLED']) {
  const rows = P.filter((r) => r.s === s);
  console.log(`\n── ${s}: ${rows.length} ──`);
  for (const r of rows) {
    console.log(`  ${r.slicer ? 'slicer' : 'non-sl'} ${r.path}:${r.line} ${r.name}`);
    console.log(`         init: ${JSON.stringify(r.init)}`);
    if (r.s === 'OTHER-DERIVED' || r.s === 'UNMODELLED') {
      console.log(`         after: ${JSON.stringify(r.after.map((l) => l.trim().slice(0, 56)))}`);
    }
  }
}
