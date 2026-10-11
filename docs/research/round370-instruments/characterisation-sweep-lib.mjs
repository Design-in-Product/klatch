/**
 * The characterisation-test sweep's pure half: population, comment spans, prose, predicate.
 *
 * Separated from the driver so that every arm drives THESE functions rather than re-spelling them.
 * (Round 369: a grader that re-implements its subject from prose grades a copy against its
 * author's expectations — the agree-vacuously shape one level down.)
 */
import fs from 'node:fs';
import path from 'node:path';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const SKIP = new Set(['node_modules', '.git', '.testdata', 'dist', 'build', '.scratch-theseus']);

/** Every file under `root`, from a readdirSync walk — never grep (NO ROW for a NUL-containing file). */
export function walk(root, dir = root, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(root, p, acc);
    else if (e.isFile()) acc.push(path.relative(root, p));
  }
  return acc;
}

export function population(root) {
  const all = walk(root);
  const tests = all.filter((f) => /\.test\.(ts|tsx|mts|js|mjs)$/.test(f));
  const probes = all.filter((f) => /(^|\/)probe-[^/]*\.(mts|mjs|ts)$/.test(f) && f.startsWith('scripts/'));
  return { all, tests, probes, files: [...tests, ...probes] };
}

/**
 * Every comment span in `src`, as {start, end, text, line}.
 *
 * Spans are rebuilt across INTERIOR SPACES: stripSource blanks a comment byte to a space, and a
 * space already is one, so a span derived by diffing truncates at the first space (Round 344's
 * defect, which returned 146 false positives against a true 0).
 *
 * A span is a comment rather than a regex literal iff its ORIGINAL text opens `//` or `/*`.
 * stripSource blanks regex bodies too — measured, not assumed — so this discriminator is
 * load-bearing rather than defensive.
 */
export function commentSpans(src) {
  const masked = stripSource(src, false);
  if (masked.length !== src.length) throw new Error('stripSource broke length-preservation');

  const blankedOrSpace = (i) => masked[i] === ' ' && src[i] !== '\n';
  const spans = [];
  let i = 0;
  while (i < src.length) {
    if (!blankedOrSpace(i)) {
      i += 1;
      continue;
    }
    let j = i;
    while (j < src.length && blankedOrSpace(j)) j += 1;
    const raw = src.slice(i, j);
    const lead = raw.replace(/^[ \t]+/, '');
    if (lead.startsWith('//') || lead.startsWith('/*')) {
      spans.push({ start: i, end: j, text: raw, line: src.slice(0, i).split('\n').length });
    }
    i = j;
  }
  return spans;
}

/**
 * Consecutive comment spans joined into LOGICAL comment blocks.
 *
 * This is the load-bearing correction and it was found by a control, not by reading. `commentSpans`
 * terminates every span at the newline, so a `//` comment wrapped over three lines is THREE spans.
 * The known positive's own text is
 *
 *     // On the failure path the returned `reasons` are built from skips only. Asserting the shape
 *     // rather than the intent: an inapplicable entry is silently dropped when code is 1.
 *
 * and `asserting the shape … rather than` straddles the wrap. Against per-line spans that marker is
 * not merely missed, it is UNREPRESENTABLE: no amount of prose normalisation inside a span can see
 * text that is in a different span. The first version of this instrument scored the known positive
 * as a non-member for exactly that reason, and the CONTROL is what caught it — the live figure
 * would have printed a smaller number with nothing to contradict it.
 */
export function commentBlocks(src) {
  const spans = commentSpans(src);
  const blocks = [];
  for (const s of spans) {
    const prev = blocks[blocks.length - 1];
    const between = prev ? src.slice(prev.end, s.start) : null;
    // One block iff nothing but a single newline and indentation separates the two spans.
    if (prev && between !== null && /^\s*\n[ \t]*$/.test(between)) {
      prev.text = `${prev.text}\n${s.text}`;
      prev.end = s.end;
      prev.spans += 1;
    } else {
      blocks.push({ start: s.start, end: s.end, text: s.text, line: s.line, spans: 1 });
    }
  }
  return blocks;
}

/**
 * A comment's PROSE: continuation furniture removed, whitespace collapsed.
 *
 * This is the finding of the drive, not a convenience. Comment prose line-wraps, and every
 * continuation line carries `//` or ` * `, so in the raw span the text reads
 * `"...the shape\n    // rather than the intent"`. Any multi-word marker written with a literal
 * space between its words therefore MISSES every instance the wrap happens to split — and misses
 * it by returning a SMALLER number, silently, which is the fleet's standing failure shape for a
 * source-scanning regex.
 */
export function commentProse(raw) {
  return raw
    .split('\n')
    .map((l) => l.replace(/^[ \t]*(?:\/\/+|\/\*+|\*+\/|\*)[ \t]*/, '').replace(/\*\/[ \t]*$/, ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The narrowed predicate, as a NAMED set so a member list can be compared, not just a count. */
export const MARKERS = [
  ['shape-rather-than-intent', /asserting\s+the\s+(?:shape|current|existing)\b[\s\S]{0,60}?rather\s+than/i],
  ['characterising', /\bcharacteris(?:e|es|ed|ing|ation)\b/i],
  ['for-now', /\bfor\s+now\b/i],
  ['silently', /\bsilent(?:ly)?\b/i],
  ['rather-than', /\brather\s+than\b/i],
];

export function markersIn(text) {
  const prose = commentProse(text);
  return MARKERS.filter(([, re]) => re.test(prose)).map(([k]) => k);
}

/** The same predicate WITHOUT normalisation — the counterfactual, driven rather than described. */
export function markersInRaw(text) {
  return MARKERS.filter(([, re]) => re.test(text)).map(([k]) => k);
}
