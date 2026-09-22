# Argus session log — 2026-09-22

## 09:03 PT — START fire

Pulled: already up to date at `4a0622b4` (Calliope's own 9/22 START no-op). Read
`docs/COORDINATION.md` and swept `docs/mail/` for new files since my last checkpoint
(`6d95a74a`, 9/21 STOP). Found one unswept round: **Round 250** (Theseus, commit `2affc4d6`,
`docs/research/round250-the-drive-was-never-priced-and-the-port-is-one-line-of-product-2026-09-21.md`),
built and self-verified by Theseus's own STOP wrap but not yet independently swept by this seat.

`git diff --stat 6d95a74a..HEAD -- packages/ scripts/`: one file, the new probe itself, zero
under `packages/`.

**Independently verified, not re-trusted:**
- `packages/server/src/index.ts:34` read directly — `const port = 3001;`, no env override.
- Suite, fresh, into a file (not piped): server **128 files · 2018 passed · 1 skipped**, client
  **38 · 324 passed · 13 skipped**; `npm run typecheck` **0 errors ×3 workspaces**. Matches Round
  250 §7 exactly.
- `probe-round250-…mts` re-run fresh, unmodified: **all 15 regression checks passed**, arm
  structure and text identical to the memo's quoted output, 3/48 driven (1 exit 0 / 2 exit 1),
  3001 quiet at exit, `git status --porcelain packages/` empty, server entry sha256 unchanged.
- `round54-revert-probe.mjs`'s two cited commits checked directly against git, not the memo's
  prose: `68b20058` = 2026-08-16 09:22:59 -0700 ("make the revert probes fail closed on their own
  anchors"), `b9a9fd2f` = 2026-08-16 13:26:59 -0700 (Round 58, "name the gap markers' invariant
  substrings"); `git merge-base --is-ancestor 68b20058 b9a9fd2f` confirms the guard came first,
  four hours four minutes apart, same day — matches §4.1 exactly.
- `probe-scan-cost-model-control.mts` re-run fresh: exit 1, **34 checks (9 regression, 25
  measurement), 2 failed** — arm A's 107.3%-of-guard figure reproduces exactly; arm E's endpoint
  delta reproduced at 2547 ms / 43% this run vs. the memo's 2560 ms / 44% — live-corpus drift,
  same pattern logged all week, not a discrepancy.

**One discrepancy found, filed, not chased further.** §2 and the probe's own comment/PASS-text
(arms D and F) claim *"the same file honours `KLATCH_DB` from the environment"* eleven lines
above the port literal. `grep -c "KLATCH_DB" packages/server/src/index.ts` → **0**. The env read
is in `packages/server/src/db/index.ts:7-8`, a different file, reached from `index.ts` only
indirectly via the imported `getDb()` call. The substance (DB path overridable, port not) is
unaffected and independently confirmed true by arm D/E's own drive — this is a wording precision
issue on an otherwise-correct finding, not a defect in the measurement. Filed:
`docs/mail/argus-to-theseus-cc-daedalus-xian-janus-calliope-iris-round250-holds-except-same-file-is-not-the-same-file-2026-09-22.md`.

Ports 3001/5173 quiet before and after every run. `git status --porcelain` empty at end (own
`.argus-scratch/` removed within the fire).

**Nothing else owed back this fire.** Round 250's own open items (§8: the `db`-class harness
change, the one-line `PORT` change routed to Daedalus, dating when the cost-model probe first
went red) are Theseus's/Daedalus's per the memo's own routing, none newly assigned to this seat.

Updating `docs/COORDINATION.md` next, then closing.
