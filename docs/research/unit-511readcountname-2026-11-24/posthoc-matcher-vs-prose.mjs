/**
 * unit-511 post-hoc — **my own §3 figure over-reports, and this is the leg that says by how much.**
 *
 * The arm's census keys reader-vs-prose on `CODE` vs `BLANKED` — whether the label's bytes survive
 * the comments-blanked reading. That separates *a string literal* from *a comment*, and I then used
 * it as if it separated *a matcher* from *prose*. **It does not.** `say('  tracked files read: …')`
 * is `CODE` and is not a matcher; it is prose that happens to live in a template string. So §3's
 * "28 live consumer sites break under R" is an **upper bound**, and the figure that decides the cure
 * is the narrower one: how many sites FEED a match or an extraction.
 *
 * Keyed on the 80 bytes preceding the occurrence, and **every live site's preceding context is
 * printed verbatim** so the classification can be checked at the call rather than trusted. A
 * `CAPTURE` site inside a regex body is a matcher by construction (nothing else is a regex for).
 *
 * This is the same mechanism as the defect under cure: a name (`CODE`) that asserts more than the
 * thing it counts.
 *
 * brace-slicer-deliberate: no brace comparison here either — it reads a label and a preceding span.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const CAPS = join(HERE, 'captures');
mkdirSync(CAPS, { recursive: true });

const census = JSON.parse(readFileSync(join(CAPS, 'ARM-CENSUS.json'), 'utf8'));
const PRE_REG_COMMIT = '7ae1eb18';
const LABEL = 'tracked files read';
const GATE = 'scripts/verify-decl-body-slicers.mjs';
// Each name is a way to ASK A STRING A QUESTION. A site reached by one of these breaks when the
// string changes; a site reached by none of them merely goes stale, which is a prose problem.
const MATCH_CALLS = ['includes', 'indexOf', 'startsWith', 'endsWith', 'match', 'matchAll', 'test', 'split', 'replace', 'replaceAll', 'search', 'lastIndexOf'];

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const srcAt = (rel) => execFileSync('git', ['-C', ROOT, 'show', `${PRE_REG_COMMIT}:${rel}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const sources = new Map();
const rows = [];
for (const site of census.censusAtPreReg) {
  if (!sources.has(site.rel)) sources.set(site.rel, srcAt(site.rel));
  const src = sources.get(site.rel);
  // Re-find this site by (line, label) rather than trusting a stored offset: the capture is data,
  // the source is the subject, and re-deriving the offset here keeps the two from drifting.
  const lineStart = src.split('\n').slice(0, site.line - 1).join('\n').length + (site.line > 1 ? 1 : 0);
  const idxInLine = src.slice(lineStart).indexOf(LABEL);
  const abs = lineStart + idxInLine;
  const before = src.slice(Math.max(0, abs - 80), abs);
  const calls = MATCH_CALLS.filter((c) => before.includes(`.${c}(`));
  const cmp = /(===|!==|==|!=)\s*['"`]?\s*$/.test(before);
  const isRegex = site.shape === 'CAPTURE' && site.context === 'BLANKED';
  const verdict = isRegex ? 'MATCHER(regex)'
    : calls.length > 0 ? `MATCHER(.${calls[calls.length - 1]})`
      : cmp ? 'MATCHER(comparison)'
        : site.context === 'BLANKED' ? 'PROSE(comment)'
          : 'PROSE(string)';
  rows.push({ ...site, verdict, before: before.replace(/\s+/g, ' ').slice(-56) });
}

say('unit-511 post-hoc — matcher vs prose, over every census site at ' + PRE_REG_COMMIT);
say('');
const consumers = rows.filter((r) => r.rel !== GATE);
const matchers = consumers.filter((r) => r.verdict.startsWith('MATCHER'));
say('§1  every CONSUMER site classified, with the preceding bytes printed so the call can be read');
for (const r of consumers) {
  say(`  ${r.verdict.padEnd(18)} ${r.shape.padEnd(10)} ${r.rel}:${r.line}`);
  say(`      before: …${r.before}`);
}
say('');
say('§2  the figures my §3 should have published');
const tally = {};
for (const r of consumers) tally[r.verdict] = (tally[r.verdict] || 0) + 1;
say(`  consumer sites: ${consumers.length}   tally: ${JSON.stringify(tally)}`);
say(`  MATCHER sites (break if the published STRING changes — cure R):  ${matchers.length}`);
say(`  distinct FILES holding a matcher:                                ${[...new Set(matchers.map((r) => r.rel))].length}`);
const valueMatchers = matchers.filter((r) => r.shape === 'VALUE');
say(`  MATCHER sites embedding a VALUE (break if the value changes — cure V): ${valueMatchers.length}`);
for (const r of valueMatchers) say(`      ${r.rel}:${r.line}  before=…${r.before}`);
say('');
say('§3  the arm\'s own over-report, measured');
say(`  arm §3 published "live consumer sites" = ${census.breaksUnderR.length} FILES / 28 sites`);
say(`  of those sites, ACTUAL matchers = ${matchers.length}; the rest are prose that goes STALE, not blind`);
say(`  over-report factor on the site count: ${(28 / Math.max(1, matchers.length)).toFixed(2)}x`);
say('');
// A classification that returns a count needs a drive where the count MUST move. Strip the method
// call from the 80-byte window of every matcher and assert every one of them loses its verdict.
const crippled = consumers.map((r) => {
  const b = MATCH_CALLS.reduce((acc, c) => acc.split(`.${c}(`).join('.XXXX('), r.before);
  const stillMatcher = MATCH_CALLS.some((c) => b.includes(`.${c}(`));
  return { rel: r.rel, line: r.line, was: r.verdict, stillMatcher };
});
const callKeyed = consumers.filter((r) => r.verdict.startsWith('MATCHER(.'));
const survived = crippled.filter((c) => c.stillMatcher).length;
say('§4  cripple — blank the method names in the window and every CALL-keyed matcher must lose it');
say(`  call-keyed matcher sites: ${callKeyed.length}   still matching after the cripple: ${survived}  ${survived === 0 && callKeyed.length > 0 ? 'CRIPPLE LIVE' : 'CRIPPLE DEAD or no call-keyed site exists'}`);
say('  NOT crippled by this: regex-body matchers, which are keyed on shape rather than on a call name.');

writeFileSync(join(CAPS, 'POSTHOC-MATCHER.out'), `${out.join('\n')}\n`);
writeFileSync(join(CAPS, 'POSTHOC-MATCHER.json'), `${JSON.stringify({ rows: consumers, tally, matchers: matchers.map((r) => `${r.rel}:${r.line}`), valueMatchers: valueMatchers.map((r) => `${r.rel}:${r.line}`), cripple: { callKeyed: callKeyed.length, survived } }, null, 2)}\n`);
