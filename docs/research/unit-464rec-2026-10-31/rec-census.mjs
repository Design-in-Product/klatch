// unit-464rec — census for a baseline rev keyed on RECENCY WITHIN A MOVING SET.
//
// The shape is Daedalus's 10/31 STOP §7.5: a rev selected as "the newest commit matching X"
// is correct only on the drive that selects it, and a unit's own later commits move the set
// out from under it.
//
// Why a lexer and not a regex. The known positive's call is
//     git('log', '--format=%H', '-5', '--', MY_DIR_REL)
// — a WRAPPED call through a one-line `git(...)` helper, with no `execFileSync` at the call
// site. An adjacency pattern keyed on the spawn function cannot reach it (P4). And instrument
// sources here carry template interpolation, regex literals containing quotes, and `//` inside
// strings, all of which make a token-adjacency regex read the wrong spans. So: lex, find call
// expressions, take the WHOLE argument span by paren matching (which crosses line wraps), and
// classify the span's argv.
//
// Population is read with `git show <rev>:<path>` off a stamped rev, never from the working
// tree, so the census is reproducible from `baseline.rev` alone.
//
// Usage:
//   node rec-census.mjs                           full census, writes rec.json
//   node rec-census.mjs --cripple=recency-blind   GCRIPPLE arm: drop the count-selector rule
//   node rec-census.mjs --selftest                GKP only, no population figure

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const HERE = dirname(new URL(import.meta.url).pathname);
const REPO = resolve(HERE, '../../..');
const SELF_DIR_REL = 'docs/research/unit-464rec-2026-10-31';
const REV = readFileSync(`${HERE}/baseline.rev`, 'utf8').trim();

const ARGS = process.argv.slice(2);
const CRIPPLE = (ARGS.find((a) => a.startsWith('--cripple=')) ?? '').slice('--cripple='.length);
const SELFTEST = ARGS.includes('--selftest');
const CRIPPLES = new Set(['', 'recency-blind']);
if (!CRIPPLES.has(CRIPPLE)) {
  console.log(`REFUSED: unknown cripple ${JSON.stringify(CRIPPLE)}`);
  process.exit(2);
}

function git(...args) {
  // stdio pinned: a child's stderr echoing into a recording has bitten this track before.
  return execFileSync('git', ['-C', REPO, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 256 * 1024 * 1024,
  });
}

// ---------------------------------------------------------------- lexer

const PUNCT = new Set(['(', ')', '[', ']', '{', '}', ',', ';', ':', '?', '.', '=', '+', '-', '*', '/', '%', '<', '>', '!', '&', '|', '^', '~']);

