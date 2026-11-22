// STOP fire 2026-11-21, Theseus. Untracked scratch; removed by the fire that wrote it.
//
// Positive control for the cross-worktree byte-identity I measured against Daedalus's committed
// unit-499 gate capture. That agreement is VACUOUS on its own: two worktrees synced to the same
// origin/main with no untracked code files have identical contents, so byte-identity shows nothing
// about requirement 1 (`git ls-files`-keyed, never a filesystem walk). This plants an untracked
// member that CARRIES the detected property and asserts the gate's output does not move.
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { extname, join } from 'node:path';

const SC = '.scratch-theseus-stop';
const plant = join(SC, 'plant-unguarded-slicer.mjs');
const OPEN = String.fromCharCode(123); // {
const CLOSE = String.fromCharCode(125); // }
const Q = String.fromCharCode(39); // '

const drive = () => spawnSync('node', ['scripts/verify-decl-body-slicers.mjs'], { encoding: 'buffer' });

const figures = (buf) => {
  const s = buf.toString();
  const m = s.match(/tracked files read: (\d+)/);
  const p = s.match(/population \(compares against both braces\): (\d+)/);
  const u = s.match(/UNGUARDED\s+(\d+)/);
  const g = s.match(/GUARDED\s+(\d+)/);
  return { read: m && m[1], pop: p && p[1], guarded: g && g[1], unguarded: u && u[1] };
};

try {
  const before = drive();

  // A genuine unguarded hand-rolled brace-balance body slicer — the exact property the gate
  // detects, not an analogy to it.
  const src = [
    'export function bodyOf(src, declStart) {',
    `  const open = src.indexOf(${Q}${OPEN}${Q}, declStart);`,
    '  let depth = 0;',
    '  for (let i = open; i < src.length; i++) {',
    `    if (src[i] === ${Q}${OPEN}${Q}) depth++;`,
    `    else if (src[i] === ${Q}${CLOSE}${Q}) {`,
    '      depth--;',
    '      if (depth === 0) return src.slice(open, i + 1);',
    '    }',
    '  }',
    `  return ${Q}${Q};`,
    '}',
    '',
  ].join('\n');
  writeFileSync(plant, src);

  // Assert the plant's own properties BEFORE the drive whose reading depends on them.
  const text = readFileSync(plant, 'utf8');
  const tracked = spawnSync('git', ['ls-files', '--error-unmatch', plant], { encoding: 'utf8' });
  console.log('plant on disk                :', existsSync(plant));
  console.log('plant tracked by git         :', tracked.status === 0, `(git rc=${tracked.status})`);
  console.log('plant ext in gate EXTS       :', extname(plant) === '.mjs');
  console.log('plant carries indexOf(brace) :', text.includes(`indexOf(${Q}${OPEN}${Q}`));
  // The exemption token is ASSEMBLED, never written as a literal. Writing it literally — even
  // inside a regex — puts this file in the gate's own `token ONLY inside a string literal` list and
  // costs a published line. Measured, not assumed: the first draft of this file did exactly that
  // and moved the gate 4160 -> 4262 bytes, 41 -> 42 lines, quoted-only list 2 -> 3. See NOTE.md §4.
  const MARKER = ['brace', 'slicer', 'deliberate'].join('-') + ':';
  console.log('plant carries the exemption  :', text.includes(MARKER));
  console.log('plant uses the shared reader :', /scripts\/lib\/decl-body\.mjs/.test(text));

  const after = drive();
  console.log('');
  console.log('rc    before / after         :', before.status, '/', after.status);
  console.log('bytes before / after         :', before.stdout.length, '/', after.stdout.length);
  console.log('byte-identical WITH plant    :', Buffer.compare(before.stdout, after.stdout) === 0);
  console.log('figures before               :', JSON.stringify(figures(before.stdout)));
  console.log('figures after                :', JSON.stringify(figures(after.stdout)));
} finally {
  if (existsSync(plant)) unlinkSync(plant);
  const back = drive();
  console.log('');
  console.log('plant removed                :', !existsSync(plant));
  console.log('post-cleanup bytes / rc      :', back.stdout.length, '/', back.status);
}
