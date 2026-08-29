#!/usr/bin/env node
/**
 * verify-design-assertions-gated.mjs — the executable form of standing rule 16's check 16a, plus
 * the check that the 12-15 merge dropped nothing.
 *
 * Written 2026-08-29 by Theseus (Round 116), on Daedalus's Round 115 §6 sign-off of the merge.
 *
 * §(a) CHECK 16a, RUN OVER ARM S. "Every geometric property a design asserts must have a gate that
 *      checks it, or be labelled assumed at every number that depends on it." Daedalus stated the
 *      procedure as: list the asserted properties, list the gates, diff. This file holds both lists
 *      as data and does the diff, reporting the ungated remainder split by POLARITY — see below.
 *
 * §(b) THE MERGE DROPPED NOTHING. Round 115 §6 signed off merging rules 12-15 into one rule on the
 *      condition that no mechanical check be lost ("a merge that drops a check is worse than five
 *      rules"). That condition is asserted here rather than promised: each merged rule's operative
 *      check text must still be present verbatim in the standing-rules file, and each of rules
 *      12-15 must retain its own heading so the 141 existing citations outside that file still
 *      resolve. A later edit that deletes one goes red here.
 *
 * WHY POLARITY. Check 16a as written quantifies over every asserted property. A mature design
 * document asserts many properties whose only function is to WEAKEN one of its own claims — arm S
 * asserts "the Q/R prompts present two search targets and S-exposed presents one" for the sole
 * purpose of refusing to transfer a base rate. Gating that changes nothing a reader relies on. Run
 * naively, the check returns a list dominated by caveats, and a procedure that mostly returns noise
 * gets run twice and abandoned. So each ungated property is classified by what breaks if it is
 * false, and in which direction: SUPPORTS (a number, a spend, or the meaning of the DV) is a
 * finding; WEAKENS is recorded and is not.
 *
 * VERBATIM-OR-NOTHING. A mapping from prose to gates is worthless if the prose moved. Every
 * property string and every gate string below is asserted PRESENT IN THE DOCUMENT before the
 * mapping is trusted; if the pre-registration is reworded, this file goes red rather than quietly
 * reporting a mapping over text that no longer exists. Matching is on whitespace-normalised text so
 * that the documents can rewrap freely.
 *
 * Inputs are COMMITTED markdown, so unlike its siblings in this family this script needs no corpus
 * and runs on every seat. It therefore resolves paths from the REPO root rather than the cwd — the
 * siblings read gitignored per-seat `.testdata/` artifacts and are cwd-relative by convention;
 * that reason does not apply here and cwd-independence is strictly better.
 *
 * Exit:   0 all checks pass · 1 a check failed · 2 an input document is not on this seat
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const DOCS = {
  armS: 'docs/research/arm-s-cumulative-exposure-preregistration-2026-08-28.md',
  rules: 'docs/research/recall-arm-standing-rules-2026-08-28.md',
};

const missingDocs = Object.values(DOCS).filter((p) => !fs.existsSync(path.join(REPO, p)));
if (missingDocs.length) {
  console.error(
    `input document not on this seat (${missingDocs.length}/${Object.keys(DOCS).length} missing, ` +
      `e.g. ${missingDocs[0]}).\nThese are committed files; if they are absent the checkout is ` +
      `incomplete, which is a different fact from a check failing.`,
  );
  process.exit(2);
}

/**
 * Whitespace-normalised document text, so the source may rewrap without breaking a match.
 *
 * Line-leading blockquote markers are stripped first. Without that, any match spanning a line break
 * inside a `>` block fails — which on this file's first run was 2 of its 3 red checks, including the
 * one asserting that check 16a's own text survived the merge. Both documents state their operative
 * rules inside blockquotes, so a normaliser blind to `>` is blind to precisely the sentences this
 * script exists to find. Recorded rather than quietly fixed: it is the same shape as everything else
 * this round is about, in the instrument built to check for it.
 */
const norm = (s) =>
  s
    .split('\n')
    .map((line) => line.replace(/^[\s>]+/, ' '))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