// Returns tokens: {k:'str'|'tpl'|'id'|'num'|'punct'|'regex', v, i}
// `v` for 'str'/'tpl' is the literal's TEXT CONTENT (interpolations rendered as `${}`), which
// is what the classifier reads. Raw source offsets are kept so a span can be quoted back.
function lex(src) {
  const t = [];
  let i = 0;
  const n = src.length;
  // Tracks whether a `/` starts a regex or is division: regex only where a value cannot precede.
  const regexOk = () => {
    for (let j = t.length - 1; j >= 0; j--) {
      const p = t[j];
      if (p.k === 'id') return ['return', 'typeof', 'case', 'in', 'of', 'new', 'delete', 'void', 'instanceof', 'do', 'else', 'yield', 'await'].includes(p.v);
      if (p.k === 'num' || p.k === 'str' || p.k === 'tpl' || p.k === 'regex') return false;
      if (p.k === 'punct') return !([')', ']', '}'].includes(p.v));
      return true;
    }
    return true;
  };
  while (i < n) {
    const c = src[i];
    if (c === '\\') { i += 2; continue; }
    if (c === ' ' || c === '\t' || c === '\r' || c === '\n') { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    if (c === '"' || c === "'") {
      const start = i; const q = c; i++; let v = '';
      while (i < n && src[i] !== q) { if (src[i] === '\\') { v += src[i + 1] ?? ''; i += 2; continue; } v += src[i]; i++; }
      i++; t.push({ k: 'str', v, i: start }); continue;
    }
    if (c === '`') {
      const start = i; i++; let v = ''; let depth = 0;
      while (i < n) {
        if (src[i] === '\\') { v += src[i + 1] ?? ''; i += 2; continue; }
        if (depth === 0 && src[i] === '`') break;
        if (src[i] === '$' && src[i + 1] === '{') { v += '${}'; depth++; i += 2; continue; }
        if (depth > 0) {
          // Skip the interpolation's own source; its text is not part of the literal's content.
          if (src[i] === '{') depth++;
          else if (src[i] === '}') depth--;
          else if (src[i] === '`') { // nested template inside interpolation
            i++; let d2 = 0;
            while (i < n) { if (src[i] === '\\') { i += 2; continue; } if (d2 === 0 && src[i] === '`') break; if (src[i] === '$' && src[i + 1] === '{') { d2++; i += 2; continue; } if (d2 > 0) { if (src[i] === '{') d2++; else if (src[i] === '}') d2--; } i++; }
          } else if (src[i] === '"' || src[i] === "'") { const q2 = src[i]; i++; while (i < n && src[i] !== q2) { if (src[i] === '\\') { i += 2; continue; } i++; } }
          i++; continue;
        }
        v += src[i]; i++;
      }
      i++; t.push({ k: 'tpl', v, i: start }); continue;
    }
    if (c === '/' && regexOk()) {
      const start = i; i++; let inClass = false;
      while (i < n) { if (src[i] === '\\') { i += 2; continue; } if (src[i] === '[') inClass = true; else if (src[i] === ']') inClass = false; else if (src[i] === '/' && !inClass) break; else if (src[i] === '\n') break; i++; }
      i++; while (i < n && /[a-z]/.test(src[i])) i++;
      t.push({ k: 'regex', v: src.slice(start, i), i: start }); continue;
    }
    if (/[A-Za-z_$]/.test(c)) { const start = i; while (i < n && /[A-Za-z0-9_$]/.test(src[i])) i++; t.push({ k: 'id', v: src.slice(start, i), i: start }); continue; }
    if (/[0-9]/.test(c)) { const start = i; while (i < n && /[0-9a-fA-FxX._]/.test(src[i])) i++; t.push({ k: 'num', v: src.slice(start, i), i: start }); continue; }
    if (PUNCT.has(c)) { t.push({ k: 'punct', v: c, i }); i++; continue; }
    i++;
  }
  return t;
}

// ------------------------------------------------- call spans

const SUBCOMMANDS = new Set(['log', 'rev-list', 'rev-parse', 'describe', 'merge-base', 'show']);
const REVPRODUCING = new Set(['log', 'rev-list', 'rev-parse', 'describe', 'merge-base']);

// A call span: callee name + the token list of its arguments, with nested parens/brackets
// included so an argv array written across several lines is one span.
function callSpans(tok) {
  const spans = [];
  for (let i = 0; i < tok.length; i++) {
    if (!(tok[i].k === 'punct' && tok[i].v === '(')) continue;
    // Callee: the identifier chain immediately before the paren.
    let j = i - 1; const chain = [];
    while (j >= 0 && (tok[j].k === 'id' || (tok[j].k === 'punct' && tok[j].v === '.'))) { chain.unshift(tok[j].v); j--; }
    const callee = chain.filter((x) => x !== '.').join('.');
    if (!callee) continue;
    // Collect this call's own arguments. NESTED CALL expressions are skipped whole.
    //
    // Found by hand-reading drive4 (GHAND is why this leg exists): without the skip, an
    // ENCLOSING call absorbs its inner call's argv literals, so
    //     console.log('lock last touched:', execFileSync('git', [... 'log', '-1' ...]).trim())
    // produced TWO RECENCY spans for ONE git call — `console.log` inherited `log` and `-1`.
    // The over-count is silent and scales with how deeply instruments wrap their git calls.
    // Nested ARRAY and OBJECT literals are still kept: an argv array is the whole point.
    let depth = 0; let k = i; const args = [];
    for (; k < tok.length; k++) {
      const x = tok[k];
      if (x.k === 'punct' && x.v === '(') {
        depth++;
        if (depth === 1) continue; // this span's own opener
        const prev = tok[k - 1];
        const isCall = prev && (prev.k === 'id' || (prev.k === 'punct' && (prev.v === ')' || prev.v === ']')));
        if (isCall) { // skip the nested call whole
          let d2 = 0;
          for (; k < tok.length; k++) {
            const y = tok[k];
            if (y.k === 'punct' && (y.v === '(' || y.v === '[' || y.v === '{')) d2++;
            else if (y.k === 'punct' && (y.v === ')' || y.v === ']' || y.v === '}')) { d2--; if (d2 === 0) break; }
          }
          depth--;
          continue;
        }
        args.push(x); continue;
      }
      if (x.k === 'punct' && (x.v === '[' || x.v === '{')) { depth++; args.push(x); continue; }
      if (x.k === 'punct' && (x.v === ')' || x.v === ']' || x.v === '}')) { depth--; if (depth === 0) break; args.push(x); continue; }
      args.push(x);
    }
    spans.push({ callee, args, at: tok[i].i });
  }
  return spans;
}

// A span is a git call if a literal `git` (or a shell string starting `git `) is among its
// arguments, OR the callee itself names git. The second disjunct is what reaches the KP.
function gitness(span) {
  const lits = span.args.filter((a) => a.k === 'str' || a.k === 'tpl');
  const viaArg = lits.some((a) => a.v === 'git' || /^git(\s|$)/.test(a.v));
  const viaCallee = /(^|\.)git$/i.test(span.callee) || /^(run|do|sh|exec|call)?[Gg]it[A-Z_]?/.test(span.callee);
  if (!viaArg && !viaCallee) return null;
  return { viaArg, viaCallee, lits };
}

// Flatten a span's literals into argv words. A shell-form string is split on whitespace;
// an argv-array form contributes each literal whole.
//
// `consts` resolves IDENTIFIER arguments against same-file `const NAME = '<literal>'`
// declarations. Found by hand-reading drive5: round387 writes
//     const MY_387_COMMIT = 'beb1ab78';
//     git(['log', '-1', '--format=%B', MY_387_COMMIT])
// — the `-1` is a tie-break over a set of exactly one PINNED commit, not a recency key. A
// classifier that reads only string literals in the span never sees the rev, calls the
// selector unpinned, and reports the author defective. A census keyed on the call line
// cannot see a hoisted constant.
function argvWords(lits, idents = [], consts = new Map()) {
  const words = [];
  for (const a of lits) {
    if (/^git(\s|$)/.test(a.v) && /\s/.test(a.v)) { for (const w of a.v.split(/\s+/).filter(Boolean)) words.push(w); continue; }
    if (a.v === 'git') continue;
    words.push(a.v);
  }
  for (const id of idents) { const v = consts.get(id); if (v !== undefined) words.push(v); }
  return words;
}

// `const NAME = 'literal'` / `"literal"` only. Deliberately shallow: a declaration this
// census cannot resolve leaves the span exactly where it was, so the failure direction is
// the over-report it already has, not a new blindness.
function constMap(tok) {
  const m = new Map();
  for (let i = 0; i + 3 < tok.length; i++) {
    if (!(tok[i].k === 'id' && (tok[i].v === 'const' || tok[i].v === 'let' || tok[i].v === 'var'))) continue;
    if (tok[i + 1].k !== 'id') continue;
    if (!(tok[i + 2].k === 'punct' && tok[i + 2].v === '=')) continue;
    if (tok[i + 3].k !== 'str' && tok[i + 3].k !== 'tpl') continue;
    m.set(tok[i + 1].v, tok[i + 3].v);
  }
  return m;
}

const HEX = /^[0-9a-f]{7,40}$/;

function classify(words, { crippled }) {
  const sub = words.find((w) => SUBCOMMANDS.has(w));
  const revProducing = sub !== undefined && REVPRODUCING.has(sub);
  const hasReverse = words.includes('--reverse');
  const hasRange = words.some((w) => w.includes('..'));
  const countSel = words.some((w) => /^-\d+$/.test(w) || /^--max-count(=\d+)?$/.test(w) || w === '-n');
  const parentSel = words.some((w) => /\^\d*$/.test(w) || /~\d*$/.test(w));
  const pinned = words.some((w) => HEX.test(w));
  const headOnly = words.some((w) => w === 'HEAD') && !countSel && !parentSel && !hasRange;

  // EVENT is a POST-HOC REFINEMENT, declared as such and not smuggled in. The
  // pre-registration fixed a five-label set before any code existed; hand-reading drive4
  // showed the registered rule mis-keys ONE real shape:
  //     git(['log', '--diff-filter=A', '--format=%H', '-1', '--', p])
  // `--diff-filter=A` selects the commit that ADDED the path — an EVENT, of which there is
  // normally exactly one, so the `-1` is a tie-break and not a recency key. That author got
  // it right and the registered rule calls them defective. Both figures are published: the
  // as-registered count and the refined one. Re-aimed, not loosened.
  // Any diff-filter KIND names an event, not a recency. Found by hand-reading drive5:
  // round394 keys on `--diff-filter=D` — the commit that DELETED the path, the move event.
  // A rule keyed on `=A` alone grades one spelling of the same correct practice.
  const eventSel = words.some((w) => /^--diff-filter=[ADMRCTUXB]/.test(w));

  if (!revProducing) return { label: 'NOTREV', sub: sub ?? null };
  // Declared order, fixed in the pre-registration before this file existed.
  // `!pinned`: a count applied to an explicitly pinned rev is a tie-break over a set of one.
  const recencyAsRegistered = countSel && !crippled && !hasReverse && !pinned
    && !(hasRange && !words.some((w) => /^HEAD\.\./.test(w)));
  if (recencyAsRegistered && eventSel) return { label: 'EVENT', sub, wasRegisteredRecency: true };
  if (recencyAsRegistered) return { label: 'RECENCY', sub };
  if (eventSel) return { label: 'EVENT', sub };
  if (parentSel || (hasReverse && hasRange)) return { label: 'PARENT', sub };
  if (pinned) return { label: 'PINNED', sub };
  if (headOnly) return { label: 'HEADONLY', sub };
  return { label: 'OTHER', sub };
}

// Baseline-consumer leg for P3. FILE-SCOPED, declared in the pre-registration as a CEILING:
// a file that reads `git show <rev>:<path>` somewhere is counted as a consumer even if its
// recency rev is not the one being fed there.
function hasBaselineConsumer(spans) {
  for (const s of spans) {
    const g = gitness(s); if (!g) continue;
    const words = argvWords(g.lits);
    if (!words.includes('show')) continue;
    if (words.some((w) => /\$\{\}\s*:/.test(w) || /:.*\$\{\}/.test(w) || /^\$\{\}:/.test(w))) return true;
  }
  return false;
}

// ------------------------------------------------- population

function population() {
  const names = git('ls-tree', '-r', '--name-only', REV, '--', 'docs/research', 'scripts')
    .split('\n').filter(Boolean).filter((f) => f.endsWith('.mjs'));
  const self = names.filter((f) => f.startsWith(SELF_DIR_REL + '/'));
  const kept = names.filter((f) => !f.startsWith(SELF_DIR_REL + '/'));
  const s1 = kept.filter((f) => /^docs\/research\/unit-[^/]+\//.test(f));
  const s2 = kept.filter((f) => !/^docs\/research\/unit-[^/]+\//.test(f));
  return { s1, s2, selfExcluded: self.length, total: kept.length };
}

function scanSource(src, path) {
  const tok = lex(src);
  const spans = callSpans(tok);
  const consts = constMap(tok);
  const consumer = hasBaselineConsumer(spans);
  const rows = [];
  for (const s of spans) {
    const g = gitness(s); if (!g) continue;
    const idents = s.args.filter((a) => a.k === 'id').map((a) => a.v);
    const words = argvWords(g.lits, idents, consts);
    const c = classify(words, { crippled: CRIPPLE === 'recency-blind' });
    if (c.label === 'NOTREV') continue;
    rows.push({ path, callee: s.callee, at: s.at, words, label: c.label, sub: c.sub, wasRegisteredRecency: c.wasRegisteredRecency === true, viaCallee: g.viaCallee, viaArg: g.viaArg });
  }
  return { rows, consumer };
}

// P4's foil: the adjacency pattern I would have reached for first. Kept here so the claim
// "adjacency misses the KP" is a RUN, not an argument about a regex.
//
// TWO foils, because the first drive refuted P4 and the refutation was MINE. `ADJACENCY_FILE`
// is what I actually registered — a `.test(src)` over the whole file — and it returns TRUE on
// the KP, because the KP's file DEFINES its `git(...)` helper with `execFileSync('git', ...)`
// twenty lines above the call. File-containment is not span-reach. The prediction was about
// whether an adjacency key can IDENTIFY THE SPAN; a file-scoped foil cannot answer that in
// either direction, so as registered P4 is refuted and unfalsifiable at once.
//
// `ADJACENCY_SPAN` is the measurement P4 was reaching for, at the granularity the claim is
// made at: is the RECENCY span's own callee a spawn function? Both are published. The first is
// not deleted — it is the evidence for the defect.
const ADJACENCY_FILE = /(execFileSync|execSync|spawnSync|spawn|exec)\s*\(\s*[`'"]git/;
const SPAWNERS = /(^|\.)(execFileSync|execSync|spawnSync|spawn|exec)$/;
const adjacencySpan = (span) => SPAWNERS.test(span.callee);

// ------------------------------------------------- GKP

const KP = { rev: '0e8bc9ac', path: 'docs/research/unit-464vac-2026-10-31/grade-cure.mjs', want: 'RECENCY' };
const CONTROL = { rev: 'a901f189', path: 'docs/research/unit-464vac-2026-10-31/grade-cure.mjs', wantNot: 'RECENCY', wantReach: 'PARENT' };

function kpLegs() {
  const out = {};
  for (const [name, spec] of [['KP', KP], ['CONTROL', CONTROL]]) {
    const src = git('show', `${spec.rev}:${spec.path}`);
    const { rows } = scanSource(src, spec.path);
    const labels = rows.map((r) => r.label);
    const recRows = rows.filter((r) => r.label === 'RECENCY');
    out[name] = {
      labels, rows,
      adjacencyFile: ADJACENCY_FILE.test(src),
      // span-granular: of this file's RECENCY spans, how many does a spawn-callee key reach?
      adjacencySpanReached: recRows.filter((r) => SPAWNERS.test(r.callee)).length,
      recSpans: recRows.length,
      calleesOfRecSpans: recRows.map((r) => r.callee),
      bytes: Buffer.byteLength(src, 'utf8'),
    };
  }
  const kpHit = out.KP.labels.includes('RECENCY');
  const ctlHit = out.CONTROL.labels.includes('RECENCY');
  const ctlParent = out.CONTROL.labels.includes('PARENT');
  const pass = kpHit && !ctlHit && ctlParent;
  return { ...out, kpHit, ctlHit, ctlParent, pass };
}

// ------------------------------------------------- drive

const kp = kpLegs();
console.log(`cripple:      ${CRIPPLE || '(none)'}`);
console.log(`population rev ${REV.slice(0, 8)}`);
console.log('');
console.log(`GKP  ${kp.pass ? 'ok ' : 'RED'} KP(${KP.rev}) RECENCY=${kp.kpHit} · CONTROL(${CONTROL.rev}) RECENCY=${kp.ctlHit} PARENT=${kp.ctlParent}`);
console.log(`       KP labels      : ${kp.KP.labels.join(',') || '(none)'}   (${kp.KP.bytes}B via Buffer.byteLength)`);
console.log(`       CONTROL labels : ${kp.CONTROL.labels.join(',') || '(none)'}   (${kp.CONTROL.bytes}B via Buffer.byteLength)`);
console.log(`P4a  AS REGISTERED (file-scoped .test(src)): adjacency reaches KP = ${kp.KP.adjacencyFile}`);
console.log(`       -> REFUTES P4 as written. The KP's file defines its \`git()\` helper with`);
console.log(`          execFileSync('git', ...), so file-containment is true while span-reach is not.`);
console.log(`P4b  AT SPAN GRANULARITY: of the KP's ${kp.KP.recSpans} RECENCY span(s), a spawn-callee key`);
console.log(`       reaches ${kp.KP.adjacencySpanReached}; the span extractor reaches ${kp.KP.recSpans}.`);
console.log(`       KP RECENCY callee(s): ${kp.KP.calleesOfRecSpans.join(',') || '(none)'}`);

if (SELFTEST) {
  console.log('');
  console.log(`SELFTEST  ${kp.pass ? 'GKP ok' : 'GKP RED'} — no population figure published from a --selftest drive.`);
  process.exit(kp.pass ? 0 : 1);
}

// GKP gates the FIGURE, not just a printed line: on a RED KP no population number is printed.
if (!kp.pass && CRIPPLE === '') {
  console.log('');
  console.log('REFUSED: GKP RED under the no-cripple arm — the detector cannot separate the');
  console.log('         KP from the cure, so no population figure is published from this drive.');
  process.exit(2);
}

if (CRIPPLE === 'recency-blind') {
  console.log('');
  console.log('*** CRIPPLE ARM — THE POPULATION FIGURES BELOW ARE VACUOUS BY CONSTRUCTION. ***');
  console.log('    `recency-blind` deletes the rule that produces the RECENCY label, so a');
  console.log('    RECENCY count of 0 here is an identity, not a measurement, and must not be');
  console.log('    lifted as one. GCRIPPLE\'s evidence is the KP delta above (RECENCY -> OTHER)');
  console.log('    with the CONTROL unmoved — the cripple perturbs the KEY, not the subject.');
}

const pop = population();
const refusals = [];
const allRows = [];
const consumerFiles = new Set();
const seen = { s1: 0, s2: 0 };

for (const [surface, files] of [['S1', pop.s1], ['S2', pop.s2]]) {
  for (const f of files) {
    let src;
    try { src = git('show', `${REV}:${f}`); } catch (e) { refusals.push({ path: f, surface, why: `unreadable at rev: ${e.message.split('\n')[0]}` }); continue; }
    let r;
    try { r = scanSource(src, f); } catch (e) {
      // GREACH: an unparseable file is a NAMED REFUSAL in the denominator, never a silent skip.
      refusals.push({ path: f, surface, why: `lex/scan threw: ${e.message.split('\n')[0]}` });
      continue;
    }
    seen[surface === 'S1' ? 's1' : 's2']++;
    if (r.consumer) consumerFiles.add(f);
    for (const row of r.rows) allRows.push({ ...row, surface });
  }
}

const by = (surface, label) => allRows.filter((r) => r.surface === surface && r.label === label);
const labels = ['RECENCY', 'EVENT', 'PARENT', 'PINNED', 'HEADONLY', 'OTHER'];

console.log('');
console.log(`GSELF ok  ${pop.selfExcluded} of this unit's own .mjs files excluded from both surfaces`);
console.log(`GREACH ${refusals.length === 0 ? 'ok ' : '!! '} parsed ${seen.s1 + seen.s2} of ${pop.total} · refused ${refusals.length} (named below if any)`);
for (const r of refusals) console.log(`       REFUSED ${r.surface} ${r.path}: ${r.why}`);
console.log('');
console.log(`surface   files  ${labels.map((l) => l.padStart(9)).join('')}`);
for (const [s, files] of [['S1', pop.s1], ['S2', pop.s2]]) {
  console.log(`${s.padEnd(10)}${String(files.length).padStart(5)}  ${labels.map((l) => String(by(s, l).length).padStart(9)).join('')}`);
}

const rec = allRows.filter((r) => r.label === 'RECENCY');
const recFiles = [...new Set(rec.map((r) => r.path))];
const recConsumer = recFiles.filter((f) => consumerFiles.has(f));
// NOT the as-registered figure, and the label that said so was wrong.
//
// The pre-registration's rule produced 12 spans, recorded at `drive4.census.out`. This
// number is computed by the CURED instrument with the EVENT carve-out switched off, so it
// also carries the nested-span and pinned-const repairs. Recomputing an "old" cell with
// cured code gives a hybrid, and the true old cell has to be read off the RECORDING.
const regRec = allRows.filter((r) => r.label === 'RECENCY' || r.wasRegisteredRecency);
console.log('');
console.log(`PRE-REG RULE, as actually recorded : 12 spans / 10 files  <- read from drive4.census.out, NOT recomputed`);
console.log(`PRE-EVENT, post-other-repairs      : ${regRec.length} spans  (a HYBRID: carries the span + pinned repairs)`);
console.log(`REFINED       RECENCY (EVENT carved out)         : ${allRows.filter((r) => r.label === 'RECENCY').length} spans`);
// Named by cause rather than by one cause's spelling: the sentence that said
// "the difference is --diff-filter=A" survived two repairs that changed what the
// difference WAS, and was false on both of them.
const eventDiff = allRows.filter((r) => r.wasRegisteredRecency).length;
console.log(`  the ${regRec.length - allRows.filter((r) => r.label === 'RECENCY').length} difference: ${eventDiff} carved out as EVENT (--diff-filter=<kind>),`);
console.log(`  the rest re-labelled by the pinned-const resolution, which the EVENT rule does not touch`);
console.log('');
console.log(`RECENCY   spans ${rec.length} in ${recFiles.length} files  (S1 ${by('S1', 'RECENCY').length} · S2 ${by('S2', 'RECENCY').length})`);
console.log(`P3        of the ${recFiles.length} RECENCY files, ${recConsumer.length} also contain a \`git show <rev>:<path>\` baseline read`);
console.log(`          ${recConsumer.length * 2 < recFiles.length ? 'UNDER' : 'AT-OR-OVER'} half — registered prediction was UNDER half`);
console.log(`          (file-scoped, declared a CEILING on the defect class, not an estimate)`);
const spawnReached = rec.filter((r) => SPAWNERS.test(r.callee)).length;
console.log(`P4b-pop   of the ${rec.length} RECENCY spans, a spawn-callee adjacency key reaches ${spawnReached};`);
console.log(`          ${rec.length - spawnReached} are wrapped calls an adjacency key cannot identify.`);

console.log('');
console.log('RECENCY spans, every one, S1 first — for the GHAND leg:');
for (const s of ['S1', 'S2']) {
  for (const r of rec.filter((x) => x.surface === s)) {
    const sel = r.words.filter((w) => /^-\d+$/.test(w) || /^--max-count/.test(w) || w === '-n');
    console.log(`  ${s} ${consumerFiles.has(r.path) ? 'CONSUMER' : 'no-consum'} ${r.callee}(${r.sub}) sel=[${sel.join(' ')}] ${r.path}`);
  }
}

writeFileSync(`${HERE}/rec.json`, JSON.stringify({
  rev: REV, cripple: CRIPPLE || null,
  gkp: {
    pass: kp.pass, kpHit: kp.kpHit, ctlHit: kp.ctlHit, ctlParent: kp.ctlParent,
    p4aFileScoped: kp.KP.adjacencyFile, p4bSpanReached: kp.KP.adjacencySpanReached,
    kpRecSpans: kp.KP.recSpans, kpRecCallees: kp.KP.calleesOfRecSpans,
  },
  adjacencySpanCensus: {
    recencySpans: allRows.filter((r) => r.label === 'RECENCY').length,
    reachedBySpawnCallee: allRows.filter((r) => r.label === 'RECENCY' && SPAWNERS.test(r.callee)).length,
  },
  population: { s1: pop.s1.length, s2: pop.s2.length, total: pop.total, selfExcluded: pop.selfExcluded, parsed: seen.s1 + seen.s2 },
  refusals, counts: Object.fromEntries(labels.map((l) => [l, { S1: by('S1', l).length, S2: by('S2', l).length }])),
  recency: { spans: rec.length, files: recFiles, consumerFiles: recConsumer },
  rows: allRows,
}, null, 2) + '\n');

const verdict = kp.pass && refusals.length === 0;
console.log('');
console.log(`CENSUSVERDICT/${verdict ? 0 : 1}  ${verdict ? 'GKP ok, GREACH ok, GSELF ok' : 'see the RED/!! lines above'}`);
process.exit(verdict ? 0 : 1);
