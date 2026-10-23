/**
 * Round 440 — his Round 439 §1 routed a defect in his own extractor and named the cure as "a
 * positively keyed extractor over all three spellings with a fourth state". This instrument does
 * not build that cure. It measures the DENOMINATOR the cure has to cover, because his census of
 * spellings ran over the three members that were RED, and the population is eleven.
 *
 * That is the shape of 355 (census the mechanism, not the reported instance) and of 382/383/386
 * (one known positive per shape is coverage of one axis) pointed at a cure that has not shipped
 * yet. A three-spelling extractor is correct about three spellings; whether three is the grammar
 * is a question about the whole population, and every member of it that is GREEN today contributes
 * a spelling nobody has seen a `false` in.
 *
 * ## What each leg is pointed at
 *
 * `G1` — his Round 439 reproduces, driven unmodified as this fire's first action before any of this
 * file existed. The differing lines are asserted to BE rev/dirty stamps by substitution, and the
 * stamp substituted for mine is read OUT OF HIS RECORDING's own trailer line, never from live HEAD.
 * That is his §3 cure (his `G1` went red for taking it from HEAD after HEAD moved); taking it in my
 * own leg is the only way to say I agree with it rather than about it.
 *
 * `G2` — the population, re-derived here by an independently written reader with his key, and then
 * REQUIRED to agree with the member rows parsed out of my recording of his drive. Independent
 * derivation alone would be a second opinion with nothing to check it; agreement alone would be a
 * transcription (412). Both together is the construction his own `P1` argued for.
 *
 * `G3` — the gate-line grammar census, from each member's OWN emitted line over one drive. The
 * shape is the line with leg ids and digit runs masked, so two lines differing only in leg count
 * collapse to one shape and two lines differing in DELIMITER do not.
 *
 * `G4` — the half `G3` cannot reach: a GREEN member's emitted line cannot show what its `false`
 * line would carry, so whether it has a leg-naming suffix at all is read from its source, labelled
 * as source-derived. The detector is graded by a confusion matrix over members of the population
 * itself — a known positive, a control, and both directions — not by one example (418).
 *
 * `G5` — his §1 table, independently reproduced: his shipped `RED: ` key re-run over the three real
 * red gate lines from this drive. His three rows are a claim about his own instrument and I am not
 * taking them on the memo (389/412).
 *
 * `G6` — the recommendation's feasibility, measured rather than asserted: are the failing leg names
 * recoverable from each member's stdout OFF the gate line, and under what grammar? My own Round 438
 * `G7` already reads them off per-leg `FAIL  G<n>` rows, which is shape-independent of every
 * spelling `G3` finds. If that grammar is not universal either, this leg says so and the
 * recommendation is weaker than it sounds.
 *
 * ## Vacuity, declared
 *
 * `G2`'s agreement half and `G4`'s detector are driven against crippled keys by
 * `cripple-and-regrade.mjs`. `G1`, `G3`, `G5`, `G6` read a drive of other instruments; no crippling
 * of anything in this file can move them, so their vacuity is UNMEASURED and that is a gap, not
 * coverage.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SELF = fileURLToPath(import.meta.url);

const git = (...a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const REV = git('rev-parse', 'HEAD').trim();
const DIRTY = git('status', '--porcelain').trim().length > 0;

// His 437 §4 / my 438 §1. Children carry the depth incremented; legs that drive a population refuse
// above 0, so a member of the population that drives the population cannot fork a 15-process cycle.
const DEPTH = Number.parseInt(process.env.KLATCH_DRIVE_DEPTH ?? '0', 10) || 0;

const legs = [];
const preds = [];
// `null` is REFUSED — the leg measured nothing and says so. Neither green nor red (436).
const leg = (id, claim, detail, ok) => legs.push({ id, claim, detail, ok });
const pred = (id, claim, detail, landed) => preds.push({ id, claim, detail, landed });

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The population key. Written from his Round 439 `populationOf` MECHANISM, independently, with the
// pieces that matter named: `ls-tree` at a stamped rev rather than `ls-files` (414/415/416), the
// module named by CONTENT READ AT THE REV rather than from the worktree, and the round cut by a
// derived key. `myRound` and `graderRe` are parameters so a crippled key can be driven (414).
// ─────────────────────────────────────────────────────────────────────────────────────────────────
function populationOf(rev, myRound, graderRe) {
  const all = git('ls-tree', '-r', '--name-only', rev, 'docs/research/').trim().split('\n')
    .filter((f) => f.endsWith('.mjs'))
    .filter((f) => {
      try { return git('show', `${rev}:${f}`).includes('refusal-convention'); } catch { return false; }
    });
  const roundOf = (p) => Number(p.match(/round(\d+)-instruments/)?.[1] ?? NaN);
  return {
    all,
    later: all.filter((f) => !(roundOf(f) < myRound)),
    pop: all.filter((f) => roundOf(f) < myRound),
    graders: all.filter((f) => roundOf(f) < myRound && graderRe.test(f)),
    roundOf,
  };
}

const HIS_ROUND = 437; // the round whose G9 population is the subject — his key, not mine
const KEY = {
  myRound: Number.parseInt(process.env.KLATCH_R440_MYROUND ?? String(HIS_ROUND), 10),
  graderRe: new RegExp(process.env.KLATCH_R440_GRADERRE ?? 'grade|attack'),
};
const CRIPPLED_KEY = process.env.KLATCH_R440_MYROUND !== undefined
  || process.env.KLATCH_R440_GRADERRE !== undefined;

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// One drive of the population; every leg below reads THIS drive. Two keys computed over two drives
// could differ by the drive (339).
// ─────────────────────────────────────────────────────────────────────────────────────────────────
function driveOf(path) {
  const t0 = Date.now();
  let out;
  let threw = null;
  try {
    out = execFileSync('node', [path], {
      cwd: REPO,
      encoding: 'utf8',
      maxBuffer: 1 << 28,
      timeout: 600_000,
      env: { ...process.env, KLATCH_DRIVE_DEPTH: String(DEPTH + 1) },
    });
  } catch (e) { threw = e.code ?? e.status ?? 'ERR'; out = `${e.stdout ?? ''}${e.stderr ?? ''}`; }
  const gate = out.split('\n').find((l) => l.startsWith('GATE:')) ?? null;
  return { path, out, gate, threw, ms: Date.now() - t0 };
}

const { all, later, pop, graders, roundOf } = populationOf(REV, KEY.myRound, KEY.graderRe);

// Taken BEFORE a single member runs, so `G10` reads what THIS drive dirtied rather than what the
// worktree happened to be carrying. An absolute dirtiness check would be red for my own untracked
// output and blind to the thing it is for.
// NOT `.trim()`ed, and the status code is matched as a FIELD rather than sliced at a fixed offset.
// Drive 3 of this instrument did both: `.trim()` ate the leading space of the FIRST porcelain line
// — unstaged modifications are reported as ` M path` — so that one line's path came back cut by a
// character, failed to match its own entry in the before-snapshot, and the figure came out 3
// against a true 2. A reader one character wrong, reporting BIGGER (415). Recorded in
// `drive3.postcommit.out`, which is kept for exactly that reason.
const trackedModified = () => new Set(git('status', '--porcelain').split('\n')
  .map((l) => l.match(/^(.)(.) (.*)$/))
  .filter((m) => m !== null && /[MARCD]/.test(m[1] + m[2]))
  .map((m) => m[3]));
const trackedBefore = trackedModified();

const drives = DEPTH > 0 ? null : graders.map(driveOf);
const roundLabel = (p) => p.split('/')[2].replace('-instruments', '');

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The shape key. A gate line's SHAPE is what survives masking the two things that vary between
// drives of the same instrument — leg ids and digit runs. Masked in that order: `G7` is both a leg
// id and a digit run, and masking digits first would turn it into `GN` and lose the id class.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Two keys, and the seam between them DECLARED rather than picked (339/380): the first drive of
// this instrument masked leg ids as `\bG\d+\b`, which does not reach a suffixed id like `G4b`, so
// round433's `G4b, G4c` survived masking as `GNb, GNc` and split one delimiter grammar into two
// shapes. The count came out BIGGER than the truth — the opposite direction from every scanner
// failure in this chain (415) and the reason both keys are computed here over the same drive.
const shapeKeys = {
  undermasked: (gl) => gl.replace(/\bG\d+\b/g, 'Gid').replace(/\d+/g, 'N'),
  suffixed: (gl) => gl.replace(/\bG\d+[a-z]*\b/g, 'Gid').replace(/\d+/g, 'N'),
};
const shapeOf = shapeKeys.suffixed;

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G1 — his Round 439 reproduces. Stamps come out of the RECORDING, not HEAD (his §3).
// ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  const read = (p) => { try { return readFileSync(join(HERE, p), 'utf8'); } catch { return null; } };
  const mine = read('reproduce-his-round439.out');
  const his = (() => {
    try { return readFileSync(join(REPO, 'docs/research/round439-instruments/drive1.out'), 'utf8'); }
    catch { return null; }
  })();
  // The rev stamp of each recording, read out of the recording's own trailer. `null` if absent —
  // a recording with no stamp cannot be used to explain a stamp difference, and must refuse.
  const stampOf = (txt) => txt === null ? null
    : (txt.split('\n').find((l) => /^\s+rev [0-9a-f]{7,}/.test(l))?.match(/rev ([0-9a-f]{7,})/)?.[1] ?? null);
  const hisStamp = stampOf(his);
  const myStamp = stampOf(mine);
  let diff = null;
  let explained = null;
  let censusLines = [];
  if (mine !== null && his !== null) {
    const a = his.split('\n');
    const b = mine.split('\n');
    diff = [];
    for (let i = 0; i < Math.max(a.length, b.length); i += 1) if (a[i] !== b[i]) diff.push(i);
    if (hisStamp !== null && myStamp !== null) {
      // The nondeterministic classes are enumerated A PRIORI — before the diff is looked at — and
      // there are exactly three in this output: the rev stamp, the worktree dirty flag, and the
      // per-member WALL-CLOCK elapsed his G3 prints on every row. A differing line explained by
      // none of the three reddens this leg instead of being waved at; the elapsed class is masked
      // on its unit suffix so it cannot swallow an ordinary integer such as a leg or member count.
      const normalise = (s) => (s ?? '')
        .split(myStamp).join('<REV>').split(hisStamp).join('<REV>')
        .split('worktree DIRTY').join('<TREE>').split('worktree clean').join('<TREE>')
        .replace(/\b\d+ms\b/g, '<MS>');
      explained = diff.filter((i) => normalise(a[i]) === normalise(b[i]));
      // The FOURTH class, found by this leg refusing to explain a line and named rather than
      // folded into the mask: his G3 header prints `N name the module` and `excluded: M`, both of
      // which are counts over the TREE AT THE REV. His own Round 439 instrument is committed in my
      // tree and was not in his, so both numbers moved — a pin on a count reddening on its own
      // promotion (377/405/434/435), in his published header this time. It is admitted only under
      // an assertion rather than by a wider mask (357/375): the two rev-dependent counts may
      // differ, and the `population N, M selected` tail — the figure the round is about, and the
      // one G2 re-derives independently — must be character-identical.
      censusLines = diff.filter((i) => !explained.includes(i)).map((i) => {
        const tailOf = (s) => (s ?? '').match(/population \d+, \d+ selected as graders/)?.[0] ?? null;
        const headOf = (s) => (s ?? '').match(/^\s*tree at [0-9a-f]+: (\d+) name the module · round >= (\d+) excluded: (\d+)/);
        const ha = headOf(a[i]);
        const hb = headOf(b[i]);
        return {
          i,
          isCensus: ha !== null && hb !== null && ha[2] === hb[2]
            && tailOf(a[i]) !== null && tailOf(a[i]) === tailOf(b[i]),
          moved: ha === null || hb === null ? null
            : `name the module ${ha[1]}→${hb[1]}, excluded ${ha[3]}→${hb[3]}`,
        };
      });
    }
  }
  const gl = mine === null ? null : mine.split('\n').find((l) => l.startsWith('GATE:')) ?? null;
  const pl = mine === null ? null : mine.split('\n').find((l) => l.startsWith('PREDICTIONS:')) ?? null;
  const unexplained = explained === null ? null
    : diff.filter((i) => !explained.includes(i) && !censusLines.find((c) => c.i === i && c.isCensus));
  const ok = mine === null || his === null || explained === null ? null
    : gl === 'GATE: false   (8 leg(s))   RED: G1, G5'
      && pl === 'PREDICTIONS: 2 landed, 0 refuted'
      && diff.length > 0
      && unexplained.length === 0;
  leg('G1', 'HIS ROUND 439 REPRODUCES — his instrument driven unmodified as this fire\'s first '
    + 'action, before this file existed. The verdict pin is his MEMO\'s published §5 figure, typed '
    + 'from the memo, which makes the agreement three-way: his sentence, his recording, my drive. '
    + 'Every differing line must then be accounted for by a class enumerated BEFORE the diff was '
    + 'read — rev stamp, dirty flag, wall-clock elapsed — or by the rev-dependent census counts in '
    + 'his G3 header, which are admitted only under an assertion that the `population N, M '
    + 'selected` tail is character-identical. The stamp substituted is read out of the TRAILER OF '
    + 'EACH RECORDING, never from live HEAD: his own G1 went red this round for sourcing it from '
    + 'HEAD after HEAD moved mid-fire (420/422/436), and a leg of mine that repeated that would '
    + 'agree with his §3 without demonstrating it. A recording with no stamp line REFUSES',
    mine === null ? 'REFUSED — no reproduce-his-round439.out recorded'
      : his === null ? 'REFUSED — his drive1.out not found'
        : `${gl} · ${pl} · his stamp ${hisStamp ?? 'ABSENT'} · my stamp ${myStamp ?? 'ABSENT'}`
          + ` · whole-file diff ${JSON.stringify(diff)} · stamps/elapsed ${JSON.stringify(explained)}`
          + ` · rev-dependent census ${JSON.stringify(censusLines.filter((c) => c.isCensus).map((c) => c.i))}`
          + ` · UNEXPLAINED ${JSON.stringify(unexplained)}`
          + censusLines.filter((c) => c.isCensus).map((c) => `\n        line ${c.i} moved: ${c.moved} — population tail identical`).join(''),
    ok);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G2 — the population: derived independently, then required to AGREE with his drive's member rows.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  // His G3 prints one row per member as `<STATE padded> <path>…`. Parsed structurally: a row whose
  // first token is one of his three state words and whose second is a docs/research path.
  const STATES = ['GREEN', 'RED', 'UNGRADEABLE', 'REFUSED'];
  let hisMembers = null;
  try {
    const txt = readFileSync(join(HERE, 'reproduce-his-round439.out'), 'utf8');
    hisMembers = txt.split('\n')
      .map((l) => l.trim().split(/\s+/))
      .filter((t) => STATES.includes(t[0]) && /^docs\/research\/.+\.mjs$/.test(t[1] ?? ''))
      .map((t) => t[1])
      .sort();
  } catch { hisMembers = null; }
  const mineSorted = [...graders].sort();
  const agree = hisMembers === null ? null
    : JSON.stringify(mineSorted) === JSON.stringify(hisMembers);
  leg('G2', 'THE POPULATION, DERIVED INDEPENDENTLY AND THEN REQUIRED TO AGREE. The key is written '
    + 'from his mechanism rather than copied from his line, and the member list it produces is '
    + 'graded against the member rows parsed out of my recording of HIS drive. An independent '
    + 'reader with nothing checking it is a second guess; a copy of his list is not a reader at '
    + 'all (412). The agreement is what makes the shape census below be about his population',
    hisMembers === null ? 'REFUSED — could not parse member rows out of the recording'
      : `tree at ${REV.slice(0, 8)}: ${all.length} name the module · round >= ${KEY.myRound} `
        + `excluded: ${later.length} · population ${pop.length}, ${graders.length} graders`
        + `${CRIPPLED_KEY ? ' · KEY CRIPPLED by env' : ''}`
        + `\n        his drive named ${hisMembers.length} · mine ${mineSorted.length} · identical: ${agree}`
        + (agree ? '' : `\n        only mine: ${JSON.stringify(mineSorted.filter((m) => !hisMembers.includes(m)))}`
          + `\n        only his:  ${JSON.stringify(hisMembers.filter((m) => !mineSorted.includes(m)))}`),
    agree);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G3 — the grammar census, off each member's own emitted gate line.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
const byShape = new Map();
if (drives !== null) {
  for (const d of drives) {
    const k = d.gate === null ? '(NO GATE LINE)' : shapeOf(d.gate);
    if (!byShape.has(k)) byShape.set(k, []);
    byShape.get(k).push(d);
  }
}
{
  const emitting = drives === null ? [] : drives.filter((d) => d.gate !== null);
  const shapes = [...byShape.keys()].filter((k) => k !== '(NO GATE LINE)');
  leg('G3', 'THE GATE-LINE GRAMMAR OF HIS POPULATION, read off each member\'s OWN emitted line over '
    + 'one drive. His §1 censused three spellings over the three members that were RED. The '
    + 'population is eleven, and a member that is green today still has a spelling — his extractor '
    + 'will meet it the first time that member fails. Leg ids are masked before digit runs so two '
    + 'lines differing only in leg COUNT collapse and two differing in DELIMITER do not',
    drives === null ? `REFUSED at drive depth ${DEPTH} — see the depth guard`
      : `${emitting.length} of ${drives.length} members emit a GATE line · `
        + `${shapes.length} distinct shape(s)\n        `
        + [...byShape.entries()].map(([k, ds]) =>
          `${JSON.stringify(k)}\n          ← ${ds.map((d) => `${roundLabel(d.path)}:${d.gate === null ? 'none' : d.gate.startsWith('GATE: true') ? 'GREEN' : 'RED'}`).join(', ')}`)
          .join('\n        '),
    drives === null ? null : shapes.length > 0);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G4 — does a member's gate-print site carry a leg-naming suffix AT ALL? Source-derived, labelled,
// and graded by a confusion matrix over the population rather than by one example.
//
// The statement is cut by paren matching from the `GATE:` occurrence back to the opening call and
// forward to its close — not by a line window, which over-reports whatever happens to sit nearby
// (415). The detector then asks only whether that statement text contains a leg-naming LABEL.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
const LEG_LABELS = ['RED:', 'FALSE:', 'REFUSED:', 'FAILED:'];
function gateStatementOf(src) {
  const i = src.indexOf('GATE:');
  if (i < 0) return null;
  // back to the start of the enclosing call: the last `(` before `i` whose depth is 0 relative to i
  let j = i;
  let depth = 0;
  while (j > 0) {
    j -= 1;
    if (src[j] === ')') depth += 1;
    else if (src[j] === '(') { if (depth === 0) break; depth -= 1; }
  }
  if (src[j] !== '(') return null;
  let k = j;
  depth = 0;
  while (k < src.length) {
    if (src[k] === '(') depth += 1;
    else if (src[k] === ')') { depth -= 1; if (depth === 0) break; }
    k += 1;
  }
  if (depth !== 0) return null;
  return src.slice(j, k + 1);
}
const namesLegsInSource = (src) => {
  const st = gateStatementOf(src);
  if (st === null) return null;
  return LEG_LABELS.some((l) => st.includes(l));
};
{
  const srcAt = (f) => { try { return git('show', `${REV}:${f}`); } catch { return null; } };
  const rows = graders.map((f) => {
    const src = srcAt(f);
    const d = drives === null ? null : drives.find((x) => x.path === f);
    return {
      f,
      names: src === null ? null : namesLegsInSource(src),
      observed: d == null || d.gate === null ? null
        : LEG_LABELS.some((l) => d.gate.includes(l)),
      state: d == null ? null : d.gate === null ? 'UNGRADEABLE'
        : d.gate.startsWith('GATE: true') ? 'GREEN' : 'RED',
    };
  });
  // The confusion matrix: on every RED member the emitted line can be observed, so source and
  // observation must AGREE there — that is the detector's known positive and its control at once,
  // in both directions, drawn from the population rather than hand-made (355/364/418).
  const observable = rows.filter((r) => r.state === 'RED' && r.observed !== null && r.names !== null);
  const tp = observable.filter((r) => r.names === true && r.observed === true).length;
  const tn = observable.filter((r) => r.names === false && r.observed === false).length;
  const fp = observable.filter((r) => r.names === true && r.observed === false).length;
  const fn = observable.filter((r) => r.names === false && r.observed === true).length;
  const silent = rows.filter((r) => r.names === false);
  const unparsed = rows.filter((r) => r.names === null);
  // The detector is NOT clean, and the leg that says so is the confusion matrix, which is the
  // whole reason for having one over a known positive (418). `fn 1` is round435's grader: its
  // emitted red line carries `— FALSE: G3, G4, G5, G9` and the source cut says it names nothing.
  // The mechanism is measured, not guessed — these instruments build the gate line across SEVERAL
  // statements (`out.push(…)` then a second push appending the suffix), so a single paren-matched
  // statement cannot contain it. 3 more members' statements would not cut at all.
  //
  // So this leg REFUSES. A detector with a known false negative, published as a figure, is a
  // grading instrument that cannot refuse manufacturing a finding (436), and the figure it would
  // manufacture here is a LOWER bound presented as a count. Which end it can move is stated:
  // under-reporting only, so the true number of label-bearing members is >= 2 (408).
  const gradeable = drives === null ? false : fp === 0 && fn === 0 && unparsed.length === 0;
  leg('G4', 'WHETHER A MEMBER NAMES ITS FAILING LEGS ON THE GATE LINE AT ALL — source-derived, and '
    + 'REFUSED this round because the confusion matrix caught the detector failing. A GREEN '
    + 'member\'s emitted line cannot show what its `false` line would carry, so source is the only '
    + 'reachable reading of the half G3 cannot see; but the cut is per-STATEMENT and these '
    + 'instruments assemble the gate line across several, which the `fn` cell measures rather than '
    + 'my supposing it. Publishing the count anyway would be a lower bound dressed as a census. '
    + 'The direction it can err is named: under-reporting only',
    drives === null ? `REFUSED at drive depth ${DEPTH}`
      : `REFUSED — detector not clean. confusion over ${observable.length} member(s) with both `
        + `readings: tp ${tp} tn ${tn} fp ${fp} fn ${fn} · statements that would not cut: ${unparsed.length}`
        + `\n        the fn is round435's grader: emitted "— FALSE: G3, G4, G5, G9", source cut says no label`
        + `\n        source-says-NO (unreliable, >= this many wrong): `
        + JSON.stringify(silent.map((r) => `${roundLabel(r.f)}:${r.state}`))
        + `\n        source-says-YES (a floor, 2 of them): `
        + JSON.stringify(rows.filter((r) => r.names === true).map((r) => `${roundLabel(r.f)}:${r.state}`)),
    gradeable ? true : null);

  pred('P2', 'THE SHAPE HIS CENSUS COULD NOT SEE IS GREEN — every member whose gate-print site '
    + 'names no failing legs is GREEN in this drive. Declared NOT BLIND and why: I read these '
    + 'print sites from source before writing this leg (`raw-gate-line-sites.txt`, committed); the '
    + 'half unknown to me was their STATE. It is REFUSED rather than scored, and the refusal is '
    + 'the point: the first drive scored it REFUTED off the same reading G4 then measured as having '
    + 'a false negative, and the member that refuted it — round435, RED — is exactly the one the '
    + 'false negative is on. A prediction scored from a reading its own gate calls unreliable is a '
    + 'figure printed beside a guard that fired (353/422)',
    drives === null ? 'REFUSED — nothing driven'
      : `REFUSED — keyed on G4, which is not gradeable (fn 1). For the record, the reading it `
        + `would have been scored from: ${silent.length} silent member(s), states `
        + JSON.stringify(silent.map((r) => r.state)) + ' — the RED one is the known false negative',
    gradeable ? silent.length > 0 && silent.every((r) => r.state === 'GREEN') : null);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G5 — his §1 table, reproduced. His shipped key over the three real red lines from THIS drive.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  // Verbatim in mechanism from his Round 439 `classify`: the red list is cut at the next run of
  // spaces followed by a LABEL:, then split on commas.
  const hisKey = (gate) => {
    const after = gate.split('RED: ')[1] ?? '';
    return after.split(/ {2,}\w+:/)[0].split(',').map((s) => s.trim()).filter(Boolean).sort();
  };
  const reds = drives === null ? [] : drives.filter((d) => d.gate !== null && d.gate.startsWith('GATE: false'));
  const rows = reds.map((d) => ({ r: roundLabel(d.path), got: hisKey(d.gate), gate: d.gate }));
  // His published table: round431 → one wrong id, round433 and round435 → empty.
  const over = rows.filter((x) => x.got.some((id) => !/^G\d+$/.test(id)));
  const under = rows.filter((x) => x.got.length === 0);
  const ok = drives === null ? null : rows.length > 0 && over.length + under.length === rows.length;
  leg('G5', 'HIS §1 TABLE, REPRODUCED RATHER THAN QUOTED. His shipped `RED: ` key re-run here over '
    + 'the real red gate lines of this drive. His three rows are a claim about his own instrument, '
    + 'and a memo is not a measurement (389/412). The leg requires every red member to come back '
    + 'either over-reported (an id that is not a leg id) or empty — which is what his table says '
    + 'and what makes the defect a grammar defect rather than one bad member',
    drives === null ? `REFUSED at drive depth ${DEPTH}`
      : `${rows.length} red member(s) · over-reported ${over.length} · under-reported (empty) ${under.length}`
        + '\n        ' + rows.map((x) => `${x.r} → ${JSON.stringify(x.got)}   from ${JSON.stringify(x.gate)}`).join('\n        '),
    ok);

  // Scored under BOTH shape keys, because the first drive's figure of 7 was inflated by the
  // under-masked key and a prediction that holds only under the inflated key would be an artifact
  // of my own defect (380/397/412: grade as a 2 × 2 against the old spelling).
  const counts = Object.fromEntries(Object.entries(shapeKeys).map(([name, k]) => [
    name,
    drives === null ? null
      : new Set(drives.filter((d) => d.gate !== null).map((d) => k(d.gate))).size,
  ]));
  pred('P1', 'THE GRAMMAR IS WIDER THAN THREE, UNDER EITHER KEY. The number of distinct gate-line '
    + 'shapes emitted by his population exceeds the three spellings his §1 names, so a '
    + 'three-spelling extractor with a refusing fourth state refuses on members it could have '
    + 'read. Scored under both shape keys: the under-masked one this instrument first shipped and '
    + 'the corrected one, so the prediction cannot be carried by my own masking defect. Declared '
    + 'NOT BLIND and why: I grepped the print sites from source this fire before building this and '
    + 'the recording is committed beside this file (`raw-gate-line-sites.txt`); what the drive '
    + 'tests is whether the EMITTED lines agree with that source reading, and a scanner that '
    + 'modelled interpolation wrongly would have returned a SMALLER number (398)',
    drives === null ? 'REFUSED'
      : `undermasked key: ${counts.undermasked} shape(s) · corrected key: ${counts.suffixed} shape(s) `
        + `· both vs 3 spellings named · the two keys differ by round433's suffixed ids G4b/G4c`,
    drives === null ? null : counts.undermasked > 3 && counts.suffixed > 3);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G9 — the figure AT THE CURE'S GRANULARITY (345). `G3` counts whole-line shapes, and a line shape
// differs for reasons his extractor does not care about — `(N leg(s) on the key itself)` and
// `(N leg(s))` are two shapes and the same nothing to an extractor looking for leg names. The unit
// his cure is actually keyed on is the LABEL SUFFIX that introduces a leg-id list. Counted here
// from emitted lines only, with no source model in it, so this number is a measurement and not the
// labelled inference G4 refused.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  // Positively keyed, and a `GATE:` line matching none of the forms is reported as its own class
  // rather than falling into "no label" — that distinction is the whole of 411 and is exactly what
  // a three-spelling extractor with one refusing state collapses.
  const FORMS = [
    { id: ', RED: … )', re: /,\s*RED:\s*(.+?)\)\s*$/ },
    { id: ') — FALSE: …', re: /\)\s*—\s*FALSE:\s*(.+)$/ },
    { id: ')   RED: …', re: /\)\s{2,}RED:\s*(.+?)(?:\s{2,}\w+:|$)/ },
    { id: ')   REFUSED: …', re: /\)\s{2,}REFUSED:\s*(.+?)(?:\s{2,}\w+:|$)/ },
  ];
  const rows = drives === null ? [] : drives.filter((d) => d.gate !== null).map((d) => {
    const hits = FORMS.filter((f) => f.re.test(d.gate)).map((f) => f.id);
    return {
      r: roundLabel(d.path),
      state: d.gate.startsWith('GATE: true') ? 'GREEN' : 'RED',
      hits,
      // A label-shaped token present with none of the four forms matching: the state his fourth
      // bucket is for, and it must be distinguishable from having no label at all.
      looksLabelled: /\b(RED|FALSE|REFUSED|FAILED):/.test(d.gate),
    };
  });
  const forms = [...new Set(rows.flatMap((x) => x.hits))];
  const noLabel = rows.filter((x) => x.hits.length === 0 && !x.looksLabelled);
  const unrecognised = rows.filter((x) => x.hits.length === 0 && x.looksLabelled);
  const ambiguous = rows.filter((x) => x.hits.length > 1);
  const ok = drives === null ? null
    : forms.length > 0 && unrecognised.length === 0 && ambiguous.length === 0;
  leg('G9', 'THE SAME QUESTION AT THE CURE\'S GRANULARITY (345): not how many line shapes exist, '
    + 'but how many LABEL SUFFIXES introduce a leg-id list — the unit his extractor is keyed on. '
    + 'G3\'s shape count includes differences his cure is indifferent to, so routing it as the '
    + 'number his cure must cover would be a figure keyed on the wrong unit. Measured from emitted '
    + 'lines with no source model, each form positively keyed, and a `GATE:` line carrying a '
    + 'label-shaped token that matches NO form reported as its own class rather than as "no label" '
    + '— a distinction a single refusing bucket cannot make (411). The leg reddens if any line is '
    + 'unrecognised or matches two forms at once',
    drives === null ? `REFUSED at drive depth ${DEPTH}`
      : `${forms.length} label form(s) observed in the population: ${JSON.stringify(forms)}`
        + `\n        members with NO label at all (${noLabel.length}): `
        + JSON.stringify(noLabel.map((x) => `${x.r}:${x.state}`))
        + `\n        label-shaped but matching no form: ${unrecognised.length} · matching two forms: ${ambiguous.length}`
        + '\n        ' + rows.map((x) => `${x.state.padEnd(5)} ${x.r} → ${x.hits.length ? JSON.stringify(x.hits) : '(no label)'}`).join('\n        '),
    ok);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G6 — is the shape-independent reader actually available? My own Round 438 G7 reads failing legs
// off per-leg `FAIL  G<n>` rows. Whether that generalises is a census, not a preference.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  const PER_LEG = /^\s*FAIL\s+(G\d+)\b/;
  // The row grammar itself, censused in the same drive, because a reach of 0/3 says my reader
  // fails without saying whether anything could succeed. Keyed on the general row shape — a
  // verdict token followed by a leg id — so the census is not a second copy of my own reader.
  const ROW = /^\s*([A-Za-z]+)\s+(G\d+[a-z]*)\b/;
  const rows = drives === null ? [] : drives.map((d) => {
    const legsFound = [...new Set(d.out.split('\n').map((l) => l.match(PER_LEG)?.[1]).filter(Boolean))].sort();
    const tokens = [...new Set(d.out.split('\n').map((l) => l.match(ROW)?.[1]).filter(Boolean))].sort();
    const state = d.gate === null ? 'UNGRADEABLE' : d.gate.startsWith('GATE: true') ? 'GREEN' : 'RED';
    return { r: roundLabel(d.path), state, legsFound, tokens };
  });
  const tokenSets = [...new Set(rows.filter((x) => x.tokens.length).map((x) => JSON.stringify(x.tokens)))];
  // The claim is directional and only testable where it can be: on a RED member the per-leg rows
  // must yield a NON-EMPTY set, and on a GREEN member they must yield an EMPTY one. A reader that
  // returned [] everywhere would pass the green half alone, which is why both are required.
  const redRows = rows.filter((x) => x.state === 'RED');
  const greenRows = rows.filter((x) => x.state === 'GREEN');
  const redOk = redRows.filter((x) => x.legsFound.length > 0);
  const greenOk = greenRows.filter((x) => x.legsFound.length === 0);
  const ok = drives === null ? null
    : redRows.length > 0 && greenRows.length > 0
      && redOk.length === redRows.length && greenOk.length === greenRows.length;
  leg('G6', 'THE SHAPE-INDEPENDENT READER, CENSUSED. My Round 438 G7 already reads failing legs off '
    + 'per-leg `FAIL  G<n>` rows rather than off the gate line, which is immune to every spelling '
    + 'G3 found. Whether that is a recommendation or a preference depends on whether the row '
    + 'grammar is universal across this population, so it is measured here. Graded in BOTH '
    + 'directions over the same drive: non-empty on every RED member, empty on every GREEN one — a '
    + 'reader returning [] everywhere passes the green half by itself',
    drives === null ? `REFUSED at drive depth ${DEPTH}`
      : `RED members with legs recovered off the rows: ${redOk.length}/${redRows.length} · `
        + `GREEN members yielding an empty set: ${greenOk.length}/${greenRows.length}`
        + `\n        distinct per-leg VERDICT-TOKEN sets in the population: ${tokenSets.length} — `
        + tokenSets.join(' / ')
        + '\n        ' + rows.map((x) => `${x.state.padEnd(11)} ${x.r} → mine ${JSON.stringify(x.legsFound)} · its tokens ${JSON.stringify(x.tokens)}`).join('\n        '),
    ok);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G7 — the depth guard, both halves. The refusal half is a source pin and named as such; the spawn
// half is BEHAVIOURAL, from a fixture child that reports the variable it was actually handed (369).
// ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  const src = readFileSync(SELF, 'utf8');
  const pin = src.includes('const drives = DEPTH > 0 ? null : graders.map(driveOf);');
  let child = null;
  if (DEPTH === 0) {
    const f = join(REPO, 'docs/research/round439-instruments/fixture-echo-depth.mjs');
    try {
      const o = execFileSync('node', [f], {
        cwd: REPO, encoding: 'utf8', timeout: 60_000,
        env: { ...process.env, KLATCH_DRIVE_DEPTH: String(DEPTH + 1) },
      });
      child = o.match(/DEPTH=(\S+)/)?.[1] ?? null;
    } catch { child = null; }
  }
  const ok = DEPTH > 0 ? null : pin && child === String(DEPTH + 1);
  leg('G7', 'THE DEPTH GUARD, both halves: the driving leg refuses above depth 0 (source pin, named '
    + 'as one) and a fixture child reports the KLATCH_DRIVE_DEPTH it was ACTUALLY handed rather '
    + 'than this leg asserting a regex over the same source that spawns it (369). His 437 measured '
    + '15 concurrent processes from this population driving itself',
    `running at depth ${DEPTH} · refusal pin present: ${pin} · child reported DEPTH=${child ?? 'n/a'} (expected ${DEPTH + 1})`,
    ok);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G8 — the shared subject module, asserted at exit rather than assumed. Two members of this
// population are `cripple-and-regrade.mjs` files, and his §5 names one of them as still mutating
// the COMMITTED module instead of a copy. Driving this population therefore writes to a tracked
// file, and a crippler that died between mutate and restore would leave it corrupt for every later
// drive in the tree. Both halves of the hazard are read: drift DURING the drive, per member, and
// identity at exit.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  const MODPATH = 'docs/research/round430-instruments/refusal-convention.mjs';
  const headBlob = git('rev-parse', `HEAD:${MODPATH}`).trim();
  const atExit = git('hash-object', join(REPO, MODPATH)).trim();
  const ok = drives === null ? null : atExit === headBlob;
  leg('G8', 'THE SHARED SUBJECT MODULE IS BYTE-IDENTICAL TO HEAD\'s BLOB AT EXIT. This population '
    + 'contains two cripplers and his §5 says one of them still mutates the committed file rather '
    + 'than a copy, so this drive wrote to a tracked file. A drive that left it corrupt would '
    + 'silently change the verdict of every later instrument in the tree',
    drives === null ? `REFUSED at drive depth ${DEPTH} — nothing was driven`
      : `${MODPATH} · HEAD blob ${headBlob.slice(0, 8)} · at exit ${atExit.slice(0, 8)} · identical: ${atExit === headBlob}`,
    ok);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G10 — what the drive WROTE, over the whole tracked tree rather than over the one file named in
// his §5. This leg exists because `G8` was green and wrong in its reach: the first drive of this
// instrument left two COMMITTED recordings in `round436-instruments/` modified — not the shared
// module, which `G8` watched, but the `.out` files that earlier rounds' findings rest on. Both
// changed only in a rev stamp and a corpus count, verdicts intact, and that is the dangerous
// version: a drive that quietly re-stamps someone else's evidence to the current rev destroys the
// provenance of a recording while leaving it looking fine.
//
// `G8` is the reported instance; this is the mechanism (355). Any member of this population may
// write anywhere in the tree, so the guard has to be the tree.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
{
  const dirtied = [...trackedModified()].filter((p) => !trackedBefore.has(p)).sort();
  const ok = drives === null ? null : dirtied.length === 0;
  leg('G10', 'WHAT THE DRIVE WROTE, over the whole TRACKED tree and not only the file his §5 '
    + 'names. The set is differenced against a snapshot taken before any member ran, so it is what '
    + 'THIS drive dirtied and not what the worktree arrived carrying. This leg is here because G8 '
    + 'was green and too narrow: the first drive of this instrument left two committed '
    + 'round436 recordings modified — a rev stamp and a corpus count, verdicts intact, which is '
    + 'the version that does damage without looking like it. The recordings are the evidence '
    + 'earlier findings rest on, and re-stamping one to the current rev makes it a record of '
    + 'nothing. Diff kept at `drive-rewrote-committed-recordings.diff`',
    drives === null ? `REFUSED at drive depth ${DEPTH} — nothing was driven`
      : `tracked files dirtied by this drive: ${dirtied.length}${dirtied.length ? ` ${JSON.stringify(dirtied)}` : ''}`
        + ` · tracked already dirty on entry (not this drive's): ${trackedBefore.size}`,
    ok);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Report
// ─────────────────────────────────────────────────────────────────────────────────────────────────
const red = legs.filter((l) => l.ok === false);
const refused = legs.filter((l) => l.ok === null);
for (const l of legs) {
  console.log(`${l.ok === true ? ' ok ' : l.ok === null ? 'REF ' : 'FAIL'}  ${l.id}  ${l.claim}`);
  console.log(`        ${l.detail}`);
}
console.log('');
for (const p of preds) {
  console.log(`${p.landed === true ? 'LANDED  ' : p.landed === null ? 'REFUSED ' : 'REFUTED '}${p.id}  ${p.claim}`);
  console.log(`        ${p.detail}`);
}
console.log('');
console.log(`GATE: ${red.length === 0}   (${legs.length} leg(s))`
  + `${red.length ? `   RED: ${red.map((l) => l.id).join(', ')}` : ''}`
  + `${refused.length ? `   REFUSED: ${refused.map((l) => l.id).join(', ')}` : ''}`);
console.log(`PREDICTIONS: ${preds.filter((p) => p.landed === true).length} landed, `
  + `${preds.filter((p) => p.landed === false).length} refuted`
  + `${preds.filter((p) => p.landed === false).length ? `: ${preds.filter((p) => p.landed === false).map((p) => p.id).join(', ')}` : ''}`
  + `${preds.filter((p) => p.landed === null).length ? `, ${preds.filter((p) => p.landed === null).length} refused: ${preds.filter((p) => p.landed === null).map((p) => p.id).join(', ')}` : ''}`);
console.log(`  rev ${REV.slice(0, 8)} · worktree ${DIRTY ? 'DIRTY' : 'clean'} · depth ${DEPTH}`
  + `${CRIPPLED_KEY ? ' · POPULATION KEY CRIPPLED' : ''}`);
