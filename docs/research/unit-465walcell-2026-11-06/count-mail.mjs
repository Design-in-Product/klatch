/**
 * Count live vs read mail with readdirSync, not grep — a pipeline's head is
 * hidden and `ls | wc -l` has bitten this seat before.
 */
import fs from 'fs';
const live = fs.readdirSync('docs/mail').filter((f) => f.endsWith('.md'));
const read = fs.readdirSync('docs/mail/read').filter((f) => f.endsWith('.md'));
console.log(`live: ${live.length}`);
console.log(`read: ${read.length}`);
console.log(`total: ${live.length + read.length}`);
