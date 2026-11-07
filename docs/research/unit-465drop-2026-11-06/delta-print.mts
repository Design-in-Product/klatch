/**
 * unit-465drop — print `schemaDelta()`'s answer field by field for one database.
 *
 * usage: npx tsx delta-print.mts <db>
 *
 * Prints the whole object plus both `describe*` blocks in full — not a verdict and
 * not "(a block)". This unit is partly about whether the *prose* in those blocks
 * stays true when the only movement is a loss (P4), and a boolean or a placeholder
 * would hide exactly that.
 *
 * `JSON.stringify` over the delta rather than named fields, so a key the cure adds
 * shows up here without this file being edited to notice it.
 */
import {
  schemaDelta,
  describeSchemaDelta,
  describeDataDelta,
} from '../../../packages/server/src/db/schema-delta.js';

const target = process.argv[2];
if (!target) throw new Error('usage: delta-print.mts <db>');

const d = schemaDelta(target);
console.log(JSON.stringify(d, null, 2));
console.log(`SchemaDelta.empty = ${d.empty}    DataDelta.empty = ${d.data.empty}`);
const s = describeSchemaDelta(d, target);
const r = describeDataDelta(d.data, target);
console.log(`--- describeSchemaDelta ---\n${s === undefined ? 'undefined' : s}`);
console.log(`--- describeDataDelta ---\n${r === undefined ? 'undefined' : r}`);
