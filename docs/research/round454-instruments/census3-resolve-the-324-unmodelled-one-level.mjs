// Round 454 — census 3: resolve census 2's 324 UNMODELLED `stripSource` arguments ONE LEVEL.
//
// `census2` answered the narrow half of Theseus's §7 lead: 0 of 351 call sites pass a bare
// `readFileSync(p)` directly. It also said plainly what that does not answer — 324 of the 351
// (92%) pass a variable or an unmodelled expression, and the hazard can sit one line above any of
// them. This census takes the next bounded step and no further: for each simple-identifier
// argument, find that identifier's DECLARATION IN THE SAME FILE and classify its initialiser with
// census2's own classifier.
//
// Two decisions that keep this from being a figure I have not earned:
//
//  1. **census2's `firstArg` and `classify` are SLICED out of census2's source, not retyped.** A
//     divergence between my copy of a key and the key it claims to extend is the defect that makes
//     a second census quietly disagree with the first; the only way two readers cannot disagree is
//     for there to be one reader. Both slices are structurally gated before use.
//  2. **The realistic Buffer path gets its OWN bucket.** If the identifier is a function
//     PARAMETER, its value comes from a caller this census does not follow — that is precisely
//     where a Buffer would enter, and calling it "unresolved" would bury the one shape his lead is
//     about. `PARAM:caller-supplied` is keyed positively and its members are printed.
//
// Resolution is strictly ONE level. A `const a = b;` whose `b` is itself a variable lands in
// `RESOLVED-TO-UNMODELLED`, not in a second hop. Depth is a parameter of the question, and a census
// that quietly recursed would be answering a different one.

import { execFileSync } from 'node:child_process';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname.replace(/\/$/, '');
const git = (...a) => execFileSync('git', ['-C', ROOT, ...a], {
  encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'],
});
const REV = git('rev-parse', 'HEAD').trim();
const SUBJECT = 'scripts/lib/strip-source.mjs';
const SELF = new URL(import.meta.url).pathname.slice(ROOT.length + 1);
const CENSUS2 = 'docs/research/round454-instruments/census2-does-any-call-site-feed-stripsource-a-non-string.mjs';

// ═══ Lift census2's two readers out of census2 ═══════════════════════════════════════════════════
const c2src = git('show', `${REV}:${CENSUS2}`);
const c2blind = stripSource(c2src, true);
if (c2blind.length !== c2src.length) throw new Error('census3: stripSource did not preserve length on census2');

/** Slice a top-level `function NAME(` declaration out of raw source by brace balance over blinded. */
function sliceFn(raw, blind, header) {
  const i = blind.indexOf(header);
  if (i === -1) throw new Error(`census3: ${JSON.stringify(header)} not found in census2 at ${REV}`);
  if (blind.indexOf(header, i + 1) !== -1) throw new Error(`census3: ${JSON.stringify(header)} occurs more than once in census2`);
  const open = blind.indexOf('{', i);
  let d = 0;
  let j = open;
  for (; j < blind.length; j += 1) {
    if (blind[j] === '{') d += 1;
    else if (blind[j] === '}') { d -= 1; if (d === 0) { j += 1; break; } }
  }
  return raw.slice(i, j);
}
const firstArgSrc = sliceFn(c2src, c2blind, 'function firstArg(');
const classifySrc = sliceFn(c2src, c2blind, 'function classify(');

// Structural gate on both slices BEFORE they are used, keyed on properties rather than on looks
// (memory: `sliced exactly once` does not pin the start anchor).
const SLICE_GATE = [
  ['firstArg slice starts at its own declaration', firstArgSrc.startsWith('function firstArg(')],
  ['firstArg slice ends at a closing brace', firstArgSrc.trimEnd().endsWith('}')],
  ['firstArg slice carries its unbalanced refusal', firstArgSrc.includes('if (d !== 0) return null')],
  ['classify slice starts at its own declaration', classifySrc.startsWith('function classify(')],
  ['classify slice ends at a closing brace', classifySrc.trimEnd().endsWith('}')],
  ['classify slice carries the BUFFER bucket name', classifySrc.includes('BUFFER:readFileSync-no-encoding')],
  ['classify slice carries the positively-keyed terminal bucket', classifySrc.includes('UNMODELLED:other-expression')],
];
let sliceRed = 0;
for (const [name, ok] of SLICE_GATE) {
  console.log(`  SLICE GATE  ${ok === true ? 'ok ' : 'RED'}  ${name}`);
  if (ok !== true) sliceRed += 1;
}
if (sliceRed !== 0) { console.log('census3: refusing to report off an ungated slice'); process.exit(1); }
// eslint-disable-next-line no-new-func
const { firstArg, classify } = new Function(`${firstArgSrc}\n${classifySrc}\nreturn { firstArg, classify };`)();

