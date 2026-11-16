/**
 * unit-467rawjson — arm A
 *
 * Subject: **step 1's declared limit.** `--list` counts the 12 `model` probes without naming them,
 * so `12 + 6 = 18` was not assertable. See PRE-REGISTRATION.md (`43ea780b`), pushed before this
 * file existed.
 *
 * The naming comes from the instrument's own per-site listing (`promote-probes.mts:761-766`), which
 * fires only under `--only`. `--only probe` is a no-op filter because `population()` is
 * `/^probe-/`-keyed — C1 verifies that empirically rather than resting on the read. `DEFERRED` is
 * imported from `sweep-probes.mjs`, the instrument's own list, so R3 is not a hand key either.
 *
 * `scripts/promote-probes.mts` is READ, never edited. R4 asserts that.
 */

import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const PIN = '1f675ebf76eb283cec6ee97294ba782b6b147678';

const legs = [];
const red = [];
const refused = [];
function leg(id, ok, detail) {
  legs.push(id);
  if (ok === null) refused.push(id);
  else if (!ok) red.push(id);
  console.log(`${ok === null ? 'REF' : ok ? 'ok ' : 'RED'} ${id.padEnd(9)} ${detail}`);
}
const preds = [];
const refuted = [];
const prefused = [];
function pred(id, held, detail) {
  preds.push(id);
  if (held === null) prefused.push(id);
  else if (!held) refuted.push(id);
  console.log(`${held === null ? 'OPEN   ' : held ? 'LANDED ' : 'REFUTED'} ${id.padEnd(4)} ${detail}`);
}

const git = (...a) => execFileSync('git', ['-C', ROOT, ...a], { encoding: 'utf8' });

// ── the instrument's own DEFERRED list, imported not re-derived (R3's source)
const { DEFERRED, SWEPT } = await import(join(ROOT, 'scripts', 'sweep-probes.mjs'));

