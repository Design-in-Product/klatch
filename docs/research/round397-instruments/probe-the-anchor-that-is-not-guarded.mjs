/**
 * Round 397, §2 — the counterfactual harness for THE FINDING.
 *
 * Theseus's Round 396 `T4` carries this conjunct, at line 307 of his instrument:
 *
 *   const renamedAway = !/\btype Row\b/.test(readFileSync(join(REPO, PROBE_371_PATH), 'utf8')
 *                        .slice(readFileSync(join(REPO, PROBE_371_PATH), 'utf8')
 *                        .indexOf('ROUND 396 RE-KEY')));
 *
 * `indexOf` returns **-1** when its needle is absent, and `.slice(-1)` is the LAST CHARACTER of
 * the string. So if the marker comment ever leaves `probe-round371` — a reword, a later round's
 * re-key replacing the block, a refactor — his detector stops reading his block and starts
 * reading one character, `/\btype Row\b/` cannot match one character, and `renamedAway` goes
 * **true**. The conjunct passes at exactly the moment it loses its subject. It is the sentinel
 * mechanism of my own Round 393 (`-1 === -1` passing beside a sentence saying "unmoved"), in a
 * grade whose own §4 item one is about a `type Row` that nothing he ran named.
 *
 * HOW THIS IS DRIVEN — his own §3 precedent, and the only honest option here. His expression
 * reads the LIVE working tree, so driving it under mutation would mean editing a swept probe in
 * a tree other agents are working in. Instead the expression is LIFTED byte-for-byte out of his
 * instrument at its own commit, the two `readFileSync(...)` calls are textually substituted with
 * `src`, and the result is compiled with `new Function` — so the function driven below IS his
 * text, not a retyping of it (357). Both the lift and the substitution are asserted, printed,
 * and the compiled body is echoed. Nothing is written to any tree.
 *
 *   node docs/research/round397-instruments/probe-the-anchor-that-is-not-guarded.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const show = (rev, path) => git(['show', `${rev}:${path}`]);

const HIS_396_PATH =
  'docs/research/round396-instruments/grade-the-grade-that-reddens-on-its-own-routed-cure.mjs';
const HIS_396_PIN = git(['log', '-1', '--format=%h', '--', HIS_396_PATH]).trim();
const PROBE_371_PATH =
  'scripts/probe-round371-the-characterisation-item-is-a-registry-not-a-sweep.mts';
const MARKER = 'ROUND 396 RE-KEY';
const READ_CALL = "readFileSync(join(REPO, PROBE_371_PATH), 'utf8')";

console.log(`# his instrument pinned at ${HIS_396_PIN} (git log -1 on the path, measured here)`);

// ── the lift, byte-for-byte out of his file at his own commit ────────────────────────────────
const his396 = show(HIS_396_PIN, HIS_396_PATH);
const LINE = (his396.match(/^const renamedAway = .*$/m) || [null])[0];
if (LINE === null) {
  console.log('REFUSED: no `const renamedAway =` line in his instrument at that pin.');
  process.exit(1);
}
console.log(`\n# HIS LINE, lifted verbatim:\n${LINE}`);
const reads = LINE.split(READ_CALL).length - 1;
const SUBSTITUTED = LINE.split(READ_CALL).join('src');
console.log(`\n# substituted (the ONLY change: ${reads} × \`${READ_CALL}\` → \`src\`):\n${SUBSTITUTED}`);
console.log(`# round-trips back to his line: ${SUBSTITUTED.split('src').join(READ_CALL) === LINE}`);
const hisKey = new Function('src', `${SUBSTITUTED}\nreturn renamedAway;`);

// ── the anchors, asserted unique BEFORE anything is substituted (347) ────────────────────────
const live = readFileSync(join(REPO, PROBE_371_PATH), 'utf8');
const markerHits = live.split(MARKER).length - 1;
const typeRowHits = live.split('type Row').length - 1;
const markerAt = live.indexOf(MARKER);
const typeRowAt = live.indexOf('type Row');
console.log(
  `\n# anchors in the LIVE ${PROBE_371_PATH.split('/').pop()}:\n` +
    `#   "${MARKER}" × ${markerHits} (first at byte ${markerAt})\n` +
    `#   "type Row"  × ${typeRowHits} (first at byte ${typeRowAt}, which is ` +
    `${typeRowAt < markerAt ? 'BEFORE' : 'after'} the marker — that is why the slice exists)`,
);
if (markerHits !== 1 || typeRowHits !== 1) {
  console.log('REFUSED to mutate: an anchor is not unique.');
  process.exit(1);
}

// ── the four populations, expectations WRITTEN DOWN FIRST ────────────────────────────────────
/**
 * One axis per row against CONTROL-A. `KP` is the known positive: the detector must be able to
 * say false at all, or every other row is uninformative (355). `CF-1` is the finding: the defect
 * KP carries, plus the one further change of the marker going away.
 */
