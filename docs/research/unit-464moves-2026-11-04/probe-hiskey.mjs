#!/usr/bin/env node
// unit-464moves — probe-hiskey.mjs
//
// P5CENSUS came out RED: my registered (a)=91 (b)=90 (c)=195 reconciliation is wrong. My own key
// reads 91 / 87 / 191 at BOTH pins. His 11/03 table says all-dirs=325, dirs-with-.mjs=90,
// .mjs=195 at `bba2aa3c`.
//
// This probe does NOT argue about which key is right. It enumerates candidate keys and reports
// which, if any, reproduces HIS three figures — "reproduce their figures under their own key"
// before saying anything about whose number is wrong.
//
// Nothing here is graded. Every line prints the key it was taken under.

import { execFileSync } from 'node:child_process';

const REPO = '/Users/xian/Development/klatch-worktrees/theseus';
const PINS = ['bba2aa3c', '0ae48068'];
const TARGET = { allDirs: 325, dirsWithMjs: 90, mjs: 195 };

function git(args) {
  try {
    return execFileSync('git', ['-C', REPO, ...args], {
      encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch { return null; }
}

for (const pin of PINS) {
  const paths = (git(['ls-tree', '-r', '--name-only', pin, 'docs/research/']) ?? '').split('\n').filter(Boolean);
  const mjs = paths.filter((p) => p.endsWith('.mjs'));
  console.log(`=== pin ${pin} — ${paths.length} blobs under docs/research/, ${mjs.length} of them *.mjs`);

  // K1 — my key: first path component matches /^round\d+-instruments$/
  const k1dirs = new Set();
  const k1mjs = [];
  for (const p of paths) {
    const m = /^docs\/research\/(round\d+-instruments)\//.exec(p);
    if (!m) continue;
    k1dirs.add(m[1]);
    if (p.endsWith('.mjs')) k1mjs.push(p);
  }
  const k1withMjs = new Set(k1mjs.map((p) => /^docs\/research\/([^/]+)\//.exec(p)[1]));
  console.log(`  K1 first component =~ /^round\\d+-instruments$/        dirs=${k1dirs.size} dirs-with-.mjs=${k1withMjs.size} .mjs=${k1mjs.length}`);

  // K2 — looser: first component starts with "round"
  const k2dirs = new Set();
  const k2mjs = [];
  for (const p of paths) {
    const m = /^docs\/research\/(round[^/]*)\//.exec(p);
    if (!m) continue;
    k2dirs.add(m[1]);
    if (p.endsWith('.mjs')) k2mjs.push(p);
  }
  const k2withMjs = new Set(k2mjs.map((p) => /^docs\/research\/([^/]+)\//.exec(p)[1]));
  console.log(`  K2 first component starts with "round"               dirs=${k2dirs.size} dirs-with-.mjs=${k2withMjs.size} .mjs=${k2mjs.length}`);

  // K3 — any path component (at any depth) matches /^round\d+-instruments$/
  const k3dirs = new Set();
  const k3mjs = [];
  for (const p of paths) {
    const parts = p.split('/');
    const hit = parts.find((s) => /^round\d+-instruments$/.test(s));
    if (!hit) continue;
    k3dirs.add(hit);
    if (p.endsWith('.mjs')) k3mjs.push(p);
  }
  console.log(`  K3 ANY component =~ /^round\\d+-instruments$/          dirs=${k3dirs.size} .mjs=${k3mjs.length}`);

  // K4 — the path contains "round" anywhere (incl. filenames)
  const k4mjs = mjs.filter((p) => p.includes('round'));
  console.log(`  K4 path contains "round" anywhere, *.mjs only         .mjs=${k4mjs.length}`);

  // K5 — DIRECTORY count at every depth: every distinct directory path under docs/research/
  const allDirPaths = new Set();
  for (const p of paths) {
    const parts = p.split('/');
    for (let i = 2; i < parts.length; i += 1) allDirPaths.add(parts.slice(0, i).join('/'));
  }
  const roundDirPaths = [...allDirPaths].filter((d) => /^docs\/research\/round\d+-instruments(\/|$)/.test(d));
  console.log(`  K5 distinct DIRECTORY PATHS at every depth           all=${allDirPaths.size} under-roundNNN=${roundDirPaths.length}`);

  // K6 — the four .mjs-less dirs under K1, named with what they do hold
  const mjsByDir = new Map([...k1dirs].map((d) => [d, 0]));
  for (const p of k1mjs) mjsByDir.set(/^docs\/research\/([^/]+)\//.exec(p)[1], mjsByDir.get(/^docs\/research\/([^/]+)\//.exec(p)[1]) + 1);
  const empties = [...mjsByDir.entries()].filter(([, n]) => n === 0).map(([d]) => d);
  for (const d of empties) {
    const held = paths.filter((p) => p.startsWith(`docs/research/${d}/`));
    const exts = [...new Set(held.map((p) => (p.includes('.') ? `.${p.split('.').pop()}` : '(none)')))].sort();
    console.log(`  K6 .mjs-less under K1: ${d.padEnd(24)} ${held.length} file(s) ${exts.join(' ')}`);
  }

  // K7 — .js / .cjs / .ts siblings, in case his "instrument" key was not .mjs-only
  const k7 = paths.filter((p) => /^docs\/research\/round\d+-instruments\//.test(p) && /\.(js|cjs|ts|mts)$/.test(p));
  console.log(`  K7 under K1 dirs, non-.mjs script extensions          n=${k7.length}${k7.length ? ` -> ${k7.slice(0, 6).join(' ')}` : ''}`);
  console.log('');
}
console.log(`targets from his 11/03 table at bba2aa3c: all-dirs=${TARGET.allDirs} dirs-with-.mjs=${TARGET.dirsWithMjs} .mjs=${TARGET.mjs}`);
