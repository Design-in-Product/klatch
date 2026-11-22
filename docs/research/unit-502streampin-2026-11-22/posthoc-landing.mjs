#!/usr/bin/env node
/**
 * Grades P5, P6 and P7 of `PRE-REGISTRATION.md` — the landing conditions, which straddle a patch
 * and a commit and so cannot live in the arm.
 *
 * P5 is graded on `sha256`, same tree state, immediately before and after the docblock patch.
 * P6 is graded on `sha256` ACROSS the commit, deliberately — a byte COUNT comparison is the exact
 * conflation Theseus's own P4 was refuted for this morning, in the unit whose finding is that a
 * byte count cannot see a content change. Applying his lesson rather than quoting it.
 *
 * Usage:  node posthoc-landing.mjs pre     (run on the PRE-patch tree; records the baseline)
 *         node posthoc-landing.mjs post    (run after the patch; grades)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = resolve(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const CAPS = join(HERE, 'captures');
const STATE = join(CAPS, 'landing-state.json');
const NL = String.fromCharCode(10);
const mode = process.argv[2];

const sha = (b) => createHash('sha256').update(b).digest('hex');
const B = (s) => Buffer.byteLength(s);

function drive() {
  const r = spawnSync('node', [GATE], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { rc: r.status, out: r.stdout ?? '', err: r.stderr ?? '' };
}
const named = (out) => {
  const pick = (re) => (out.match(re) || [, 'absent'])[1];
  return {
    read: pick(/tracked files read: (\d+)/),
    pop: pick(/population \(compares against both braces\): (\d+)/),
    marked: pick(/MARKED\s+(\d+)/),
    guarded: pick(/\n\s+GUARDED\s+(\d+)/),
    unguarded: pick(/UNGUARDED\s+(\d+)/),
    baseline: pick(/baseline entries: (\d+)/),
  };
};

if (mode === 'pre') {
  const d = drive();
  const head = execFileSync('git', ['-C', ROOT, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  writeFileSync(STATE, `${JSON.stringify({
    head, rc: d.rc, bytes: B(d.out), lines: d.out.split(NL).length - 1, sha: sha(d.out), named: named(d.out),
  }, null, 2)}${NL}`);
  writeFileSync(join(CAPS, 'landing-pre-patch.out'), d.out);
  console.log(`pre  rc=${d.rc} ${B(d.out)}B/${d.out.split(NL).length - 1}L sha ${sha(d.out).slice(0, 16)} head ${head.slice(0, 8)}`);
  console.log(`     named: ${JSON.stringify(named(d.out))}`);
  process.exit(0);
}

if (mode !== 'post') { console.error('usage: posthoc-landing.mjs pre|post'); process.exit(2); }
if (!existsSync(STATE)) { console.error('no pre-patch state recorded; P5 is ungradeable'); process.exit(2); }

const pre = JSON.parse(readFileSync(STATE, 'utf8'));
const d = drive();
writeFileSync(join(CAPS, 'landing-post-patch.out'), d.out);
const post = { rc: d.rc, bytes: B(d.out), lines: d.out.split(NL).length - 1, sha: sha(d.out), named: named(d.out) };

const rows = [];
const grade = (id, claim, p, m) => {
  const hit = String(p) === String(m);
  rows.push({ id, claim, predicted: p, measured: m, hit });
  console.log(`  ${hit ? 'HIT ' : 'MISS'}  ${id}  ${claim}`);
  console.log(`          predicted ${p}`);
  console.log(`          measured  ${m}`);
};

console.log('posthoc-landing — P5 / P6 / P7');
console.log(`  pre  ${pre.bytes}B/${pre.lines}L sha ${pre.sha.slice(0, 16)}  (head ${pre.head.slice(0, 8)})`);
console.log(`  post ${post.bytes}B/${post.lines}L sha ${post.sha.slice(0, 16)}`);
console.log('');

/* ---- P5: the patch moved no published byte, same tree state */
grade('P5.rc', 'gate still green after the patch', 0, post.rc);
grade('P5.sha', 'stdout sha256 IDENTICAL across the docblock patch, same tree state', pre.sha, post.sha);

/* ---- P6: across the commit — count survives, bytes do not */
const prevCapture = join(HERE, 'captures/d0-green-baseline.out');
if (existsSync(prevCapture)) {
  const d0 = readFileSync(prevCapture, 'utf8');
  console.log('');
  console.log('  P6 — ACROSS THIS UNIT\'S COMMITS (d0 at fire start vs now):');
  grade('P6.bytes', 'stdout byte COUNT equal across the commit', B(d0), post.bytes);
  grade('P6.sha', 'stdout BYTES differ across the commit (graded as sha, not count)', true, sha(d0) !== post.sha);
  const was = d0.split(NL);
  const now = d.out.split(NL);
  const diff = now.map((l, i) => [i + 1, was[i], l]).filter(([, x, y]) => x !== y);
  grade('P6.difflines', 'differing published lines across the commit', 1, diff.length);
  for (const [n, x, y] of diff) {
    console.log(`       L${n}  ${JSON.stringify(x)}  ->  ${JSON.stringify(y)}   widths ${B(x ?? '')} / ${B(y)}`);
  }
}

/* ---- P7: hazards, read off the gate's own report */
console.log('');
console.log('  P7 — the gate\'s own lists, read off the post-patch report:');
const deadFiles = (post2 = d.out) => (post2.match(/(\d+) tracked file\(s\), carrying (\d+) marker occurrence/) || []).slice(1);
const [df, dm] = deadFiles();
const quoted = (d.out.match(/(\d+) tracked file\(s\) contain the marker token ONLY inside a string literal/) || [, 'absent'])[1];
const inpop = (d.out.match(/(\d+) in-population file\(s\) carry the marker token ONLY inside/) || [, 'absent'])[1];
grade('P7.dead', 'dead-marker list: files / occurrences', '19 / 22', `${df} / ${dm}`);
grade('P7.quoted', 'quoted-only list (REGISTERED AS 2 — see RESULTS)', 2, Number(quoted));
grade('P7.inpop', 'in-population quoted-only', 0, Number(inpop));
console.log('');
console.log(`  named figures now: ${JSON.stringify(post.named)}`);
console.log('');
const hits = rows.filter((r) => r.hit).length;
console.log(`SUMMARY — ${hits} of ${rows.length} HIT`);
writeFileSync(join(CAPS, 'posthoc-landing.json'), `${JSON.stringify({ pre, post, rows }, null, 2)}${NL}`);
