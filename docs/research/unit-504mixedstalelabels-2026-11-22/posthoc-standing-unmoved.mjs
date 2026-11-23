#!/usr/bin/env node
/**
 * unit-504mixedstalelabels — P6. This unit moved no published gate figure, and the mechanism was
 * registered before the arms existed rather than explained afterwards.
 *
 * `unit-502` (this seat) moved the standing figure `4160 → 4230` because its derivation script
 * quoted the exemption token inside a STRING literal and joined the quoted-only list. `unit-503`
 * (Theseus) moved it `4230 → 4309` because its arm spelled the token contiguously inside a regex in
 * a COMMENT and joined DEAD MARKERS. Two doors, both unconditional prints of a path row, both found
 * by the unit that walked through them.
 *
 * This compares the pre-drive capture (taken at 17:20 PST before any file of this unit existed)
 * against a post-commit capture, as line MULTISETS rather than index-wise, because one inserted
 * line reads as N changes under a naive diff.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CAP = join(import.meta.dirname, 'captures');
const must = (cond, msg) => { if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`); };

const pre = readFileSync(join(CAP, 'standing-pre.out'));
const post = readFileSync(join(CAP, 'standing-post.out'));
const preT = pre.toString('utf8');
const postT = post.toString('utf8');
const lines = (s) => s.split('\n').length - (s.endsWith('\n') ? 1 : 0);

const num = (s, re, what) => {
  const m = s.match(re);
  must(m, `cannot read ${what} out of the capture`);
  return Number(m[1]);
};
const TRACKED = /tracked files read: (\d+)/;
const POP = /population \(compares against both braces\): (\d+)/;
const DEADF = /(\d+) tracked file\(s\), carrying \d+ marker occurrence\(s\)/;
const DEADO = /\d+ tracked file\(s\), carrying (\d+) marker occurrence\(s\)/;
const QONLY = /(\d+) tracked file\(s\) contain the marker token ONLY inside a string literal/;

const multiset = (s) => {
  const m = new Map();
  for (const l of s.split('\n')) m.set(l, (m.get(l) || 0) + 1);
  return m;
};
const diff = (a, b) => {
  const out = [];
  const keys = new Set([...a.keys(), ...b.keys()]);
  for (const k of keys) if ((a.get(k) || 0) !== (b.get(k) || 0)) out.push([k, a.get(k) || 0, b.get(k) || 0]);
  return out;
};
const changed = diff(multiset(preT), multiset(postT));

// Every .mjs this unit added, by name — none of them may appear anywhere in the post capture.
const MINE = [
  'derive-stale-entry-general-form.mjs',
  'posthoc-reachable-labels-anchored.mjs',
  'arm-mixedstalelabels.mjs',
  'posthoc-standing-unmoved.mjs',
];
const mineHits = Object.fromEntries(MINE.map((f) => [f, (postT.match(new RegExp(f, 'g')) || []).length]));

const verdict = {
  'P6.a  green stdout is still 4309 B / 43 lines':
    post.length === 4309 && lines(postT) === 43 && post.length === pre.length,
  'P6.b  population 65, dead markers 20 files / 23 occurrences, quoted-only 3 — all flat':
    num(postT, POP, 'population') === 65
    && num(postT, DEADF, 'dead marker files') === 20
    && num(postT, DEADO, 'dead marker occurrences') === 23
    && num(postT, QONLY, 'quoted-only') === 3
    && num(preT, POP, 'population') === 65,
  'P6.c  tracked files read MOVED, 1064 -> strictly greater':
    num(preT, TRACKED, 'pre tracked') === 1064
    && num(postT, TRACKED, 'post tracked') > 1064,
  'P6.d  none of this unit\'s own filenames appears in the post capture — 0 hits each':
    Object.values(mineHits).every((n) => n === 0),
  'P6.e  the ONLY line that differs is the tracked-files-read line':
    changed.length === 2 && changed.every(([l]) => TRACKED.test(l)),
  'P6.f  equal bytes, DIFFERENT sha — the byte count could not have reported this move':
    post.length === pre.length && preT !== postT,
};

console.log(JSON.stringify({
  preBytes: pre.length,
  postBytes: post.length,
  preLines: lines(preT),
  postLines: lines(postT),
  trackedPre: num(preT, TRACKED, 'pre tracked'),
  trackedPost: num(postT, TRACKED, 'post tracked'),
  population: num(postT, POP, 'population'),
  deadMarkerFiles: num(postT, DEADF, 'dead marker files'),
  deadMarkerOccurrences: num(postT, DEADO, 'dead marker occurrences'),
  quotedOnly: num(postT, QONLY, 'quoted-only'),
  changedLines: changed,
  ownFilenameHits: mineHits,
  verdict,
}, null, 2));
