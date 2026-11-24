/**
 * unit-511 post-hoc 2 — **the class my own two keys both missed, and it is the one that decides the
 * cured line's SHAPE.**
 *
 * The arm keyed `CAPTURE` on `(\d+)` appearing immediately after the label. One live matcher reads
 *
 *     /^(  tracked files read: )(\d+)$/
 *
 * — a **group boundary** sits between the label and the capture, so my shape key called it
 * `LABEL_ONLY`, and `MATCHER(regex)` (which requires `CAPTURE && BLANKED`) therefore called it
 * **`PROSE(comment)`**. A live reader classified as prose by two keys in a row.
 *
 * It matters beyond the tally: that pattern is **end-anchored**. Any cure that appends text after
 * the value — `tracked files read: 1079 (1080 in scope)` — would break it **silently**, because an
 * end-anchored regex that stops matching returns `null` and a consumer reading `[1]` off it either
 * throws or substitutes a default. **So the cure must leave the digits LAST on their line**, and
 * that constraint comes from this census rather than from taste.
 *
 * Key: every occurrence of the label whose surrounding 60 bytes contain regex-literal punctuation,
 * reported with the pattern span verbatim, plus whether it carries `$`, `^`, or neither.
 *
 * No marker: this file compares no braces, so it is out of the population and a marker would exempt
 * nothing (see the arm's note).
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const CAPS = join(HERE, 'captures');
mkdirSync(CAPS, { recursive: true });
const PRE_REG_COMMIT = '7ae1eb18';
const LABEL = 'tracked files read';
const GATE = 'scripts/verify-decl-body-slicers.mjs';

const census = JSON.parse(readFileSync(join(CAPS, 'ARM-CENSUS.json'), 'utf8'));
const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const srcAt = (rel) => execFileSync('git', ['-C', ROOT, 'show', `${PRE_REG_COMMIT}:${rel}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const sources = new Map();
const rows = [];
for (const site of census.censusAtPreReg) {
  if (site.rel === GATE) continue;
  if (!sources.has(site.rel)) sources.set(site.rel, srcAt(site.rel));
  const src = sources.get(site.rel);
  const line = src.split('\n')[site.line - 1] ?? '';
  // The whole LINE is the window. A regex literal holding this label is written on one line in
  // every instance in this corpus; widening the window would add no member and would start
  // catching the next statement's punctuation.
  const slashSpans = [...line.matchAll(/\/(?:[^/\\\n]|\\.)+\/[a-z]*/g)].map((m) => m[0]);
  const inRegex = slashSpans.filter((s) => s.includes(LABEL));
  if (inRegex.length === 0) continue;
  for (const pat of inRegex) {
    rows.push({
      rel: site.rel, line: site.line, pattern: pat,
      endAnchored: pat.includes('$'), startAnchored: pat.includes('^'),
      capturesDigits: /\(\\d\+\)/.test(pat),
      armShape: site.shape, armContext: site.context,
    });
  }
}

const uniq = [];
for (const r of rows) if (!uniq.some((u) => u.rel === r.rel && u.line === r.line && u.pattern === r.pattern)) uniq.push(r);

say(`unit-511 post-hoc 2 — regex matchers on \`${LABEL}\`, by line shape, at ${PRE_REG_COMMIT}`);
say('');
say('§1  every regex literal in the corpus that contains the label');
for (const r of uniq) {
  say(`  ${r.rel}:${r.line}`);
  say(`      pattern:  ${r.pattern}`);
  say(`      anchors:  ${r.startAnchored ? '^' : '-'}${r.endAnchored ? '$' : '-'}   captures digits: ${r.capturesDigits}   arm called it: ${r.armShape}/${r.armContext}`);
}
say('');
const end = uniq.filter((r) => r.endAnchored);
const missedByArm = uniq.filter((r) => !(r.armShape === 'CAPTURE' && r.armContext === 'BLANKED'));
say('§2  the figures');
say(`  regex matchers found:                                  ${uniq.length}`);
say(`  END-ANCHORED (break if ANY text is appended after the value): ${end.length}`);
for (const r of end) say(`      ${r.rel}:${r.line}  ${r.pattern}`);
say(`  classified as something other than MATCHER(regex) by my own two keys: ${missedByArm.length}`);
for (const r of missedByArm) say(`      ${r.rel}:${r.line}  called ${r.armShape}/${r.armContext}  pattern ${r.pattern}`);
say('');
say('§3  the constraint this puts on the cure, stated as a rule the landing must satisfy');
say(`  ${end.length > 0
  ? 'The digits must remain the LAST characters on their line. Scope and skip counts go on a SEPARATE line.'
  : 'No end-anchored matcher exists, so appending after the value would be survivable — but it is not needed either.'}`);
say('');
// A census of regex literals returns a count; a cripple makes the count MOVE. Strip the slashes
// from one real pattern's line and the span finder must lose it.
if (uniq.length > 0) {
  const victim = uniq[0];
  const vline = (sources.get(victim.rel).split('\n')[victim.line - 1] ?? '').split('/').join('X');
  const found = [...vline.matchAll(/\/(?:[^/\\\n]|\\.)+\/[a-z]*/g)].filter((m) => m[0].includes(LABEL));
  say('§4  cripple — remove the delimiters from one real pattern\'s line; the span finder must lose it');
  say(`  ${victim.rel}:${victim.line}: 1 → ${found.length}  ${found.length === 0 ? 'CRIPPLE LIVE' : 'CRIPPLE DEAD — the finder is not keyed on the delimiters'}`);
}

writeFileSync(join(CAPS, 'POSTHOC-ANCHORS.out'), `${out.join('\n')}\n`);
writeFileSync(join(CAPS, 'POSTHOC-ANCHORS.json'), `${JSON.stringify({ regexMatchers: uniq, endAnchored: end.map((r) => `${r.rel}:${r.line}`), missedByArmKeys: missedByArm.map((r) => `${r.rel}:${r.line}`) }, null, 2)}\n`);
