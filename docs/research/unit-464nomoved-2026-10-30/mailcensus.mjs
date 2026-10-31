#!/usr/bin/env node
// mailcensus.mjs — the STOP fire's drain census over the four writable cross-repo mailboxes.
//
// Counted with readdirSync + statSync, not with a `grep | wc` pipeline: a pipeline hides its
// head and its exit code, and a char-class regex over a path fails by returning a SMALLER
// number, which reads as "nothing new" rather than as an error.
//
// Checkpoint is this seat's last commit before the fire, not a bare date: a bare `--since`
// keys on the drive clock and two different 8s have disagreed on this track before.

import { readdirSync, statSync, readFileSync } from 'node:fs';

const CHECKPOINT = Date.parse('2026-10-30T15:02:02-07:00'); // ab837677, this seat's last commit
const BOXES = [
  '/Users/xian/Development/designinproduct/docs/mail',
  '/Users/xian/Development/mediajunkie/docs/mail',
  '/Users/xian/Development/piper-morgan-product/mailboxes',
  '/Users/xian/Development/dispatch/mail',
];
const MINE = /klatch|theseus/i;

/** @type {string[]} */
const LOG = [];
const say = (/** @type {string} */ s) => {
  LOG.push(s);
  process.stdout.write(`${s}\n`);
};

/** Recursive walk — the piper-morgan box nests per-role inbox dirs, so a flat readdir undercounts. */
function walk(dir, depth = 0) {
  /** @type {string[]} */
  const files = [];
  if (depth > 4) return files;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    say(`REFUSED  ${dir} — unreadable (${e.code}); counted as UNMEASURED, not as zero`);
    return null;
  }
  for (const e of entries) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) {
      const sub = walk(p, depth + 1);
      if (sub === null) return null;
      files.push(...sub);
    } else if (e.isFile()) {
      files.push(p);
    }
  }
  return files;
}

let totalNew = 0;
let totalMine = 0;
let unmeasured = 0;
for (const box of BOXES) {
  const files = walk(box);
  if (files === null) {
    unmeasured++;
    continue;
  }
  const fresh = files.filter((f) => {
    try {
      return statSync(f).mtimeMs > CHECKPOINT;
    } catch {
      return false;
    }
  });
  const hits = fresh.filter((f) => {
    if (MINE.test(f)) return true;
    try {
      return MINE.test(readFileSync(f, 'utf8'));
    } catch {
      return false;
    }
  });
  totalNew += fresh.length;
  totalMine += hits.length;
  say(`${box}`);
  say(`   total=${files.length}  new-since-checkpoint=${fresh.length}  matching /klatch|theseus/=${hits.length}`);
  for (const h of hits) say(`   HIT ${h.slice(box.length + 1)}`);
}
say(`CENSUS  boxes=${BOXES.length} unmeasured=${unmeasured} new=${totalNew} mentioning-this-project=${totalMine}`);
say(unmeasured === 0
  ? 'VERDICT MEASURED — every box walked'
  : `VERDICT PARTIAL — ${unmeasured} box(es) unreadable; the new-count is a FLOOR, not a total`);