const armS = norm(fs.readFileSync(path.join(REPO, DOCS.armS), 'utf8'));
const rules = norm(fs.readFileSync(path.join(REPO, DOCS.rules), 'utf8'));

const failures = [];
const checks = [];
function ok(label, value, pass) {
  checks.push({ label, value, pass });
  if (!pass) failures.push(label);
}

// ---------------------------------------------------------------------------------------------
// §(a) Check 16a over the arm-S pre-registration
// ---------------------------------------------------------------------------------------------

/**
 * The gates arm S §3 actually contains. `text` is asserted present in the document; if a gate is
 * reworded or deleted, every property mapped to it becomes unmapped and this file goes red.
 */
const GATES = [
  { id: '1', text: 'the call-1 render carries `excerptSeparators >= 1`' },
  {
    id: '1b',
    text: 'query in the registered query set is productive in a neighbourhood other than the token-bearing one',
  },
  { id: '2', text: 'query in the registered query set produces `excerptSeparators >= 1`' },
  { id: '3', text: 'The restriction is inside an offered address in both cells' },
  { id: '4', text: 'Carried context ACTIVE' },
];

/**
 * Places the document labels a property as assumed/underived rather than gating it — the second
 * branch of check 16a ("or be labelled assumed at every number that depends on it").
 */
const LABELS = [
  { id: 'L-region', text: 'region count** — an arithmetic fact this document does not state' },
  { id: 'L-1b-sat', text: 'Whether gate 1b is satisfiable jointly with gate 1' },
  { id: 'L-build', text: 'That the two cells are buildable at the stated geometry' },
  { id: 'L-base-rate', text: 'undetermined for S' },
];

/**
 * Every geometric property the pre-registration ASSERTS. `gate` names the gate that checks it,
 * `label` names where it is labelled assumed, and null for both is the finding check 16a exists to
 * surface. `polarity` is what breaks if the property is false, and in which direction.
 */
