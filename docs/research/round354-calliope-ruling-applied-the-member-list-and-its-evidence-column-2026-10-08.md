# Calliope's independent-confirmation ruling, applied — the member list and its evidence column

**Theseus, 2026-10-08 WORK fire.** Executing
`docs/mail/calliope-to-theseus-cc-xian-janus-daedalus-argus-convention-ruling-on-the-68-un-numbered-threads-2026-10-08.md`.

**The rule, as she set it:** a pre-frontmatter memo closes if, and only if, something *other than its
own text* confirms the matter is settled — a later memo, a `COORDINATION.md` entry, a shipped commit,
a doc in `docs/`. Not age. Not the subject line's sentiment. Cite the evidence before moving
anything, and leave visible anything you can't confirm.

## 1 — The population, and why it is 17 and not 68

Keyed on **filenames**, not frontmatter: frontmatter is the selector that was blind last time and
returned the smaller number silently. Measured at fire start:

| Reading | Count |
|---|---|
| `docs/mail/` active `.md` | 119 |
| filename names Theseus | 76 |
| of those, carrying a `round:` key | 5 |
| of those, **un-numbered** | **71** |
| un-numbered, dated **before** 2026-09-01 — her scope | **17** |
| un-numbered, dated 2026-09-01 or later | **54** |
| un-numbered with no frontmatter at all | 63 |

By month, the un-numbered body: 2026-07 → 2, 08 → 15, 09 → 52, 10 → 2. Files with no trailing date in
the filename: **0**, so the date key covers the whole population.

**The scope discrepancy, stated rather than silently resolved.** Her ruling says "your 68, dated
before 2026-09-01." My "68" this morning was the un-numbered body *regardless of date*; her bound
selects the pre-round-numbering body. The intersection — what the rule was actually run against — is
**17**. The other **54** are covered by neither her ruling nor the round-chain rule (they have no
`round:` key), and are referred back to her as a scope question, not widened by default.

## 2 — Closed: 14, with the evidence cited

| # | Thread | Independent evidence |
|---|---|---|
| 1 | `pard-to-theseus-cadence-request-2026-08-05` | `COORDINATION.md:3077` — "~~Pard — arm the cadence~~ **armed and firing** (10:47/14:47/19:47 confirmed live 8/10)" |
| 2 | `theseus-to-pard-duty-cycle-cadence-2026-08-09` | same line; the cadence proposed is the one now firing |
| 3 | `theseus-to-pard-post-reboot-nudge-reply-2026-08-11` | this fire is a 14:47 WORK fire; `COORDINATION.md:22`/`:199` record the duty cycle armed and `launchctl`-verified |
| 4 | `memo-pard-to-theseus-iris-amber-migration-2026-07-29` | `COORDINATION.md:2208` records the Amber worktree `/Users/xian/Development/klatch-worktrees/theseus` as my live branch location |
| 5 | `theseus-to-pard-test-data-migration-2026-08-09` | `docs/research/inbound-test-data-canonicity-2026-08-12.md` exists — the transfer completed and was ruled on |
| 6 | `theseus-to-pard-test-data-transfer-approved-2026-08-09` | same |
| 7 | `pard-to-theseus-test-data-status-and-why-i-am-not-reaching-into-the-laptops-2026-08-10` | same |
| 8 | `pard-to-theseus-cc-team-test-data-landed-with-a-question-2026-08-12` | `docs/research/maxt-corpus-ruling-measured-2026-08-12.md` exists — the question it asked was answered |
| 9 | `theseus-to-pard-cc-team-canonicity-provisional-plus-a-write-leak-2026-08-12` | superseded by the measured ruling in `maxt-corpus-ruling-measured-2026-08-12.md` |
| 10 | `pard-to-theseus-cc-team-measured-output-and-both-options-2026-08-12` | same doc — the ruling made *from* that output |
| 11 | `theseus-to-pard-cc-team-measured-ruling-and-two-corrections-to-myself-2026-08-12` | `COORDINATION.md:3077` — "~~**xian** — the `.env` credential decision~~ **ruled 8/12 (option 3), landed by Argus, verified from this seat**" |
| 12 | `pard-to-theseus-cc-team-you-were-right-and-the-gate-is-my-own-design-2026-08-10` | `COORDINATION.md:3077` — "~~narrow network allowlist~~ **moot — network was never actually blocked** (Pard's 8/10 correction; verified from this seat)" |
| 13 | `theseus-to-pard-cc-team-option4-necessary-not-sufficient-2026-08-11` | `COORDINATION.md:3077` — the `.env` decision ruled 8/12 as option 3, so the option list is decided |
| 14 | `pard-to-theseus-cc-team-option1-is-the-billing-trap-scope-it-to-the-subprocess-2026-08-11` | same |

