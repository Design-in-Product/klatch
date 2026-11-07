/**
 * unit-465promote — P4.
 *
 * Arm E keys "the race state was built" on the `-wal`'s **inode**: the racer's commit landing in
 * the inode the tool's own open created is what proves `sidecarsBefore` was captured with it
 * absent. That key is sound only if an unlinked inode is not handed straight back to the next
 * file created in its place — otherwise the arm reads "same inode" for a `-wal` the racer made
 * AFTER the cleanup, which is a false GREEN in exactly the state the key exists to refuse.
 *
 * This measures that, rather than reasoning about it, and names the filesystem instead of
 * generalising: a reuse-free result here is a claim about darwin's `os.tmpdir()` only.
 *
 * Two controls, because a reader that cannot tell any two inodes apart would otherwise score
 * perfectly: KP — two stats of one live file must AGREE; KN — two concurrently live files must
 * DIFFER.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';

const TRIALS = 500;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'u465promote-ino-'));

let reused = 0;
const reuseExamples = [];
const inos = [];

for (let i = 0; i < TRIALS; i++) {
  const a = path.join(dir, `a${i}`);
  fs.writeFileSync(a, 'x');
  const inoA = fs.statSync(a).ino;
  fs.rmSync(a);
  const b = path.join(dir, `b${i}`);
  fs.writeFileSync(b, 'y');
  const inoB = fs.statSync(b).ino;
  fs.rmSync(b);
  inos.push(inoA, inoB);
  if (inoA === inoB) {
    reused++;
    if (reuseExamples.length < 5) reuseExamples.push(`trial ${i}: ino ${inoA} handed back`);
  }
}

// KP — two stats of one live file agree.
const kpPath = path.join(dir, 'kp');
fs.writeFileSync(kpPath, 'z');
const kp = fs.statSync(kpPath).ino === fs.statSync(kpPath).ino;

// KN — two concurrently live files differ.
const kn1 = path.join(dir, 'kn1');
const kn2 = path.join(dir, 'kn2');
fs.writeFileSync(kn1, '1');
fs.writeFileSync(kn2, '2');
const kn = fs.statSync(kn1).ino !== fs.statSync(kn2).ino;

fs.rmSync(dir, { recursive: true, force: true });

// The filesystem, read rather than assumed from the platform string.
let fsType = '(unread)';
try {
  const out = execFileSync('/bin/df', ['-T', 'nodev', os.tmpdir()], { encoding: 'utf8' });
  fsType = out.trim().split('\n').slice(-1)[0];
} catch {
  try {
    fsType = execFileSync('/bin/df', [os.tmpdir()], { encoding: 'utf8' }).trim().split('\n').slice(-1)[0];
  } catch { /* leave unread rather than guess */ }
}

const uniq = new Set(inos).size;
const grades = [];
const grade = (name, ok, detail) => {
  grades.push({ name, ok });
  console.log(`  ${ok ? 'true ' : 'FALSE'}  ${name} — ${detail}`);
};

console.log(`platform ${process.platform}  tmpdir ${os.tmpdir()}`);
console.log(`df: ${fsType}`);
console.log(`trials ${TRIALS}  distinct inodes seen ${uniq} of ${inos.length}`);
console.log('');
grade('KP two stats of one live file agree', kp, 'same ino twice');
grade('KN two concurrently live files differ', kn, 'different inos');
grade('P4 no unlinked inode was handed to the next file created', reused === 0,
  `${reused} reuse(s) in ${TRIALS} trials`);
for (const e of reuseExamples) console.log(`    ${e}`);

const bad = grades.filter((g) => !g.ok);
console.log(`\nSUMMARY  ${grades.length - bad.length}/${grades.length} grades true  ` +
  `(reuse rate ${reused}/${TRIALS})`);
process.exit(bad.length ? 1 : 0);