// ═══ One-level resolution ════════════════════════════════════════════════════════════════════════
const DECL_FORMS = (name) => {
  const n = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    // `const x = `, `let x = `, `var x = ` at any indentation. The `=` must not be `==`/`=>`.
    binding: new RegExp(`\\b(?:const|let|var)\\s+${n}\\s*=(?![=>])`, 'g'),
    // destructuring — resolvable in principle, not resolved here, so it gets its own bucket
    destructure: new RegExp(`\\b(?:const|let|var)\\s*[{[][^;=]*\\b${n}\\b[^;=]*[}\\]]\\s*=`, 'g'),
    // `for (const x of …)`
    forOf: new RegExp(`for\\s*\\(\\s*(?:const|let|var)\\s+${n}\\s+(?:of|in)\\b`, 'g'),
    // an import binding
    imported: new RegExp(`import\\s*\\{[^}]*\\b${n}\\b[^}]*\\}\\s*from`, 'g'),
    // a function/arrow PARAMETER: `(x)`, `(x,`, `, x)`, `, x,` inside a parameter list that is
    // immediately followed by `=>` or preceded by `function …`. Approximated by requiring a `=>`
    // or `function` within a short window, and reported as its own bucket either way.
    param: new RegExp(`(?:function\\s*[\\w$]*\\s*\\(|\\(\\s*)(?:[^()]*?\\b)?${n}\\b(?:[^()]*?)\\)\\s*(?:=>|\\{)`, 'g'),
  };
};

function resolveOneLevel(raw, blind, name, siteIdx) {
  const forms = DECL_FORMS(name);
  const hits = (re) => { re.lastIndex = 0; return [...blind.matchAll(re)]; };
  const bindings = hits(forms.binding);
  if (bindings.length > 1) {
    return { bucket: 'AMBIGUOUS:multiple-bindings', why: `${bindings.length} \`const/let/var ${name} =\` in file` };
  }
  if (bindings.length === 1) {
    const at = bindings[0].index + bindings[0][0].length;
    // The initialiser runs to the first `;` at depth 0, balanced over the BLINDED text.
    let d = 0;
    let j = at;
    for (; j < blind.length; j += 1) {
      const c = blind[j];
      if ('(['.includes(c) || c === '{') d += 1;
      else if (')]'.includes(c) || c === '}') d -= 1;
      else if ((c === ';' || c === '\n') && d === 0) break;
    }
    const init = raw.slice(at, j).trim();
    const { bucket } = classify(init);
    if (bucket.startsWith('BUFFER')) return { bucket: 'RESOLVED-TO-BUFFER', why: `${name} = ${init.slice(0, 90)}` };
    if (bucket.startsWith('STRING')) return { bucket: `RESOLVED-TO-STRING (${bucket.split(':')[1]})`, why: `${name} = ${init.slice(0, 90)}` };
    return { bucket: 'RESOLVED-TO-UNMODELLED', why: `${name} = ${init.slice(0, 90)}` };
  }
  if (hits(forms.destructure).length) return { bucket: 'DESTRUCTURED', why: name };
  if (hits(forms.forOf).length) return { bucket: 'LOOP-BINDING', why: name };
  if (hits(forms.imported).length) return { bucket: 'IMPORTED-BINDING', why: name };
  // Parameters last, and only after no binding was found, because a name can be both a parameter
  // somewhere and a const elsewhere, and the binding is the stronger evidence.
  if (hits(forms.param).length) {
    return { bucket: 'PARAM:caller-supplied', why: `${name} — value comes from a caller this census does not follow` };
  }
  return { bucket: 'UNRESOLVED:no-declaration-found', why: `${name} (site offset ${siteIdx})` };
}

// ═══ KP bundle for the resolver ══════════════════════════════════════════════════════════════════
// One positive per resolver bucket, and — the row that matters — a BUFFER one, because a resolver
// that could never say RESOLVED-TO-BUFFER would report 0 for any tree and look like good news.
const KP = [
  ['const src = readFileSync(p);\nstripSource(src, true);', 'src', 'RESOLVED-TO-BUFFER'],
  ['const src = readFileSync(p, "utf8");\nstripSource(src, true);', 'src', 'RESOLVED-TO-STRING (readFileSync-encoded)'],
  ['const src = git("show", r);\nstripSource(src, true);', 'src', 'RESOLVED-TO-STRING (child-process-helper)'],
  ['const src = other;\nstripSource(src, true);', 'src', 'RESOLVED-TO-UNMODELLED'],
  ['const f = (src) => stripSource(src, true);', 'src', 'PARAM:caller-supplied'],
  ['const { src } = bag;\nstripSource(src, true);', 'src', 'DESTRUCTURED'],
  ['for (const src of all) stripSource(src, true);', 'src', 'LOOP-BINDING'],
  ['import { src } from "x";\nstripSource(src, true);', 'src', 'IMPORTED-BINDING'],
  ['stripSource(src, true);', 'src', 'UNRESOLVED:no-declaration-found'],
  ['const src = readFileSync(p);\nconst src = 1;\nstripSource(src, true);', 'src', 'AMBIGUOUS:multiple-bindings'],
];
const kpRows = KP.map(([src, name, want]) => {
  const blind = stripSource(src, true);
  const got = resolveOneLevel(src, blind, name, 0).bucket;
  return { src: src.replace(/\n/g, ' ⏎ '), want, got, ok: got === want };
});