All 14 asserted present in `docs/mail/` before any move, list asserted duplicate-free, moved with
`git mv` (14 of 14 rc=0), nothing deleted. `docs/mail/` **119 → 105**; `read/` **894 → 908**.

`COORDINATION.md:3077` is in **my own section** (nearest preceding heading, line 2207:
`### Theseus Prime`), checked rather than assumed. It qualifies under the ruling as a
`COORDINATION.md` entry — an artifact outside the memos' text — and its struck-through items are
dated resolutions, not sentiment.

## 3 — Left visible: 3, and two of them are the rule earning its keep

**`theseus-to-pard-cc-xian-team-two-more-controls-and-the-boundary-is-porous-2026-08-11`** and
**`pard-to-theseus-cc-team-porous-boundary-adopted-2026-08-11`**.

These read closed. Pard's is titled *"All three adopted. And stopping at `stat` was the right call —
thank you for it."* Sentiment closes both instantly. Age closes both instantly. But the same
`COORDINATION.md:3077` line that closed four other threads reads:

> Open: **xian** — (a) the **route** decision (subprocess bypass of the path scope, now with a
> write-side datum and three `/tmp` files attached)

which is precisely these two memos' finding. Checked for later resolution: **4** files under `docs/`
mention the route decision; the newest are my own `2026-08-12` session logs, and one of them records
the previous Theseus **leaving this same thread in `docs/mail/` deliberately** for this same reason.
No record of resolution found. **Still parked on xian**, so both stay visible.

Two instruments agreeing here is worth naming: her rule and the 08-12 judgement reached the same
answer independently, and both proxies she rejected would have buried a live thread parked on xian.

**`calliope-to-theseus-maxt-observer-brief-2026-07-05`.** Briefs me for an upcoming search-planning
MAXT session (companion to `docs/plans/theseus-brief-search-planning-maxt-2026-07-04.md`). No record
found this fire that the session ran or concluded: `docs/axt/` contains exactly one file,
`maxt-session-01-baseline.md`, which is not that session. No independent confirmation ⇒ stays
visible. Routed back to Calliope, who owns it and may hold the confirmation herself.

## 4 — Limits

- **The 54 un-numbered threads dated 09-01 or later were not touched** — blocker: outside the
  ruling's date bound, and a scope call belongs to the convention owner. Referred back to Calliope
  with my own view attached (leave them: for threads that recent, "nobody answered it" is the likelier
  reading than "it was resolved").
- **The wider no-frontmatter population in `docs/mail/`** that isn't mine is explicitly not this
  ruling's business, per Calliope, and was not measured here.
- **Evidence was sought per thread, not per cluster**, but seven of the fourteen rest on two shared
  artifacts. If either of those two research docs were later found to misstate its own conclusion,
  seven closures would need revisiting together. They were existence-checked, not re-read in full
  this fire — stated so the dependency is visible.
- **Calliope's own thread halves** are left in `docs/mail/` rather than moved; she said she would
  move both together once my list landed, and moving another agent's mail for her is not mine to do.
