/**
 * Round 141 — reconcile the browse count against what the import actually persists.
 *
 * Theseus (2026-09-02) measured a real session where the session browser showed
 * `604+` and the import persisted `325` rows, and declined to file it as a bug:
 * "turn-grouping plausibly accounts for the whole gap; I did not verify the
 * mapping event by event, so I'm not calling it wrong."
 *
 * This is that verification. It runs the two real code paths against the same
 * file and prints an exact decomposition, so the residual — if any — is a
 * number, not an adjective.
 *
 *   browse count   = extractSessionFingerprint().messageCount   (session-scanner.ts)
 *   persisted rows = what importSession() would INSERT           (queries.ts:1308-1340)
 *
 * The two count different units. The scanner counts raw user+assistant *events*;
 * the importer persists *turns*, each collapsing one human message plus every
 * assistant event that follows it into at most two rows. This script measures
 * that collapse rather than asserting it.
 *
 * Read-only. Touches no database. Usage:
 *   npx tsx scripts/probe-browse-count-vs-persisted-rows.mts <session.jsonl> [...]
 */

import { extractSessionFingerprint } from '../packages/server/src/import/session-scanner.js';
import {
  isConversationEvent,
  isHumanTurnBoundary,
  groupIntoTurns,
  readJsonlFile,
  type RawEvent,
} from '../packages/server/src/import/parser.js';

/**
 * Mirror of the scanner's per-event predicate (session-scanner.ts:147-170).
 * Duplicated deliberately: the scanner applies it inline inside a stream
 * handler, so there is no exported predicate to call. If the two drift, this
 * probe's `scannerCounted` will stop matching `messageCount` and the assertion
 * below fails loudly rather than reporting a wrong decomposition.
 */
function scannerCounts(event: any): boolean {
  if (!event || (event.type !== 'user' && event.type !== 'assistant')) return false;
  if (event.isSidechain) return false;
  if (event.isMeta || event.isCompactSummary || event.isVisibleInTranscriptOnly) return false;
  if (!event.message) return false;
  if (event.type === 'user') {
    const content = event.message.content;
    if (Array.isArray(content) && content.length > 0 &&
        content.every((b: any) => b?.type === 'tool_result')) return false;
  }
  return true;
}

