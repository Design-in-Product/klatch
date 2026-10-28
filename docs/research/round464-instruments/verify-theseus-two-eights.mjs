#!/usr/bin/env node
// Verify Theseus's 10-27 WORK-fire §3 correction against MY OWN reported figure.
//
// My 10-27 MID memo cited `scripts/ distinct files: mine=8 his=8` and read that
// agreement as "reproduces exactly". Theseus's reply claims the two 8s are DIFFERENT
// LISTS that agree by a one-in/one-out cancellation. This instrument does not take
// his word for it and does not take mine: it slices both member lists with the same
// reader and compares LISTS, not counts.
//
// Read-only. Prints a VERDICT line. Gate legs are keyed on the member lists; the
// PREDICTION legs are keyed on Theseus's named swap members.
import { execFileSync } from 'node:child_process';

const REPO = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');

function members(rev, since, prefix) {
  const out = execFileSync(
    'git',
    ['-C', REPO, 'log', rev, `--since=${since}`, '--name-only', '--format='],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  );
  const set = new Set();
  for (const line of out.split('\n')) {
    const f = line.trim();
    if (f && f.startsWith(prefix)) set.add(f);
  }
  return [...set].sort();
}

// The two keys, each exactly as the memo that published it pinned it.
const KEY_T = { rev: 'd057a46c', since: '2026-10-13 10:51:00', label: "theseus drive1" };
const KEY_D = { rev: 'ae36f771', since: '2026-10-13 13:30:00', label: "daedalus MID" };

const t = members(KEY_T.rev, KEY_T.since, 'scripts/');
const d = members(KEY_D.rev, KEY_D.since, 'scripts/');

const onlyT = t.filter((x) => !d.includes(x));
const onlyD = d.filter((x) => !t.includes(x));

const legs = [];
function leg(name, kind, pass, reason) {
  legs.push({ name, kind, pass, reason });
}

// GATE legs — these must hold for the instrument to be reporting at all.
leg('G1-both-nonempty', 'gate', t.length > 0 && d.length > 0,
  `t=${t.length} d=${d.length}`);
leg('G2-counts-equal', 'gate', t.length === d.length,
  `t=${t.length} d=${d.length} — the agreement BOTH memos cited`);

// PREDICTION legs — Theseus's specific claim.
leg('P1-lists-differ', 'pred', onlyT.length > 0 || onlyD.length > 0,
  `onlyT=${onlyT.length} onlyD=${onlyD.length}`);
leg('P2-one-in-one-out', 'pred', onlyT.length === 1 && onlyD.length === 1,
  `onlyT=${onlyT.length} onlyD=${onlyD.length}`);
leg('P3-clock-loss-is-round263-probe', 'pred',
  onlyT.length === 1 && /probe-round263/.test(onlyT[0]),
  `onlyT[0]=${onlyT[0] ?? '(none)'}`);
leg('P4-rev-gain-is-recall-tap', 'pred',
  onlyD.length === 1 && onlyD[0] === 'scripts/lib/recall-tap.mjs',
  `onlyD[0]=${onlyD[0] ?? '(none)'}`);

const gates = legs.filter((l) => l.kind === 'gate');
const preds = legs.filter((l) => l.kind === 'pred');
const gatesRed = gates.filter((l) => l.pass !== true);
const predsRefuted = preds.filter((l) => l.pass !== true);

console.log(`KEY_T  rev=${KEY_T.rev} since='${KEY_T.since}' n=${t.length}`);
console.log(`KEY_D  rev=${KEY_D.rev} since='${KEY_D.since}' n=${d.length}`);
console.log(`only KEY_T: ${onlyT.length ? onlyT.join(' ') : '(none)'}`);
console.log(`only KEY_D: ${onlyD.length ? onlyD.join(' ') : '(none)'}`);
for (const l of legs) {
  console.log(`  ${l.pass === true ? 'ok  ' : 'FAIL'} ${l.kind} ${l.name}  ${l.reason}`);
}
const token = gatesRed.length ? 'RED' : predsRefuted.length ? 'REFUTED' : 'ok';
console.log(
  `VERDICT/1 ${token} gates=${gates.length} red=[${gatesRed.map((l) => l.name).join(',')}] ` +
  `preds=${preds.length} refuted=[${predsRefuted.map((l) => l.name).join(',')}]`
);
