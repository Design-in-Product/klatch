#!/usr/bin/env node
/**
 * unit-513consumernull — post-hoc 4 (STOP fire 2026-11-24)
 *
 * WHY THIS EXISTS. Theseus's 11-24 addendum (§2) names a specific hole in his own key — his
 * `STRINGARG` shape required the label to be the WHOLE string literal, so the COLON FORM, where
 * the label is a *prefix* of its literal (`num('tracked files read:')`), never matched — and then
 * says: "Your own census would have the same hole for the same reason, if it keyed on the literal
 * rather than on the pattern — worth a look at your 23 before either of us treats a label census
 * as settled."
 *
 * This drives that look. Two questions, each with a known positive FIRST:
 *
 *   Q1  Does my arm's selector have HIS hole — does a colon-suffixed label inside a regex literal
 *       escape it? My arm keys on `REGEX_LITERAL` match whose text `.includes(LABEL)`. That is
 *       substring containment, not whole-literal equality, so the prediction is NO. Driven, not
 *       reasoned.
 *
 *   Q2  What hole does my selector have INSTEAD, by the same mechanism one layer out? My subject
 *       population is regex *literals*, found per line. A matcher built some other way —
 *       `new RegExp('tracked files read: (\\d+)')` — carries the label to a matcher and cannot be
 *       a `REGEX_LITERAL` match. If any such site exists in the corpus, my published 23 sites /
 *       22 applications is INCOMPLETE, and incomplete in exactly the family he named: a selector
 *       keyed on one syntactic FORM of its subject.
 *
 * KNOWN POSITIVES RUN FIRST AND GATE THE CORPUS FIGURE. A zero from the non-literal key is only a
 * finding if the key is shown able to return non-zero. Fixtures are in-memory strings, never
 * tracked files — a tracked fixture carrying this label would join the population it grades
 * (Theseus's rule, adopted).
 *
 * DECLARED BLINDNESS, registered before the corpus drive: the non-literal key tests the
 * *call argument text* for label containment, so a label assembled by CONCATENATION
 * (`new RegExp('tracked files' + ' read')`) or built from a variable is NOT matched. KP5 plants
 * exactly that form and asserts the key MISSES it, so the blindness is measured rather than
 * claimed. The corpus figure is therefore a FLOOR on non-literal matcher sites, not a count.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const CAPS = join(HERE, 'captures');
mkdirSync(CAPS, { recursive: true });

const LABEL = 'tracked files read';
const SELF = 'docs/research/unit-513consumernull-2026-11-24/posthoc-nonliteral-matchers.mjs';
const CODE_EXT = new Set(['.mjs', '.mts', '.ts', '.js', '.cjs', '.tsx', '.jsx']);

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const sha12 = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);

// ---------------------------------------------------------------- the two keys

/** My unit-513 arm's selector, COPIED VERBATIM from arm-consumernull.mjs (asserted below). */
const REGEX_LITERAL = /\/(?:[^/\\\n]|\\.)+\/[a-z]*/g;

/** KEY OLD — the arm's own site key: a regex literal, on a line carrying the label, containing it. */
function keyOldSites(src) {
  const hits = [];
  if (!src.includes(LABEL)) return hits;
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].includes(LABEL)) continue;
    for (const m of lines[i].matchAll(REGEX_LITERAL)) {
      if (!m[0].includes(LABEL)) continue;
      hits.push({ line: i + 1, pattern: m[0] });
    }
  }
  return hits;
}

/**
 * KEY NEW — a matcher whose pattern is NOT a regex literal: `new RegExp(<args>)` or
 * `RegExp(<args>)`, where the argument text up to the closing paren on the same line contains the
 * label. Blind to concatenation and to variable-built patterns, by construction (KP5).
 */
const NONLITERAL = /(?:new\s+)?RegExp\s*\(([^)]*)\)/g;
function keyNewSites(src) {
  const hits = [];
  if (!src.includes(LABEL)) return hits;
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].includes(LABEL)) continue;
    for (const m of lines[i].matchAll(NONLITERAL)) {
      if (!m[1].includes(LABEL)) continue;
      hits.push({ line: i + 1, args: m[1].trim().slice(0, 90) });
    }
  }
  return hits;
}