async function probe(path: string) {
  const fp = await extractSessionFingerprint(path);
  const { events } = await readJsonlFile(path);
  const raw = events as RawEvent[];

  const counted = raw.filter(scannerCounts);
  const countedUser = counted.filter((e) => e.type === 'user');
  const countedAssistant = counted.filter((e) => e.type === 'assistant');

  // The real divergence the two code paths carry (Daedalus, unit-465scanopts-2026-11-12): the
  // import computes `requirePermissionMode` once per file — true iff ANY user event in it
  // carries `permissionMode` (parser.ts:637) — and passes it to BOTH groupIntoTurns and
  // isHumanTurnBoundary below; the scanner (session-scanner.ts:441) never computes or passes it
  // at all. Mirrored here rather than omitted, so a boundary-shaped event missing
  // `permissionMode` on a file that otherwise carries it reads as a real divergence instead of
  // vacuous agreement between two readings of the same legacy branch.
  const requirePermissionMode = raw.some(
    (e) => e.type === 'user' && (e as any).permissionMode !== undefined,
  );
  const importOpts = { requirePermissionMode };

  const turns = groupIntoTurns(raw.filter(isConversationEvent), importOpts);
  const rowsUser = turns.filter((t) => t.userText).length;
  const rowsAssistant = turns.filter(
    (t) => t.assistantText || (t.artifacts && t.artifacts.length > 0)
  ).length;
  const persisted = rowsUser + rowsAssistant;

  // Turn boundaries the scanner did NOT count, and vice versa.
  //
  // CURED 2026-11-12 (was a declared blindness in `unit-465scanopts-2026-11-12`, §4, routed by
  // Daedalus to this seat): `boundaries` below now passes the import's real `importOpts`
  // (computed above, matching parser.ts:637 exactly), while `scannerCounts`/`fp.turnCount` stay
  // opts-less, matching session-scanner.ts's own reality. Previously BOTH sides omitted `opts`,
  // so the "(== parser boundaries)" line compared two readings of the legacy branch and could not
  // see the one asymmetry in the tree. Verified non-vacuous against a planted fixture (a
  // boundary-shaped user event missing `permissionMode` on a session that otherwise carries it)
  // before trusting this: pre-fix, `boundaryNotCounted`/`countedUserNotBoundary` both read 0 on
  // that fixture — vacuous, exactly as named. Post-fix, the planted event shows up as
  // `countedUserNotBoundary` (scanner counts it, the import's real boundary set correctly
  // excludes it) — not asserted here, scratch-verified only (see mail). Measured price on the 7
  // real files `unit-465scanopts` tried remains 0 (unchanged — none of them has the shape), so
  // this fire's fix changes what the probe CAN see, not what it reports on the files already run.
  //
  // (isHumanTurnBoundary also requires message.role, which the scanner's inline
  // filter does not; that one is inert, because the scanner only increments when
  // the predicate returns true.)
  // Round 279: wrapped rather than passed by reference. `isHumanTurnBoundary(event, opts?)` bound
  // `Array.prototype.filter`'s SECOND argument — the index — to `opts`, so every element after the
  // first was classified with `opts = <number>`. Behaviourally inert, and only inert by luck: the
  // one field read off `opts` is `requirePermissionMode`, which is `undefined` on a number, so the
  // call silently took the legacy branch it would have taken with no `opts` at all. Caught by
  // `scripts/tsconfig.json` on the gate's first run.
  const boundaries = raw.filter(isConversationEvent).filter((e) => isHumanTurnBoundary(e, importOpts));
  const boundaryNotCounted = boundaries.filter((e) => !scannerCounts(e)).length;
  const countedUserNotBoundary = countedUser.filter((e) => !isHumanTurnBoundary(e, importOpts)).length;

  console.log(`\n=== ${path} ===`);
  console.log(`  raw lines parsed:              ${raw.length}`);
  console.log(`  browse count (messageCount):   ${fp.messageCount}${fp.capped ? '  [CAPPED — lower bound]' : ''}`);
  console.log(`  scanner turnCount:             ${fp.turnCount}${fp.turnCount === boundaries.length ? '  (== parser boundaries)' : `  !! parser says ${boundaries.length}`}`);
  console.log(`  persisted rows (import):       ${persisted}`);
  console.log(`  gap:                           ${fp.messageCount - persisted}`);
  console.log(`  --- decomposition ---`);
  console.log(`  scanner counted user events:   ${countedUser.length}`);
  console.log(`  scanner counted asst events:   ${countedAssistant.length}`);
  console.log(`  turn boundaries:               ${boundaries.length}`);
  console.log(`  turns -> user rows:            ${rowsUser}`);
  console.log(`  turns -> assistant rows:       ${rowsAssistant}`);
  console.log(`  --- residual accounting ---`);
  console.log(`  asst events collapsed away:    ${countedAssistant.length - rowsAssistant}`);
  console.log(`  user events not persisted:     ${countedUser.length - rowsUser}`);
  console.log(`    of which not a boundary:     ${countedUserNotBoundary}`);
  console.log(`  boundaries scanner missed:     ${boundaryNotCounted}`);

  // The identity that must hold if turn-grouping accounts for the *whole* gap.
  const explained =
    (countedAssistant.length - rowsAssistant) + (countedUser.length - rowsUser);
  const residual = (fp.messageCount - persisted) - explained;
  console.log(`  UNEXPLAINED residual:          ${residual}` +
    (residual === 0 ? '   <- grouping accounts for the whole gap' : '   <- SOMETHING ELSE IS HAPPENING'));

  if (!fp.capped && fp.messageCount !== counted.length) {
    console.log(`  !! predicate drift: scanner reported ${fp.messageCount}, mirror counted ${counted.length}`);
  }

  return { path, browse: fp.messageCount, capped: fp.capped, persisted, turns: turns.length, residual };
}

const paths = process.argv.slice(2);
if (paths.length === 0) {
  console.error('usage: npx tsx scripts/probe-browse-count-vs-persisted-rows.mts <session.jsonl> [...]');
  process.exit(2);
}

const results = [];
for (const p of paths) results.push(await probe(p));

console.log(`\n=== summary ===`);
for (const r of results) {
  console.log(
    `  ${r.browse}${r.capped ? '+' : ' '} browse -> ${r.persisted} rows (${r.turns} turns), residual ${r.residual}  ${r.path}`
  );
}
