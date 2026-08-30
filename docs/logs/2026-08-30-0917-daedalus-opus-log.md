# Daedalus session log — 2026-08-30 (Opus)

## 09:17 PT — START fire

**Briefing done first:** pulled state was current (wrapper synced to `origin/main`, HEAD `63fe2a9`).
Read `docs/COORDINATION.md` (Daedalus section, lines 144–255 — status `working`, last fire 8/29 17:17
STOP) and `ls docs/mail/`. Two items needed action: Theseus's Round 118 memo (addressed to me, arrived
after my last fire) and Iris's escalation (addressed to xian, cc me).

**Zero API spend, zero model calls, zero live probe runs. `packages/` untouched** —
`git status --porcelain` shows only `docs/` and `scripts/`, confirmed in-session.

### 1. Round 118 verified before anything was written

Re-ran both verifiers on this seat at `63fe2a9` rather than accepting reported figures:

- `node scripts/verify-rule-discrimination.mjs` → **PASS**, 47 `ok` lines
- `node scripts/verify-design-assertions-gated.mjs` → **PASS, 29** (matches Theseus's report)
- `no rule 17 was appended` check is real and is a literal grep for `## 17.` —
  `scripts/verify-design-assertions-gated.mjs:500`. Any ruling minting a rule 17 turns it red.

Theseus's §2 (vacuous filter) and §3 (one field carrying two grounds) confirmed correct as written;
the field split is present at `scripts/verify-rule-discrimination.mjs:754` and the 3b mutant does
drive the corrected antecedent to `['RESTR']`.

### 2. Ruling given — the one item Theseus put to me

"A mutation licenses only the assertion it runs through" → **limb 8b of rule 8, not rule 17.**

Reasoning: §16's fresh-number rule is about *merges*, which displace old content and silently
redefine citations. Widening does not, provided the old limb survives as a special case — and
non-application is the degenerate instance of the wider rule (zero assertions run through). Test
stated generally: **does the change preserve the truth-value and the ground of every existing
citation under the old number?** Merge: no. Widen-preserving-the-limb: yes.

Written to `docs/research/recall-arm-standing-rules-2026-08-28.md` as 8a (original sentence verbatim)
/ 8b (new). Confirmed `no rule 17 was appended` still green afterwards — checked, not assumed.

### 3. Finding against Round 118's own fix

Read as code: Round 118 fixed the data model, left the coupling. All three mutant sites re-expressed
their check's predicate *inline* rather than sharing a binding. Two were copies; **the third had
already drifted at commit time** — the `>= 3 BY CONSTRUCTION` check read
`some(r => r.outsideCall1Union)` while its mutant read `some(...) && length >= 3`.

### 4. Fixed structurally + demonstrated red

Four named bindings applied to both real and mutant inventories (`queryRenderableRows`,
`renderableOutsideUnion`, `gate3bFreeSupport`, `countIsAtLeastThreeByConstruction`), plus three
`BITES` checks. **47 → 50 checks, PASS.**

Each BITES check demonstrated red under self-mutation on a scratch copy (`scripts/.tmp-selfmut.mjs`,
since deleted): 2 failures / 4 failures / 6 failures respectively. Not argued — run.

Stated limit, written into the rule: 8b's structural limb **cannot** be checked from inside the file
(nothing detects a future re-inline), so it is discharged by construction or not at all.

### 5. `fixedBy` mis-attribution — deliberately left open

Considered a keyword-overlap proxy and rejected it: it greens on a wrong-but-related gate, i.e. a
check reporting coverage it doesn't have — the exact defect this round is about. Named, not faked.

### 6. Iris's escalation — verified the one part that could have been mine

Iris's memo is addressed to xian; the decision is his. But her claim that the server side is shipped
is a claim about *my* work, so I read the code:

- `entityGuess` — `packages/server/src/routes/import.ts:67` ✅
- `entityName`/`entityId` on both POST branches — `:115–122` (multipart), `:126–133` (JSON) ✅
- `grep -rn entityGuess packages/client/src` → **0 hits** ✅

Her read is exact. **No server dependency remains**, so option 2 is buildable next fire without a
handshake from this seat. Memo filed telling her so — an action, not a re-surface.

### 7. Mail hygiene

`git mv`'d the closed Theseus thread to `docs/mail/read/`: the 8/29 merge-executed inbound and my two
8/29 replies, all superseded by Round 118. Round 118 + my reply stay in `docs/mail/` — thread is live.

### Deliverables this fire

- `docs/research/round119-the-rule-goes-under-8-and-the-fix-that-minted-it-had-already-drifted-2026-08-30.md`
- `docs/mail/daedalus-to-theseus-cc-xian-team-it-is-limb-8b-and-your-own-fix-had-already-drifted-2026-08-30.md`
- `docs/mail/daedalus-to-iris-cc-xian-server-side-confirmed-shipped-the-stall-is-not-mine-2026-08-30.md`
- `docs/research/recall-arm-standing-rules-2026-08-28.md` (rule 8 → 8a/8b)
- `scripts/verify-rule-discrimination.mjs` (four bindings + three BITES checks, 47 → 50)

### Numbers

Region count **3**. Surviving discriminating shapes **10**. Section (e)'s 2-of-2 prior untouched.
Four underived pre-spend conditions on the S side, still four. `verify-design-assertions-gated.mjs`
**29** unchanged. **No count moves.**

### New open item

8b's structural limb is discharged in `verify-rule-discrimination.mjs` §(f) **only**. The other
`scripts/verify-*.mjs` have not been swept for the copy-instead-of-share shape. Sweep is **unrun** —
not started rather than started and left half-done.

### Verification block (Session Wrap Protocol)

Run after commit, below.
