#!/usr/bin/env node
/**
 * unit-465chainfloor arm D — the cross-seat cost of the §3 string cure, graded off Theseus's own
 * arm's output rather than re-typed from reading it.
 *
 * The drive is `node docs/research/unit-465foilchain-2026-11-13/arm-foilchain-a.mjs`, captured to
 * `drive3.theseus-arma-after-cure.out` in this unit. His committed `drive1.arma.out` is NOT
 * re-stamped; his arm writes only under his own git-ignored `scratch/a/`.
 *
 * Usage: node arm-chainfloor-d.mjs [--repo <path>] [--capture <file>]
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const pick = (f, d) => (argv.indexOf(f) === -1 ? d : argv[argv.indexOf(f) + 1]);
const REPO = resolve(pick('--repo', resolve(HERE, '..', '..', '..')));
const CAPTURE = resolve(pick('--capture', resolve(HERE, 'drive3.theseus-arma-after-cure.out')));
const HIS_ARM = 'docs/research/unit-465foilchain-2026-11-13/arm-foilchain-a.mjs';
const MY_ARM = 'docs/research/unit-465routecure-2026-11-13/arm-routecure-d.mjs';
const HIS_RECORDING = 'docs/research/unit-465foilchain-2026-11-13/drive1.arma.out';

const legs = [];
const red = [];
const refused = [];
const preds = [];
const refuted = [];
function record(id, what, got) {
  if (got === 'REFUSED') {
    legs.push({ id, what, verdict: 'REFUSED', detail: 'leg declared a refusal' });
    refused.push(id);
    return undefined;
  }
  const ok = got && got.ok === true;
  legs.push({ id, what, verdict: ok ? 'green' : 'RED', detail: (got && got.detail) || '' });
  if (!ok) red.push(id);
  return got;
}
function check(id, what, fn) {
  try {
    return record(id, what, fn());
  } catch (e) {
    legs.push({ id, what, verdict: 'REFUSED', detail: `threw: ${e.message}` });
    refused.push(id);
    return undefined;
  }
}
function pred(id, claim, held) {
  preds.push(id);
  if (held !== true) refuted.push(id);
  legs.push({ id: `pred:${id}`, what: claim, verdict: held === true ? 'HELD' : 'REFUTED', detail: '' });
}
function git(args) {
  const r = spawnSync('git', ['-C', REPO, ...args], { stdio: 'pipe', encoding: 'utf8', maxBuffer: 1 << 28 });
  return r.status !== 0 ? null : r.stdout;
}

const out = readFileSync(CAPTURE, 'utf8');
const lines = out.split('\n');
/** His table is `VERDICT  ID  what`, aligned — capture the token, never re-type it. */
const verdictOf = (id) => {
  const l = lines.find((x) => new RegExp(`^\\S+\\s+${id}\\s`).test(x));
  return l ? l.trim().split(/\s+/)[0] : null;
};
const headline = (lines.find((l) => l.startsWith('VERDICT/')) || '').trim();
const redSet = (() => {
  const m = /red=\[([^\]]*)\]/.exec(headline);
  return m ? m[1].split(',').filter(Boolean) : null;
})();

check('E0', 'the capture is HIS arm\'s output and names the cripple source rev it actually read', () => {
  const src = lines.find((l) => l.startsWith('cripple source ='));
  const m = src ? /@([0-9a-f]{7,40})/.exec(src) : null;
  return {
    ok: lines[0].includes('unit-465foilchain arm A') && m !== null,
    detail: `header=${JSON.stringify(lines[0])} · ${JSON.stringify(src)}`,
  };
});

const p15 = check('E1', 'P15 — his A-src pin goes RED: it hashes the LIVE file against his rev, and my cure moved it', () => {
  const v = verdictOf('A-src');
  const l = lines.find((x) => /^\S+\s+A-src\s/.test(x));
  const detailLine = l ? lines[lines.indexOf(l) + 1].trim() : '';
  return { ok: v === 'RED', detail: `A-src → ${v} · ${detailLine}` };
});
pred('P15', 'his A-src leg reddens on my cure', p15 !== undefined && p15.ok === true);

const p16 = check('E2', 'P16 — C1 and C2 go RED and his P7/P8 flip to refuted', () => {
  const c1 = verdictOf('C1');
  const c2 = verdictOf('C2');
  const p7 = verdictOf('P7');
  const p8 = verdictOf('P8');
  return {
    ok: c1 === 'RED' && c2 === 'RED' && p7 !== 'LANDED' && p8 !== 'LANDED',
    detail: `C1 → ${c1} · C2 → ${c2} · his P7 → ${p7} · his P8 → ${p8}`,
  };
});
pred('P16', 'his C1/C2 redden and his P7/P8 are refuted', p16 !== undefined && p16.ok === true);

