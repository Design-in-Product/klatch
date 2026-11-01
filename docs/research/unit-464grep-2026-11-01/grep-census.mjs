// unit-464grep — census of `--grep`-keyed rev selectors on the instrument surface.
//
// The class is Daedalus's 11/01 START §5, which he named and did not census: `--grep` searches
// the WHOLE commit message, so any commit whose body quotes a selector's phrase joins that
// selector's answer set. A memo or log entry ABOUT the defect is such a commit — reporting the
// finding can create it. He cured one instance; this measures the mechanism.
//
// Reader (lexer, call spans, gitness, argv words, const map) is NOT retyped: `lifted-reader.mjs`
// is a byte slice of unit-464rec's census at a literal rev, built and gated by `lift-reader.mjs`.
//
// Population is read with `git show <rev>:<path>` off a stamped rev, never the working tree.
//
// Usage:
//   node grep-census.mjs                      full census
//   node grep-census.mjs --cripple=grep-blind GCRIPPLE arm: delete the rule making the GREP label
//   node grep-census.mjs --selftest           GKP/CONTROL only, no population figure

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { lex, callSpans, gitness, constMap } from './lifted-reader.mjs';

const HERE = dirname(new URL(import.meta.url).pathname);
const REPO = resolve(HERE, '../../..');
const SELF_DIR_REL = 'docs/research/unit-464grep-2026-11-01';
const REV = readFileSync(`${HERE}/baseline.rev`, 'utf8').trim();

const ARGS = process.argv.slice(2);
const CRIPPLE = (ARGS.find((a) => a.startsWith('--cripple=')) ?? '').slice('--cripple='.length);
const SELFTEST = ARGS.includes('--selftest');
const CRIPPLES = new Set(['', 'grep-blind']);
if (!CRIPPLES.has(CRIPPLE)) {
  console.log(`REFUSED: unknown cripple ${JSON.stringify(CRIPPLE)}`);
  process.exit(2);
}

function git(...args) {
  // stdio pinned: a child's stderr echoing into a recording has bitten this track before.
  return execFileSync('git', ['-C', REPO, ...args], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024,
  });
}

// ------------------------------------------------- ordered argv
//
// `argvWords` in the lifted reader appends resolved identifier values AFTER all the literals,
// which is fine for a label but destroys the one thing this census needs: the word that comes
// IMMEDIATELY AFTER `--grep`. So the order-preserving walk is local, and the lifted reader is
// used unmodified for everything else.
//
// Identifiers are emitted only when they resolve in the same-file const map, EXCEPT where one
// directly follows a `--grep` word — there an unresolved name must be visible, because a phrase
// this census cannot resolve has to become a NAMED REFUSAL rather than vanish.
function argvOrdered(span, consts) {
  const out = [];
  for (const a of span.args) {
    if (a.k === 'str' || a.k === 'tpl') {
      if (/^git(\s|$)/.test(a.v) && /\s/.test(a.v)) {
        for (const w of a.v.split(/\s+/).filter(Boolean)) out.push({ k: 'lit', v: w });
        continue;
      }
      out.push({ k: 'lit', v: a.v });
      continue;
    }
    if (a.k === 'id') out.push({ k: 'id', name: a.v, v: consts.get(a.v) });
  }
  return out;
}

const GREP_FLAGS = new Set([
  '-i', '--regexp-ignore-case', '-F', '--fixed-strings', '-E', '--extended-regexp',
  '-P', '--perl-regexp', '--basic-regexp', '--all-match', '--invert-grep',
]);
const COUNT_SEL = (w) => /^-\d+$/.test(w) || /^--max-count(=\d+)?$/.test(w) || w === '-n';

