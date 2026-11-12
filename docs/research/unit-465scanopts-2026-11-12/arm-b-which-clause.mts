/**
 * unit-465scanopts — ARM B (follow-on characterisation)
 *
 * NOT PRE-REGISTERED. Written after arm-scanopts refuted P1 (delta 0 on every
 * file, including the three permissionMode sessions). This arm exists to say
 * WHY, and it makes no graded prediction — every number below is a reading, and
 * the conclusions in RESULTS.md that rest on it are labelled post-hoc.
 *
 * P1 was sourced from `parser.ts:430-437`, whose own figure is "6-7 of 75 turns
 * fabricated" on this exact file. Today's readings are 66 / 66. Either the
 * docblock's figure describes code that no longer exists, or the file's count
 * has moved. This arm nests the predicate's clauses so each one's contribution
 * is a separate number.
 *
 *   A'  absence-only, pre-b5e1672a      (no isVisibleInTranscriptOnly clause)
 *   A   absence-only, today's flags     (A' + isVisibleInTranscriptOnly)
 *   B   A + isMachineAuthoredText       == today's LEGACY branch == the scanner
 *   C   B + permissionMode required     == today's STRICT branch == the import
 *
 * A'-A, A-B and B-C are the three clauses' prices. B-C is the one the scanner
 * does not pay, because it does not pass the option.
 *
 * Read-only. Usage:
 *   npx tsx docs/research/unit-465scanopts-2026-11-12/arm-b-which-clause.mts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  isConversationEvent,
  isMachineAuthoredText,
  type RawEvent,
} from '../../../packages/server/src/import/parser.js';
import { readJsonlFile } from '../../../packages/server/src/import/parser.js';

const REPO = path.resolve(import.meta.dirname, '../../..');

const FILES = [
  'exports/sessions/theseus-2026-03-22.jsonl',
  'packages/server/src/__tests__/fixtures/real-shapes-2.1.241.jsonl',
  'packages/server/src/__tests__/fixtures/real-shapes-2.1.81.jsonl',
];

/** First text block of an event, mirroring parser.ts firstTextOf (not exported). */
function firstTextOf(event: RawEvent): string | undefined {
  const content = event.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    for (const b of content as any[]) {
      if (b?.type === 'text' && typeof b.text === 'string') return b.text;
    }
  }
  return undefined;
}

function hasText(event: RawEvent): boolean {
  const content = event.message?.content;
  if (!content) return false;
  if (typeof content === 'string') return content.trim().length > 0;
  if (Array.isArray(content)) {
    return (content as any[]).some(
      (b) => b?.type === 'text' && b.text && b.text.trim().length > 0,
    );
  }
  return false;
}

// Refusal: the clause this arm nests must still be spelled the way it reads it.
const parserSrc = fs.readFileSync(
  path.join(REPO, 'packages/server/src/import/parser.ts'),
  'utf-8',
);
const needed = [
  'if (event.isVisibleInTranscriptOnly) return false;',
  'if (opts?.requirePermissionMode && event.permissionMode === undefined) return false;',
  'if (firstText !== undefined && isMachineAuthoredText(firstText)) return false;',
];
let refusals = 0;
for (const n of needed) {
  const occ = parserSrc.split(n).length - 1;
  if (occ !== 1) {
    console.log(`  REFUSE — clause occurs ${occ}x, expected 1: ${n}`);
    refusals++;
  }
}
if (refusals > 0) {
  console.log(`\nREFUSALS: ${refusals} — no figure printed.`);
  process.exit(1);
}
console.log('=== REFUSAL GATE === all 3 nested clauses present exactly once in parser.ts\n');

for (const f of FILES) {
  const abs = path.join(REPO, f);
  const { events } = await readJsonlFile(abs);
  const raw = events as RawEvent[];
  const conv = raw.filter(isConversationEvent);

  const userRole = conv.filter(
    (e) => e.type === 'user' && e.message?.role === 'user' && hasText(e),
  );

  const aPrime = userRole.filter((e) => !e.isCompactSummary && !e.isMeta);
  const a = aPrime.filter((e) => !e.isVisibleInTranscriptOnly);
  const b = a.filter((e) => {
    const t = firstTextOf(e);
    return !(t !== undefined && isMachineAuthoredText(t));
  });
  const c = b.filter((e) => e.permissionMode !== undefined);

  console.log(`=== ${f} ===`);
  console.log(`  user-role events with text:                      ${userRole.length}`);
  console.log(`  A'  absence-only, pre-b5e1672a:                  ${aPrime.length}`);
  console.log(`  A   absence-only, today's flags:                 ${a.length}   (A'-A = ${aPrime.length - a.length})`);
  console.log(`  B   + isMachineAuthoredText  [= scanner]:        ${b.length}   (A-B  = ${a.length - b.length})`);
  console.log(`  C   + permissionMode required [= import]:        ${c.length}   (B-C  = ${b.length - c.length})`);

  const shapeExcluded = a.filter((e) => {
    const t = firstTextOf(e);
    return t !== undefined && isMachineAuthoredText(t);
  });
  if (shapeExcluded.length > 0) {
    const byPrefix = new Map<string, number>();
    for (const e of shapeExcluded) {
      const t = (firstTextOf(e) ?? '').trimStart();
      const key = t.slice(0, t.indexOf('>') + 1) || t.split('\n')[0].slice(0, 24);
      byPrefix.set(key, (byPrefix.get(key) ?? 0) + 1);
    }
    console.log(`  A-B by kind:`);
    for (const [k, n] of [...byPrefix].sort((x, y) => y[1] - x[1])) {
      console.log(`      ${n}  ${JSON.stringify(k)}`);
    }
  }

  const pmMissing = b.filter((e) => e.permissionMode === undefined);
  console.log(
    `  of B, carrying no permissionMode:                ${pmMissing.length}` +
      (pmMissing.length === 0
        ? '   <- the option is REDUNDANT on this file: the shape filter already removed every one'
        : '   <- the option would remove these; the scanner does not'),
  );
  console.log('');
}

console.log('=== APPARATUS ===');
console.log(`refusals: ${refusals} of 3 declared — ${refusals === 0 ? 'all green' : 'RED'}`);
console.log('predictions: none — this arm is a characterisation, not a graded leg.');
process.exit(0);
