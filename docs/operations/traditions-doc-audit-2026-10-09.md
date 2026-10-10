# Traditions-doc audit — 2026-10-09

**Author:** Calliope
**Why this exists:** `docs/agents/calliope.md` §3 names a quarterly audit of `docs/agents/` for drift. The recurring-item tracker (`docs/operations/duty-cycle/calliope-tasks.md`) carried this as `next_due: 2026-07-01`, `last_completed: —` — it had never been run. This is the first pass, found overdue by three months during a WORK-fire drain and done the same fire rather than deferred without a named blocker.

**Scope:** the three files in `docs/agents/` — `calliope.md`, `argus.md`, `calliope-calibration.md` — checked against current repo state (COORDINATION.md, CLAUDE.md, ROSTER.md, actual file conventions, live mail headers). Findings only; fixes applied where they're mine to make (my own doc, factual corrections) and flagged rather than applied where they belong to another agent's doc or need xian's call.

---

## `calliope.md`

**1. Header is stale on its own terms.** `Model: Claude Opus 4.6 (was Sonnet 4.6 through mid-March 2026)` — but §4's own session-log naming convention (`...-calliope-sonnet-log.md`) matches every actual log filename in `docs/logs/` going back months, including today's. The header and the body convention have disagreed for a while; nobody reconciled it. **Fixed directly** (factual correction, not a structural rewrite) — see diff.

**2. Mail-naming convention (§4) doesn't match any mail in the repo.** States `docs/mail/SENDER-to-RECIPIENT-re-YYYY-MM-DD.md`. Every file in `docs/mail/` for months has used a different shape: full recipient/cc list plus a descriptive subject slug embedded in the filename itself, e.g. `theseus-to-daedalus-argus-cc-xian-janus-calliope-iris-your-359-reproduces-entire-...-2026-10-09.md`. The documented convention and the lived one have fully diverged — not a minor naming tweak, the whole shape changed (cc visible in filename, subject visible in filename, no `re-`). **Flagged, not fixed** — rewriting this correctly means describing the actual convention precisely, and that's worth getting right rather than fast; recommend as a follow-up edit, not bundled into this audit.

**3. The entire operating model described in §3 is session-based; actual practice is duty-cycle-fire-based.** §3's "At session start / During session / At session close" structure predates the worktree migration (`docs/operations/duty-cycle-klatch-v0.2.md`, Phase 1 — Calliope was the cutover proof-of-concept) and the shift to scheduled, autonomous fires (START/MID/WORK/SWEEP/STOP) reading `docs/COORDINATION.md` as the primary status board. None of that — the persistent worktree (`.claude/worktrees/calliope` on `claude/calliope`), the drain discipline (CLAUDE.md "Duty-Cycle Drain"), COORDINATION.md as the handoff mechanism, the mandatory `Drain:` line per entry — appears anywhere in this document. This is the single largest piece of drift: a reader learning Calliope's job from this file alone would not recognize how the role is actually run today. **Flagged, not fixed** — this is a structural rewrite of §3 (and probably a new §3a), not a line edit, and calliope.md's own working-style rule (§2) says discuss major document changes with xian before drafting. Recommend raising at next 1:1 rather than unilaterally rewriting the standing-responsibilities section.

**4. §5 "Key relationships" has no entry for Iris.** Iris (UX design & front-end development) has been an active COORDINATION.md seat for months with substantial cross-pollination into Calliope's own mail and rollup work (e.g. the entity-delete UX ruling, the cross-poll-brief-unreadable thread this week). The relationships section names xian, Mnemosyne, Argus, Daedalus, Theseus — not Iris. **Flagged, not fixed** — same reasoning as #3; this is new content, not a correction, and deserves its own short paragraph rather than a bolt-on line.

**5. §5's Mnemosyne relationship ("closest peer... after any significant session, compile the sync list") has no corroborating recent activity.** The only mail to Mnemosyne in the repo is `calliope-to-mnemosyne-care-package-2026-03-27.md` — over six months old, nothing since. I can't tell from inside this sandbox whether the sync-list practice quietly lapsed, moved to a channel outside `docs/mail/`, or Mnemosyne's role changed — "I don't recall seeing it" isn't evidence it stopped. **Flagged as an open question, not asserted as drift** — worth a direct check with xian or Mnemosyne's own side rather than a guess from absence.

## `argus.md`

**1. `Branch:` field is stale and wrong.** States `claude/audit-and-planning-xn2w7`. Argus's actual current branch, per COORDINATION.md's own Argus section (checked live this fire): `claude/argus-cycle`, Amber worktree at `.claude/worktrees/argus`. Not a cosmetic drift — this is the kind of fact a new agent or an external reader would use directly and get wrong.

**2. `Last updated: 2026-03-23`** — about 6.5 months stale, predating the worktree/duty-cycle migration, Iris joining, and the entire AAXT/MAXT round-track verification work (now past Round 360) that has become a large share of Argus's actual recent output. Same session-vs-fire structural gap as calliope.md #3 likely applies here too, unverified in detail — this file is Argus's to own and I didn't do a full line-by-line pass the way I did for my own doc.

**Not fixed** — this is another agent's traditions document; Calliope's audit role is to surface drift, not rewrite Argus's self-description on his behalf. Recommend routing the two findings above to Argus directly.

## `calliope-calibration.md`

Holds up reasonably well against current working-style (verify-before-claiming, parallel batching, lead-with-findings) — nothing here contradicts observed practice this fire. One standing item: the file's own closing note says it's "a pilot experiment... to be assessed in a future MAXT session for transfer fidelity" (created 2026-03-27). Checked: no MAXT session or later document records that assessment ever happening — the file is referenced by a few other docs but never evaluated against its own stated purpose. **Flagged, not fixed** — scheduling a MAXT assessment isn't Calliope's call to make alone (MAXT is Theseus + xian's lane per calliope.md §5), so this is a routing item, not an edit.

---

## Disposition

- Fixed this fire: `calliope.md` header model field (factual, mine, low-risk).
- Flagged for a discuss-first pass with xian: `calliope.md` §3 rewrite (session model → duty-cycle model), §5 Iris addition.
- Flagged for Argus: his doc's stale branch field and stale date.
- Flagged as an open question, not a finding: whether the Mnemosyne sync-list practice is still live.
- Flagged as a routing item: whether `calliope-calibration.md`'s pilot ever gets its planned MAXT assessment.
- `docs/operations/duty-cycle/calliope-tasks.md` recurring-item table updated: `last_completed: 2026-10-09`, `next_due: 2027-01-09`.

**Verified how:** read all three `docs/agents/` files in full this fire; checked `calliope.md`'s mail-naming claim against live `ls docs/mail/*.md` filenames; checked the session-log-naming claim against `ls docs/logs/`; checked Argus's branch field against COORDINATION.md's live Argus section (read fresh this fire, not recalled); checked Mnemosyne mail recency via `grep -rl mnemosyne docs/mail`; checked the calibration file's MAXT-assessment claim via `grep -rl "calliope-calibration\|transfer fidelity" docs/` across the repo.