// Why `phrase` can fail to resolve, named rather than silently dropped.
function resolvePhrase(entries, i) {
  const w = entries[i].v;
  if (w.startsWith('--grep=')) {
    const tail = w.slice('--grep='.length);
    if (tail === '') return { why: 'UNRESOLVED-EMPTY' };
    if (tail.includes('${}')) return { why: 'UNRESOLVED-INTERP', raw: tail };
    // A shell-form string split on whitespace cuts a quoted multi-word phrase in half.
    if (/^["']/.test(tail) && !new RegExp(`^${tail[0]}.*${tail[0]}$`).test(tail)) {
      return { why: 'UNRESOLVED-SHELLSPLIT', raw: tail };
    }
    return { phrase: tail.replace(/^(["'])(.*)\1$/, '$2'), form: 'equals' };
  }
  const nxt = entries[i + 1];
  if (!nxt) return { why: 'UNRESOLVED-NOPHRASE' };
  if (nxt.k === 'id') {
    if (nxt.v === undefined) return { why: 'UNRESOLVED-CONST', raw: nxt.name };
    if (nxt.v.includes('${}')) return { why: 'UNRESOLVED-INTERP', raw: `${nxt.name} = ${nxt.v}` };
    return { phrase: nxt.v, form: 'separate-const', via: nxt.name };
  }
  if (nxt.v.includes('${}')) return { why: 'UNRESOLVED-INTERP', raw: nxt.v };
  return { phrase: nxt.v, form: 'separate' };
}

// A GREP site: a rev-producing git span whose argv carries `--grep`.
function grepSitesIn(span, consts) {
  if (CRIPPLE === 'grep-blind') return [];
  const entries = argvOrdered(span, consts);
  const words = entries.filter((e) => e.k === 'lit').map((e) => e.v);
  const sub = words.find((w) => ['log', 'rev-list', 'show', 'rev-parse', 'describe'].includes(w));
  if (sub === undefined) return [];
  const sites = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.k !== 'lit') continue;
    if (e.v !== '--grep' && !e.v.startsWith('--grep=')) continue;
    const r = resolvePhrase(entries, i);
    sites.push({
      sub,
      flags: words.filter((w) => GREP_FLAGS.has(w)),
      countSel: words.filter(COUNT_SEL),
      wide: words.includes('--all'),
      // Named, not reproduced: a per-site rev or pathspec narrows the search and this census
      // does not reconstruct it. Published per site so the limit is visible, not assumed away.
      narrowing: words.filter((w) => w === '--' || /^refs\//.test(w) || /^[0-9a-f]{7,40}$/.test(w) || w === 'HEAD'),
      ...r,
    });
  }
  return sites;
}

// ------------------------------------------------- reproduction

// Key A: the site's own grep semantics (phrase + its own grep flags), scope = `--all` iff the
// site said `--all`. Key B: the same grep semantics over `--all` unconditionally. The two keys
// vary the thing that SELECTS (scope), so agreement between them is a result and not an identity.
function runGrep(phrase, flags, wide) {
  const argv = ['log', ...(wide ? ['--all'] : []), ...flags, `--grep=${phrase}`, '--format=%H'];
  try {
    const out = git(...argv).split('\n').filter(Boolean);
    return { shas: out, n: out.length, argv };
  } catch (e) {
    return { shas: null, n: null, argv, err: e.message.split('\n')[0] };
  }
}

// Subject vs body split. git has no "subject only" grep, so the split is computed in JS from
// the flag mode — an APPROXIMATION of git's engine, and gated as one: a commit git matched that
// the JS tester explains in NEITHER field is named `unexplained`, never bucketed by default.
function makeTester(phrase, flags) {
  const ci = flags.includes('-i') || flags.includes('--regexp-ignore-case');
  if (flags.includes('-F') || flags.includes('--fixed-strings')) {
    const p = ci ? phrase.toLowerCase() : phrase;
    return { fn: (s) => (ci ? s.toLowerCase() : s).includes(p), mode: 'fixed' };
  }
  try {
    const re = new RegExp(phrase, ci ? 'i' : '');
    return { fn: (s) => re.test(s), mode: 'regex' };
  } catch (e) {
    return { fn: null, mode: `UNTESTABLE (${e.message.split('\n')[0]})` };
  }
}

function splitSubjectBody(shas, phrase, flags) {
  const t = makeTester(phrase, flags);
  if (!t.fn) return { subject: null, bodyOnly: null, unexplained: null, mode: t.mode };
  let subject = 0, bodyOnly = 0; const unexplained = [];
  for (const sha of shas) {
    const raw = git('log', '-1', '--format=%s%x00%b', sha);
    const [s, b = ''] = raw.split('\u0000');
    if (t.fn(s)) subject++;
    else if (t.fn(b)) bodyOnly++;
    else unexplained.push(sha.slice(0, 8));
  }
  return { subject, bodyOnly, unexplained, mode: t.mode };
}

const VERDICT = (n) => (n === null ? 'ERROR' : n === 0 ? 'DEAD' : n === 1 ? 'LATENT' : 'STOLEN');

// ------------------------------------------------- scan

function scanSource(src, path) {
  const tok = lex(src);
  const spans = callSpans(tok);
  const consts = constMap(tok);
  const rows = [];
  for (const s of spans) {
    const g = gitness(s);
    if (!g) continue;
    for (const site of grepSitesIn(s, consts)) {
      rows.push({ path, callee: s.callee, at: s.at, ...site });
    }
  }
  // P6 SIGNAL only — the hand map is primary. Does the file mention a throw/exit anywhere? A
  // file-scoped signal cannot settle whether a GUARD covers a SITE, and is published as a
  // signal in those words rather than as the guard measurement.
  const loudSignal = /\bthrow new\b|\bprocess\.exit\(/.test(src);
  return { rows, loudSignal };
}

// ------------------------------------------------- GKP / CONTROL

// KP:      the pre-cure spelling of the very site Daedalus cured. A `--grep=` equals-form.
// CONTROL: a `git log` span in THE SAME FILE with no `--grep` — reached by the extractor,
//          and required NOT to be a GREP site. The two differ only in the keyed property.
const KP = { rev: 'a3cb4cb7', path: 'docs/research/round378-instruments/grade-b3-known-positive.mjs' };

function kpLegs() {
  const src = git('show', `${KP.rev}:${KP.path}`);
  const { rows } = scanSource(src, KP.path);
  // The CONTROL leg is measured on the same source: count rev-producing git spans the reader
  // reaches, so "CONTROL not a GREP site" is distinguishable from "CONTROL not reached at all".
  const tok = lex(src);
  const spans = callSpans(tok);
  let logSpans = 0, nonGrepLogSpans = 0;
  for (const s of spans) {
    const g = gitness(s);
    if (!g) continue;
    const words = g.lits.map((a) => a.v);
    if (!words.includes('log')) continue;
    logSpans++;
    if (!words.some((w) => w === '--grep' || w.startsWith('--grep='))) nonGrepLogSpans++;
  }
  const kpHit = rows.length === 1 && rows[0].phrase !== undefined;
  const controlReached = nonGrepLogSpans >= 1;
  const controlNotGrep = rows.every((r) => !r.phrase || logSpans > 0) && rows.length === 1;
  return {
    src, rows, logSpans, nonGrepLogSpans, kpHit, controlReached, controlNotGrep,
    kpPhrase: rows[0]?.phrase ?? null,
    bytes: Buffer.byteLength(src, 'utf8'),
    pass: kpHit && controlReached && rows.length === 1,
  };
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

// ------------------------------------------------- drive

const kp = kpLegs();
console.log(`cripple:       ${CRIPPLE || '(none)'}`);
console.log(`population rev ${REV.slice(0, 8)}`);
console.log('');
console.log(`GKP  ${kp.pass ? 'ok ' : 'RED'} KP(${KP.rev}) grep sites=${kp.rows.length} phrase=${kp.kpPhrase === null ? '(none)' : JSON.stringify(kp.kpPhrase)}`);
console.log(`CTL  ${kp.controlReached ? 'ok ' : 'RED'} same file: ${kp.logSpans} \`log\` span(s) reached, ${kp.nonGrepLogSpans} carry no --grep and are NOT labelled GREP`);
console.log(`       (${kp.bytes}B via Buffer.byteLength)`);

if (SELFTEST) {
  console.log('');
  console.log(`SELFTEST  ${kp.pass ? 'GKP ok' : 'GKP RED'} — no population figure published from a --selftest drive.`);
  process.exit(kp.pass ? 0 : 1);
}

// GFIG: the refusal is on the FIGURE. On a RED KP under the no-cripple arm nothing is printed
// that could be lifted as a count.
if (!kp.pass && CRIPPLE === '') {
  console.log('');
  console.log('REFUSED: GKP RED under the no-cripple arm — the detector cannot identify the known');
  console.log('         positive, so NO population figure is published from this drive.');
  process.exit(2);
}

if (CRIPPLE === 'grep-blind') {
  console.log('');
  console.log('*** CRIPPLE ARM — THE POPULATION FIGURES BELOW ARE VACUOUS BY CONSTRUCTION. ***');
  console.log('    `grep-blind` deletes the rule that produces a GREP site, so a site count of 0');
  console.log('    here is an identity, not a measurement, and must not be lifted as one.');
  console.log('    GCRIPPLE\'s evidence is the KP delta above with the CONTROL unmoved — the');
  console.log('    cripple perturbs the KEY, not the subject.');
}

const pop = population();
const refusals = [];
const allRows = [];
const loudFiles = new Set();
const seen = { S1: 0, S2: 0 };

for (const [surface, files] of [['S1', pop.s1], ['S2', pop.s2]]) {
  for (const f of files) {
    let src;
    try { src = git('show', `${REV}:${f}`); } catch (e) {
      refusals.push({ path: f, surface, why: `unreadable at rev: ${e.message.split('\n')[0]}` });
      continue;
    }
    let r;
    try { r = scanSource(src, f); } catch (e) {
      refusals.push({ path: f, surface, why: `lex/scan threw: ${e.message.split('\n')[0]}` });
      continue;
    }
    seen[surface]++;
    if (r.loudSignal) loudFiles.add(f);
    for (const row of r.rows) allRows.push({ ...row, surface });
  }
}

console.log('');
const selfVacuous = pop.selfExcluded === 0;
console.log(`GSELF ${selfVacuous ? 'VACUOUS' : 'ok     '} ${pop.selfExcluded} of this unit's own .mjs excluded from both surfaces`);
if (selfVacuous) {
  console.log(`        VACUOUS: the population rev ${REV.slice(0, 8)} predates this directory, so the`);
  console.log('        exclusion rule is untested by this drive. Not counted green.');
}
console.log(`GREACH ${refusals.length === 0 ? 'ok ' : '!! '} parsed ${seen.S1 + seen.S2} of ${pop.total} · refused ${refusals.length} (each named below if any)`);
for (const r of refusals) console.log(`       REFUSED ${r.surface} ${r.path}: ${r.why}`);

console.log('');
console.log(`GREP sites: ${allRows.length} in ${new Set(allRows.map((r) => r.path)).size} file(s)  (S1 ${allRows.filter((r) => r.surface === 'S1').length} · S2 ${allRows.filter((r) => r.surface === 'S2').length})`);

// ------------------------------------------------- per-site measurement

const measured = [];
for (const row of allRows) {
  if (row.phrase === undefined) {
    measured.push({ ...row, verdict: row.why, keyA: null, keyB: null, split: null });
    continue;
  }
  const a = runGrep(row.phrase, row.flags, row.wide);
  const b = row.wide ? a : runGrep(row.phrase, row.flags, true);
  const split = a.shas ? splitSubjectBody(a.shas, row.phrase, row.flags) : null;
  measured.push({ ...row, keyA: a, keyB: b, split, verdict: VERDICT(a.n) });
}

console.log('');
console.log('Per-site, every one — this is the GHAND surface:');
console.log('');
for (const m of measured) {
  const loc = `${m.surface} ${m.path}@${m.at}`;
  console.log(`  ${m.verdict.padEnd(22)} ${loc}`);
  console.log(`      callee=${m.callee}(${m.sub})  form=${m.form ?? '-'}  flags=[${m.flags.join(' ')}]  count-sel=[${m.countSel.join(' ')}]  --all=${m.wide}`);
  if (m.phrase === undefined) {
    console.log(`      phrase UNRESOLVED (${m.why})${m.raw ? `: ${JSON.stringify(m.raw)}` : ''}`);
    continue;
  }
  console.log(`      phrase=${JSON.stringify(m.phrase)}`);
  console.log(`      key A (site's own grep flags, --all=${m.wide}) n=${m.keyA.n}${m.keyA.err ? ` ERR ${m.keyA.err}` : ''}`);
  console.log(`      key B (same flags, --all forced)              n=${m.keyB.n}${m.keyB.err ? ` ERR ${m.keyB.err}` : ''}`);
  if (m.split) {
    console.log(`      of key A's ${m.keyA.n}: subject-match ${m.split.subject} · BODY-ONLY ${m.split.bodyOnly} · unexplained ${m.split.unexplained === null ? '(tester ' + m.split.mode + ')' : m.split.unexplained.length}${m.split.unexplained && m.split.unexplained.length ? ' = ' + m.split.unexplained.join(',') : ''}  [tester ${m.split.mode}]`);
  }
  console.log(`      silently-stealable: ${m.countSel.length > 0 ? 'YES — a count selector takes one of the matches' : 'no count selector; a steal widens a list instead'}`);
  console.log(`      narrowing args present and NOT reproduced by key A: [${m.narrowing.join(' ')}]`);
  console.log(`      P6 file-scoped loud SIGNAL (throw/exit anywhere in file): ${loudFiles.has(m.path)}`);
}

// ------------------------------------------------- figures

const resolved = measured.filter((m) => m.phrase !== undefined);
const unresolved = measured.filter((m) => m.phrase === undefined);
const dead = resolved.filter((m) => m.verdict === 'DEAD');
const latent = resolved.filter((m) => m.verdict === 'LATENT');
const stolen = resolved.filter((m) => m.verdict === 'STOLEN');
const silently = resolved.filter((m) => m.countSel.length > 0);
const bodyOnlyFired = resolved.filter((m) => m.split && m.split.bodyOnly > 0);
const unexplainedRows = resolved.filter((m) => m.split && m.split.unexplained && m.split.unexplained.length > 0);
const keysDisagree = resolved.filter((m) => m.keyA.n !== m.keyB.n);

console.log('');
console.log('FIGURES');
console.log(`  sites                       ${measured.length}`);
console.log(`  resolved / unresolved       ${resolved.length} / ${unresolved.length}`);
console.log(`  DEAD / LATENT / STOLEN      ${dead.length} / ${latent.length} / ${stolen.length}`);
console.log(`  with a count selector       ${silently.length}  (a steal silently changes the answer)`);
console.log(`  BODY-ONLY match present     ${bodyOnlyFired.length}  (the steal mechanism having actually fired)`);
console.log(`  key A vs key B disagree     ${keysDisagree.length}  (scope is doing work)`);
console.log(`  GSUBJ unexplained rows      ${unexplainedRows.length}  (git matched, JS tester explained neither field)`);

writeFileSync(`${HERE}/grep.json`, JSON.stringify({
  rev: REV, cripple: CRIPPLE || null,
  gkp: { pass: kp.pass, kpHit: kp.kpHit, sites: kp.rows.length, logSpans: kp.logSpans, nonGrepLogSpans: kp.nonGrepLogSpans, kpPhrase: kp.kpPhrase },
  population: { s1: pop.s1.length, s2: pop.s2.length, total: pop.total, selfExcluded: pop.selfExcluded, parsed: seen.S1 + seen.S2, selfVacuous },
  refusals,
  figures: {
    sites: measured.length, resolved: resolved.length, unresolved: unresolved.length,
    dead: dead.length, latent: latent.length, stolen: stolen.length,
    withCountSelector: silently.length, bodyOnlyFired: bodyOnlyFired.length,
    keysDisagree: keysDisagree.length, unexplained: unexplainedRows.length,
  },
  sites: measured.map((m) => ({
    surface: m.surface, path: m.path, at: m.at, callee: m.callee, sub: m.sub, form: m.form ?? null,
    phrase: m.phrase ?? null, why: m.why ?? null, flags: m.flags, countSel: m.countSel, wide: m.wide,
    narrowing: m.narrowing, verdict: m.verdict,
    keyA: m.keyA ? { n: m.keyA.n, argv: m.keyA.argv, shas: m.keyA.shas } : null,
    keyB: m.keyB ? { n: m.keyB.n } : null,
    split: m.split, loudSignal: loudFiles.has(m.path),
  })),
}, null, 2) + '\n');

const verdict = kp.pass && refusals.length === 0 && unexplainedRows.length === 0 && !selfVacuous;
console.log('');
console.log(`GREPVERDICT/${verdict ? 0 : 1}  ${verdict ? 'GKP ok, CTL ok, GREACH ok, GSELF ok, GSUBJ ok' : 'see the RED / !! / VACUOUS lines above'}`);
process.exit(verdict ? 0 : 1);
