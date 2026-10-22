import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const REPO = '/Users/xian/Development/klatch-worktrees/theseus';
const git = (...a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const REV = git('rev-parse', 'HEAD').trim();
const LIVE = await import(`${REPO}/docs/research/round430-instruments/refusal-convention.mjs`);

// Mechanism of A, run rather than reasoned about (329-331/367/409/429).
const RE = new RegExp('(^|[^.\\w$])src(?![\\w$])');
console.log('=== A, mechanism asserted by running the regex ===');
for (const t of ['{ ...src }', '{ ..src }', '{ .src }', '{ src }', '{ o.src }', '{ a,src }']) {
  console.log(`  ${RE.test(t) ? 'match  ' : 'NO     '} ${JSON.stringify(t)}  (char before "src": ${JSON.stringify(t[t.indexOf('src') - 1])})`);
}

const files = git('ls-tree', '-r', '--name-only', REV, 'scripts/lib/').trim().split('\n')
  .filter((f) => f.endsWith('.mjs'));
const identical = files.filter((f) => git('show', `${REV}:${f}`) === readFileSync(join(REPO, f), 'utf8'));

console.log('');
console.log(`=== reach over scripts/lib/ at ${REV.slice(0, 8)} — ${files.length} files, byte-identical ${identical.length} ===`);
let fns = 0;
const spreadHits = [];
const methodHits = [];
for (const f of files) {
  let mod;
  try { mod = await import(join(REPO, f)); } catch { continue; }
  for (const [name, v] of Object.entries(mod)) {
    if (typeof v !== 'function') continue;
    fns += 1;
    const s = v.toString();
    const ps = LIVE.paramsOf(s);
    if (ps.refused !== undefined) continue;
    for (const sp of LIVE.returnExprs(s) ?? []) {
      const m = LIVE.maskKeyPositions(sp.masked);
      for (const p of ps.params) {
        // A: the param spread in a return value, invisible to mentionsParam.
        if (new RegExp(`\\.\\.\\.${p}(?![\\w$])`).test(sp.masked)
            && !LIVE.mentionsParam(sp.masked, [p])) spreadHits.push(`${f}#${name}@${sp.at} ...${p}`);
        // B: a method/getter/setter name at an entry head spelled like the param, unblanked.
        if (new RegExp(`[{,]\\s*(?:get |set |async |\\*)?${p}\\s*\\(`).test(m)) {
          methodHits.push(`${f}#${name}@${sp.at} ${p}()`);
        }
      }
    }
  }
}
console.log(`function exports ${fns}`);
console.log(`A — return spans spreading a param that mentionsParam cannot see: ${spreadHits.length}`);
for (const h of spreadHits.slice(0, 12)) console.log(`     ${h}`);
console.log(`B — return spans with a method-position param name left unblanked: ${methodHits.length}`);
for (const h of methodHits.slice(0, 12)) console.log(`     ${h}`);

// How many spread-of-ANY-identifier return spans exist at all? The population A could bite.
let anySpread = 0;
for (const f of files) {
  let mod;
  try { mod = await import(join(REPO, f)); } catch { continue; }
  for (const [, v] of Object.entries(mod)) {
    if (typeof v !== 'function') continue;
    for (const sp of LIVE.returnExprs(v.toString()) ?? []) {
      if (/\.\.\.[A-Za-z_$]/.test(sp.masked)) anySpread += 1;
    }
  }
}
console.log(`context — return spans spreading ANY identifier (the population A can bite): ${anySpread}`);
