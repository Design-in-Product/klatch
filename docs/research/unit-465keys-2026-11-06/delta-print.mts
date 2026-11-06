/**
 * unit-465keys — print `schemaDelta()`'s answer field by field, from the
 * TypeScript source, for one database.
 *
 * usage: npx tsx delta-print.mts <db>
 *
 * Separate from the driver because the driver is not an async module and this
 * reads the subject's own exports directly. Prints every field rather than a
 * verdict: the unit is about which key sees what, and a boolean would hide that.
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
console.log(`describeSchemaDelta -> ${describeSchemaDelta(d, target) === undefined ? 'undefined' : '(a block)'}`);
console.log(`describeDataDelta   -> ${describeDataDelta(d.data, target) === undefined ? 'undefined' : '(a block)'}`);
