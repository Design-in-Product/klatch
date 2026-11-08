/**
 * unit-465adopt, the restoration leg. The five probes that went green -> red across
 * the promotion, re-driven after the revert.
 *
 * *A restoration leg must diff a pre-action baseline*, so this reads the five names
 * out of `registry-pre.json` / `registry-post.json` — the recorded pair — rather
 * than from a hand-typed list, and prints each probe's pre, post and now verdicts
 * side by side.
 *
 * Usage: npx tsx .../drive-restore.mts
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const REPO = path.resolve(HERE, '../../..');
type Row = { file: string; code: number | null; conclusion: string };
const pre: Row[] = JSON.parse(fs.readFileSync(path.join(HERE, 'registry-pre.json'), 'utf8'));
const post: Row[] = JSON.parse(fs.readFileSync(path.join(HERE, 'registry-post.json'), 'utf8'));
const B = Object.fromEntries(post.map((r) => [r.file, r]));
const changed = pre.filter((a) => B[a.file] && B[a.file].code !== a.code);
console.log(`${changed.length} probes changed verdict across the promotion; re-driving each`);

const conclusion = (out: string) =>
  out
    .trim()
    .split('\n')
    .reverse()
    .map((l) => l.trim())
    .find((l) =>
      /^(INCONCLUSIVE — |FAILED — |All \d+ regression checks passed|\d+ of \d+ regression check\(s\) FAILED)/.test(l)
    ) ?? '(none)';

const rows: (Row & { preCode: number | null; postCode: number | null })[] = [];
for (const a of changed) {
  const r = spawnSync('npx', ['tsx', path.join('scripts', a.file)], {
    cwd: REPO,
    encoding: 'utf8',
    timeout: 300_000,
  });
  const now = conclusion(`${r.stdout || ''}${r.stderr || ''}`);
  rows.push({ file: a.file, code: r.status, conclusion: now, preCode: a.code, postCode: B[a.file].code });
  console.log(`  ${a.file}`);
  console.log(`    pre ${a.code} · post ${B[a.file].code} · now ${r.status}   ${now}`);
}
fs.writeFileSync(path.join(HERE, 'registry-restored.json'), `${JSON.stringify(rows, null, 2)}\n`);
const back = rows.filter((r) => r.code === r.preCode).length;
console.log(`${back} of ${rows.length} are back at their pre-action verdict`);
