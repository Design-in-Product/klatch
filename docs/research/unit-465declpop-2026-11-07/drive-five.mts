/**
 * Drives the five declaration-population graders and records each run whole.
 *
 * Usage: npx tsx docs/research/unit-465declpop-2026-11-07/drive-five.mts <tag>
 *
 * Records `<tag>.<short>.out` / `.err` per probe plus `<tag>-grading.txt`, which carries the exit
 * code, the elapsed ms, the summary line AS PRINTED, and — the point of this unit — the labels of
 * the FAILING arms scraped from the run's own output rather than from a search of its source.
 *
 * `execFileSync` would echo child stderr into this process's recording (a lesson this seat has
 * already paid for), so the child is `spawnSync`'d with the streams captured, never inherited.
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const HERE = import.meta.dirname;
const REPO = path.join(HERE, '..', '..', '..');

const PROBES: Array<[string, string]> = [
  ['r372', 'probe-round372-the-rows-are-keyed-on-the-limb-and-the-contradiction-is-latent.mts'],
  ['r373', 'probe-round373-the-red-hint-legs-ran-backwards-from-their-witnesses.mts'],
  ['r374', 'probe-round374-the-absence-check-has-no-control-and-the-drift-is-already-in-the-tree.mts'],
  ['r375', 'probe-round375-the-guard-on-the-routed-cure-reddens-on-the-cure-and-passes-on-a-comment.mts'],
  ['r377', 'probe-round377-the-cure-landed-on-the-two-reported-sites-and-the-mechanism-was-live-in-both-files.mts'],
];

const tag = process.argv[2];
if (!tag) { console.error('usage: drive-five.mts <tag>'); process.exit(2); }

/**
 * The failing arms, read off the run's own `REGRESSIONS:` block rather than scraped for a marker.
 * `summariseAndExit` (`scripts/lib/probe-outcome.mts:938`) prints that header and then one
 * `  [arm] check` line per failure, so the block — not a `FAIL` token — is the structural key. The
 * whole line is kept beside the label: the label alone would lose the reason string, which is the
 * thing this unit is actually censusing.
 *
 * The block is terminated by the first blank line AFTER a row has been taken, so an empty line
 * between the header and the first row cannot end it early, and the row I am looking for cannot
 * become its own terminator.
 */
const failingLines = (out: string): string[] => {
  const lines = out.split('\n');
  const start = lines.findIndex((l) => l.trim() === 'REGRESSIONS:');
  if (start < 0) return [];
  const rows: string[] = [];
  for (const l of lines.slice(start + 1)) {
    if (/^\s*\[/.test(l)) { rows.push(l); continue; }
    if (rows.length && l.trim() === '') break;
  }
  return rows;
};

const summaryLine = (out: string): string => {
  const m = out.split('\n').filter((l) => /regression check/.test(l));
  return m.length ? m[m.length - 1].trim() : '(no summary line)';
};

const rows: string[] = [];
for (const [short, file] of PROBES) {
  const t0 = Date.now();
  const r = spawnSync('npx', ['tsx', path.join('scripts', file)], {
    cwd: REPO, encoding: 'utf8', timeout: 600_000,
  });
  const ms = Date.now() - t0;
  const out = r.stdout || '';
  const err = r.stderr || '';
  fs.writeFileSync(path.join(HERE, `${tag}.${short}.out`), out);
  fs.writeFileSync(path.join(HERE, `${tag}.${short}.err`), err);
  const fails = failingLines(out + err);
  rows.push(
    `${short}  exit ${r.status}  ${ms} ms  ${summaryLine(out + err)}\n` +
    (fails.length
      ? fails.map((l) => `        FAILING: ${l.trim()}`).join('\n') + '\n'
      : '        (no FAIL line)\n'),
  );
  console.log(rows[rows.length - 1]);
}
fs.writeFileSync(path.join(HERE, `${tag}-grading.txt`), rows.join('\n'));