const p17 = check('E3', 'P17 — A3/B1 stay green BECAUSE my cure made `!includes("misordered")` a tautology', () => {
  const a3 = verdictOf('A3');
  const b1 = verdictOf('B1');
  const stillGreen = a3 === 'green' && b1 === 'green';
  // The predicted MECHANISM, graded separately from the verdict: a tautology requires that the text
  // they read no longer contains the word. It plainly does — C1/C2 print it from the same blob.
  const wordStillInTheBlobTheyRead = /misordered/.test(out);
  return {
    ok: stillGreen && wordStillInTheBlobTheyRead === false,
    detail:
      `A3 → ${a3} · B1 → ${b1} (verdict as predicted) · but the word is still present in the blob ` +
      `they read: ${wordStillInTheBlobTheyRead} — so the conjunct is NOT a tautology and the reason ` +
      'I pre-registered is false. Verdict right, mechanism wrong.',
  };
});
pred('P17', 'A3/B1 stay green because the cure made their conjunct unconditionally true', p17 !== undefined && p17.ok === true);

const p18 = check('E4', 'P18 — his red set is a strict superset of [D3] AND contains A-src, C1 and C2', () => {
  if (redSet === null) return 'REFUSED';
  const superset = redSet.includes('D3') && redSet.length > 1;
  const all3 = ['A-src', 'C1', 'C2'].every((x) => redSet.includes(x));
  return { ok: superset && all3, detail: `red=[${redSet}] · strict superset of [D3]=${superset} · contains all three=${all3}` };
});
pred('P18', 'his red set contains A-src, C1 and C2', p18 !== undefined && p18.ok === true);

check('E5', 'THE REASON P16/P17/P18 FAILED, read off his source: his cripples come from a PINNED REV, not the live file', () => {
  const src = git(['show', `HEAD:${HIS_ARM}`]);
  if (src === null) return 'REFUSED';
  const crippleFromRev = /git\(\[\s*'show',\s*`\$\{SRC_REV\}:\$\{MODPATH\}`/.test(src) || /\$\{SRC_REV\}:/.test(src);
  const liveOnlyForThePin = /hash-object/.test(src);
  return {
    ok: crippleFromRev && liveOnlyForThePin,
    detail:
      `his cripple source is \${SRC_REV}:\${MODPATH} → ${crippleFromRev}; the LIVE path is used for a ` +
      `hash-object PIN leg → ${liveOnlyForThePin}. I inferred "reads the live module" from the LIVE ` +
      'constant without checking what the cripple source was — the constant is the pin, not the subject.',
  };
});

check('E6', 'AND THE FINDING: my own arm D has NO equivalent pin — it reads LIVE with nothing asserting LIVE is the rev it claims to grade', () => {
  const mine = git(['show', `HEAD:${MY_ARM}`]);
  if (mine === null) return 'REFUSED';
  const readsLive = /const LIVE = resolve\(/.test(mine);
  const hasHashPin = /hash-object/.test(mine);
  return {
    ok: readsLive === true && hasHashPin === false,
    detail:
      `arm-routecure-d.mjs reads a LIVE constant → ${readsLive}; contains a hash-object pin leg → ` +
      `${hasHashPin}. His A-src is the only leg in either instrument that noticed my cure, and it is ` +
      'the design I mispredicted. Routed to myself as a mechanism, not patched here.',
  };
});

check('E7', 'his committed recording is NOT re-stamped by this drive', () => {
  const s = git(['status', '--porcelain', HIS_RECORDING, HIS_ARM]);
  if (s === null) return 'REFUSED';
  return { ok: s.trim() === '', detail: `git status --porcelain <his recording> <his arm> → ${JSON.stringify(s)}` };
});

check('E8', 'no gate leg is owed — packages/ and scripts/ clean', () => {
  const s = git(['status', '--porcelain', 'packages', 'scripts']);
  if (s === null) return 'REFUSED';
  return { ok: s.trim() === '', detail: `git status --porcelain packages scripts → ${JSON.stringify(s)}` };
});

console.log('unit-465chainfloor arm D — the cross-seat cost of the string cure, graded off his arm\'s own output');
console.log(`repo=${REPO}`);
console.log(`capture=${CAPTURE}`);
console.log(`his headline = ${JSON.stringify(headline)}`);
console.log('');
for (const l of legs) {
  console.log(`${l.verdict.padEnd(8)} ${l.id.padEnd(10)} ${l.what}`);
  if (l.detail) console.log(`         ${l.detail}`);
}
console.log('');
console.log(
  `VERDICT/${red.length || refused.length || refuted.length ? 1 : 0} ` +
    `${red.length ? 'RED' : refused.length ? 'REFUSED' : refuted.length ? 'REFUTED' : 'GREEN'} ` +
    `legs=${legs.filter((l) => !l.id.startsWith('pred:')).length} red=[${red}] refused=[${refused}] ` +
    `preds=${preds.length} refuted=[${refuted}]`
);
process.exit(red.length || refused.length || refuted.length ? 1 : 0);
