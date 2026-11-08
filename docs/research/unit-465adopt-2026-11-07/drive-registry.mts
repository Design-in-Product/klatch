/**
 * unit-465adopt P10. The swept probes that READ the registry, driven before and
 * after the promotion, graded as a per-probe delta.
 *
 * *A pin on a count reddens on its own promotion* — so the population at risk is
 * not "every swept probe" but the swept probes whose source mentions the registry
 * at all. Selected mechanically (`SWEPT` membership ∩ source matching
 * `/SWEPT|DEFERRED/`), never by eye.
 *
 * **The population is FROZEN at the `pre` phase and written to `population.json`;
 * the `post` phase reads that file and never recomputes.** The promoted probe's own
 * source mentions the registry, so a recomputed selector would gain a member
 * exactly because of the treatment, and a join key that widens with the property
 * cannot grade it.
 *
 * A delta, not an absolute: a probe that was already red before the edit is not
 * evidence about the edit, and a reader that is wrong in the same direction in both
 * phases cancels in the difference.
 *
 * Usage: npx tsx .../drive-registry.mts pre|post
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { SWEPT } from '../../../scripts/sweep-probes.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const REPO = path.resolve(HERE, '../../..');
const phase = process.argv[2];
if (phase !== 'pre' && phase !== 'post') {
  console.error('usage: drive-registry.mts pre|post');
  process.exit(2);
}
const POP = path.join(HERE, 'population.json');

let population: string[];
if (phase === 'pre') {
  population = (SWEPT as { file: string }[])
    .map((e) => e.file)
    .filter((f) => /SWEPT|DEFERRED/.test(fs.readFileSync(path.join(REPO, 'scripts', f), 'utf8')))
    .sort();
  fs.writeFileSync(POP, `${JSON.stringify(population, null, 2)}\n`);
} else {
  population = JSON.parse(fs.readFileSync(POP, 'utf8'));
}
console.log(`${phase}: ${population.length} probes (population ${phase === 'pre' ? 'frozen now' : 'read from population.json'})`);

const rows: { file: string; code: number | null; conclusion: string; ms: number }[] = [];
const conclusion = (out: string) =>
  out
    .trim()
    .split('\n')
    .reverse()
    .map((l) => l.trim())
    .find((l) =>
      /^(INCONCLUSIVE — |FAILED — |All \d+ regression checks passed|\d+ of \d+ regression check\(s\) FAILED)/.test(l)
    ) ?? '(none)';

for (const f of population) {
  const runner = f.endsWith('.mts') ? ['npx', ['tsx', path.join('scripts', f)]] : ['node', [path.join('scripts', f)]];
  const t0 = Date.now();
  const r = spawnSync(runner[0] as string, runner[1] as string[], {
    cwd: REPO,
    encoding: 'utf8',
    timeout: 300_000,
  });
  const ms = Date.now() - t0;
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  rows.push({ file: f, code: r.status, conclusion: conclusion(out), ms });
  console.log(`  exit ${String(r.status).padEnd(2)} ${String(ms).padStart(6)} ms  ${f}`);
  console.log(`        ${conclusion(out)}`);
}

fs.writeFileSync(path.join(HERE, `registry-${phase}.json`), `${JSON.stringify(rows, null, 2)}\n`);
console.log(`wrote registry-${phase}.json — ${rows.length} rows, ${rows.filter((r) => r.code !== 0).length} non-zero exit`);