// ---------------------------------------------------------------- §0 selector provenance

say(`unit-513 post-hoc 4 — is my own 23 keyed on one FORM of its subject?`);
say(`label \`${LABEL}\``);
say('');
say('## §0 selector provenance — KEY OLD is the arm\'s own, not a retyping');

const armRel = 'docs/research/unit-513consumernull-2026-11-24/arm-consumernull.mjs';
const armSrc = readFileSync(join(ROOT, armRel), 'utf8');
const armLine = armSrc.split('\n').find((l) => l.includes('const REGEX_LITERAL'));
const mineLine = readFileSync(join(ROOT, SELF), 'utf8').split('\n')
  .find((l) => l.includes('const REGEX_LITERAL'));
const provenance = armLine && mineLine && armLine.trim() === mineLine.trim();
say(`  arm  : ${armLine ? armLine.trim() : '(NOT FOUND)'}`);
say(`  mine : ${mineLine ? mineLine.trim() : '(NOT FOUND)'}`);
say(`  byte-identical selector line: ${provenance ? 'YES' : 'NO'}`);
if (!provenance) {
  say('  ABORT — the key under test is not the key that produced the 23. Nothing below is gradeable.');
  writeFileSync(join(CAPS, 'POSTHOC-NONLITERAL.out'), out.join('\n') + '\n');
  process.exit(2);
}
say('');

// ---------------------------------------------------------------- §1 known positives

say('## §1 known positives — run FIRST, gate both corpus figures');

const KP = [
  {
    id: 'KP1 non-literal, label whole arg',
    src: `const re = new RegExp('tracked files read: (\\\\d+)');\nconst m = out.match(re);\n`,
    wantOld: 0, wantNew: 1,
    why: 'the form my arm cannot see: pattern built, not written',
  },
  {
    id: 'KP2 literal, inline application',
    src: `const m = stdout.match(/tracked files read: (\\d+)/);\n`,
    wantOld: 1, wantNew: 0,
    why: 'control — KEY OLD must still fire, or its 23 means nothing',
  },
  {
    id: 'KP3 literal, COLON form (his hole, on my key)',
    src: `const n = Number(stdout.match(/tracked files read:\\s+(\\d+)/)[1]);\n`,
    wantOld: 1, wantNew: 0,
    why: 'label is a PREFIX inside the pattern — does my key drop it?',
  },
  {
    id: 'KP4 trap — RegExp with no label',
    src: `const re = new RegExp(someName + '\\\\s*=');\n// tracked files read\n`,
    wantOld: 0, wantNew: 0,
    why: 'label present in the file but not in the call argument',
  },
  {
    id: 'KP5 declared blindness — label by concatenation',
    src: `const re = new RegExp('tracked files' + ' read: (\\\\d+)');\n`,
    wantOld: 0, wantNew: 0,
    why: 'REGISTERED MISS — this is why the corpus figure is a floor, not a count',
  },
  {
    id: 'KP6 non-literal, bare RegExp() call',
    src: `const re = RegExp('tracked files read: (\\\\d+)', 'm');\n`,
    wantOld: 0, wantNew: 1,
    why: 'the `new`-less form is the same hazard',
  },
];

let kpPass = 0;
for (const k of KP) {
  const gotOld = keyOldSites(k.src).length;
  const gotNew = keyNewSites(k.src).length;
  const ok = gotOld === k.wantOld && gotNew === k.wantNew;
  if (ok) kpPass += 1;
  say(`  ${ok ? 'PASS' : 'FAIL'}  ${k.id}`);
  say(`        OLD want ${k.wantOld} got ${gotOld} · NEW want ${k.wantNew} got ${gotNew}  — ${k.why}`);
}
say('');
say(`KNOWN POSITIVES: ${kpPass} of ${KP.length}`);
if (kpPass !== KP.length) {
  say('ABORT — a key that fails its own known positives cannot grade the corpus.');
  writeFileSync(join(CAPS, 'POSTHOC-NONLITERAL.out'), out.join('\n') + '\n');
  process.exit(3);
}
say('');
say('  Q1 ANSWERED BY KP3: my key sees the colon form. His hole is not mine — the arm tests');
say('  `.includes(LABEL)` on the matched pattern text, which is substring containment, so a label');
say('  that is a PREFIX of its pattern is found. KP2 confirms the key is live, so KP3 is not a');
say('  vacuous pass.');
say('');

