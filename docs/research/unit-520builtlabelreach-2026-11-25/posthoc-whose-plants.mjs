/* unit-520builtlabelreach — POST-HOC. Labelled as the post-hoc wherever it is quoted.
 *
 * Grades PH1–PH4 of PRE-REGISTRATION-ADDENDUM-WHOSE-PLANTS.md, registered and pushed (db630b42)
 * before this file existed.
 *
 * The three gain sites are READ OUT OF THE ARM'S OWN CAPTURE, not retyped — the capture is the
 * record of the drive, and a hand-typed site list would be a second measurement wearing the first
 * one's name.
 *
 * The CONSUMER bucket is reached by fall-through, so it is KP'd with a planted cell that MUST key
 * CONSUMER before "0 of 3 are consumers" is allowed to mean anything. A terminal bucket nothing can
 * reach absorbs every blindness.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

process.chdir(execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim());

const UNIT = 'docs/research/unit-520builtlabelreach-2026-11-25';
const CAPTURE = `${UNIT}/captures/ARM.out`;
const PUBLISHED_COMMIT = 'c99d1d91';        // unit-516's re-drive commit, its 636-of-639 reading
const UNIT_PATH_RE = /^docs\/research\/unit-[^/]+\//;

const say = (...a) => console.log(...a);
const out = {};

/* ============================================= §0 the arm's own capture, parsed not retyped */

say('=== §0 the three sites come out of the arm capture ===\n');
const cap = readFileSync(CAPTURE, 'utf8');
const jsonLine = cap.split('\n').find((l) => l.startsWith('JSON '));
const armOut = jsonLine ? JSON.parse(jsonLine.slice(5)) : null;
const LABEL = armOut?.provenance?.label ?? null;
const gainSites = armOut?.census?.gainSites ?? null;
const siteCount = armOut?.census?.builtLabelSites ?? null;
const popArm = armOut?.census?.population ?? null;
say(`  capture: ${CAPTURE}  ${cap.length} B`);
say(`  LABEL as the arm extracted it: ${JSON.stringify(LABEL)}`);
say(`  gain files: ${gainSites ? gainSites.length : '(PARSE FAILED)'}   sites: ${siteCount}   population: ${popArm}`);
if (!LABEL || !gainSites || siteCount === null) { say('\n  ABORT — the capture did not parse.'); process.exit(1); }

const flat = [];
for (const g of gainSites) for (const h of g.hits) flat.push({ file: g.file, line: h.line });
say(`  flattened to ${flat.length} site(s); the arm published ${siteCount} — ${flat.length === siteCount ? 'agree' : 'DISAGREE, the parse is wrong'}`);
if (flat.length !== siteCount) process.exit(1);

/* ============================================= §1 the class key, ordered and KP'd */

/* Both flags are reported for every site, not only the winning class: an ordered key's resolved
 * cell hides which conditions were true. PROSE is tested first; the order is declared here. */
const QUOTES = new Set(["'", '"', '`']);
const isProse = (line) => /^\s*(\*|\/\/|\/\*)/.test(line);
/* NESTED-LITERAL, unit-516 §5's signature: a quote character between the enclosing quoted run's own
 * opening delimiter and the label fragment. Scanned over the RAW line with a one-char state. */
const FRAG = 'tracked';
const isNested = (line) => {
  const li = line.indexOf(FRAG);
  if (li === -1) return null;                       // the fragment is not on this line
  let delim = null, openAt = -1;
  for (let i = 0; i < li; i += 1) {
    const c = line[i];
    if (delim === null && QUOTES.has(c)) { delim = c; openAt = i; }
    else if (delim !== null && c === delim && line[i - 1] !== '\\') { delim = null; openAt = -1; }
  }
  if (delim === null) return false;                 // the label is not inside a quoted run at all
  for (let i = openAt + 1; i < li; i += 1) if (QUOTES.has(line[i])) return true;
  return false;
};
const classify = (line) => {
  const prose = isProse(line);
  const nested = isNested(line);
  const cls = prose ? 'PROSE' : nested === true ? 'PLANT' : 'CONSUMER';
  return { prose, nested, cls };
};

