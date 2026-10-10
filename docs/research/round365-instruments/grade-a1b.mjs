/**
 * Round 365 grader for the routed item (a): does a MEMBER-LIST A1b catch what the `> 100`
 * threshold lets through?
 *
 * Drives five states of the real compilerOptions over the real tree and scores BOTH predicates —
 * the one in `probe-round303`/`probe-round304` at HEAD, and the one this fire proposes — against
 * each. Nothing here reasons about a regex: every program is read off `tsc --listFiles`.
 *
 * Gated: exits 1 unless every expected verdict matches, so a figure cannot be read off a run whose
 * own grade was false.
 */
import { readdirSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, relative } from 'node:path';

const REPO = process.cwd();
const SCRIPTS = join(REPO, 'scripts');
const PLANT = join(REPO, '.testdata', 'r365-grade');
const PLANT_CFG = join(PLANT, 'tsconfig.json');

// ── the disk-side selector, independent of tsc: a recursive walk ────────────────────────────────
const walk = (d, acc = []) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(relative(REPO, p));
  }
  return acc;
};
const DISK_MTS = walk(SCRIPTS).filter((f) => f.endsWith('.mts')).sort();

const RESIDUE = DISK_MTS.find((f) => f.includes('probe-round311-'));
if (!RESIDUE) {
  console.log('GRADE setup: false — residue file (probe-round311) not found on disk');
  process.exit(1);
}

// ── the two predicates, side by side, same inputs ───────────────────────────────────────────────
const OLD = (program) => {
  const mts = [...program].filter((f) => f.endsWith('.mts'));
  return mts.length > 100 && program.has('scripts/sweep-probes.d.mts');
};
const NEW = (program, disk) => {
  const inProgram = [...program].filter((f) => f.startsWith('scripts/') && f.endsWith('.mts'));
  const missing = disk.filter((f) => !program.has(f));
  const stray = inProgram.filter((f) => !disk.includes(f));
  return (
    disk.length >= 100 &&
    disk.includes('scripts/sweep-probes.d.mts') &&
    missing.length === 0 &&
    stray.length === 0
  );
};

const stripComments = (s) => s.replace(/^\s*\/\/.*$/gm, '');
const REAL = JSON.parse(stripComments(readFileSync(join(SCRIPTS, 'tsconfig.json'), 'utf8')));
const REAL_GLOBS = REAL.include.map((g) => `../../scripts/${g}`);
const PROBE_MTS = DISK_MTS.filter((f) => f.includes('probe-round'));
// Residue FIRST, so it is certainly among the 47 (Theseus's Round 364 construction).
const FORTY_SEVEN = [RESIDUE, ...PROBE_MTS.filter((f) => f !== RESIDUE)].slice(0, 47);

const listFiles = (cfgPath) => {
  const r = spawnSync('npx', ['tsc', '-p', cfgPath, '--noEmit', '--listFiles'], {
    cwd: REPO,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const text = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  const program = new Set(
    `${r.stdout ?? ''}`
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith(REPO) && !l.includes('node_modules'))
      .map((l) => l.slice(REPO.length + 1)),
  );
  return { program, status: r.status, diag: text.split('\n').filter((l) => /error TS/.test(l)) };
};

const plantCfg = (include, exclude) => {
  rmSync(PLANT, { recursive: true, force: true });
  mkdirSync(PLANT, { recursive: true });
  writeFileSync(
    PLANT_CFG,
    JSON.stringify(
      {
        compilerOptions: {
          ...REAL.compilerOptions,
          // A config outside `scripts/` cannot resolve `types: ["node"]` from its own directory —
          // Theseus's Round 364 TS2688 plant. Pointed back at the repo; the CONTROL state below is
          // what proves the plant runs at all rather than dying on setup.
          typeRoots: ['../../node_modules/@types'],
        },
        include,
        ...(exclude ? { exclude } : {}),
      },
      null,
      2,
    ),
  );
  return PLANT_CFG;
};

const STATES = [
  { name: 'V0  REAL config, as committed', real: true, old: true, new: true },
  { name: 'V0c CONTROL planted config, no exclude', include: REAL_GLOBS, old: true, new: true },
  {
    name: 'V1  residue file excluded (1 file)',
    include: REAL_GLOBS,
    exclude: [`../../${RESIDUE}`],
    old: true,
    new: false,
  },
  {
    name: 'V2  47 probe .mts excluded, residue first',
    include: REAL_GLOBS,
    exclude: FORTY_SEVEN.map((f) => `../../${f}`),
    old: true,
    new: false,
  },
  {
    name: 'V3  scripts coverage re-narrowed to hooks/',
    include: ['../../scripts/hooks/**/*.mts'],
    old: false,
    new: false,
  },
];

let bad = 0;
for (const s of STATES) {
  const cfg = s.real ? join(SCRIPTS, 'tsconfig.json') : plantCfg(s.include, s.exclude);
  const { program, status, diag } = listFiles(cfg);
  const oldV = OLD(program);
  const newV = NEW(program, DISK_MTS);
  const mts = [...program].filter((f) => f.endsWith('.mts')).length;
  const missing = DISK_MTS.filter((f) => !program.has(f));
  const okOld = oldV === s.old;
  const okNew = newV === s.new;
  if (!okOld || !okNew) bad += 1;
  console.log(
    `${okOld && okNew ? 'OK  ' : 'MISS'} ${s.name}\n` +
      `      .mts in program ${mts} · exit ${status} · ${diag.length} diag` +
      `${diag.length ? ` (${diag[0].trim().slice(0, 72)})` : ''}\n` +
      `      residue ${program.has(RESIDUE) ? 'IN ' : 'OUT'} · disk members missing from program ${missing.length}` +
      `${missing.length && missing.length <= 3 ? ` [${missing.join(', ')}]` : ''}\n` +
      `      OLD (>100) ${oldV ? 'GREEN' : 'RED'} (expected ${s.old ? 'GREEN' : 'RED'})` +
      ` · NEW (member list) ${newV ? 'GREEN' : 'RED'} (expected ${s.new ? 'GREEN' : 'RED'})`,
  );
}

// ── the instrument's own control: a broken disk census must not read as GREEN ───────────────────
const real = listFiles(join(SCRIPTS, 'tsconfig.json'));
const vacuous = NEW(real.program, []);
const oneMember = NEW(real.program, ['scripts/sweep-probes.d.mts']);
const ctlOk = vacuous === false && oneMember === false;
if (!ctlOk) bad += 1;
console.log(
  `${ctlOk ? 'OK  ' : 'MISS'} V4  instrument control: NEW over the REAL program with a BROKEN disk census\n` +
    `      disk census [] ⇒ ${vacuous ? 'GREEN (vacuous!)' : 'RED'} · ` +
    `disk census 1 member ⇒ ${oneMember ? 'GREEN (vacuous!)' : 'RED'}`,
);

rmSync(PLANT, { recursive: true, force: true });

console.log(`\nDISK .mts census: ${DISK_MTS.length} · residue: ${RESIDUE}`);
console.log(`47-set size: ${FORTY_SEVEN.length} (probe .mts on disk: ${PROBE_MTS.length})`);
console.log(`GRADE all expected verdicts matched: ${bad === 0}`);
if (bad !== 0) {
  console.log(`${bad} state(s) did not match — no figure above may be quoted.`);
  process.exit(1);
}