const reintroduce = (src) => {
  const at = src.indexOf(MARKER);
  const eol = src.indexOf('\n', at);
  return `${src.slice(0, eol + 1)}type Row = { tag: string };\n${src.slice(eol + 1)}`;
};
const dropMarker = (src) => src.split(MARKER).join('ROUND 396 REKEYED');
const CASES = [
  ['CONTROL-A', 'the live bytes, untouched', (s) => s, true, 'green, and correctly so'],
  ['KP', '`type Row` reintroduced just after the marker', reintroduce, false, 'RED — the detector has teeth while its anchor is present'],
  ['CF-1', 'the marker reworded AND `type Row` reintroduced at the same spot', (s) => dropMarker(reintroduce(s)), true, 'GREEN WITH THE DEFECT PRESENT — the finding'],
  ['CF-2', 'the marker reworded only, nothing reintroduced', dropMarker, true, 'green, and indistinguishable from CONTROL-A'],
];
console.log('\n# EXPECTED, written before any row drove:');
for (const [tag, what, , expect, why] of CASES) {
  console.log(`#   ${tag.padEnd(9)} ${String(expect).padEnd(5)} — ${what} → ${why}`);
}

console.log('\n| case | marker present | `type Row` after the marker | slice length | his key |');
console.log('|---|---|---|---|---|');
const results = {};
for (const [tag, , mutate, expect] of CASES) {
  const src = mutate(live);
  const idx = src.indexOf(MARKER);
  const sliced = src.slice(idx);
  const defectPresent = /\btype Row\b/.test(src.slice(Math.max(idx, 0)));
  const got = hisKey(src);
  results[tag] = { got, expect, idx, sliceLen: sliced.length, defectPresent };
  console.log(
    `| ${tag} | ${idx !== -1} (indexOf ${idx}) | ${idx === -1 ? 'n/a — the slice is not his block' : defectPresent} | ` +
      `${sliced.length} | **${got}** (expected ${expect}${got === expect ? ', AS PREDICTED' : ', **PREDICTION WRONG**'}) |`,
  );
}

// ── the mechanism, stated as a measurement rather than as prose ──────────────────────────────
const vac = results['CF-1'];
const kp = results['KP'];
console.log(
  `\n# MECHANISM: with the marker gone, \`indexOf\` returns ${vac.idx} and \`.slice(${vac.idx})\` is ` +
    `${vac.sliceLen} character(s) of a ${live.length}-character file — ` +
    `${JSON.stringify(dropMarker(reintroduce(live)).slice(vac.idx))}. A one-character window cannot ` +
    `contain \`type Row\`, so the test is false and the conjunct is true.`,
);
console.log(
  `# ISOLATION: KP and CF-1 carry the IDENTICAL defect (both ${kp.defectPresent ? 'reintroduce `type Row`' : '—'}); ` +
    `the single axis between them is whether the marker string is still spelled "${MARKER}". ` +
    `KP → ${kp.got}, CF-1 → ${vac.got}.`,
);

const asPredicted = CASES.every(([tag, , , expect]) => results[tag].got === expect);
const vacuous = results['CF-1'].got === true && results['KP'].got === false;
const liftOk = SUBSTITUTED.split('src').join(READ_CALL) === LINE && reads === 2;
console.log(
  `\nPROBE VERDICT: lift faithful: ${liftOk}; every row as predicted: ${asPredicted}; ` +
    `the conjunct passes with the defect present once the anchor goes: ${vacuous}`,
);
console.log(
  `PROBE ${liftOk && asPredicted && vacuous ? 'CONFIRMS' : 'DOES NOT CONFIRM'} the finding`,
);
process.exit(liftOk && asPredicted && vacuous ? 0 : 1);