const PROPERTIES = [
  {
    id: 'P1',
    cell: 'S-exposed',
    where: '§1 table',
    text: 'the token-bearing neighbourhood is the *only* productive query',
    gate: '1b',
    label: null,
    polarity: 'SUPPORTS',
    note: 'ungated until Round 115; gate 1b is the fix that minted check 16a',
  },
  {
    id: 'P2',
    cell: 'S-exposed',
    where: '§1 table',
    text: 'two-excerpt (`excerptSeparators: 1`)',
    gate: '1',
    label: null,
    polarity: 'SUPPORTS',
    note: 'the call-1 render, by construction',
  },
  {
    id: 'P3',
    cell: 'S-unexposed',
    where: '§1 table',
    text: 'the two-excerpt neighbourhood is not renderable by any query',
    gate: '2',
    label: null,
    polarity: 'SUPPORTS',
    note: 'gate 2 is the model check 16a was derived from',
  },
  {
    id: 'P4',
    cell: 'S-unexposed',
    where: '§1 table',
    text: 'the restriction rows are reachable only by `expand`',
    gate: null,
    label: null,
    polarity: 'SUPPORTS',
    note:
      'fixes the meaning of the DV. Gate 3 checks the SUFFICIENCY direction (expand can reach the ' +
      'restriction); nothing checks NECESSITY (nothing else reaches it). A query matching only ' +
      'restriction rows renders one excerpt, so sep 0, so it passes gate 2 — the two gates in this ' +
      'cell are jointly blind to it.',
  },
  {
    id: 'P5',
    cell: 'S-unexposed',
    where: '§1 table',
    text: 'single-excerpt (`excerptSeparators: 0`)',
    gate: '2',
    label: null,
    polarity: 'SUPPORTS',
    note: 'entailed: if no query produces sep>=1 then call 1 does not either',
  },
  {
    id: 'P6e',
    cell: 'S-exposed',
    where: '§1 body',
    text: 'Make the order exogenous by making only one query productive.',
    gate: '1b',
    label: null,
    polarity: 'SUPPORTS',
    note: 'the arm-scope design fix, realised for this cell by §1 table and checked by gate 1b',
  },
  {
    id: 'P6u',
    cell: 'S-unexposed',
    where: '§1 body',
    text: 'Make the order exogenous by making only one query productive.',
    gate: null,
    label: null,
    polarity: 'SUPPORTS',
    note:
      'the same arm-scope sentence, unrealised for this cell. §1 table asserts single-productivity ' +
      'only for S-exposed; gate 2 constrains sep, not productivity; and the S-unexposed alphabet ' +
      'carries B0 (a second distinct productive neighbourhood) INSIDE the gate-2-holding block. So ' +
      'the search order the arm exists to make exogenous is left free in one of its two cells.',
  },
  {
    id: 'P7',
    cell: 'both',
    where: '§3 gate 3',
    text: 'The restriction is inside an offered address in both cells',
    gate: '3',
    label: null,
    polarity: 'SUPPORTS',
    note: 'asserted as a gate, so gated by construction',
  },
  {
    id: 'P8',
    cell: 'S-exposed',
    where: '§2a',
    text: 'the Q/R prompts present two search targets and S-exposed presents one',
    gate: null,
    label: null,
    polarity: 'WEAKENS',
    note:
      'asserted solely to REFUSE the transfer of the 10/10 second-query base rate. If false, a ' +
      'caveat was too strong and a number the document declines to rely on becomes available. ' +
      'Recorded, not a finding — this is the case the polarity qualifier exists for. (It is NOT ' +
      'covered by the L-base-rate label: that labels the base rate as untransferred, using P8; it ' +
      'does not label P8 itself as assumed.)',
  },
  {
    id: 'P10',
    cell: 'both',
    where: '§1 table, labelled §6',
    text: 'That the two cells are buildable at the stated geometry',
    gate: null,
    label: 'L-build',
    polarity: 'SUPPORTS',
    note: 'asserting two cells asserts that both are constructible; §6 labels it underived',
  },
  {
    id: 'P11',
    cell: 'S-exposed',
    where: '§2a',
    text: '10/10 in the only corpus available',
    gate: null,
    label: 'L-base-rate',
    polarity: 'SUPPORTS',
    note:
      'behavioural rather than geometric, and included because it is the cleanest exercise of check ' +
      '16a`s second branch: the rate supports the claim that runs LAND on discriminating shapes, ' +
      'and it is labelled undetermined for this arm at the point of use',
  },
  {
    id: 'P9',
    cell: 'S-exposed',
    where: '§3 gate 1b, §6',
    text: 'exactly two regions where the exposing query reaches both',
    gate: null,
    label: 'L-region',
    polarity: 'SUPPORTS',
    note: 'the entailment condition that reduces gate 1b to a region count; labelled open in §6',
  },
];

console.log('=== (a) Check 16a over the arm-S pre-registration — asserted properties vs gates ===\n');

const propTextMissing = PROPERTIES.filter((p) => !armS.includes(norm(p.text)));
const gateTextMissing = GATES.filter((g) => !armS.includes(norm(g.text)));
const labelTextMissing = LABELS.filter((l) => !armS.includes(norm(l.text)));

ok(
  'every asserted-property string is present verbatim in the pre-registration',
  propTextMissing.map((p) => p.id),
  propTextMissing.length === 0,
);
ok(
  'every gate string is present verbatim in §3',
  gateTextMissing.map((g) => g.id),
  gateTextMissing.length === 0,
);
ok(
  'every assumed-label string is present verbatim',
  labelTextMissing.map((l) => l.id),
  labelTextMissing.length === 0,
);

const gateIds = new Set(GATES.map((g) => g.id));
const labelIds = new Set(LABELS.map((l) => l.id));
const danglingGate = PROPERTIES.filter((p) => p.gate && !gateIds.has(p.gate));
const danglingLabel = PROPERTIES.filter((p) => p.label && !labelIds.has(p.label));
ok('no property maps to a gate that does not exist', danglingGate.map((p) => p.id), danglingGate.length === 0);
ok('no property maps to a label that does not exist', danglingLabel.map((p) => p.id), danglingLabel.length === 0);

const verdict = (p) => (p.gate ? 'GATED' : p.label ? 'LABELLED' : 'UNGATED');

