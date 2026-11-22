#!/usr/bin/env node
/**
 * unit-503stalelabelwidth — P7, graded against this unit's OWN landed files.
 *
 * `unit-502streampin` §1: the standing figure moved +70 B / +1 line because that unit's derivation
 * script had to quote the exemption token in order to slice it, so it joined the `quotedOnly` list
 * the report prints unconditionally — and the gate's own IRREDUCIBLE LIMIT block says every file
 * that measures this gate has to quote its key, so *"the instrument is the author of this class."*
 *
 * P7 registered the opposite outcome for this unit, in advance and with a stated mechanism: the key
 * and every quoted-character comparison are assembled at runtime in every `.mjs` file here, so
 * neither `MARKER` nor `OPEN_BRACE`/`CLOSE_BRACE` can match any of this unit's source. If that
 * holds, the class is escapable by construction rather than irreducible, and the only green figure
 * that may move is `tracked files read`.
 *
 * Run AFTER this unit's files are committed, so `git ls-files` can see them. Grades on `sha256` as
 * well as on `wc -c`, and the registered expectation is that the two DISAGREE: same byte count,
 * different bytes, exactly one differing line.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../../..');
const GATE = `${ROOT}/scripts/verify-decl-body-slicers.mjs`;
const UNIT_REL = 'docs/research/unit-503stalelabelwidth-2026-11-22';

const sha = (b) => createHash('sha256').update(b).digest('hex');
const git = (args) => spawnSync('git', ['-C', ROOT, ...args], { encoding: 'utf8' });

// §0 of the pre-registration, measured by this seat before any arm existed.
const PREREG = {
  outBytes: 4230,
  outLines: 42,
  outSha: 'e3e7252d2a37fc6c91cf4f17a18733b1feadef757e819d3c960645afd9b5e8ee',
  trackedRead: 1058,
  population: 65,
  baselineEntries: 58,
  quotedOnly: 3,
};

const r = spawnSync(process.execPath, [GATE], { cwd: ROOT, maxBuffer: 1 << 26 });
const out = r.stdout.toString('utf8');
const fig = (name) => {
  const m = new RegExp(`${name}:\\s*(\\d+)`).exec(out);
  return m ? Number(m[1]) : null;
};
const quotedOnlyCount = (() => {
  const m = /(\d+) tracked file\(s\) contain the marker token ONLY inside a string/.exec(out);
  return m ? Number(m[1]) : null;
})();

const now = {
  rc: r.status,
  outBytes: r.stdout.length,
  outLines: out.split('\n').length - (out.endsWith('\n') ? 1 : 0),
  outSha: sha(r.stdout),
  trackedRead: fig('tracked files read'),
  population: fig('population \\(compares against both braces\\)'),
  baselineEntries: fig('baseline entries'),
  quotedOnly: quotedOnlyCount,
};

// Which of this unit's files does the gate see at all, and in which list?
const tracked = git(['ls-files', '--', UNIT_REL]).stdout.split('\n').filter(Boolean);
const mine = tracked.filter((f) => /\.(mjs|ts|mts|js|cjs|cts|tsx)$/.test(f));
const namedAnywhereInReport = mine.filter((f) => out.includes(f));

// Exactly which lines differ? Read from a FROZEN capture on disk, never retyped.
//
// DECLARED, because it is a real limitation of this leg: `probe-baseline.mjs` recorded §0's byte
// count, line count and sha but not the gate's raw stdout, so there is no §0 document to diff
// against. The comparison below is therefore against `d4-clean-after-reset.out` — this unit's own
// clean green capture, taken mid-fire at `tracked files read: 1059`, one file past §0's 1058. It is
// the right subject for "exactly one line differs" (the differing line is the same line either
// way), and the sha half of P7.e is still graded against §0's recorded sha, which IS in hand.
const DIFF_SUBJECT = `${UNIT_REL}/captures/d4-clean-after-reset.out`;
const diffLines = (() => {
  const prev = spawnSync('cat', [`${ROOT}/${DIFF_SUBJECT}`], { encoding: 'buffer' });
  if (prev.status !== 0) return { available: false, reason: `no frozen capture at ${DIFF_SUBJECT}` };
  const a = prev.stdout.toString('utf8').split('\n');
  const b = out.split('\n');
  const differing = [];
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    if (a[i] !== b[i]) differing.push({ line: i + 1, before: a[i], after: b[i] });
  }
  return { available: true, subject: DIFF_SUBJECT, subjectTrackedRead: 1059, count: differing.length, differing };
})();

const verdict = {
  'P7.a  green stdout is still 4230 B / 42 lines':
    now.rc === 0 && now.outBytes === PREREG.outBytes && now.outLines === PREREG.outLines,
  'P7.b  population unchanged at 65 — no file of mine is admitted':
    now.population === PREREG.population,
  'P7.c  quoted-only unchanged at 3 — no file of mine joins the printed list':
    now.quotedOnly === PREREG.quotedOnly,
  'P7.d  tracked files read is the ONLY figure that moved, and keeps its digit width':
    now.trackedRead > PREREG.trackedRead
    && String(now.trackedRead).length === String(PREREG.trackedRead).length
    && now.baselineEntries === PREREG.baselineEntries,
  'P7.e  sha DIFFERS, byte count does NOT, and exactly one line differs':
    now.outSha !== PREREG.outSha
    && now.outBytes === PREREG.outBytes
    && (diffLines.available ? diffLines.count === 1 : null) === true,
  'P7.f  none of this unit\'s code files is named anywhere in the gate\'s report':
    namedAnywhereInReport.length === 0,
};

console.log(JSON.stringify({
  prereg: PREREG,
  now,
  myTrackedCodeFiles: mine,
  myFilesNamedInReport: namedAnywhereInReport,
  diffLines,
  verdict,
}, null, 2));
