/** Counterfactuals for P2's census detector. Expected member losses written down first (383/386). */
import { execFileSync } from 'node:child_process';

const REPO = '/Users/xian/Development/klatch-worktrees/daedalus';
const git = (a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const src = git(['show', 'c848dc66:docs/research/round392-instruments/grade-the-finding-that-is-its-own-finding.mjs']);

const chainsOf = (s) => {
  const calls = [];
  for (const m of s.matchAll(/\ng\(\n  '([A-Za-z0-9]+)',\n/g)) {
    const rest = s.slice(m.index + m[0].length);
    const body = rest.slice(0, rest.indexOf('\n);'));
    const i = body.lastIndexOf('`,\n  ');
    calls.push([m[1], i < 0 ? body : body.slice(i + 4)]);
  }
  return calls;
};
const defsOf = (s) => {
  const d = {};
  for (const m of s.matchAll(/\nconst ([A-Za-z0-9_$]+) = ([^\n]*(?:\n(?![\n]|const |\/\*|g\()[^\n]*)*)/g)) d[m[1]] = m[2];
  return d;
};
const defs = defsOf(src);
const idsIn = (e) => [...e.matchAll(/\b([a-z][A-Za-z0-9_$]*)\b/g)].map((m) => m[1]);
const run = (patterns, depth) => {
  const found = [];
  for (const [name, verdict] of chainsOf(src)) {
    for (const raw of verdict.split('&&')) {
      const c = raw.trim().replace(/,$/, '').replace(/^\(|\)$/g, '');
      if (!c || c === 'true') continue;
      let seen = c;
      let frontier = idsIn(c);
      for (let i = 0; i < depth; i += 1) {
        const next = [];
        for (const id of frontier) {
          if (defs[id] === undefined) continue;
          seen += `\n${defs[id]}`;
          next.push(...idsIn(defs[id]));
        }
        frontier = next;
      }
      if (patterns.some((r) => r.test(seen))) found.push(`${name}.${c}`);
    }
  }
  return [...new Set(found)];
};
const EXISTS = /existsSync\(/;
const READ = /readFileSync\(join\(REPO,/;
const base = run([EXISTS, READ], 2);
const cases = [
  ['BASE            ', base, null],
  ['A drop existsSync', run([READ], 2), ['Q2.scratchHereNow']],
  ['B drop readFileSync', run([EXISTS], 2), ['Q1.hisFileUnmoved', 'Q2b.myCureMovedIt']],
  ['C depth 1       ', run([EXISTS, READ], 1), ['Q1.hisFileUnmoved', 'Q2b.myCureMovedIt']],
  ['D depth 0       ', run([EXISTS, READ], 0), base],
];
for (const [label, got, expectedLoss] of cases) {
  const lost = expectedLoss === null ? [] : base.filter((x) => !got.includes(x));
  const ok = expectedLoss === null ? true : JSON.stringify(lost) === JSON.stringify(expectedLoss);
  console.log(`${label} -> [${got.join(', ')}]  lost=[${lost.join(', ')}]  expected_loss=[${(expectedLoss ?? []).join(', ')}]  ${expectedLoss === null ? '' : ok ? 'AS PREDICTED' : '*** PREDICTION WRONG ***'}`);
}
const chains = chainsOf(src);
console.log(`\nchains: ${chains.map(([n, v]) => `${n}=${v.split('&&').map((s) => s.trim().replace(/,$/, '')).filter(Boolean).length}`).join(' ')}`);
console.log(`total conjuncts: ${chains.reduce((a, [, v]) => a + v.split('&&').filter((s) => s.trim()).length, 0)}`);
