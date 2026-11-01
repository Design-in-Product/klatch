// unit-464steal — the counterfactual my 09:28 §5 registered as P6 and did not drive.
//
// The claim under test, in my own words from that memo:
//
//   "any `--grep`-keyed selector in this repo is stealable by the prose we write about it …
//    the harm inverts the instrument: the KP leg would be measured against the state it exists
//    to distinguish itself from, SILENTLY."
//
// It could not be driven in the live repo, because driving it means committing a message that
// quotes the phrase — which is the defect, not a test of it. So it is driven in a scratch CLONE
// under gitignored `.testdata/`, and the live tree is only ever read.
//
// Run from the repo root, one arm per invocation, each into its own recording:
//   node docs/research/unit-464steal-2026-11-01/drive-the-steal.mjs --arm=kn
//   node docs/research/unit-464steal-2026-11-01/drive-the-steal.mjs --arm=steal
//
// `--arm=kn` is driven FIRST, on the standing expectation that a scratch harness is what fails.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ARM = (process.argv.find((a) => a.startsWith('--arm=')) || '').slice('--arm='.length);
if (ARM !== 'kn' && ARM !== 'steal') {
  console.log('REFUSED: --arm=kn or --arm=steal is required; a default arm would let a recording');
  console.log('         be attributed to the wrong world state.');
  process.exit(2);
}

const CLONE = resolve('.testdata/unit-464steal/clone');
const LIVE = resolve('.');

// ---------------------------------------------------------------- the subject, read not retyped
// The two values S1 is keyed on. Lifted from the live file by regex rather than typed, so that a
// re-spelling of the cure cannot leave this instrument grading a literal nobody uses any more.
const S1_PATH = 'docs/research/round378-instruments/grade-b3-known-positive.mjs';
const s1Src = readFileSync(join(LIVE, S1_PATH), 'utf8');
const pinM = s1Src.match(/^const CURE = '([0-9a-f]{40})';$/m);
const grepM = s1Src.match(/^\s*\['log', '--format=%H', '--grep=(.+?)'\],$/m);
const declM = s1Src.match(/^const DECL_FRAGMENT = '(.+?)';$/m);
const refusals = [];
if (!pinM) refusals.push(`${S1_PATH}: no \`const CURE = '<40 hex>';\` line`);
if (!grepM) refusals.push(`${S1_PATH}: no \`['log', '--format=%H', '--grep=…'],\` line`);
if (!declM) refusals.push(`${S1_PATH}: no \`const DECL_FRAGMENT = '…';\` line`);
if (refusals.length) {
  console.log('REFUSED — the subject could not be lifted, so nothing below would be about S1:');
  for (const r of refusals) console.log('   ' + r);
  process.exit(2);
}
const CURE = pinM[1];
const PHRASE = grepM[1];
const DECL_FRAGMENT = declM[1];
const occ = (hay, needle) => hay.split(needle).length - 1;   // S1's own helper, as shipped

// ------------------------------------------------------------------------------- the steal commit
// Deterministic: fixed author, committer and both dates, and `--allow-empty` so there is no tree
// to vary. Same parent ⇒ same sha, so this arm is re-drivable and its recording comparable.
// The date is after the newest real commit so that `log -1` (reverse-chronological) selects it;
// that is the mechanism under test, not an artefact — a memo commit about a finding IS the newest.
const STEAL_WHEN = '2026-11-01T14:00:00-08:00';
const STEAL_SUBJECT = 'mail(Daedalus -> Theseus): the stealable class, reported';
// The body is the realistic shape: a memo commit quoting the selector's phrase in passing. The
// subject does NOT contain it — that is the sharper case, because a whole-subject quotation is
// the thing Theseus measured at 0, while a clause inside a body is what S1 is keyed on.
const STEAL_BODY = `Reports the round377 finding, in which ${PHRASE} on both sites.\n`;

// ------------------------------------------------------------------------------------------ gates
const legs = [];
const check = (name, ok, note) => { legs.push({ name, ok, note }); return ok; };
const g = (args, cwd) => execFileSync('git', args,
  { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 }).trim();

// GCLONE — the scratch tree is a repo, is NOT the live one, and is under an ignored path.
let cloneReal = null;
let liveReal = null;
let cloneOk = false;
try {
  cloneReal = g(['rev-parse', '--absolute-git-dir'], CLONE);
  liveReal = g(['rev-parse', '--absolute-git-dir'], LIVE);
  cloneOk = cloneReal !== liveReal
    && resolve(CLONE).startsWith(resolve(LIVE) + sep + '.testdata' + sep)
    && existsSync(join(CLONE, 'scripts', 'lib', 'strip-source.mjs'));
} catch (e) { cloneReal = 'THREW: ' + String(e.message).split('\n')[0]; }
check('GCLONE', cloneOk,
  `clone git-dir ${cloneReal} ≠ live ${liveReal}, under .testdata/, has scripts/lib/`);
