# Daedalus — 2026-09-02 session log (Opus 5)

## 09:17 PT — START fire. Round 137: took the repair Theseus nominated in Round 136 §6.

**Briefing.** Worktree synced by wrapper; `git log` at `1fe3256`, tree clean. Read
`docs/COORDINATION.md` (Daedalus section, last fire 9/1 17:17 STOP) and swept `docs/mail/`. One
inbound addressed to me: `theseus-to-daedalus-cc-xian-team-your-52-split-was-needed-one-predicate-over-2026-09-01.md`,
read in full. It nominates its §2 and §3 findings as "a repair round for whoever takes 137." Took it
— Theseus deferred shipping twice on the grounds that the code was his and should be checked by
someone who didn't produce it, which is the seat I'm in.

**Baseline reproduced before changing anything** (not inherited from his memo):
- `npx tsx scripts/verify-tsx-guard.mjs` → `PASS — all 196 checks passed`
- `node scripts/probe-import-sites.mjs` → `0 site(s) a fourth limb would name`
- `git status --porcelain` → empty; node v26.5.0

**Reproduced all three of his findings on my own fixtures** (`.testdata/r137/`, gitignored; one
directory per row, contents byte-identical across rows). `.mts`/`.cts` over-fire confirmed including
his exact `tsx` quotation (`Cannot find module './inner.js'`, `nextResolveSimple`); `packages/` term
and extensionless-specifier under-fires both confirmed. His population counts reconcile
independently: 38 `.tsx`, four TypeScript files outside `packages/`.

*Rig error I made and backed out:* first sibling matrix sat outside any `packages/` segment, so all
four rows returned `false` for the **path** term rather than the sibling term — a matrix measuring
the wrong conjunct. Rebuilt under `packages/`.

**Two findings beyond his list.**
1. His §2 answer set `['.tsx','.ts']` is one member short: `tsx` resolves `./inner.js` onto a
   `.jsx` sibling, which is outside `TS_EXTENSIONS` *and* outside his list. His own Round 135 §3
   rule ("the next shape has been outside it") landing on his own repair.
2. `isTsExtensionFailure` — the limb his §6 item 1 recorded as unmeasured — is under-**narrow**,
   not over-wide: `.jsx` declined, node refuses it, `tsx` loads it. He was right that `.ts`/`.mts`
   are unreachable on this node.

*Second confound, caught:* first `.jsx` fixture had a real JSX body; `tsx` failed it for want of a
JSX runtime and I nearly recorded "`.jsx` is not resolvable". That is contents, not extension —
Theseus's §4 distinction one limb over. Holding contents constant inverted the result.

**Measured before reusing the obvious binding.** The tidy repair points the sibling limb at
`TS_DIR_INDEX_EXTENSIONS` (same value today). The two questions **diverge on `.json`** — `tsx`
resolves `<dir>/index.json` but not `./inner.js` → `inner.json` — so the equality is coincidence,
and merging would have been the Round 128 error again.

**Shipped** (`packages/` untouched — `git diff --stat`: 2 files, both under `scripts/`):
- `scripts/lib/tsx-required.mjs` — two new bindings named for their questions
  (`TSX_JS_SPECIFIER_EXTENSIONS`, `TSX_LOADABLE_EXTENSIONS`); `TS_EXTENSIONS` kept with its one
  legitimate consumer (the source-text anchor regex). Both predicates repaired, including §3b's
  extensionless specifier. Both diagnosis bodies corrected — they said "TypeScript" and `.jsx` is
  now a member of both limbs.
- `scripts/verify-tsx-guard.mjs` — 11 checks (196 → **207**), including the `.json` divergence
  witness and the `.mts` loadable-but-not-a-specifier-target asymmetry.

**Mutation-tested, not assumed:** M1 (re-merge onto `TS_EXTENSIONS`) → `FAIL — 5 of 207`;
M2 (extension limb reverted) → `FAIL — 1`; M3 (drop extensionless) → `FAIL — 1`;
M4 (over-widen the stem to any extension) → `FAIL — 1`, the `.css` control. All reverted; verified
`PASS — all 207` after.

**Verification after:** `PASS — all 207` · probe `0 named` · `npm test` server **1447/1447**, client
**239/239 (13 skipped)** — matches Argus's 9/2 figures exactly, zero drift · `npm run typecheck`
clean across all three workspaces.

**Deliberately not done, written down rather than guessed at:**
- §3a, the `packages/` term, is **untouched and still under-fires**. I disagree with his reading
  that the prefix carries soundness load — the sibling test is the whole discriminant — but
  deleting it widens the population to `node_modules/`, `dist/`, and every stale `.js` beside a
  `.ts`, none of which I measured. That is a population study. **Nominated for Round 138.**
- Whether these shapes escape §(b2)'s crash detector — his §6 item 2's boundary; I didn't cross it
  either. Predicates only, no guard-level mutants this fire.
- `.jsx` behaviour on any node but v26.5.0. Single seat, single version.
- `.jsx` findings are **latent**: zero `.jsx` files in the repo (`find` over `packages/`, `scripts/`).

**Mail discharged in-fire.** Reply filed:
`docs/mail/daedalus-to-theseus-cc-team-your-answer-set-was-one-short-and-the-json-case-separates-the-bindings-2026-09-02.md`.
His inbound `git mv`'d to `docs/mail/read/` (thread closed; the one open item is the 138 nomination,
which lives in the research doc and COORDINATION, not in an open thread). Nothing in this fire needs
xian.

**Deliverable:** `docs/research/round137-the-repair-list-was-one-member-short-in-a-direction-neither-of-us-was-looking-2026-09-02.md`

### Wrap verification (09:33 PT)

**Step 1 — commits (`git log --oneline -3`):**
```
b4f29a1 round137: split two more shared bindings out of TS_EXTENSIONS, both wrong in different shapes
6bd4e89 mail: Daedalus → Theseus, Round 137 reply — his answer set was one member short, and .json separates the two bindings
1fe3256 log+coordination: Argus 9/2 START fire — no-op, verified not assumed
```
Mail committed separately from the work commit, per the worktree mail discipline.

**Step 2 — every claimed deliverable `ls`'d, all present:**
```
docs/logs/2026-09-02-0917-daedalus-opus-log.md
docs/mail/daedalus-to-theseus-cc-team-your-answer-set-was-one-short-and-the-json-case-separates-the-bindings-2026-09-02.md
docs/mail/read/theseus-to-daedalus-cc-xian-team-your-52-split-was-needed-one-predicate-over-2026-09-01.md
docs/research/round137-the-repair-list-was-one-member-short-in-a-direction-neither-of-us-was-looking-2026-09-02.md
scripts/lib/tsx-required.mjs
scripts/verify-tsx-guard.mjs
```

**Step 3 — verifier re-run against the committed state:** `PASS — all 207 checks passed`.

**Delivery:** not claimed. Commits are local to `claude/daedalus-cycle`; the wrapper owns push to
`origin/main` and logs the outcome. This log and the COORDINATION entry commit last.
