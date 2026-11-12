/**
 * unit-465bareline — does the STATIC form of the K-onceR gate leg see a duplicate BARE LINE?
 *
 * Subject: scripts/probe-once-anchor-duplication.mts (Argus's SWEPT leg, promoted 11/11 b942aa49).
 * Question: my task list carries a declared blindness measured against my own two-rev DELTA screen
 * ("the screen sees added DECLARATIONS, so a duplicate bare line is invisible"). The promoted form
 * is static, re-enumerating every declaration and counting occurrences over the whole file each run.
 * Does the blindness survive the change of form?
 *
 * R2: the reader is SLICED out of the subject at run time, both span markers asserted to occur
 * exactly once. R3: anchor names and values are read off the live files by that sliced reader, never
 * typed here. R1: nothing under scripts/ or packages/ is written — every arm is an in-memory string.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SUBJECT = join(REPO, 'scripts', 'probe-once-anchor-duplication.mts');

// Two tallies, deliberately separate: a REFUTED pre-registered prediction is a result, a RED
// apparatus check is a broken instrument, and they must not share an exit code (my own record:
// "a crash and an arm's red share an exit code" — so the exit code tracks the apparatus only).
let red = 0;
let refuted = 0;
let held = 0;
const ck = (arm: string, what: string, pass: boolean) => {
  if (!pass) red++;
  console.log(`${pass ? '[ok]' : 'FAIL'} ${arm}  ${what}`);
};
/** A pre-registered prediction. Records held/refuted; does NOT touch the exit code. */
const pred = (arm: string, what: string, holds: boolean) => {
  if (holds) held++;
  else refuted++;
  console.log(`${holds ? '[HELD]' : '[REFUTED]'} ${arm}  ${what}`);
};
const meas = (arm: string, line: string) => console.log(`[MEAS] ${arm}  ${line}`);

// ── S — slice the reader out of the subject, both ends pinned ─────────────────────────────────────

const subjectSrc = readFileSync(SUBJECT, 'utf8');
const START = '// ── shared apparatus — self-contained, not imported from docs/research/* scratch files';
const END = '// ── Section A — apparatus self-check';
const occRaw = (hay: string, needle: string) => hay.split(needle).length - 1;

ck('S1', `start marker occurs exactly once in the subject (got ${occRaw(subjectSrc, START)})`, occRaw(subjectSrc, START) === 1);
ck('S2', `end marker occurs exactly once in the subject (got ${occRaw(subjectSrc, END)})`, occRaw(subjectSrc, END) === 1);
if (red > 0) {
  console.log('\nREFUSED — the slice is not pinned at both ends; no figure is reported.');
  process.exit(1);
}

const from = subjectSrc.indexOf(START);
const to = subjectSrc.indexOf(END);
const span = subjectSrc.slice(from, to);
ck('S3', `sliced span is non-empty and shorter than the subject (${span.length} B of ${subjectSrc.length} B)`, span.length > 500 && span.length < subjectSrc.length);

const scratch = join(HERE, '.scratch');
mkdirSync(scratch, { recursive: true });
const slicePath = join(scratch, 'apparatus-sliced.mts');
writeFileSync(slicePath, `${span}\nexport { occ, literalDecls, consumedByOnce, flagsIn };\n`, 'utf8');
meas('S4', `slice written: ${span.length} B, ${span.split('\n').length} lines`);

const mod = await import(slicePath);
const { occ, literalDecls, consumedByOnce, flagsIn } = mod as {
  occ: (hay: string, needle: string) => number;
  literalDecls: (src: string) => Map<string, { value: string; line: number }>;
  consumedByOnce: (src: string, name: string, declLine: number) => { key: boolean; chain: string[] };
  flagsIn: (src: string) => Array<{ name: string; value: string; line: number; occ: number; chain: string[] }>;
};
ck('S5', 'all four bindings recovered and callable', [occ, literalDecls, consumedByOnce, flagsIn].every((f) => typeof f === 'function'));

// ── P (population) — grounded on the SUBJECT'S OWN B1 line, not on my re-typed filter ────────────

const drive = spawnSync('npx', ['tsx', SUBJECT], { cwd: REPO, encoding: 'utf8' });
ck('P0', `the shipped leg drives green, exit code read off the child (rc=${drive.status})`, drive.status === 0);
const b1 = (drive.stdout ?? '').split('\n').find((l) => l.includes('[MEAS] B1'));
ck('P1a', 'the shipped leg printed a B1 population line', b1 !== undefined);
const reported = (b1 ?? '').split(':').slice(1).join(':').split(',').map((s) => s.trim()).filter(Boolean);
const mine = readdirSync(join(REPO, 'scripts'))
  .filter((f) => f.endsWith('.mts') && f !== 'probe-once-anchor-duplication.mts')
  .filter((f) => readFileSync(join(REPO, 'scripts', f), 'utf8').includes("const once = (src: string, from: string, to: string) => {"))
  .sort();