/** Run the instrument. Exit code captured, never swallowed — R2 grades it. */
function runList(extra) {
  const argv = ['tsx', 'scripts/promote-probes.mts', '--list', ...extra];
  try {
    const out = execFileSync('npx', argv, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return { code: 0, out };
  } catch (e) {
    // A non-zero exit still carries the stdout we need; `--list` exits 2 when nothing is drivable.
    return { code: e.status ?? -1, out: e.stdout ?? '' };
  }
}

/**
 * Parse the report. Bucket members are the `    · <file> — <site>` lines that FOLLOW a
 * `  not driven (k): N` header, up to the next two-space-indented line. Deliberately keyed on the
 * instrument's exact emitted shape (lines 755 and 764) rather than on a loose containment match,
 * so a format change reddens R1 instead of silently producing an empty bucket.
 */
function parse(out) {
  const header = /^promote-probes — (\d+) probe files · (\d+) SWEPT · (\d+) DEFERRED$/m.exec(out);
  const counts = new Map();
  const members = new Map();
  const inadmissible = [];
  let bucket = null;
  for (const line of out.split('\n')) {
    const h = /^ {2}not driven \(([a-z]+)\): (\d+)$/.exec(line);
    if (h) {
      bucket = h[1];
      counts.set(h[1], Number(h[2]));
      members.set(h[1], []);
      continue;
    }
    const m = /^ {4}· (\S+) — (.*)$/.exec(line);
    if (m && bucket) {
      members.get(bucket).push({ file: m[1], site: m[2] });
      continue;
    }
    const ina = /^ {2}INADMISSIBLE \(spawn closure, not own source\): (\S+) — (.*)$/.exec(line);
    if (ina) {
      inadmissible.push({ file: ina[1], why: ina[2] });
      bucket = null;
      continue;
    }
    // Any other two-space-indented report line closes the current bucket.
    if (/^ {2}\S/.test(line)) bucket = null;
  }
  return {
    files: header ? Number(header[1]) : null,
    swept: header ? Number(header[2]) : null,
    deferred: header ? Number(header[3]) : null,
    counts,
    members,
    inadmissible,
  };
}

console.log(`unit-467rawjson arm A — pin ${PIN}`);
console.log(`HEAD now: ${git('rev-parse', 'HEAD').trim()}`);
console.log('');

const bare = runList([]);
const only = runList(['--only', 'probe']);
const B = parse(bare.out);
const O = parse(only.out);

// ── R2 — exit codes. `--list` documents `process.exit(drivable.length ? 0 : 2)`; 0 and 2 are the
// only admissible values and anything else is an instrument/arm defect, not a finding.
leg('R2', [0, 2].includes(bare.code) && [0, 2].includes(only.code),
  `exit codes: bare=${bare.code}, --only probe=${only.code} (admissible: 0 or 2)`);

// ── C2 (REPRO, no predictive credit) — step 1's published figures, quoted as frozen strings
const PUB = { files: 155, swept: 45, deferred: 110, db: 81, net: 55, homedir: 29, model: 12, suite: 12 };
const reproHeader = B.files === PUB.files && B.swept === PUB.swept && B.deferred === PUB.deferred;
const reproBuckets = Object.entries(PUB)
  .filter(([k]) => !['files', 'swept', 'deferred'].includes(k))
  .every(([k, v]) => B.counts.get(k) === v);
leg('C2', reproHeader && reproBuckets,
  `repro of step 1 (155/45/110 · db81 net55 homedir29 model12 suite12): ` +
  `got ${B.files}/${B.swept}/${B.deferred} · ` +
  [...B.counts].map(([k, v]) => `${k}${v}`).join(' ') +
  `${reproHeader && reproBuckets ? '' : ' — TREE MOVED, the 12 below is not step 1\'s 12'}`);

// ── C1 — `--only probe` filters nothing, so the per-site listing is a COMPLETE naming
const sameHeader = B.files === O.files && B.swept === O.swept && B.deferred === O.deferred;
const bucketDiffs = [...B.counts].filter(([k, v]) => O.counts.get(k) !== v).map(([k, v]) => `${k}: ${v}→${O.counts.get(k)}`);
leg('C1', sameHeader && bucketDiffs.length === 0,
  `--only probe vs bare: header ${sameHeader ? 'identical' : 'DIFFERS'}, ` +
  `bucket diffs ${bucketDiffs.length ? JSON.stringify(bucketDiffs) : 'none'} — ` +
  `${sameHeader && bucketDiffs.length === 0 ? 'the listing names every member' : 'the listing is PARTIAL and the names below are a subset'}`);

const model = O.members.get('model') ?? [];

// ── R1 — per-site lines under each bucket must equal that bucket's own printed count
const r1 = [...O.counts].filter(([k, v]) => (O.members.get(k) ?? []).length !== v).map(([k, v]) => `${k}: count=${v} listed=${(O.members.get(k) ?? []).length}`);
leg('R1', r1.length === 0,
  `listed-vs-counted per bucket: ${r1.length ? JSON.stringify(r1) : 'all agree'} ` +
  `(model: count=${O.counts.get('model')} listed=${model.length})`);

// ── R3 — every named member is in the instrument's own DEFERRED list
const notDeferred = model.map((m) => m.file).filter((f) => !DEFERRED.includes(f));
leg('R3', notDeferred.length === 0,
  `model members absent from sweep-probes DEFERRED: ${notDeferred.length ? JSON.stringify(notDeferred) : 'none'} ` +
  `(DEFERRED has ${DEFERRED.length}, SWEPT ${SWEPT.length})`);

// ── A4 — the INADMISSIBLE set this run reports, as names
const inaFiles = O.inadmissible.map((i) => i.file);
leg('A4', inaFiles.length > 0, `INADMISSIBLE reported this run: ${inaFiles.length}`);

console.log('');
console.log('── the model bucket, named (the 12) ──');
for (const m of model) console.log(`  ${m.file}\n      ${m.site}`);
console.log('');
console.log('── INADMISSIBLE (spawn closure), named ──');
for (const i of O.inadmissible) console.log(`  ${i.file}\n      ${i.why}`);
console.log('');

// ── P1 — is 12 + 6 = 18 false by overlap?
const SIX_FROM_STEP1 = [
  'probe-path-c-chat-binding-live.mts',
  'probe-round162-preamble-drop-and-roster-live.mts',
  'probe-round164-layer5-terminality-live.mts',
  'probe-round166-terminal-floor-live.mts',
  'probe-round167-floor-report-live.mts',
  'probe-round213-reassign-live-http.mts',
];
const modelFiles = new Set(model.map((m) => m.file));
const overlapStep1 = SIX_FROM_STEP1.filter((f) => modelFiles.has(f));
const overlapLive = inaFiles.filter((f) => modelFiles.has(f));
// Step 1's six are quoted; this run's INADMISSIBLE set is measured. Both intersections are reported
// so a change in the INADMISSIBLE population since step 1 cannot hide inside the answer.
leg('A5', true,
  `step1's six still INADMISSIBLE this run: ${SIX_FROM_STEP1.filter((f) => inaFiles.includes(f)).length}/6; ` +
  `this run's INADMISSIBLE set size ${inaFiles.length}`);

console.log('');
pred('P1', overlapStep1.length >= 1,
  `overlap(step1's six, the 12) = ${overlapStep1.length} ${JSON.stringify(overlapStep1)}; ` +
  `overlap(this run's INADMISSIBLE, the 12) = ${overlapLive.length} ${JSON.stringify(overlapLive)}. ` +
  `${overlapStep1.length >= 1
    ? `12 + 6 = 18 is FALSE by overlap — the live-call population is at most ${model.length + inaFiles.length - overlapLive.length}.`
    : `the two sets are disjoint, so 12 + ${inaFiles.length} = ${model.length + inaFiles.length} IS assertable, and step 1's "inherit rather than own" holds.`}`);

const R230 = 'probe-round230-a-killed-probe-must-not-leave-its-server.mts';
pred('P2', modelFiles.has(R230),
  `${R230} in the 12: ${modelFiles.has(R230)}` +
  (modelFiles.has(R230) ? '' : ` — it is ${SWEPT.map((s) => s.file).includes(R230) ? 'SWEPT' : DEFERRED.includes(R230) ? 'DEFERRED but not model-hazardous' : 'NOT IN THE POPULATION'}`));

const nonLive = model.map((m) => m.file).filter((f) => !/-live\.mts$/.test(f));
pred('P3', nonLive.length >= 1,
  `of the ${model.length}, ${nonLive.length} do NOT end "-live.mts": ${JSON.stringify(nonLive)}. ` +
  `${nonLive.length >= 1 ? 'A writer keyed on the filename suffix would miss these.' : 'The suffix happens to be a sound key at this pin.'}`);

const unsited = model.filter((m) => /no single line matched/.test(m.site));
pred('P4', unsited.length === 0,
  `members with no named site: ${unsited.length} ${JSON.stringify(unsited.map((m) => m.file))}`);

// ── P5 — which branch of the three-way alternation fired, per member
const BRANCH = {
  'ANTHROPIC_API_KEY': /\bANTHROPIC_API_KEY\b/,
  'messages.create': /\bmessages\s*\.\s*create\b/,
  'Anthropic': /\bAnthropic\b/,
};
const byBranch = { 'ANTHROPIC_API_KEY': [], 'messages.create': [], 'Anthropic': [], '(none — site text did not re-match)': [] };
for (const m of model) {
  const hits = Object.entries(BRANCH).filter(([, re]) => re.test(m.site)).map(([k]) => k);
  // `Anthropic` is a substring of nothing in the other two branches as written, but
  // ANTHROPIC_API_KEY lines can carry `Anthropic` elsewhere on the line. Attribution is
  // "every branch that matches this site line", not "the first", so a multi-branch line is visible.
  if (!hits.length) byBranch['(none — site text did not re-match)'].push(m.file);
  else for (const h of hits) byBranch[h].push(m.file);
}
console.log('');
console.log('── which detector branch fired, per member (a member can appear twice) ──');
for (const [k, v] of Object.entries(byBranch)) console.log(`  ${String(v.length).padStart(2)} ${k}${v.length ? ':' : ''}\n${v.map((f) => `       ${f}`).join('\n')}`);
console.log('');
const bareAnthropicOnly = model.filter((m) => BRANCH['Anthropic'].test(m.site) && !BRANCH['ANTHROPIC_API_KEY'].test(m.site) && !BRANCH['messages.create'].test(m.site));
pred('P5', bareAnthropicOnly.length >= 1,
  `members whose site fires ONLY the bare \`Anthropic\` branch: ${bareAnthropicOnly.length} ` +
  JSON.stringify(bareAnthropicOnly.map((m) => m.file)));

// ── R4 — this unit touches nothing outside its own directory
const gate = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('R4', gate === '', `gate (packages, scripts, docs/research/lib): ${gate === '' ? 'empty' : gate}`);

console.log('');
console.log(`VERDICT/${red.length} ${red.length ? 'RED' : 'GREEN'} legs=${legs.length} red=${JSON.stringify(red)} ` +
  `refused=${JSON.stringify(refused)} preds=${preds.length} refuted=${JSON.stringify(refuted)} prefused=${JSON.stringify(prefused)}`);
process.exit(red.length ? 1 : 0);