// ---------------------------------------------------------------- §2 corpus

say('## §2 corpus — tracked code files at HEAD');

const tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\n').filter(Boolean)
  .filter((p) => CODE_EXT.has(p.slice(p.lastIndexOf('.'))));

let selfExcluded = 0;
const corpus = tracked.filter((p) => {
  if (p === SELF) { selfExcluded += 1; return false; }
  return true;
});

let unreadable = 0;
let carryLabel = 0;
const oldSites = [];
const newSites = [];
for (const rel of corpus) {
  let src;
  try { src = readFileSync(join(ROOT, rel), 'utf8'); } catch { unreadable += 1; continue; }
  if (!src.includes(LABEL)) continue;
  carryLabel += 1;
  for (const h of keyOldSites(src)) oldSites.push({ rel, ...h });
  for (const h of keyNewSites(src)) newSites.push({ rel, ...h });
}

say(`  tracked code files           ${tracked.length}`);
say(`  of which this post-hoc       ${selfExcluded} (excluded; tracked-at-run-time: ${selfExcluded === 1})`);
say(`  corpus scanned               ${corpus.length}`);
say(`  unreadable                   ${unreadable}`);
say(`  files carrying the label     ${carryLabel}`);
say('');
say(`  KEY OLD  regex-literal matcher sites   ${oldSites.length}`);
say(`  KEY NEW  non-literal matcher sites     ${newSites.length}   (FLOOR — see KP5)`);
say('');

say('## §3 the non-literal sites, printed in full, not sized');
if (newSites.length === 0) {
  say('  none. Stated as a measured zero: KP1 and KP6 show the key fires on this form, and');
  say('  KP5 shows what it would still miss, so the zero is a floor of 0 with one declared');
  say('  blindness — NOT a claim that no such matcher exists.');
} else {
  for (const s of newSites) say(`  ${s.rel}:${s.line}  RegExp(${s.args})`);
}
say('');

// ---------------------------------------------------------------- §4 reconciliation

say('## §4 reconciliation against the published 23');
say('  Published in unit-513 RESULTS: 23 regex matcher sites at HEAD, 22 applied applications.');
say(`  KEY OLD re-driven here, at THIS commit: ${oldSites.length} sites.`);
say('  The two figures are read at different commits and this fire added research files, so a');
say('  difference is expected and is NOT a defect; what matters is the FORM coverage, below.');
say('');
const verdict = newSites.length > 0
  ? `INCOMPLETE BY FORM — ${newSites.length} matcher site(s) carry the label to a built pattern that the arm's regex-literal key cannot see.`
  : 'COMPLETE ON THE MEASURED FORMS — no built-pattern matcher site found, with KP5\'s concatenation form declared unmeasured.';
say(`  VERDICT: ${verdict}`);
say('');
say('## §5 what is still not keyed, stated as a limit');
say('  - Concatenated / variable-built patterns (KP5): declared blind, unmeasured.');
say('  - Matchers whose RegExp call spans more than one line: the key is line-local, same as the arm\'s.');
say('  - Non-regex string consumers (`num(\'tracked files read:\')`): NOT this key\'s population at');
say('    all — that is Theseus\'s 14, and the two censuses remain different populations.');

writeFileSync(join(CAPS, 'POSTHOC-NONLITERAL.out'), out.join('\n') + '\n');
say('');
say(`capture sha12 ${sha12(out.join('\n'))}`);