say('\n=== §1 KP of the class key — CONSUMER is a fall-through bucket, so it is reached on purpose ===\n');
const kp = [
  { id: 'K1', want: 'CONSUMER', note: 'a built label as a PLAIN own-line argument — the bucket must be reachable', cell: "      read: num(out, 'tracked files ' + 'read:')," },
  { id: 'K2', want: 'PLANT', note: 'the built label inside an outer template literal (a fixture body)', cell: "const f = `const v = num('tracked files ' + 'read:');`;" },
  { id: 'K3', want: 'PROSE', note: 'a docblock line writing about the form', cell: " * built as ('tracked files ' + 'read:') is NOT matched" },
  { id: 'K4', want: 'CONSUMER', note: 'a WHOLE-literal consumer, for contrast: not nested, not prose', cell: "      read: num(out, 'tracked files read:')," },
].map((k) => { const c = classify(k.cell); return { ...k, ...c, ok: c.cls === k.want }; });
for (const k of kp) say(`  ${k.id}  want ${k.want.padEnd(8)} got ${k.cls.padEnd(8)} prose=${k.prose} nested=${k.nested}  ${k.ok ? 'PASS' : 'FAIL'}   ${k.note}`);
const kpOk = kp.every((k) => k.ok);
say(`\n  class-key KP: ${kp.filter((k) => k.ok).length} of 4 → ${kpOk ? 'the key may be pointed at the three sites' : 'ABORT'}`);
if (!kpOk) process.exit(1);
out.classKeyKp = kp;

/* ============================================= §2 PH1 — the three sites, keyed */

say('\n=== §2 PH1 — the three sites, keyed mechanically ===\n');
const keyed = flat.map((s) => {
  const line = readFileSync(s.file, 'utf8').split('\n')[s.line - 1] ?? '';
  return { ...s, text: line.trim().slice(0, 160), ...classify(line), inUnitDir: UNIT_PATH_RE.test(s.file) };
});
for (const k of keyed) {
  say(`  ${k.cls.padEnd(8)} prose=${String(k.prose).padEnd(5)} nested=${String(k.nested).padEnd(5)} unit-dir=${k.inUnitDir}   ${k.file}:${k.line}`);
  say(`           ${k.text}`);
}
const consumers = keyed.filter((k) => k.cls === 'CONSUMER').length;
const inUnit = keyed.filter((k) => k.inUnitDir).length;
say(`\n  PH1a: ${consumers} of ${keyed.length} key as CONSUMER`);
say(`  PH1b: ${inUnit} of ${keyed.length} sit under docs/research/unit-*/`);
out.ph1 = { keyed, consumers, inUnit };

/* ============================================= §3 PH2 — the drift, named, with a KP'd oracle */

say('\n=== §3 PH2 — the 7-file population drift, named file by file ===\n');
const existedAt = (p) => {
  try { execFileSync('git', ['cat-file', '-e', `${PUBLISHED_COMMIT}:${p}`], { stdio: 'ignore' }); return true; }
  catch { return false; }
};
/* The oracle is KP'd in BOTH directions first: an oracle that answers "absent" for everything
 * would hand me PH2 for free. */
const oracleKp = [
  { p: 'docs/research/unit-514equalityconsumer-2026-11-24/arm-equalityconsumer.mjs', want: true },
  { p: 'docs/research/unit-520builtlabelreach-2026-11-25/arm-builtlabelreach.mjs', want: false },
  { p: 'docs/research/unit-516secondargfixture-2026-11-25/arm-secondargfixture.mjs', want: true },
].map((k) => { const got = existedAt(k.p); return { ...k, got, ok: got === k.want }; });
for (const k of oracleKp) say(`  oracle KP  want ${String(k.want).padEnd(5)} got ${String(k.got).padEnd(5)} ${k.ok ? 'PASS' : 'FAIL'}   ${k.p}`);
const oracleOk = oracleKp.every((k) => k.ok) && oracleKp.some((k) => k.want) && oracleKp.some((k) => !k.want);
say(`  oracle KP'd in both directions: ${oracleOk}`);
if (!oracleOk) { say('  ABORT — the novelty oracle is not graded.'); process.exit(1); }

const extRe = new RegExp(armOut.provenance.armFilterLiteral.slice(1, armOut.provenance.armFilterLiteral.lastIndexOf('/')));
const SELF_ARM = `${UNIT}/arm-builtlabelreach.mjs`;
const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\n').filter((p) => extRe.test(p));
const popNow = tracked.filter((p) => p !== SELF_ARM && !p.startsWith(`${UNIT}/`));
const added = popNow.filter((p) => !existedAt(p));
say(`\n  population now, this unit's own files excluded: ${popNow.length}`);
say(`  of those, absent at ${PUBLISHED_COMMIT}: ${added.length}`);
for (const p of added) {
  const author = execFileSync('git', ['log', '--diff-filter=A', '--format=%an', '-1', '--', p], { encoding: 'utf8' }).trim();
  say(`    + ${p}   ${author || '(no add commit found)'}`);
}
const thisThread = added.filter((p) => /unit-51[789]/.test(p)).length;
say(`\n  PH2: ${thisThread} of ${added.length} added file(s) are units 517–519 — this thread's own instruments`);
out.ph2 = { populationNow: popNow.length, added, addedCount: added.length, thisThread };

/* ============================================= §4 PH3 — reach restricted to the old population */

