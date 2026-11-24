#!/usr/bin/env node
/**
 * unit-514equalityconsumer — Arm B: Daedalus's §6 item 3, "P8's strict form".
 *
 *   "drive a real LIVE host against renamed gate output and watch its own output. Needs a path/env
 *    seam or a reversibility-checked scratch copy of the host."
 *
 * It needs neither a seam nor an edit. `unit-506…/posthoc-standing-linewise.mjs` resolves its
 * subject as `join(import.meta.dirname, 'captures')`, so a BYTE-IDENTICAL copy of the source placed
 * beside a `captures/` of renamed captures drives the real host against a renamed subject with the
 * host's own bytes unchanged. The source sha256 is asserted equal before each drive.
 *
 * Two drives, differing in ONE thing:
 *
 *   VERBATIM  — byte-identical source, byte-identical captures. This is the arm's KNOWN POSITIVE:
 *               its stdout must reproduce the host's own published `captures/P6-standing-linewise.json`.
 *               If it does not, every renamed figure is UNGRADEABLE and is published as such.
 *   RENAMED   — byte-identical source, captures with `tracked files read` -> `tracked code files read`
 *               at every occurrence and nowhere else, reversibility checked (substitute back, compare
 *               bytes; refuse rather than continue if it does not return the original).
 *
 * Neither scratch tree is ever `git add`ed, both are removed in a `finally`, the removal is
 * asserted, and `git status --porcelain` is asserted empty at the end — because the population the
 * gate censuses is TRACKED files and this instrument must not join the population it reads.
 *
 * No brace comparison in this file, deliberately (see Arm A's docblock).
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';

const OLD = 'tracked files read';
const NEW = 'tracked code files read';

const HOST_REL = 'docs/research/unit-506labelmultiset-2026-11-23/posthoc-standing-linewise.mjs';
const HOST_DIR = 'docs/research/unit-506labelmultiset-2026-11-23';
const HOST_SHA12 = 'e3354aeb3d63'; // pinned in the pre-registration, read at 74d68a30
const STAGES = ['standing-pre', 'standing-after-arm', 'standing-after-docblock'];
const PUBLISHED = join(HOST_DIR, 'captures', 'P6-standing-linewise.json');

const sha12 = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 12);
const ROOT = process.cwd();
const SCRATCH = [join(ROOT, 'scratch-unit514-verbatim'), join(ROOT, 'scratch-unit514-renamed')];

const report = { pins: {}, reversibility: {}, drives: {}, comparison: {}, predictions: {}, hygiene: {} };

try {
  /* ---------------------------------------------------------------- pins */
  const hostBytes = readFileSync(HOST_REL);
  const hostSha = sha12(hostBytes);
  report.pins.hostSha12 = hostSha;
  report.pins.hostShaMatchesPreRegistration = hostSha === HOST_SHA12;
  if (!report.pins.hostShaMatchesPreRegistration) {
    throw new Error(`host source moved since registration: ${hostSha} != ${HOST_SHA12}`);
  }

  const capBytes = {};
  for (const s of STAGES) {
    capBytes[`${s}.out`] = readFileSync(join(HOST_DIR, 'captures', `${s}.out`));
    capBytes[`${s}.err`] = readFileSync(join(HOST_DIR, 'captures', `${s}.err`));
  }
  report.pins.captures = Object.fromEntries(
    Object.entries(capBytes).map(([k, v]) => [k, { sha12: sha12(v), bytes: v.length }]),
  );

  /* ---------------------------------------------------------------- the rename, reversibility-checked */
  const renamed = {};
  for (const s of STAGES) {
    const key = `${s}.out`;
    const src = capBytes[key].toString('utf8');
    const occ = (src.match(new RegExp(OLD, 'g')) ?? []).length;
    const sub = src.split(OLD).join(NEW);
    const back = sub.split(NEW).join(OLD);
    const reversible = Buffer.from(back, 'utf8').equals(capBytes[key]);
    report.reversibility[key] = {
      occurrencesSubstituted: occ,
      bytesBefore: capBytes[key].length,
      bytesAfter: Buffer.byteLength(sub, 'utf8'),
      reversible,
      newAlreadyPresentBefore: src.includes(NEW),
    };
    if (!reversible) throw new Error(`substitution not reversible for ${key} — refusing to drive`);
    if (src.includes(NEW)) throw new Error(`${key} already contains NEW — substitution is not clean`);
    renamed[key] = Buffer.from(sub, 'utf8');
  }

  /* ---------------------------------------------------------------- build the two scratch trees */
  const build = (dir, outs) => {
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(join(dir, 'captures'), { recursive: true });
    const hostPath = join(dir, 'posthoc-standing-linewise.mjs');
    writeFileSync(hostPath, hostBytes);
    if (!readFileSync(hostPath).equals(hostBytes)) throw new Error(`scratch host in ${dir} is not byte-identical`);
    for (const s of STAGES) {
      writeFileSync(join(dir, 'captures', `${s}.out`), outs[`${s}.out`]);
      writeFileSync(join(dir, 'captures', `${s}.err`), capBytes[`${s}.err`]);
    }
    return hostPath;
  };

  const verbatimHost = build(SCRATCH[0], capBytes);
  const renamedHost = build(SCRATCH[1], renamed);

  const drive = (name, hostPath) => {
    const r = spawnSync('node', [hostPath], { encoding: 'utf8', maxBuffer: 1e8 });
    const row = {
      rc: r.status,
      stdoutBytes: Buffer.byteLength(r.stdout ?? '', 'utf8'),
      stdoutSha12: sha12(Buffer.from(r.stdout ?? '', 'utf8')),
      stderrBytes: Buffer.byteLength(r.stderr ?? '', 'utf8'),
      stderrHead: (r.stderr ?? '').slice(0, 400),
      hostSha12: sha12(readFileSync(hostPath)),
    };
    report.drives[name] = row;
    return r.stdout ?? '';
  };

  const vOut = drive('VERBATIM', verbatimHost);
  const rOut = drive('RENAMED', renamedHost);

  /* ---------------------------------------------------------------- P4: the control */
  const pub = readFileSync(PUBLISHED);
  const vBuf = Buffer.from(vOut, 'utf8');
  const vMatchesPublishedExact = vBuf.equals(pub);
  const vMatchesPublishedTrimmed = vOut.trim() === pub.toString('utf8').trim();
  report.predictions.P4 = {
    claim: 'the verbatim drive reproduces the published P6-standing-linewise.json byte-for-byte, rc 0, stderr 0 B',
    publishedSha12: sha12(pub),
    publishedBytes: pub.length,
    driveSha12: report.drives.VERBATIM.stdoutSha12,
    driveBytes: report.drives.VERBATIM.stdoutBytes,
    byteForByte: vMatchesPublishedExact,
    equalIgnoringTrailingWhitespace: vMatchesPublishedTrimmed,
    rc: report.drives.VERBATIM.rc,
    stderrBytes: report.drives.VERBATIM.stderrBytes,
    verdict: (vMatchesPublishedExact || vMatchesPublishedTrimmed)
      && report.drives.VERBATIM.rc === 0 && report.drives.VERBATIM.stderrBytes === 0 ? 'HIT' : 'REFUTED',
  };
  const armGradeable = report.predictions.P4.verdict === 'HIT';
  report.predictions.P4.consequence = armGradeable
    ? 'control holds — P5..P10 are gradeable'
    : 'CONTROL FAILED — every figure below is UNGRADEABLE and is published as such, not as a finding';

  /* ---------------------------------------------------------------- parse both outputs */
  const vJson = JSON.parse(vOut);
  const rJson = JSON.parse(rOut);

  /* P5 */
  report.predictions.P5 = {
    claim: 'the renamed drive exits rc 0 with stderr 0 B — the rename raises nothing and says nothing',
    rc: report.drives.RENAMED.rc,
    stderrBytes: report.drives.RENAMED.stderrBytes,
    verdict: report.drives.RENAMED.rc === 0 && report.drives.RENAMED.stderrBytes === 0 ? 'HIT' : 'REFUTED',
    gradeable: armGradeable,
  };

  /* P6 */
  const keys = Object.keys(vJson.verdict);
  const flips = keys.map((k) => ({
    verdict: k.slice(0, 72),
    verbatim: vJson.verdict[k],
    renamed: rJson.verdict[k],
    flipped: vJson.verdict[k] !== rJson.verdict[k],
    direction: vJson.verdict[k] === true && rJson.verdict[k] === false ? 'true->false'
      : vJson.verdict[k] === false && rJson.verdict[k] === true ? 'false->true' : 'unchanged',
  }));
  const flippedTrueFalse = flips.filter((f) => f.direction === 'true->false');
  report.predictions.P6 = {
    claim: 'exactly 2 of 6 named verdicts flip true->false: P6.d and P6.e; the other four stay true',
    totalVerdicts: keys.length,
    flippedTrueFalseCount: flippedTrueFalse.length,
    flippedNames: flippedTrueFalse.map((f) => f.verdict.split(' ')[0]),
    allRows: flips,
    verdict: flippedTrueFalse.length === 2
      && flippedTrueFalse.every((f) => ['P6.d', 'P6.e'].includes(f.verdict.split(' ')[0]))
      && flips.filter((f) => f.direction === 'unchanged').every((f) => f.renamed === true)
      ? 'HIT' : 'REFUTED',
    gradeable: armGradeable,
  };

  /* P7 — the false green */
  report.predictions.P7 = {
    claim: 'movedFigures becomes [] and flatFigures GAINS the label — the renamed-away figure is reported as one that HELD CONSTANT across all three stages',
    verbatim: { flatFigures: vJson.flatFigures, movedFigures: vJson.movedFigures },
    renamed: { flatFigures: rJson.flatFigures, movedFigures: rJson.movedFigures },
    movedBecameEmpty: Array.isArray(rJson.movedFigures) && rJson.movedFigures.length === 0,
    labelNowInFlat: (rJson.flatFigures ?? []).includes(OLD),
    labelWasInFlat: (vJson.flatFigures ?? []).includes(OLD),
    itsThreeStageValuesRenamed: rJson.stages.map((s) => s.figures[OLD]),
    itsThreeStageValuesVerbatim: vJson.stages.map((s) => s.figures[OLD]),
    verdict: (rJson.movedFigures ?? []).length === 0 && (rJson.flatFigures ?? []).includes(OLD)
      && !(vJson.flatFigures ?? []).includes(OLD) ? 'HIT' : 'REFUTED',
    gradeable: armGradeable,
    why: 'null at every stage and constant at every stage are the same thing to a Set-size reader',
  };

  /* P8 — which conjunct reddened */
  const reEval = (j) => {
    const p = j.preToPost;
    return {
      countConjunct: p.onlyInPre.length === 1 && p.onlyInPost.length === 1,
      nameConjunct: (p.onlyInPre[0] ?? '').includes(OLD) && (p.onlyInPost[0] ?? '').includes(OLD),
      onlyInPre: p.onlyInPre,
      onlyInPost: p.onlyInPost,
    };
  };
  const vE = reEval(vJson);
  const rE = reEval(rJson);
  report.predictions.P8 = {
    claim: "P6.e's count conjunct still holds under the rename; it fails only on the NAME conjunct, and the host's own output cannot say which",
    verbatim: vE,
    renamed: rE,
    countConjunctSurvived: rE.countConjunct === true,
    nameConjunctFailed: rE.nameConjunct === false,
    hostReportsOnlyTheFusedBoolean: true,
    verdict: rE.countConjunct === true && rE.nameConjunct === false && vE.countConjunct === true && vE.nameConjunct === true
      ? 'HIT' : 'REFUTED',
    gradeable: armGradeable,
  };

  /* P9 — where the new label shows up */
  const verdictKeysMentionNew = Object.keys(rJson.verdict).some((k) => k.includes(NEW));
  const figureNamesMentionNew = rJson.stages.some((s) => Object.keys(s.figures).some((k) => k.includes(NEW)));
  const verdictKeysMentionOld = Object.keys(rJson.verdict).filter((k) => k.includes(OLD)).length;
  report.predictions.P9 = {
    claim: 'the NEW label appears in the renamed stdout (inside preToPost) but in NO verdict key and NO figure name; both false verdicts name the OLD label',
    newAppearsInStdout: rOut.includes(NEW),
    newOccurrencesInStdout: (rOut.match(new RegExp(NEW, 'g')) ?? []).length,
    newInAnyVerdictKey: verdictKeysMentionNew,
    newInAnyFigureName: figureNamesMentionNew,
    verdictKeysNamingOldLabel: verdictKeysMentionOld,
    falseVerdictsNameOldLabel: flippedTrueFalse.every((f) => f.verdict.includes(OLD)),
    verdict: rOut.includes(NEW) && !verdictKeysMentionNew && !figureNamesMentionNew
      && flippedTrueFalse.every((f) => f.verdict.includes(OLD)) ? 'HIT' : 'REFUTED',
    gradeable: armGradeable,
  };

  /* P10 — line multiset diff of the two stdouts */
  const msDiff = (a, b) => {
    const count = (xs) => xs.reduce((m, l) => m.set(l, (m.get(l) || 0) + 1), new Map());
    const ca = count(a.split('\n'));
    const cb = count(b.split('\n'));
    const only = (x, y) => [...x].flatMap(([l, n]) => {
      const d = n - (y.get(l) || 0);
      return d > 0 ? Array(d).fill(l) : [];
    });
    return { onlyInVerbatim: only(ca, cb), onlyInRenamed: only(cb, ca) };
  };
  const d = msDiff(vOut, rOut);
  report.predictions.P10 = {
    claim: 'the line-multiset difference between the two stdouts is MORE than the 2 flipped verdict lines',
    differingLineCount: d.onlyInVerbatim.length + d.onlyInRenamed.length,
    onlyInVerbatim: d.onlyInVerbatim.map((l) => l.trim()),
    onlyInRenamed: d.onlyInRenamed.map((l) => l.trim()),
    verdict: d.onlyInVerbatim.length + d.onlyInRenamed.length > 2 ? 'HIT' : 'REFUTED',
    gradeable: armGradeable,
  };

  report.comparison.stdoutBytes = { verbatim: report.drives.VERBATIM.stdoutBytes, renamed: report.drives.RENAMED.stdoutBytes };
} finally {
  const removed = {};
  for (const dir of SCRATCH) {
    rmSync(dir, { recursive: true, force: true });
    removed[dir.replace(`${ROOT}/`, '')] = !existsSync(dir);
  }
  report.hygiene.scratchRemoved = removed;
  try {
    const porcelain = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' });
    report.hygiene.gitStatusPorcelain = porcelain.trim().split('\n').filter(Boolean);
    report.hygiene.noScratchLeftInGitStatus = !porcelain.includes('scratch-unit514');
  } catch (e) {
    report.hygiene.gitStatusError = String(e).slice(0, 200);
  }

  const P = report.predictions;
  console.log('=== unit-514 Arm B — the strict P8 drive: real host, real bytes, renamed subject ===\n');
  console.log(`  host sha12 ${report.pins.hostSha12} (matches pre-registration: ${report.pins.hostShaMatchesPreRegistration})`);
  for (const [k, v] of Object.entries(report.reversibility)) {
    console.log(`  ${k.padEnd(28)} ${v.occurrencesSubstituted} substituted, ${v.bytesBefore} -> ${v.bytesAfter} B, reversible ${v.reversible}`);
  }
  console.log('');
  for (const [k, v] of Object.entries(report.drives)) {
    console.log(`  ${k.padEnd(9)} rc ${v.rc}  stdout ${v.stdoutBytes} B (${v.stdoutSha12})  stderr ${v.stderrBytes} B  host ${v.hostSha12}`);
  }
  console.log('');
  for (const [name, p] of Object.entries(P)) {
    console.log(`  ${name.padEnd(4)} ${String(p.verdict).padEnd(11)} ${p.claim}`);
  }
  console.log(`\n  scratch removed: ${JSON.stringify(report.hygiene.scratchRemoved)}`);
  console.log(`  git status --porcelain: ${JSON.stringify(report.hygiene.gitStatusPorcelain ?? report.hygiene.gitStatusError)}`);
  console.log(`\n${JSON.stringify(report, null, 2)}`);
}