// ═══ Drive over the population ═══════════════════════════════════════════════════════════════════
const POP = git('ls-tree', '-r', '--name-only', '-z', REV)
  .split('\0')
  .filter((f) => f !== '' && /\.(mjs|mts|ts|tsx|js)$/.test(f))
  .filter((f) => f !== SUBJECT && f !== SELF && f !== CENSUS2);

const out = [];
let sitesSeen = 0;
for (const f of POP) {
  let raw;
  try { raw = git('show', `${REV}:${f}`); } catch { continue; }
  if (!raw.includes('stripSource')) continue;
  const blind = stripSource(raw, true);
  if (blind.length !== raw.length) continue;
  const token = 'stripSource(';
  for (let i = blind.indexOf(token); i !== -1; i = blind.indexOf(token, i + 1)) {
    if (/[\w$.]/.test(blind[i - 1] ?? '')) continue;
    sitesSeen += 1;
    const arg = firstArg(raw, blind, i + token.length);
    const first = classify(arg);
    const line = raw.slice(0, i).split('\n').length;
    if (!first.bucket.startsWith('UNMODELLED')) { out.push({ f, line, bucket: `(census2) ${first.bucket}`, why: first.why.slice(0, 90) }); continue; }
    // Only a SIMPLE identifier is resolvable one level. A dotted member expression is a different
    // question and gets its own bucket rather than being forced through this resolver.
    const a = String(arg).trim();
    if (!/^[A-Za-z_$][\w$]*$/.test(a)) { out.push({ f, line, bucket: 'NOT-A-SIMPLE-IDENTIFIER', why: a.slice(0, 90) }); continue; }
    const r = resolveOneLevel(raw, blind, a, i);
    out.push({ f, line, bucket: r.bucket, why: r.why.slice(0, 110) });
  }
}

// ═══ PUBLISH ═════════════════════════════════════════════════════════════════════════════════════
console.log('');
console.log(`census3 — census2's UNMODELLED arguments, resolved ONE level.   rev = ${REV}`);
console.log(`  population ${POP.length} tracked source file(s) · ${sitesSeen} call site(s)`);
console.log('');
const byBucket = new Map();
for (const r of out) byBucket.set(r.bucket, [...(byBucket.get(r.bucket) ?? []), r]);
const names = [...byBucket.keys()].sort();
const SHOW_MEMBERS = (b) => b.startsWith('RESOLVED-TO-BUFFER') || b.startsWith('PARAM')
  || b.startsWith('AMBIGUOUS') || b.startsWith('UNRESOLVED') || b === 'NOT-A-SIMPLE-IDENTIFIER';
for (const b of names) {
  const m = byBucket.get(b);
  console.log(`   ${String(m.length).padStart(3)}  ${b}`);
  if (SHOW_MEMBERS(b)) for (const x of m.slice(0, 40)) console.log(`          ${x.f}:${x.line}  ${x.why}`);
  if (SHOW_MEMBERS(b) && m.length > 40) console.log(`          … and ${m.length - 40} more`);
}
const total = names.reduce((n, b) => n + byBucket.get(b).length, 0);
const nBuf = (byBucket.get('RESOLVED-TO-BUFFER') ?? []).length;
const nParam = (byBucket.get('PARAM:caller-supplied') ?? []).length;
const nStillUnknown = names.filter((b) => b.startsWith('RESOLVED-TO-UNMODELLED') || b.startsWith('AMBIGUOUS')
  || b.startsWith('UNRESOLVED') || b === 'NOT-A-SIMPLE-IDENTIFIER' || b === 'DESTRUCTURED'
  || b === 'LOOP-BINDING' || b === 'IMPORTED-BINDING' || b === 'PARAM:caller-supplied')
  .reduce((n, b) => n + byBucket.get(b).length, 0);

console.log('');
console.log('KP BUNDLE for the resolver (graded before the figures above stand)');
for (const r of kpRows) console.log(`   ${r.ok ? 'ok ' : 'BAD'}  want ${r.want.padEnd(44)} got ${r.got}`);

const GATE = [
  ['every resolver KP row resolves as declared', kpRows.every((r) => r.ok)],
  ['the resolver CAN say RESOLVED-TO-BUFFER (its KP row does), so a 0 here is a measurement',
    kpRows.find((r) => r.want === 'RESOLVED-TO-BUFFER')?.ok === true],
  ['the buckets sum to the call-site count', total === sitesSeen],
  ['the population is non-empty and carries sites', POP.length > 0 && sitesSeen > 0],
];
console.log('');
console.log('GATE');
let red = 0;
for (const [name, ok] of GATE) {
  console.log(`  ${ok === true ? 'ok ' : 'RED'}  ${name}`);
  if (ok !== true) red += 1;
}
console.log('');
console.log(`census3 verdict: ${red === 0 ? 'ok' : `RED (${red})`}`
  + ` · ${sitesSeen} site(s) · RESOLVED-TO-BUFFER ${nBuf} · PARAM ${nParam} · still not known ${nStillUnknown}`);
if (red !== 0) process.exitCode = 1;
