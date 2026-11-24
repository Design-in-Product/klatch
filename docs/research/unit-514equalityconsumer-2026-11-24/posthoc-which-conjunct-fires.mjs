#!/usr/bin/env node
/**
 * unit-514 post-hoc — WHICH conjunct of each flipped verdict actually fires, and whether the
 * equality comparison Daedalus named is reached at all.
 *
 * Arm B established that `P6.d` and `P6.e` flip true->false. Neither the host's output nor Arm B
 * says WHICH conjunct did it, and `&&` short-circuits, so a conjunct can be false-by-never-running.
 * That distinction is the whole question for his §6 item 2: his class is "the equality-keyed
 * consumer population", and if the `===` is short-circuited away then the class is named after the
 * member that does not fire.
 *
 * Method: rebuild each verdict's conjuncts as separate closures over the two drives' own JSON
 * (Arm B's captured stdout, re-driven here from the same scratch construction), evaluate each in
 * isolation, and separately record evaluation order so "false" and "not reached" are different
 * columns. Nothing is decided by eye; the conjunct sources are printed verbatim from the frozen
 * host file, sliced at the lines Arm A's census named.
 *
 * No brace comparison in this file, deliberately (see Arm A's docblock).
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';

const OLD = 'tracked files read';
const NEW = 'tracked code files read';
const HOST_DIR = 'docs/research/unit-506labelmultiset-2026-11-23';
const HOST_REL = join(HOST_DIR, 'posthoc-standing-linewise.mjs');
const STAGES = ['standing-pre', 'standing-after-arm', 'standing-after-docblock'];
const sha12 = (b) => createHash('sha256').update(b).digest('hex').slice(0, 12);
const SCRATCH = join(process.cwd(), 'scratch-unit514c-renamed');

const out = { pins: {}, conjunctSources: {}, rows: [], summary: {}, hygiene: {} };

try {
  const hostBytes = readFileSync(HOST_REL);
  out.pins.hostSha12 = sha12(hostBytes);
  const hostText = hostBytes.toString('utf8');
  const lines = hostText.split('\n');
  // the conjunct sources, sliced from the frozen file at the lines Arm A's census named
  out.conjunctSources['P6.d'] = lines.slice(113, 115).map((l) => l.trim());
  out.conjunctSources['P6.e'] = lines.slice(115, 119).map((l) => l.trim());

  // drive the renamed tree once more, same construction as Arm B, for this script's own JSON
  rmSync(SCRATCH, { recursive: true, force: true });
  mkdirSync(join(SCRATCH, 'captures'), { recursive: true });
  writeFileSync(join(SCRATCH, 'posthoc-standing-linewise.mjs'), hostBytes);
  for (const s of STAGES) {
    const o = readFileSync(join(HOST_DIR, 'captures', `${s}.out`), 'utf8');
    const sub = o.split(OLD).join(NEW);
    if (o.includes(NEW) || sub.split(NEW).join(OLD) !== o) throw new Error(`substitution not clean for ${s}`);
    writeFileSync(join(SCRATCH, 'captures', `${s}.out`), sub);
    writeFileSync(join(SCRATCH, 'captures', `${s}.err`), readFileSync(join(HOST_DIR, 'captures', `${s}.err`)));
  }
  const drive = (dir) => {
    const r = spawnSync('node', [join(dir, 'posthoc-standing-linewise.mjs')], { encoding: 'utf8', maxBuffer: 1e8 });
    if (r.status !== 0) throw new Error(`drive in ${dir} exited ${r.status}`);
    return JSON.parse(r.stdout);
  };
  const rJson = drive(SCRATCH);
  const vJson = JSON.parse(readFileSync(join(HOST_DIR, 'captures', 'P6-standing-linewise.json'), 'utf8'));
  out.pins.verbatimSource = 'the host\'s own published P6-standing-linewise.json, which Arm B reproduced byte-for-byte';

  /**
   * Each verdict as an ORDERED list of conjuncts. `reached` is computed by walking the list and
   * stopping at the first false — the same thing `&&` does — so "false" and "never evaluated" end
   * up in different columns.
   */
  const VERDICTS = {
    'P6.d': [
      { src: 'movedFigures.length === 1', kind: 'COUNT', f: (j) => j.movedFigures.length === 1 },
      { src: "movedFigures[0] === 'tracked files read'", kind: 'EQUALITY', f: (j) => j.movedFigures[0] === OLD },
    ],
    'P6.e': [
      { src: 'firstToLast.onlyInFirst.length === 1', kind: 'COUNT', f: (j) => j.preToPost.onlyInPre.length === 1 },
      { src: 'firstToLast.onlyInSecond.length === 1', kind: 'COUNT', f: (j) => j.preToPost.onlyInPost.length === 1 },
      { src: "firstToLast.onlyInFirst[0].includes('tracked files read')", kind: 'INCLUDES', f: (j) => (j.preToPost.onlyInPre[0] ?? '').includes(OLD) },
      { src: "firstToLast.onlyInSecond[0].includes('tracked files read')", kind: 'INCLUDES', f: (j) => (j.preToPost.onlyInPost[0] ?? '').includes(OLD) },
    ],
  };

  for (const [name, conjuncts] of Object.entries(VERDICTS)) {
    for (const drv of [['VERBATIM', vJson], ['RENAMED', rJson]]) {
      const [drvName, j] = drv;
      let stillRunning = true;
      for (const c of conjuncts) {
        let value = null;
        let reached = stillRunning;
        if (stillRunning) {
          value = c.f(j);
          if (value !== true) stillRunning = false;
        }
        out.rows.push({
          verdict: name, drive: drvName, kind: c.kind, conjunct: c.src, reached, value,
          state: !reached ? 'NOT REACHED (short-circuited)' : value === true ? 'true' : 'FALSE — this is the one that fires',
        });
      }
    }
  }

  const fired = out.rows.filter((r) => r.drive === 'RENAMED' && r.reached && r.value === false);
  const unreached = out.rows.filter((r) => r.drive === 'RENAMED' && !r.reached);
  out.summary = {
    whatFiresUnderTheRename: fired.map((r) => ({ verdict: r.verdict, kind: r.kind, conjunct: r.conjunct })),
    neverReachedUnderTheRename: unreached.map((r) => ({ verdict: r.verdict, kind: r.kind, conjunct: r.conjunct })),
    equalityConjunctsReached: out.rows.filter((r) => r.drive === 'RENAMED' && r.kind === 'EQUALITY' && r.reached).length,
    equalityConjunctsTotal: out.rows.filter((r) => r.drive === 'RENAMED' && r.kind === 'EQUALITY').length,
    includesConjunctsThatFired: fired.filter((r) => r.kind === 'INCLUDES').length,
    countConjunctsThatFired: fired.filter((r) => r.kind === 'COUNT').length,
  };
} finally {
  rmSync(SCRATCH, { recursive: true, force: true });
  out.hygiene.scratchRemoved = !existsSync(SCRATCH);
  try {
    const p = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' });
    out.hygiene.gitStatusPorcelain = p.trim().split('\n').filter(Boolean);
    out.hygiene.noScratchLeft = !p.includes('scratch-unit514');
  } catch (e) { out.hygiene.gitStatusError = String(e).slice(0, 200); }

  console.log('=== unit-514 post-hoc — which conjunct fires, and is the equality one reached? ===\n');
  console.log(`  host sha12 ${out.pins.hostSha12}\n`);
  for (const [k, v] of Object.entries(out.conjunctSources)) {
    console.log(`  ${k} as written in the frozen host:`);
    for (const l of v) console.log(`      ${l}`);
  }
  console.log('');
  for (const r of out.rows) {
    console.log(`  ${r.drive.padEnd(9)} ${r.verdict}  ${r.kind.padEnd(9)} ${r.state.padEnd(32)} ${r.conjunct}`);
  }
  console.log(`\n  SUMMARY`);
  console.log(`    conjuncts that fire under the rename: ${JSON.stringify(out.summary.whatFiresUnderTheRename)}`);
  console.log(`    never reached under the rename:       ${JSON.stringify(out.summary.neverReachedUnderTheRename)}`);
  console.log(`    EQUALITY conjuncts reached: ${out.summary.equalityConjunctsReached} of ${out.summary.equalityConjunctsTotal}`);
  console.log(`    INCLUDES conjuncts that fired: ${out.summary.includesConjunctsThatFired}   COUNT conjuncts that fired: ${out.summary.countConjunctsThatFired}`);
  console.log(`\n  scratch removed: ${out.hygiene.scratchRemoved}  git status: ${JSON.stringify(out.hygiene.gitStatusPorcelain ?? out.hygiene.gitStatusError)}`);
  console.log(`\n${JSON.stringify(out, null, 2)}`);
}