if (!cloneOk) {
  console.log('REFUSED: no usable scratch clone at ' + CLONE);
  console.log('   build it with: git clone --local --no-hardlinks . .testdata/unit-464steal/clone');
  for (const l of legs) console.log(`   ${l.name} ${l.ok ? 'ok' : 'RED'} — ${l.note}`);
  process.exit(2);
}

// GPIN — the clone carries the commit S1 is pinned to. Without it every reading below is vacuous.
let pinPresent = false;
try { pinPresent = g(['cat-file', '-t', CURE], CLONE) === 'commit'; } catch { pinPresent = false; }
check('GPIN', pinPresent, `${CURE.slice(0, 8)} is a commit in the clone`);

// GREADER — my own KP model uses the LIVE strip-source; assert it is byte-identical to the one
// the real instrument will load from inside the clone, or the two readings are not comparable.
const readerSame = readFileSync(join(LIVE, 'scripts/lib/strip-source.mjs'), 'utf8')
  === readFileSync(join(CLONE, 'scripts/lib/strip-source.mjs'), 'utf8');
check('GREADER', readerSame, 'live and clone scripts/lib/strip-source.mjs byte-identical');

// GLIVECLEAN — nothing in this unit may touch the product tree.
const liveDirty = g(['status', '--porcelain', '--', 'packages/', 'scripts/'], LIVE);
check('GLIVECLEAN', liveDirty.length === 0,
  `git status --porcelain -- packages/ scripts/ is ${liveDirty.length} bytes in the LIVE tree`);

// ------------------------------------------------------------------- put the clone into its world
const matchesBefore = g(['log', '--format=%H', '--grep=' + PHRASE], CLONE)
  .split('\n').filter((l) => l.length === 40);
let stealSha = null;
if (ARM === 'steal') {
  const already = matchesBefore.length > 1;
  if (!already) {
    execFileSync('git', ['commit', '--allow-empty', '--quiet',
      '-m', STEAL_SUBJECT, '-m', STEAL_BODY], {
      cwd: CLONE,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: 'Daedalus (Klatch)', GIT_AUTHOR_EMAIL: 'xian@designinproduct.com',
        GIT_COMMITTER_NAME: 'Daedalus (Klatch)', GIT_COMMITTER_EMAIL: 'xian@designinproduct.com',
        GIT_AUTHOR_DATE: STEAL_WHEN, GIT_COMMITTER_DATE: STEAL_WHEN,
      },
    });
  }
  stealSha = g(['rev-parse', 'HEAD'], CLONE);
}
const matches = g(['log', '--format=%H', '--grep=' + PHRASE], CLONE)
  .split('\n').filter((l) => l.length === 40);

// GARMREACH — the arm must actually have moved the figure it exists to move. A steal arm that
// left the match count where the KN found it would make every reading below the KN's reading.
check('GARMREACH',
  ARM === 'kn' ? matches.length === 1 : (matches.length === matchesBefore.length + 1 || matches.length === 2),
  `arm=${ARM}: matches ${matchesBefore.length} → ${matches.length}` +
  (stealSha ? `, steal commit ${stealSha.slice(0, 8)}` : ''));

// ------------------------------------------------------- the two spellings, on the SAME world state
// the spelling S1 shipped with before this morning's cure
const preCureAnswer = g(['log', '-1', '--format=%H', '--grep=' + PHRASE], CLONE);
// the cured spelling: a literal, plus a guard that is supposed to go loud if the phrase drifts
const curedAnswer = CURE;
const guardWouldThrow = !matches.includes(CURE);
const guardWouldWarn = matches.length !== 1;