ck('P1b', `my population equals the subject's own B1 list (${mine.length} vs ${reported.length})`,
  mine.length === reported.length && mine.every((f) => reported.includes(f)));
meas('P1c', `population: ${mine.join(', ')}`);

const srcOf = new Map(mine.map((f) => [f, readFileSync(join(REPO, 'scripts', f), 'utf8')]));

// ── P3/P5 — the consumed-anchor census, split by occ. Three figures, kept apart (R8) ─────────────

type Anchor = { file: string; name: string; value: string; line: number; occ: number };
const consumed: Anchor[] = [];
for (const [file, src] of srcOf) {
  for (const [name, d] of literalDecls(src)) {
    if (!consumedByOnce(src, name, d.line).key) continue;
    consumed.push({ file, name, value: d.value, line: d.line, occ: occ(src, d.value) });
  }
}
const at1 = consumed.filter((a) => a.occ === 1);
const at2 = consumed.filter((a) => a.occ >= 2);
meas('P3a', `once()-consumed literal anchors in the live population: ${consumed.length}`);
meas('P3b', `of those, at occ == 1: ${at1.length}  ·  at occ >= 2 (flagged): ${at2.length}`);
pred('P3c', `P3: at least one consumed anchor sits at occ == 1, so P1 is measurable on a real member (got ${at1.length})`, at1.length > 0);
ck('P5a', `the flagged figure agrees with the shipped F1 line, read off the child (got ${at2.length})`,
  ((drive.stdout ?? '').match(/\[MEAS\] F1\s+(\d+) live flag/) ?? [])[1] === String(at2.length));
const f1 = (drive.stdout ?? '').split('\n').find((l) => l.includes('[MEAS] F1')) ?? '';
pred('P5b', `P5: the subject reports flags only — its own output names no occ == 1 figure`,
  !/occ\s*==?\s*1/.test(drive.stdout ?? '') && /\d+ live flag\(s\)/.test(f1));

if (at1.length === 0) {
  console.log('\nREFUSED (R4) — no real member at occ == 1. A planted DECLARATION would test the delta');
  console.log('screen\'s subject, not the bare-line question. No P1/P2/P4 figure is reported.');
  process.exit(red > 0 ? 1 : 0);
}

// ── A1/A2 — P1: plant a duplicate of an occ==1 anchor's value INTO ITS OWN DECLARING FILE ────────

const victim = at1[0];
meas('A0', `victim read off the live file (R3): ${victim.file} ${victim.name} :${victim.line} occ=${victim.occ}`);
const baseFlags = flagsIn(srcOf.get(victim.file)!);
meas('A0b', `${victim.file} baseline flags: ${baseFlags.length} (${baseFlags.map((f) => f.name).join(', ') || 'none'})`);

// A1 — planted as a COMMENT line: duplicates the value's text without adding a declaration.
const a1Src = `${srcOf.get(victim.file)!}\n// ${victim.value}\n`;
const a1Flags = flagsIn(a1Src);
const a1Hit = a1Flags.find((f) => f.name === victim.name);
pred('A1a', `P1: comment-planted bare duplicate is FLAGGED on ${victim.name} (occ ${victim.occ} → ${a1Hit?.occ ?? 'absent'})`, a1Hit !== undefined && a1Hit.occ === 2);
ck('A1b', `it added exactly one flag, no collateral (${baseFlags.length} → ${a1Flags.length})`, a1Flags.length === baseFlags.length + 1);
ck('A1c', 'the plant added no literal declaration — it is a bare line, not a decl',
  literalDecls(a1Src).size === literalDecls(srcOf.get(victim.file)!).size);

// A2 — planted raw (uncommented). Reported separately: an anchor value that is itself a source line
// may parse as a declaration, in which case A1 is the clean arm and A2 says why.
const a2Src = `${srcOf.get(victim.file)!}\n${victim.value}\n`;
const a2Flags = flagsIn(a2Src);
const a2Hit = a2Flags.find((f) => f.name === victim.name);
const a2AddedDecls = literalDecls(a2Src).size - literalDecls(srcOf.get(victim.file)!).size;
meas('A2a', `raw plant: ${victim.name} ${a2Hit ? `flagged occ=${a2Hit.occ}` : 'NOT flagged'} · flags ${baseFlags.length} → ${a2Flags.length} · declarations added by the plant: ${a2AddedDecls}`);

// ── A3 — P2: the SAME plant, into a DIFFERENT population file than the declaring one ─────────────

const other = mine.find((f) => f !== victim.file)!;
const totalBase = [...srcOf.values()].reduce((n, s) => n + flagsIn(s).length, 0);
const planted = (f: string) => (f === other ? `${srcOf.get(f)!}\n// ${victim.value}\n` : srcOf.get(f)!);
const a3Total = mine.reduce((n, f) => n + flagsIn(planted(f)).length, 0);
pred('A3a', `P2: planting ${victim.name}'s value into ${other.slice(0, 18)}… adds NO flag anywhere (${totalBase} → ${a3Total})`, a3Total === totalBase);