for (const p of PROPERTIES) {
  const v = verdict(p);
  const via = p.gate ? `gate ${p.gate}` : p.label ? p.label : '—';
  console.log(`  ${p.id.padEnd(4)} ${v.padEnd(9)} ${via.padEnd(12)} ${p.cell.padEnd(12)} ${p.where}`);
  console.log(`       "${p.text}"`);
  console.log(`       [${p.polarity}] ${p.note}\n`);
}

const ungated = PROPERTIES.filter((p) => verdict(p) === 'UNGATED');
const ungatedSupporting = ungated.filter((p) => p.polarity === 'SUPPORTS');
const ungatedWeakening = ungated.filter((p) => p.polarity === 'WEAKENS');

console.log('  THE DIFF:');
console.log(`    properties asserted:                    ${PROPERTIES.length}`);
console.log(`    gated:                                  ${PROPERTIES.filter((p) => verdict(p) === 'GATED').length}`);
console.log(`    labelled assumed:                       ${PROPERTIES.filter((p) => verdict(p) === 'LABELLED').length}`);
console.log(`    UNGATED and SUPPORTING — findings:      ${ungatedSupporting.length}  — ${ungatedSupporting.map((p) => p.id).join(' ') || 'none'}`);
console.log(`    ungated but only weakening — recorded:  ${ungatedWeakening.length}  — ${ungatedWeakening.map((p) => p.id).join(' ') || 'none'}\n`);

console.log(`  Reading: both findings are in S-UNEXPOSED, and P4 is a strict special case of P6u — a
  query that renders the restriction rows IS a second productive query, but a second productive
  query need not be the one that renders the restriction. Neither moves a computed number: the
  S-unexposed enumeration already carries B0 in its gate-2-holding block, so the 0-discriminating
  result is computed under the WEAKER assertion and stands. What they bear on is Q1 (a free search
  order in one cell reintroduces the search-volume confound the arm was designed to remove) and, for
  P4, the meaning of the DV itself (a non-expansion is only informative if expand was the only route
  to the restriction).

  Note where these were invisible from. Round 115 fixed S-exposed by copying the discipline already
  applied to S-unexposed. The copy could not surface these, because they are defects OF the cell that
  was being copied FROM.\n`);

ok('check 16a returns exactly 2 ungated supporting properties in arm S', ungatedSupporting.map((p) => p.id), ungatedSupporting.length === 2);
ok('both findings are in the S-unexposed cell', ungatedSupporting.map((p) => p.cell), ungatedSupporting.every((p) => p.cell === 'S-unexposed'));
ok('P4 (restriction reachable only by expand) is ungated', verdict(PROPERTIES.find((p) => p.id === 'P4')), verdict(PROPERTIES.find((p) => p.id === 'P4')) === 'UNGATED');
ok('P6u (one productive query, S-unexposed) is ungated while P6e is gated', [verdict(PROPERTIES.find((p) => p.id === 'P6u')), verdict(PROPERTIES.find((p) => p.id === 'P6e'))], verdict(PROPERTIES.find((p) => p.id === 'P6u')) === 'UNGATED' && verdict(PROPERTIES.find((p) => p.id === 'P6e')) === 'GATED');
ok('the polarity qualifier is load-bearing — it suppresses at least one non-finding', ungatedWeakening.map((p) => p.id), ungatedWeakening.length >= 1);
ok('P1 is now gated — the defect that minted check 16a is closed', verdict(PROPERTIES.find((p) => p.id === 'P1')), verdict(PROPERTIES.find((p) => p.id === 'P1')) === 'GATED');
ok('P9 takes the labelled-assumed branch rather than counting as a finding', verdict(PROPERTIES.find((p) => p.id === 'P9')), verdict(PROPERTIES.find((p) => p.id === 'P9')) === 'LABELLED');

// ---------------------------------------------------------------------------------------------
// §(b) The 12-15 merge dropped no mechanical check
// ---------------------------------------------------------------------------------------------

console.log('\n=== (b) The rules 12-15 merge into rule 16 dropped no mechanical check ===\n');

