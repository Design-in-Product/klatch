#!/usr/bin/env node
/**
 * unit-505markedabsentpair — POST-HOC, NOT a pre-registered HIT. P8 was REFUTED; this locates the
 * site that refuted it, by measurement rather than by reading my own file and deciding.
 *
 * P8 predicted this unit would move no published gate figure. The gate's DEAD MARKERS list went
 * 20 files / 23 occurrences -> 21 / 24 and the standing report went 4309 B / 43 L -> 4390 B / 44 L
 * the moment `arm-markedabsentpair.mjs` became tracked.
 *
 * The key is taken from the GATE'S OWN SOURCE, sliced out of the live `const MARKER = ...;`
 * statement, never retyped here — a hand-typed reader is not a slice, and retyping the key would
 * also plant it in this file a second time.
 *
 * This file itself carries NO contiguous occurrence of the key: it slices the key out of the gate
 * at runtime and never writes it down. Whether that worked is measured below for THIS file too,
 * which is the only honest way to make the claim after having made it falsely once today.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';

const UNIT = import.meta.dirname;
const ROOT = resolve(UNIT, '../../..');
const GATE_REL = 'scripts/verify-decl-body-slicers.mjs';

const must = (c, m) => { if (!c) throw new Error(`ASSERTION FAILED: ${m}`); };
const gateSrc = readFileSync(join(ROOT, GATE_REL), 'utf8');

/* --------------------------------------- the key, SLICED from the gate's live statement, not typed */
const DECL = /^const MARKER = \/(.+)\/;$/m.exec(gateSrc);
must(DECL, 'could not locate the live `const MARKER = /.../;` statement in the gate');
const MARKER = new RegExp(DECL[1]);
// The literal token is the part of the pattern before the first escape class — derived, not typed.
const TOKEN = DECL[1].split('\\s')[0];
must(TOKEN.endsWith(':'), `derived token does not end in a colon: ${JSON.stringify(TOKEN)}`);

/* ------------------------------------------------------------- every site, in each file I shipped */
const FILES = [
  'docs/research/unit-505markedabsentpair-2026-11-22/arm-markedabsentpair.mjs',
  'docs/research/unit-505markedabsentpair-2026-11-22/posthoc-p8-which-site.mjs',
  'docs/research/unit-503stalelabelwidth-2026-11-22/arm-stalelabelwidth.mjs',
  'docs/research/unit-504mixedstalelabels-2026-11-22/arm-mixedstalelabels.mjs',
];

/** Classify a site the way the gate does: a DECLARED marker lives in a comment. */
function sites(rel) {
  const src = readFileSync(join(ROOT, rel), 'utf8');
  const out = [];
  src.split('\n').forEach((line, i) => {
    let idx = line.indexOf(TOKEN);
    while (idx !== -1) {
      const before = line.slice(0, idx);
      out.push({
        line: i + 1,
        inComment: /(^\s*\*|^\s*\/\/|\/\*)/.test(before) || /^\s*\*/.test(line),
        matchesLiveKey: MARKER.test(line),
        text: line.trim().slice(0, 120),
      });
      idx = line.indexOf(TOKEN, idx + 1);
    }
  });
  return out;
}

const report = Object.fromEntries(FILES.map((f) => [f, sites(f)]));

/* ------------------------------------------------------------------------------- what this proves */
const mine = report[FILES[0]];
const self = report[FILES[1]];
const prior = report[FILES[2]];

const verdict = {
  'POST-HOC  arm-markedabsentpair.mjs carries at least one contiguous occurrence of the live key':
    mine.length > 0,
  'POST-HOC  every one of them is in a COMMENT (so the gate counts it as DECLARED, not quoted-only)':
    mine.length > 0 && mine.every((s) => s.inComment),
  'POST-HOC  every one of them matches the live MARKER regex sliced from the gate':
    mine.length > 0 && mine.every((s) => s.matchesLiveKey),
  'POST-HOC  the offending comment is the one ASSERTING the token cannot match this file':
    mine.some((s) => /cannot match/i.test(s.text)),
  'POST-HOC  unit-503 arm-stalelabelwidth.mjs shipped the SAME site, earlier today':
    prior.length > 0 && prior.every((s) => s.inComment),
  'POST-HOC  unit-504 arm-mixedstalelabels.mjs did NOT (his R4 held where mine did not)':
    report[FILES[3]].length === 0,
  'POST-HOC  THIS post-hoc file carries ZERO contiguous occurrences — key sliced, never written':
    self.length === 0,
};

console.log(JSON.stringify({
  gateSha: createHash('sha256').update(readFileSync(join(ROOT, GATE_REL))).digest('hex'),
  liveMarkerPattern: DECL[1],
  derivedToken: TOKEN,
  sites: Object.fromEntries(Object.entries(report).map(([f, s]) => [relative('docs/research', f), s])),
  verdict,
}, null, 2));
