// unit-512matchersubject arm — Theseus, 2026-11-24 START fire.
//
// Population is NOT hand-typed. It is sliced out of Daedalus's own recorded artefact,
// `unit-511readcountname-2026-11-24/captures/POSTHOC-MATCHER.json` → `.matchers`, which is the
// 15-member set his memo's §2 makes its claims about. Grading his claim on a population I retyped
// would grade my typing.
//
// DEVIATION FROM THE PRE-REGISTERED KEY, declared here rather than quietly absorbed:
// the pre-registration resolves a *per-site subject*. 7 of the 15 sites are pattern DEFINITIONS
// (`const TRACKED = /…/`) or object-literal members, so at that line there is no subject at all.
// The resolvable unit is the INSTRUMENT (the file): what gate output does this file consume when
// it runs? That is also the unit the claim is about — "cure R breaks all 15, silently" is a claim
// about what happens when each instrument is next driven. Both levels are reported: the per-file
// provenance (the key that decides), and the per-site line text (so a reader can audit which site
// sits in which file).
//
// Provenance key, applied to each file's own source text:
//   LIVE     — at run time the file obtains gate output derived from the LIVE gate source
//              (`scripts/verify-decl-body-slicers.mjs`): it spawns the gate, or copies that path
//              and spawns the copy. A rename inside the gate reaches this instrument.
//   FROZEN   — the file reads only committed bytes (`.out` captures, baselines, source files) and
//              never produces gate output at run time. A rename cannot reach it.
//   BOTH     — evidence of each.
//   UNRESOLVED — neither kind of evidence found. Printed, never bucketed into FROZEN.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const SRC = 'docs/research/unit-511readcountname-2026-11-24/captures/POSTHOC-MATCHER.json';
const GATE = 'scripts/verify-decl-body-slicers.mjs';
const GATE_BASENAME = 'verify-decl-body-slicers';

const matchers = JSON.parse(readFileSync(`${ROOT}/${SRC}`, 'utf8')).matchers;
const sites = matchers.map((s) => {
  const i = s.lastIndexOf(':');
  return { site: s, file: s.slice(0, i), line: Number(s.slice(i + 1)) };
});

const SPAWN = /\b(spawnSync|execFileSync|execSync|spawn|exec)\s*\(/g;
const READS = /\breadFileSync\s*\(([^)]*)\)/g;

function tracked(p) {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', p], { cwd: ROOT, stdio: 'pipe' });
    return true;
  } catch { return false; }
}

const files = [...new Set(sites.map((s) => s.file))].sort();
const perFile = new Map();