// Diagnostic, added after P2 was refuted: WHICH flag appeared, and in which file. Named, because
// "cross-file plant is invisible" was the sentence I was about to publish and it is false.
const beforeNames = new Set(mine.flatMap((f) => flagsIn(srcOf.get(f)!).map((fl) => `${f}::${fl.name}`)));
const appeared = mine.flatMap((f) => flagsIn(planted(f)).map((fl) => ({ f, fl }))).filter((x) => !beforeNames.has(`${x.f}::${x.fl.name}`));
meas('A3c', `flags appearing on the cross-file plant: ${appeared.map((x) => `${x.fl.name} in ${x.f.slice(0, 18)}… occ=${x.fl.occ}`).join(' | ') || 'none'}`);
// Does the receiving file DECLARE an anchor with the same value? That is the mechanism if so.
const sameValueInOther = [...literalDecls(srcOf.get(other)!)].filter(([, d]) => d.value === victim.value).map(([n]) => n);
meas('A3d', `${other.slice(0, 18)}… declares ${sameValueInOther.length} anchor(s) with the SAME value as ${victim.name}: ${sameValueInOther.join(', ') || 'none'}`);

// A3e — the true cross-file blindness test: a value that NO other population file contains at all.
const exclusive = at1.filter((a) => mine.filter((f) => f !== a.file).every((f) => occ(srcOf.get(f)!, a.value) === 0));
meas('A3e', `consumed occ==1 anchors whose value appears in NO other population file: ${exclusive.length}${exclusive.length ? ` (e.g. ${exclusive[0].name} in ${exclusive[0].file.slice(0, 18)}…)` : ''}`);
if (exclusive.length > 0) {
  const ex = exclusive[0];
  const recv = mine.find((f) => f !== ex.file)!;
  const exTotal = mine.reduce((n, f) => n + flagsIn(f === recv ? `${srcOf.get(f)!}\n// ${ex.value}\n` : srcOf.get(f)!).length, 0);
  ck('A3f', `a value exclusive to its own file, planted into a sibling, adds NO flag (${totalBase} → ${exTotal}) — the declaring-file key really is blind HERE`, exTotal === totalBase);
}

// ── A4 — P4: the grandfather bound. Key is (file, name, value); occ is not in it ─────────────────

const BASELINE_REV = '467b8209052394096ea59679e735f2937992c64a';
const blob = (rev: string, path: string): string | null => {
  try {
    return execFileSync('git', ['show', `${rev}:${path}`], { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return null;
  }
};
const key = (file: string, name: string, value: string) => `${file}::${name}::${value}`;
const baselineKeys = new Set<string>();
for (const f of mine) {
  const b = blob(BASELINE_REV, `scripts/${f}`);
  if (b === null) continue;
  for (const fl of flagsIn(b)) baselineKeys.add(key(f, fl.name, fl.value));
}
ck('A4a', `baseline set rebuilt from ${BASELINE_REV.slice(0, 8)} with the sliced reader: ${baselineKeys.size} keys (shipped F1 says 9 grandfathered)`, baselineKeys.size === 9);

const already = at2[0];
const a4Src = `${srcOf.get(already.file)!}\n// ${already.value}\n`;
const a4Hit = flagsIn(a4Src).find((f) => f.name === already.name);
const a4New = a4Hit !== undefined && !baselineKeys.has(key(already.file, a4Hit.name, a4Hit.value));
meas('A4b', `already-flagged anchor ${already.name} (occ ${already.occ}): a bare-line plant takes it to occ=${a4Hit?.occ ?? '?'} and is ${a4New ? 'NEW → gate RED' : 'GRANDFATHERED → gate GREEN'}`);
pred('A4c', 'P4: the plant on an already-flagged anchor stays grandfathered — occ is not in the key', !a4New);

// and the mirror: is the A1 victim's new flag NEW against the baseline? (this is the gate verdict)
const a1New = a1Hit !== undefined && !baselineKeys.has(key(victim.file, a1Hit.name, a1Hit.value));
ck('A4d', `the A1 victim's flag IS new against the baseline — the gate would REDDEN on it`, a1New);

// ── R1 — read back, not asserted ─────────────────────────────────────────────────────────────────

const diff = execFileSync('git', ['diff', '--stat', '--', 'scripts', 'packages'], { cwd: REPO, encoding: 'utf8' });
ck('R1', `git diff --stat -- scripts packages is empty (${JSON.stringify(diff)})`, diff.trim() === '');

console.log(`\nAPPARATUS: ${red === 0 ? 'all checks passed' : `${red} check(s) RED — instrument broken, no figure stands`}`);
console.log(`PREDICTIONS: ${held} held, ${refuted} refuted (of ${held + refuted} pre-registered)`);
console.log('Exit code tracks the APPARATUS only — a refuted prediction is a result, not a failure.');
process.exit(red === 0 ? 0 : 1);
