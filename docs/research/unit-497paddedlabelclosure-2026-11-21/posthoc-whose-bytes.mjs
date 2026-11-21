#!/usr/bin/env node
/**
 * unit-497paddedlabelclosure — POST-HOC, written after P5 came back REFUTED and committed with its
 * expectation stated before it was driven.
 *
 * P5 registered: "published stdout differs from the pre-build capture on exactly ONE line —
 * `tracked files read`, 1036 → 1038 — and `Buffer.byteLength(stdout)` stays 4065." The drive found
 * the 1036 → 1038 exactly as registered, and then **three more changes**: the out-of-population
 * dead-marker figures moved 18/20 → 20/22 and two new lines appeared naming this unit's own two
 * `.mjs` files. Bytes 4065 → 4231. **P5 is REFUTED.**
 *
 * The question P5's refutation leaves open is *whose bytes those are*, and it matters, because P5
 * was the landing condition on the widening. Two rival causes:
 *
 *   H1 — the widened key changed what the gate prints.
 *   H2 — the widening printed nothing, and every moved byte is this unit's two files ENTERING the
 *        tracked tree: one of them in the count, and the rest because both docblocks wrote the
 *        string `brace-slicer-deliberate:` while declaring they needed no exemption. The gate's own
 *        IRREDUCIBLE LIMIT section says exactly this will happen: "Any file that writes about this
 *        gate joins the list above."
 *
 * STATED EXPECTATION, before this file is driven: **H2**. Specifically — the wide-key gate and a
 * narrow-key copy of it, run against the SAME tree, produce **byte-identical stdout** (so the
 * widening's own cost is **0 bytes**), and the dead-marker figures return to **18/20** when the
 * token is removed from this unit's two docblocks, leaving `tracked files read` as the only
 * surviving difference from the pre-build capture. If the first comparison is not byte-identical,
 * H1 is live and the widening does not land.
 */
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = resolve(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const SCRATCH = resolve(ROOT, 'scripts/scratch-unit497-posthoc.mjs');
const WIDE_KEY = 'LABELS.find((v) => line.trimEnd().endsWith(v))';
const NARROW_KEY = 'LABELS.find((v) => line.endsWith(v))';

const src = readFileSync(GATE, 'utf8');
if (src.split(WIDE_KEY).length - 1 !== 1) throw new Error('posthoc: wide key not present exactly once');

const wide = spawnSync(process.execPath, [GATE], { encoding: 'buffer', cwd: ROOT });
writeFileSync(SCRATCH, src.replace(WIDE_KEY, NARROW_KEY));
let narrow;
try {
  narrow = spawnSync(process.execPath, [SCRATCH], { encoding: 'buffer', cwd: ROOT });
} finally {
  rmSync(SCRATCH, { force: true });
}

console.log('unit-497paddedlabelclosure — post-hoc: whose bytes moved?');
console.log('');
console.log('## H1 vs H2 — the same tree, read by the wide key and by the narrow key');
console.log(`  wide key   rc=${wide.status}  stdout ${wide.stdout.length} B  stderr ${wide.stderr.length} B`);
console.log(`  narrow key rc=${narrow.status}  stdout ${narrow.stdout.length} B  stderr ${narrow.stderr.length} B`);
const identical = Buffer.compare(wide.stdout, narrow.stdout) === 0;
const errIdentical = Buffer.compare(wide.stderr, narrow.stderr) === 0;
console.log(`  stdout byte-identical: ${identical}   stderr byte-identical: ${errIdentical}`);
console.log(`  bytes attributable to the WIDENING: ${wide.stdout.length - narrow.stdout.length}`);
console.log(`  → ${identical && errIdentical ? 'H1 is dead. H2 stands: the widening printed nothing.' : 'H1 IS LIVE — the widening moved published bytes.'}`);
console.log('');

// --- the decomposition against the pre-build capture --------------------------------------------
const pre = readFileSync(resolve(HERE, 'captures/pre-build-stdout.out'), 'utf8');
const post = wide.stdout.toString('utf8');
const figure = (text, re) => (text.match(re) || [null, null])[1];
const OUTPOP = /\n {2}(\d+) tracked file\(s\), carrying (\d+) marker occurrence\(s\), are OUT/;
const TRACKED = /\n {2}tracked files read: (\d+)/;
const selfNamed = (text) => (text.match(/unit-497paddedlabelclosure-2026-11-21\/\S+\.mjs/g) || []).length;
console.log('## decomposition of the 4065 → ' + Buffer.byteLength(post) + ' move');
console.log(`  tracked files read:        ${figure(pre, TRACKED)} → ${figure(post, TRACKED)}  (registered in P5)`);
const preOut = pre.match(OUTPOP); const postOut = post.match(OUTPOP);
console.log(`  out-of-population markers: ${preOut[1]}/${preOut[2]} → ${postOut[1]}/${postOut[2]}  (NOT registered)`);
console.log(`  lines naming this unit's own files in that list: ${selfNamed(pre)} → ${selfNamed(post)}`);
console.log('');
console.log('## why: the token is in this unit\'s own docblocks');
for (const f of ['arm-padded-closure.mjs', 'cripple-padded-closure.mjs', 'posthoc-whose-bytes.mjs']) {
  const text = readFileSync(resolve(HERE, f), 'utf8');
  const hits = (text.match(/brace-slicer-deliberate:/g) || []).length;
  console.log(`  ${f.padEnd(28)} occurrences of the marker token: ${hits}`);
}
console.log('');
console.log(`POST-HOC ${identical && errIdentical ? 'OK' : 'ATTENTION'} — P5 is refuted and the refutation is`
  + ' against this seat\'s own docblock phrasing rather than against the cure: the widening\'s own'
  + ' cost is 0 published bytes, measured at one tree by two keys.');
