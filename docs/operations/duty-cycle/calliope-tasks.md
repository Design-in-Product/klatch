# Calliope — Task List of Record

**Persists across days.** The drain-loop's task source. Unblocked items the cycle picks up; blocked-on-xian items surface (cycle batches, doesn't act).

Updated: 2026-09-29 (mandatory logbook entry added per xian's direct instruction, below)

## MANDATORY — every STOP fire, no exceptions

- [ ] **Write today's `log.html` entry before closing the STOP fire.** One entry per calendar day, newest-first at the top of the entries block (see existing entries for format: `<!-- ENTRY: YYYY-MM-DD -->` wrapper, `log-date` + `log-body`, narrative prose, brief — not a bullet dump). This was informal practice that lapsed for three months (last entry 2026-06-23 until resumed 2026-09-24) and stayed lapsed even after resuming, because nothing made it mandatory. xian's instruction, 2026-09-29, verbatim intent: resume the practice and make it a required part of the STOP cycle, not an optional nice-to-have. **If a day had a STOP fire and no `log.html` entry exists for that date, that is a protocol violation, not a quiet skip** — the next fire to notice should write the missing entry rather than let the gap compound, the same discipline this file already asks for mail and rollup drain.
- [ ] If the day's STOP fire also warrants a `docs/STATE.md` refresh (a real state change, not just narrative — see that file's own "Refresh cadence" note), do both together; they're a paired update, not two independent ones.

## Unblocked (cycle can advance)

- [ ] **Mail drain** — keep `docs/mail/` at inbox-zero per Mail Handling discipline; move closed threads to `docs/mail/read/`. (Continuous.)
- [ ] **Cycle log + session log upkeep** — turn-by-turn during xian-present sessions; brief entries per autonomous fire. (Continuous.)
- [ ] **Blog series continuation drafting** — convergent-infrastructure post + MCP-capstone post on the mining list; possible future beat: the 54%→94% UI-as-context AAXT diagnostic-loop story; possible future beat: the duty-cycle rollout once it produces lessons. **New 6/21 mining material from Daedalus**: 7 transferable patterns from the composition-spine work (test-suite-as-diagnostic-instrument is the standalone candidate; infra-outage-fail-closed + can't-loosen-own-guardrails together could anchor a safety-properties post; tandem-collision-via-rebase + coordination-vs-code-layer-separation fold into convergent-infrastructure). (Drafting unblocked; publishing gated on xian. Major new drafts to discuss with xian on angle/sequencing first per calliope.md working-style.)

## Blocked-on-xian (cycle surfaces, doesn't act)

- **Blog publish: entity reframe** ("Bringing Conversations Into a Room") — `docs/drafts/bringing-conversations-into-a-room.md` + illustration at `docs/drafts/bringing-conversations-illustration.html`. Drafted 5/12; illustration drafted 5/28. **Awaiting xian's illustration reaction + final approval.** The only drafted-not-published post.
- **Step 11 scoping advance** — needs xian to make Step 11 active (post-beta). D1–D5 decided 5/28; implementation clusters with Phase 5d.
- **Cohort rollout Phases 2–3** — Phase 3 Iris launched 6/21. Daedalus + Argus (Phase 2) and Theseus (Phase 3) still gated on xian's launch.

## Watch items (cycle monitors; triggers a one-line outbound when condition met)

- **Janus channel: composition-spec → demo-able trigger.** When the composition spec (`docs/ux/spec-composition-gesture.md`) produces something demo-able or client-legible (a working flow, a real screen recording, an artifact that prove the transporter-device claim), send Janus a one-liner via `docs/mail/` so he can surface it to Themis for the cross-pollination brief. Janus committed 6/21 to holding the BYOC/demoability flag until then. *Trigger condition lives downstream of Daedalus's implementation.*
- **Step 11 read-ahead: Epicenter + MemPalace** (per Argus sweep #13, 6/21). Two local-first SQLite parallels worth a brief scan before Step 11 (Search) design starts: Epicenter (5/25; open-source local-first app ecosystem, shared plain-text + SQLite memory folder) and MemPalace (no new dev, research doc current). If either's cross-app memory format stabilizes, Klatch could declare compatibility as a distribution/discovery story. *Trigger: when xian opens Step 11 scoping.*
- **Vendor-risk arc evolution** (per Argus sweep #13, 6/21). The Stainless→IPO→Policy→Fable-5-suspension arc strengthened the BYOC/transporter-device case. Routed to Janus 6/21 via direct channel for Themis relay. If a subsequent event compounds further (e.g., second forced takedown, additional vendor consolidation, post-IPO pricing shift), update Janus and consider blog-post timing. *Trigger: next material vendor-side event.*

## Recurring items (START dispatcher promotes when `next_due ≤ today`)

| Item | Cadence | next_due | last_completed | Notes |
|---|---|---|---|---|
| **Logbook (`log.html`) entry — MANDATORY, see top of file** | daily, at STOP fire | 2026-10-10 | 2026-10-09 | Made mandatory by xian 2026-09-29 after the practice lapsed silently for three months and stayed lapsed even post-resumption. **Lapsed a second time, 09-30 through 10-07 (8 entries), found while applying the 2026-10-08 drain rule and backfilled same-session from COORDINATION.md/session-log history — see `log.html`'s own 09-30 entry for the backfill disclosure.** **Lapsed a third time, 10-08 alone, found and backfilled during the 10-09 WORK fire** (see `docs/operations/traditions-doc-audit-2026-10-09.md`'s sibling entry in COORDINATION.md for the detail). Today's (10-09) entry written at this STOP fire, no lapse. |
| Quarterly traditions-doc audit | quarterly | 2027-01-09 | 2026-10-09 | `docs/agents/` drift check per calliope.md § 3. **First-ever run, 2026-10-09** (was overdue since 07-01, `last_completed` had never been set) — found during a WORK-fire drain. Substantial drift found: `calliope.md`'s model field (fixed), its §3 session-based operating model vs. actual duty-cycle-fire model (flagged, needs discuss-first per working style), missing Iris in §5 (flagged), `argus.md`'s stale branch field and 6.5-month-stale date (flagged to Argus, not mine to edit). Full findings: `docs/operations/traditions-doc-audit-2026-10-09.md`. |

(Other recurring items will surface as patterns emerge; this is the v0.2 starting set.)

## Notes

- Higher-priority items (1.0-beta UX) are xian + Iris's lane, not Calliope's to advance directly. When those are the priority and waiting on xian/Iris, the cycle drops to the next unblocked Calliope item (don't-sit-passively rule sharpened 5/12: lower-priority unblocked beats higher-priority-blocked).
- "Blog series continuation drafting" requires angle/sequencing discussion with xian before starting a major draft (calliope.md working-style: discuss-before-major-documents).
