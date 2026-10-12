// D6 — the arm that makes D2's red a FALSE defect rather than a cosmetic one: D2's
// behaviour-preserving refactor PLUS the registry drift. If the refactored file still catches the
// drift (B4 red at 2), then the property A1 exists to protect is present in D2 and A1 reports it
// absent. One variable against D2 (the registry), one variable against D5 (the refactor).
import { cpSync, readFileSync, rmSync } from 'node:fs';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SWEEP = 'scripts/sweep-probes.mjs';
const REG_ANCHOR = 'refusal: /probe-round223b: something already holds 3001/,';
const REG_REPLACEMENT = 'refusal: /something already holds 3001/,';

const dst = '.testdata/round376f';
rmSync(dst, { recursive: true, force: true });
cpSync('.testdata/round376b', dst, { recursive: true });

const g = join(dst, SWEEP);
const src = readFileSync(g, 'utf8');
const n = src.split(REG_ANCHOR).length - 1;
if (n !== 1) throw new Error(`D6 registry: anchor occurs ${n} time(s), expected exactly 1`);
console.log('[anchor ok] D6 registry: 1 occurrence');
writeFileSync(g, src.replace(REG_ANCHOR, REG_REPLACEMENT));
console.log(`[built] ${dst}`);
