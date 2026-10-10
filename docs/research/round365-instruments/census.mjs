import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, relative } from 'node:path';

const REPO = process.cwd();

const walk = (d, acc = []) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(relative(REPO, p));
  }
  return acc;
};

const onDisk = walk(join(REPO, 'scripts')).filter((f) => f.endsWith('.mts')).sort();
console.log('ON-DISK .mts under scripts/:', onDisk.length);

const r = spawnSync('npx', ['tsc', '-p', 'scripts/tsconfig.json', '--noEmit', '--listFiles'], {
  cwd: REPO,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
console.log('exit', r.status);
const diag = `${r.stdout ?? ''}${r.stderr ?? ''}`.split('\n').filter((l) => /error TS/.test(l));
console.log('diagnostics', diag.length, diag[0] ?? '');

const prog = new Set(
  `${r.stdout ?? ''}`
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith(REPO) && !l.includes('node_modules'))
    .map((l) => l.slice(REPO.length + 1)),
);
const progMts = [...prog].filter((f) => f.endsWith('.mts')).sort();
console.log('PROGRAM .mts total:', progMts.length);
console.log('PROGRAM .mts under scripts/:', progMts.filter((f) => f.startsWith('scripts/')).length);

const missing = onDisk.filter((f) => !prog.has(f));
const extra = progMts.filter((f) => !onDisk.includes(f));
console.log('on-disk NOT in program:', missing.length, JSON.stringify(missing.slice(0, 8)));
console.log('in program NOT on-disk-under-scripts:', extra.length, JSON.stringify(extra.slice(0, 8)));