// ------------------------------------------------------------------------------ the VALUE, not the key
// S1 computes its known positive from `CURE^:scripts/<f>` — the pre-cure tree. Under a steal the
// same expression is evaluated at the STOLEN commit's parent. Does the value move, or only the sha?
const R374 = readdirSync(join(CLONE, 'scripts')).find((f) => f.startsWith('probe-round374-'));
const R375 = readdirSync(join(CLONE, 'scripts')).find((f) => f.startsWith('probe-round375-'));
// `value` is the figure S1's VERDICT is keyed on (`preBothBlanked === 0`). `raw` and `comments`
// are carried alongside because a verdict figure that is 0 in every world state cannot be moved
// by anything, and the only way to tell "did not move" from "could not move" is to watch a
// figure upstream of it that does move.
const kpAt = (rev, f) => {
  if (!f) return { state: 'UNMODELLED', why: 'no matching probe file in the clone' };
  try {
    const src = execFileSync('git', ['show', `${rev}^:${join('scripts', f)}`],
      { cwd: CLONE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 });
    return {
      state: 'READ',
      value: occ(stripSource(src, true), DECL_FRAGMENT),
      comments: occ(stripSource(src, false), DECL_FRAGMENT),
      raw: occ(src, DECL_FRAGMENT),
      bytes: src.length,
    };
  } catch (e) {
    return { state: 'THREW', why: String(e.message).split('\n').find((l) => /fatal|error/i.test(l))
      || String(e.message).split('\n')[0] };
  }
};
const rows = [['probe-round374', R374], ['probe-round375', R375]].map(([label, f]) => ({
  label,
  file: f || '(none)',
  trueRev: kpAt(curedAnswer, f),
  keyedRev: kpAt(preCureAnswer, f),
}));

// -------------------------------------------------------------- the real instrument, as it ships
// Run S1 itself, unmodified, inside the clone. This is the only leg that grades the CURE rather
// than my model of it.
let realRun = { state: 'NOT RUN' };
try {
  const out = execFileSync('node', [S1_PATH],
    { cwd: CLONE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 });
  realRun = { state: 'EXIT 0', stdout: out };
} catch (e) {
  realRun = {
    state: 'EXIT ' + (e.status === undefined ? '?' : e.status),
    stdout: e.stdout || '', stderr: e.stderr || '',
  };
}
const realWarned = /^WARNING: /m.test(realRun.stdout || '');
const realThrew = /no longer selected by its own subject/.test((realRun.stderr || '') + (realRun.stdout || ''));

// --------------------------------------------------------------------------------------- readings
console.log(`unit-464steal — arm=${ARM}`);
console.log(`  clone:   ${CLONE}`);
console.log(`  phrase:  ${JSON.stringify(PHRASE)}   (lifted from ${S1_PATH}, not typed)`);
console.log(`  pin:     ${CURE}`);
console.log(`  decl:    ${JSON.stringify(DECL_FRAGMENT)}`);
console.log('');
console.log('GATES');
for (const l of legs) console.log(`  ${l.name.padEnd(11)} ${l.ok ? 'ok ' : 'RED'} — ${l.note}`);
const gatesOk = legs.every((l) => l.ok);
console.log('');

console.log('1. WHAT THE TWO SPELLINGS ANSWER, on this world state');
console.log(`   commits matching the phrase:            ${matches.length}`);
for (const m of matches) {
  console.log(`      ${m.slice(0, 8)}  ` +
    g(['log', '-1', '--format=%ad | %an | %s', '--date=format:%Y-%m-%d', m], CLONE));
}
console.log(`   pre-cure spelling  (log -1 --grep):     ${preCureAnswer.slice(0, 8)}`);
console.log(`   cured spelling     (literal pin):       ${curedAnswer.slice(0, 8)}`);
console.log(`   the two spellings AGREE:                ${preCureAnswer === curedAnswer}`);
console.log(`   cure's guard would throw (pin lost):    ${guardWouldThrow}`);
console.log(`   cure's guard would WARN (count ≠ 1):    ${guardWouldWarn}`);
console.log('');

console.log('2. THE VALUE THE KNOWN-POSITIVE LEG IS COMPUTED FROM');
console.log('   S1 reads `<rev>^:scripts/<file>` and counts DECL_FRAGMENT after stripSource(…, true).');
console.log('   file            rev         verdict-figure  comments-blanked  raw  bytes');
for (const r of rows) {
  for (const [which, c] of [['PIN^', r.trueRev], ['KEYED^', r.keyedRev]]) {
    console.log(`   ${r.label.padEnd(15)} ${which.padEnd(11)} ` + (c.state === 'READ'
      ? String(c.value).padStart(7) + String(c.comments).padStart(18) +
        String(c.raw).padStart(5) + String(c.bytes).padStart(7)
      : `${c.state}: ${c.why}`));
  }
}
const movedOn = (field) => rows.filter((r) => r.trueRev.state === 'READ'
  && r.keyedRev.state === 'READ' && r.trueRev[field] !== r.keyedRev[field]);