for (const f of files) {
  const text = readFileSync(`${ROOT}/${f}`, 'utf8');
  const lines = text.split('\n');

  // --- LIVE evidence: a spawn/exec whose statement names the gate, or a copy of the gate path.
  const spawnLines = [];
  SPAWN.lastIndex = 0;
  let m;
  while ((m = SPAWN.exec(text)) !== null) {
    const lineNo = text.slice(0, m.index).split('\n').length;
    // the statement: from this line, forward until braces/parens balance or 6 lines, whichever first
    const stmt = lines.slice(lineNo - 1, lineNo + 5).join('\n');
    spawnLines.push({ lineNo, kind: m[1], stmt });
  }
  const namesGate = (s) => s.includes(GATE_BASENAME);
  const gateSpawns = spawnLines.filter((s) => namesGate(s.stmt));
  // a file may spawn a COPY whose path came from a variable; so also record whether the file reads
  // the live gate source at all (copying it in), which makes any spawn in that file gate-derived
  const readsGateSource = text.includes(GATE) || text.includes(GATE_BASENAME);
  const liveEvidence = [];
  for (const s of gateSpawns) liveEvidence.push(`${f}:${s.lineNo} ${s.kind}(…) names ${GATE_BASENAME}`);
  if (liveEvidence.length === 0 && readsGateSource && spawnLines.length > 0) {
    for (const s of spawnLines) liveEvidence.push(`${f}:${s.lineNo} ${s.kind}(…) + file names ${GATE_BASENAME} elsewhere (copy-then-drive candidate)`);
  }

  // --- FROZEN evidence: readFileSync of a tracked path.
  const frozenEvidence = [];
  READS.lastIndex = 0;
  while ((m = READS.exec(text)) !== null) {
    const lineNo = text.slice(0, m.index).split('\n').length;
    const args = m[1];
    // resolve string/template literal fragments in the arg list, plus const bindings they name
    const lits = [...args.matchAll(/['"`]([^'"`]+)['"`]/g)].map((x) => x[1]);
    const idents = [...args.matchAll(/\b([A-Z][A-Z0-9_]{2,})\b/g)].map((x) => x[1]);
    const resolved = [];
    for (const id of idents) {
      const dre = new RegExp(`\\bconst\\s+${id}\\s*=\\s*['"\`]([^'"\`]+)['"\`]`);
      const dm = text.match(dre);
      if (dm) resolved.push(dm[1]);
    }
    const parts = [...resolved, ...lits].filter((p) => !p.includes('utf8'));
    // try every joined candidate path, longest first
    const cands = [];
    for (let i = 0; i < parts.length; i++) {
      for (let k = i; k < parts.length; k++) {
        const joined = parts.slice(i, k + 1).join('/').replace(/\/+/g, '/').replace(/^\//, '');
        if (joined.includes('.')) cands.push(joined);
      }
    }
    const hit = cands.sort((a, b) => b.length - a.length).find((c) => tracked(c));
    frozenEvidence.push({ lineNo, args: args.replace(/\s+/g, ' ').slice(0, 90), path: hit ?? null, tracked: Boolean(hit) });
  }
  const trackedReads = frozenEvidence.filter((e) => e.tracked);

  let verdict;
  if (liveEvidence.length > 0 && trackedReads.length > 0) verdict = 'BOTH';
  else if (liveEvidence.length > 0) verdict = 'LIVE';
  else if (trackedReads.length > 0) verdict = 'FROZEN';
  else verdict = 'UNRESOLVED';

  perFile.set(f, { verdict, liveEvidence, frozenEvidence, trackedReads, nSpawns: spawnLines.length });
}

console.log(`unit-512 arm — provenance of the subject each of Daedalus's 15 matcher sites consumes`);
console.log(`population sliced from ${SRC} → .matchers  (${sites.length} sites, ${files.length} files)\n`);

console.log(`§1  per-instrument provenance`);
for (const f of files) {
  const r = perFile.get(f);
  const mine = sites.filter((s) => s.file === f).map((s) => s.line);
  console.log(`\n  ${r.verdict.padEnd(10)} ${f}`);
  console.log(`      matcher line(s): ${mine.join(', ')}`);
  for (const e of r.liveEvidence) console.log(`      LIVE   : ${e}`);
  for (const e of r.trackedReads) console.log(`      FROZEN : :${e.lineNo} readFileSync → ${e.path} (tracked)`);
  const unres = r.frozenEvidence.filter((e) => !e.tracked);
  for (const e of unres) console.log(`      (read, path not resolved to a tracked file) :${e.lineNo} ${e.args}`);
  if (r.verdict === 'UNRESOLVED') console.log(`      *** UNRESOLVED — ${r.nSpawns} spawn(s), ${r.frozenEvidence.length} read(s), none resolved`);
}

const bySite = sites.map((s) => ({ ...s, verdict: perFile.get(s.file).verdict }));
const tally = {};
for (const s of bySite) tally[s.verdict] = (tally[s.verdict] ?? 0) + 1;

console.log(`\n§2  the figures, at site granularity (his claim's granularity)`);
console.log(`  sites: ${sites.length}   files: ${files.length}`);
console.log(`  tally: ${JSON.stringify(tally)}`);
const breaks = bySite.filter((s) => s.verdict === 'LIVE' || s.verdict === 'BOTH');
const unreached = bySite.filter((s) => s.verdict === 'FROZEN');
console.log(`  sites cure R can reach (LIVE or BOTH): ${breaks.length} of ${sites.length}`);
console.log(`  sites cure R cannot reach (FROZEN)   : ${unreached.length} of ${sites.length}`);
for (const s of unreached) console.log(`      unreachable: ${s.site}`);

console.log(`\n§3  the END-ANCHORED site, named separately because his §2 rests the cure's SHAPE on it`);
const ANCH = 'docs/research/unit-500trackedcomplement-2026-11-22/posthoc-landing-condition.mjs';
const anchSites = bySite.filter((s) => s.file === ANCH);
for (const s of anchSites) console.log(`  ${s.site}  provenance ${s.verdict}`);
const anchCaps = perFile.get(ANCH).trackedReads.map((e) => e.path);
console.log(`  its subjects: ${anchCaps.join(', ')}`);
for (const p of anchCaps) {
  const t = readFileSync(`${ROOT}/${p}`, 'utf8');
  const hasCured = /tracked code file\(s\) in scope/.test(t);
  const readLine = (t.split('\n').find((l) => /tracked files read/.test(l)) ?? '').trimEnd();
  console.log(`    ${p}`);
  console.log(`      bytes ${Buffer.byteLength(t)}   contains the cured scope line: ${hasCured}`);
  console.log(`      its read line: ${JSON.stringify(readLine)}`);
}

const out = { sites: bySite, tally, breaks: breaks.length, unreached: unreached.length, anchSubjects: anchCaps };
process.stdout.write('');
import('node:fs').then(({ writeFileSync }) => {
  writeFileSync(`${ROOT}/docs/research/unit-512matchersubject-2026-11-24/captures/ARM.json`, JSON.stringify(out, null, 1));
});