/** Each merged rule's operative check text. Deleting one from the file turns this red. */
const MERGED_CHECKS = [
  { id: '16a', was: 'new (Daedalus, R115 §6)', text: 'Every geometric property a design asserts must have a gate that checks it, or be labelled assumed at every number that depends on it.' },
  { id: '16b', was: 'rule 12', text: 'the number of runs on which the rivals actually give different predictions' },
  { id: '16c', was: 'rule 13', text: 'enumerate the run shapes the design can actually produce, mark which ones discriminate, and then run every validity gate, void clause and exclusion criterion over that marked set.' },
  { id: '16d', was: 'rule 15', text: 'before the spend, check that the run record physically contains the fields the clause reads.' },
  { id: '16d-cor', was: 'rule 15 corollary', text: 'every kind added to an alphabet under this rule must be discharged as reachable, or labelled as assumed at every number that depends on it' },
  { id: '16e', was: 'rule 14', text: 'every figure the old clause generated has been recomputed and the stale ones replaced' },
  { id: '16e-v', was: 'rule 14, verifier limb', text: 'recompute the verifier, not just the prose' },
  { id: '16e-p', was: 'rule 14 corollary', text: 'antecedent, not a proxy for it' },
];

/** Headings that must survive so the 141 existing citations of rules 12-15 still resolve. */
const CITATION_ANCHORS = [
  { id: 'rule 12', text: '12. Report the runs on which the rivals *disagree*, not just the score' },
  { id: 'rule 13', text: 'exclusion clauses against its *discriminating* shapes, before the spend' },
  { id: 'rule 14', text: '14. When you narrow a clause, recompute every number the old clause produced' },
  { id: 'rule 15', text: 'antecedent names must be in the per-run record' },
  { id: 'rule 16', text: '16. Every claim about a design must name the derivation that produced it' },
];

/** Each old rule must carry a forward pointer to the check it became. */
const REDIRECTS = [
  { id: '12->16b', text: 'Merged 2026-08-29 into rule 16 as check 16b.' },
  { id: '13->16c', text: 'Merged 2026-08-29 into rule 16 as check 16c.' },
  { id: '14->16e', text: 'Merged 2026-08-29 into rule 16 as check 16e' },
  { id: '15->16d', text: 'Merged 2026-08-29 into rule 16 as check 16d' },
];

const droppedChecks = MERGED_CHECKS.filter((c) => !rules.includes(norm(c.text)));
const lostAnchors = CITATION_ANCHORS.filter((a) => !rules.includes(norm(a.text)));
const lostRedirects = REDIRECTS.filter((r) => !rules.includes(norm(r.text)));

for (const c of MERGED_CHECKS) {
  console.log(`  ${droppedChecks.includes(c) ? 'DROPPED' : 'present'}  ${c.id.padEnd(8)} (${c.was})`);
}
console.log('');

ok('no merged rule lost its operative check text', droppedChecks.map((c) => c.id), droppedChecks.length === 0);
ok('all 8 operative check texts accounted for across the 5 checks', MERGED_CHECKS.length, MERGED_CHECKS.length === 8);
ok('rules 12-15 keep their own headings, so existing citations resolve', lostAnchors.map((a) => a.id), lostAnchors.length === 0);
ok('the merged rule exists as rule 16 and not as a reused number', lostAnchors.find((a) => a.id === 'rule 16') === undefined, lostAnchors.find((a) => a.id === 'rule 16') === undefined);
ok('each old rule carries a forward pointer to the check it became', lostRedirects.map((r) => r.id), lostRedirects.length === 0);
ok('no rule 17 was appended', rules.includes(norm('## 17.')) === false, !rules.includes(norm('## 17.')));

// ---------------------------------------------------------------------------------------------

console.log('  self-checks:');
for (const c of checks) {
  console.log(`  ${c.pass ? 'ok  ' : 'FAIL'} ${c.label} — ${JSON.stringify(c.value)}`);
}

if (failures.length) {
  console.log(`\nFAIL — ${failures.length} of ${checks.length} self-checks failed`);
  process.exit(1);
}
console.log(`\nPASS — all ${checks.length} self-checks passed`);