say('\n=== §4 PH3 — the reach, restricted to files that existed at the published commit ===\n');
const oldPop = popNow.filter((p) => existedAt(p));
const JOINT = /(['"`])\s*\+\s*(['"`])/g;
const countOcc = (s, n) => { let c = 0; for (let i = s.indexOf(n); i !== -1; i = s.indexOf(n, i + 1)) c += 1; return c; };
let oldSites = 0; const oldFiles = [];
for (const p of oldPop) {
  const src = readFileSync(p, 'utf8');
  const gain = countOcc(src.replace(JOINT, ''), LABEL) - countOcc(src, LABEL);
  if (gain > 0) {
    const lines = src.split('\n');
    let n = 0;
    for (const l of lines) if (countOcc(l.replace(JOINT, ''), LABEL) - countOcc(l, LABEL) > 0) n += 1;
    oldSites += n; oldFiles.push(`${p} (${n})`);
  }
}
say(`  files in the old population: ${oldPop.length}`);
say(`  built-label sites among them: ${oldSites}   files: ${oldFiles.join('  ') || 'none'}`);
say(`\n  PH3: ${oldSites} against the arm's ${siteCount} → ${oldSites === siteCount ? 'the reach is NOT an artefact of the drift' : 'part of the 3 is drift'}`);
out.ph3 = { oldPop: oldPop.length, oldSites, oldFiles };

/* ============================================= §5 PH4 — disjointness, as far as it can be graded */

say('\n=== §5 PH4 — is the gain disjoint from the published 22? ===\n');
say('  unit-516 §6 publishes PER-UNIT COUNTS, not a line list: 5 unit-513consumernull, 3 unit-514equalityconsumer.');
say('  A count cannot say which lines, so this is graded only as far as that table can grade it.');
const perUnit = {};
for (const k of keyed) {
  const m = k.file.match(/^docs\/research\/(unit-[^/]+)\//);
  const u = m ? m[1] : '(outside)';
  perUnit[u] = (perUnit[u] ?? 0) + 1;
}
say(`\n  this unit's gain sites per unit: ${Object.entries(perUnit).map(([u, n]) => `${u} ${n}`).join('  ')}`);
say('  DECLARED RESIDUAL: whether any of the three coincides with one of the published own-line');
say('  consumer rows cannot be settled from a count. It is NOT claimed either way. What CAN be said');
say('  mechanically is that a published own-line consumer row required the label to be found by the');
say("  region-aware key, and the key's own precondition is a WHOLE literal — which none of these");
say('  three lines has. That is an argument from the key, not a row-level comparison, and it is');
say('  labelled as such.');
const wholeLiteral = keyed.map((k) => ({ file: `${k.file}:${k.line}`, containsWholeLabel: readFileSync(k.file, 'utf8').split('\n')[k.line - 1].includes(LABEL) }));
for (const w of wholeLiteral) say(`    ${w.file}  contains the whole label in one unbroken run: ${w.containsWholeLabel}`);
out.ph4 = { perUnit, wholeLiteral };

/* ============================================= §6 verdicts */

say('\n=== §6 POST-HOC VERDICTS ===\n');
const V = [];
const g = (id, v, n) => { V.push({ id, verdict: v, note: n }); say(`  ${id.padEnd(5)} ${v.padEnd(8)} ${n}`); };
g('PH1a', consumers === 0 ? 'HIT' : 'REFUTED', `${consumers} of ${keyed.length} key as CONSUMER (registered 0), with the bucket KP'd reachable`);
g('PH1b', inUnit === keyed.length ? 'HIT' : 'REFUTED', `${inUnit} of ${keyed.length} under docs/research/unit-*/`);
g('PH1c', consumers === 0 ? 'HIT' : 'REFUTED', 'the declaration of the blindness created its own census population — every built label in the tree is a plant of it or a line about it');
g('PH2', thisThread >= 5 ? 'HIT' : 'REFUTED', `${thisThread} of ${added.length} added files are units 517–519 (registered ≥5)`);
g('PH3', oldSites === siteCount ? 'HIT' : 'REFUTED', `${oldSites} sites in the old population against ${siteCount} now (registered equal)`);
g('PH4', 'PARTIAL', `graded only to the granularity the published table allows; ${wholeLiteral.filter((w) => !w.containsWholeLabel).length} of ${wholeLiteral.length} gain lines contain no whole-literal label, so none could have been found by the region-aware key`);
say(`\n  ${V.filter((v) => v.verdict === 'HIT').length} HIT · ${V.filter((v) => v.verdict === 'REFUTED').length} REFUTED · ${V.filter((v) => v.verdict === 'PARTIAL').length} PARTIAL of ${V.length}`);
out.verdicts = V;
say(`\nJSON ${JSON.stringify(out)}`);
