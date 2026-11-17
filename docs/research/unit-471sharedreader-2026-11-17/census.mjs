// census.mjs -- unit-471sharedreader
// Find test files that import both a writer (readBack-mapper) function and its
// matching reader function, for each of the 8 entity pairs Daedalus's round468
// cure produced. For each hit, print surrounding context so a human can judge
// whether an actual toEqual/toBe round-trip arm exists that shares the mapper.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const TEST_DIR = 'packages/server/src/__tests__';

const pairs = [
  ['createChannel', 'getChannel'],
  ['createGroundRulesPreset', 'getGroundRulesPreset'],
  ['createMessagePair', 'getMessage'],
  ['createEntity', 'getEntity'],
  ['createProject', 'getProject'],
  ['createFileArtifact', 'getMessageArtifacts'],
  ['createCarriedContextArtifact', 'getMessageArtifacts'],
  ['createToolUseArtifact', 'getMessageArtifacts'],
  ['createFile', 'getFile'],
  ['createFileRef', 'getFileRefs'],
];

const files = readdirSync(TEST_DIR).filter((f) => f.endsWith('.test.ts'));
const bodies = new Map();
for (const f of files) {
  bodies.set(f, readFileSync(join(TEST_DIR, f), 'utf8'));
}

for (const [writer, reader] of pairs) {
  console.log(`\n== ${writer} / ${reader} ==`);
  for (const f of files) {
    const src = bodies.get(f);
    if (src.includes(writer) && src.includes(reader)) {
      console.log(`  ${f}`);
    }
  }
}
