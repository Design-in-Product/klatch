/**
 * My own key for his Round 392 §3/Q4 census, written to differ from his in what SELECTS the
 * population as well as in how it counts (339: two keys sharing a denominator agree vacuously).
 *
 * His key:  git ls-tree -r --name-only <pin>  ->  startsWith('scripts/') && endsWith('.d.mts')
 *           count /export declare const (N)\s*:\s*\(/g  and  /export declare function (N)\s*\(/g
 *
 * Mine:     every TRACKED .d.mts anywhere in the tree (so "under scripts/" is a reading, not an
 *           assumption), and a declaration-shape scan that walks `export declare` occurrences and
 *           classifies each by what follows the NAME — which catches generics (`function f<T>(`),
 *           non-function consts (`const X: string`), and anything neither regex would see.
 */
import { execFileSync } from 'node:child_process';

const REPO = process.cwd();
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const show = (pin, path) => git(['show', `${pin}:${path}`]);

const PINS = { '58debe3e': '58debe3e', HEAD: 'HEAD' };

/** Classify every `export declare` site in a .d.mts by shape, from the text after the name. */
function classify(src) {
  const out = { arrow: [], func: [], funcGeneric: [], constNonFn: [], other: [] };
  /**
   * The trailing context is a LOOKAHEAD, not a capture: a consuming `([\s\S]{0,40})` swallows the
   * start of the next declaration and `matchAll` then skips it, which is why the first drive of
   * this key read 13/3 and 17/8 against his published 14/4 and 18/12 — short on every figure, in
   * the direction a bad source scan always fails (char-class/regex lesson).
   */
  const re = /export declare (const|function|class|type|enum|namespace)\s+([A-Za-z0-9_$]+)(?=([\s\S]{0,40}))/g;
  for (const m of src.matchAll(re)) {
    const [, kind, name, after] = m;
    if (kind === 'const') {
      if (/^\s*:\s*\(/.test(after)) out.arrow.push(name);
      else out.constNonFn.push(name);
    } else if (kind === 'function') {
      if (/^\s*\(/.test(after)) out.func.push(name);
      else if (/^\s*</.test(after)) out.funcGeneric.push(name);
      else out.other.push(`${kind} ${name}`);
    } else {
      out.other.push(`${kind} ${name}`);
    }
  }
  return out;
}

for (const [label, pin] of Object.entries(PINS)) {
  const all = git(['ls-tree', '-r', '--name-only', pin]).split('\n').filter((f) => f.endsWith('.d.mts'));
  const inScripts = all.filter((f) => f.startsWith('scripts/'));
  const outside = all.filter((f) => !f.startsWith('scripts/'));
  let arrow = 0;
  let func = 0;
  let gen = 0;
  let nonFn = 0;
  const per = {};
  for (const f of inScripts) {
    const c = classify(show(pin, f));
    per[f] = { arrow: c.arrow.length, func: c.func.length, gen: c.funcGeneric.length, nonFn: c.constNonFn.length, other: c.other };
    arrow += c.arrow.length;
    func += c.func.length;
    gen += c.funcGeneric.length;
    nonFn += c.constNonFn.length;
  }
  console.log(`\n=== ${label} (${pin}) ===`);
  console.log(`tracked .d.mts total ${all.length}; under scripts/ ${inScripts.length}; OUTSIDE scripts/ ${outside.length} ${JSON.stringify(outside)}`);
  console.log(`const-arrow ${arrow} | export declare function (plain) ${func} | function GENERIC ${gen} | const non-function ${nonFn}`);
  console.log(`his total (arrow+plain func) = ${arrow + func}; with generics = ${arrow + func + gen}`);
  for (const [f, v] of Object.entries(per)) {
    if (v.arrow || v.func || v.gen || v.nonFn || v.other.length) {
      console.log(`  ${f.replace('scripts/', '')}  arrow=${v.arrow} func=${v.func} gen=${v.gen} nonFn=${v.nonFn}${v.other.length ? ` other=${JSON.stringify(v.other)}` : ''}`);
    }
  }
}