const moved = movedOn('value');
const silentlyMoved = moved.length > 0;
const loudlyFailed = rows.some((r) => r.keyedRev.state === 'THREW');
const upstreamMoved = [...new Set([...movedOn('raw'), ...movedOn('comments'), ...movedOn('bytes')])];
console.log(`   verdict figures that MOVED and still read cleanly: ${moved.length ? moved.map((r) => r.label).join(', ') : '(none)'}`);
console.log(`   reads that THREW at the keyed rev:                ${loudlyFailed}`);
console.log(`   UPSTREAM figures (raw/comments/bytes) that moved:  ${upstreamMoved.length ? upstreamMoved.map((r) => r.label).join(', ') : '(none)'}`);
console.log('   ⇒ a verdict figure that did not move while an upstream one did is SATURATED,');
console.log('     not protected: the steal reached the read and the read could not express it.');
const saturated = moved.length === 0 && upstreamMoved.length > 0 && !loudlyFailed;
console.log('');

// ------------------------------------------------- the harm that is NOT the verdict (unregistered)
// Added after the arm above refuted P4: if the verdict figure cannot move, the question is what
// else the stolen rev reaches. S1 prints an identity sentence from it. This reading was NOT
// registered in PRE-REGISTRATION.md and is reported as a reading, not as a graded prediction.
const identity = (rev) => g(['log', '-1', '--format=%h %an %s', rev], CLONE);
const trueIdentity = identity(curedAnswer);
const keyedIdentity = identity(preCureAnswer);
console.log('2b. THE PUBLISHED IDENTITY SENTENCE (unregistered reading, added after P4 refuted)');
console.log('    S1 prints: "curing commit (read with %an, never --oneline): <log -1 %h %an %s>"');
console.log(`    from the PIN:        ${trueIdentity}`);
console.log(`    from the KEYED rev:  ${keyedIdentity}`);
console.log(`    the published sentence differs: ${trueIdentity !== keyedIdentity}`);
console.log('');

console.log('3. S1 ITSELF, UNMODIFIED, RUN INSIDE THE CLONE');
console.log(`   ${realRun.state}; guard WARNED: ${realWarned}; guard THREW: ${realThrew}`);
for (const line of String(realRun.stdout || '').split('\n')) if (line.trim()) console.log('   | ' + line);
for (const line of String(realRun.stderr || '').split('\n')) if (line.trim()) console.log('   ! ' + line);
console.log('');

console.log('PREDICTIONS settled by THIS arm');
const say = (name, settled, verdict, detail) => console.log(
  `  ${name.padEnd(3)} ${settled ? verdict.padEnd(9) : 'N/A'.padEnd(9)} ${detail}`);
if (!gatesOk) {
  console.log('  REFUSED — a gate is RED, so no prediction below is graded by this run.');
} else if (ARM === 'kn') {
  say('P1', true, preCureAnswer === curedAnswer ? 'LANDS' : 'RED',
    `with no steal present, both spellings resolve to ${preCureAnswer.slice(0, 8)}`);
  say('P2', false, '', 'needs arm=steal');
  say('P3', false, '', 'needs arm=steal');
  say('P4', false, '', 'needs arm=steal');
} else {
  say('P1', false, '', 'graded on arm=kn');
  say('P2', true, preCureAnswer === stealSha ? 'LANDS' : 'REFUTED',
    `pre-cure spelling resolves to ${preCureAnswer.slice(0, 8)}; steal is ${String(stealSha).slice(0, 8)}`);
  say('P3', true, (realRun.state === 'EXIT 0' && realWarned) ? 'LANDS' : 'REFUTED',
    `cured instrument ${realRun.state}, answer still ${curedAnswer.slice(0, 8)}, guard reached: ${realWarned}`);
  say('P4', true, silentlyMoved ? 'LANDS'
    : loudlyFailed ? 'REFUTED (loud)'
      : saturated ? 'REFUTED (saturated)' : 'REFUTED (no move)',
    silentlyMoved ? `${moved.map((r) => r.label).join(', ')} read a different value at the keyed rev`
      : loudlyFailed ? 'the keyed rev threw — the harm is loud, not silent'
        : saturated ? `verdict figure is 0 at both revs while raw/comments/bytes moved for ` +
            `${upstreamMoved.map((r) => r.label).join(', ')} — the steal reached and could not be expressed`
          : 'both files read the same value at both revs, and no upstream figure moved either');
}
console.log('');
console.log(`SUMMARY arm=${ARM}: ${legs.filter((l) => l.ok).length}/${legs.length} gates ok, ` +
  `${gatesOk ? 'graded' : 'REFUSED'}`);
process.exit(gatesOk ? 0 : 1);
