# Handoff — Theseus, 2026-09-18 (Amber reboot gate)

**Written:** 2026-09-18, START fire (~10:47 PT), in response to
`docs/mail/janus-to-all-non-pm-residents-cc-xian-pard-exec-the-gate-reads-24-red-and-you-are-on-it-2026-09-18.md`.
**Written for a cold start, not a resume.** xian intends to open new sessions and decline to
import prior context, so this file plus the repo is the whole inheritance. Nothing here is
"see the transcript."
**Worktree:** `/Users/xian/Development/klatch-worktrees/theseus` · **Branch:** `claude/theseus-cycle`
(tracking `origin/main`) · **Identity:** `Theseus (Klatch) <theseus@klatch.local>`, per-worktree.

Everything below is either verified by a tool call in this fire (marked **verified**) or cited to a
file you can open. Where I could not verify, I say so rather than smoothing it.

---

## 0 — Mechanics, verified this fire

| | |
|---|---|
| Duty cycle | **ARMED.** All three plists present in `~/Library/LaunchAgents/` and loaded — `launchctl list` shows `com.klatch.theseus-START` (running, this fire), `-WORK` and `-STOP` loaded. **This is the opposite of my 08-11 state**, where they were parked in `standdown-parked/`; the restore procedure in `docs/handoff-theseus-2026-08-11.md` has already been executed and does **not** need re-running. |
| Schedule | START **10:47**, WORK **14:47**, STOP **19:47**, all `KLATCH_MODEL=claude-opus-5`, all `RunAtLoad=false`. Read from the plists, not from the old handoff. The `:47` minute is deliberate — unused by the other seats, and places each fire downstream of the fires whose output it consumes. |
| Credentials in the fire env | **ABSENT, not blocked.** `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` both undefined. This has been true continuously since 08-11 and it is the one thing that gates model-calling work from this seat. Every probe I run is deliberately zero-model as a result. |
| Network in the fire env | **Present.** Contradicts older fire prompts that assert otherwise; measured 2026-08-10 and unchanged. If a prompt says this session has no network, the prompt is stale. |
| Working tree | Clean. `git log origin/main..HEAD` empty — **nothing of mine is at risk from the reboot.** |
| Suites, re-run by me this fire as a control | server **119 files · 1884 passed · 1 skipped**; client **25 files · 324 passed · 13 skipped**; **exit 0**. Matches Daedalus's 9/18 figures and Argus's v136. |
| `npm test` noise to expect | ~50 lines of `Models API fetch failed, using fallback: Could not resolve authentication method`. That is the missing key above, not a regression. Do not chase it. |

**Gate mechanics, read from the matcher rather than from the memo describing it**
(`/Users/xian/Development/mediajunkie/scripts/amber-fleet.sh`, `gate`): the script lists
`origin/main` per repo, filters paths for `handoff|stand-?down`, requires **today's or yesterday's**
date somewhere in the path, and requires the **basename** to match
`handoff[-_]theseus([-_.]|$)|(^|[-_])theseus[-_]handoff`. It reads `origin/main` — **a handoff on a
worktree branch counts as missing.** It needs a snapshot at
`~/.local/state/amber-agent/fleet-snapshot.tsv` (present, written 07:39 PT today).

## 1 — Who I am on this team, in one line — and what changed since August

Manual testing and exploration. **In practice, for the last month, that has meant one thing: I take
Daedalus's claims and drive them at the wire, then report what reproduces and what does not.** Not
proofreading, not re-reading his diff — a real TCP connection to a real server, a real corpus, a
real database, and a probe under `scripts/` that prints PASS/FAIL lines anyone can re-run.

**If you are rebuilding cold, this is the correction most worth having:** the August version of this
seat was about AAXT rounds (synthetic probes via an auxiliary LLM) and MAXT observation. That work
is **dormant, not current** — it requires credentials this seat does not have. The live work is the
numbered probe rounds, currently at **Round 228**, running as a two-agent loop with Daedalus at
roughly one round per fire. Do not open a fire by looking for the AAXT sweep.

**The round ledger lives in two places:** `docs/research/roundNNN-*.md` for the write-ups and
`scripts/probe-*.mts` for the instruments. Both are ground truth; my memos in `docs/mail/` are the
narrative.

## 2 — Who owes what, both directions

**I owe:**

| To | What | State |
|---|---|---|
| Daedalus | **Round 229 — the reply to his Round 228 memo**, which asks me two direct questions: (a) §5, whether the arm-P monotonicity assertion is his or mine — *"say which"*; (b) §5.2, whether `remainder`'s negative verdict should be **hard** — *"if you think it should be hard, say so and I'll take it."* | **Owed as of this fire.** Filed this fire as a memo; see §6. |
| Daedalus | **Round 219 arm C at a different cap** — needs a mutated `packages/shared` and the port to itself. | Named three rounds running, still undone. Small; the blocker is exclusivity on 3001, not difficulty. |
| Daedalus / Argus | **The `reapOnExit` retrofit** across the ~21 probes that do not have it. Daedalus has carried it three rounds, has landed it on `probe-browse-latency-end-to-end.mts`, and has said he will either finish it next fire **or propose we drop it**. I listed it three times before that. | Open. **If nobody claims it this week, my position is: drop it explicitly rather than list it a fifth time.** An item carried four times is not an item, it is a ritual. |
| Argus | The standing meta-question from August, never answered: **what does a green probe round actually certify?** Round 223's *skipped its way to zero checks*, Round 227's *guard that cannot fail* and Round 228's *readiness check that cannot identify* are three answers to it and it has never been written up as one thing. | Open, and it is the most valuable unwritten doc in my lane. |
| xian | Nothing blocking. See "parked on xian" below — those are things **he** owes, not me. |

**I am owed / waiting on:**

| From | What | Since |
|---|---|---|
| **xian** | The **backfill dry run**. Daedalus's memo `daedalus-to-xian-cc-calliope-theseus-iris-argus-janus-the-backfill-apply-pass-is-built-and-it-needs-one-dry-run-2026-09-09.md` is **unanswered since 2026-09-09** — nine days. It is his call, not ours, and it is the longest-parked item on the board. |
| **xian** | The `DELETE /entities/:id` floor (my Round ~226 §6(b)). A product call about whether deleting an entity should be cheap or guarded; I measured it and stopped. |
| **Daedalus** | Nothing blocking as of Round 228 — he replied same-day, as he consistently does. |
| **Iris** | Two residuals from my 2026-08-09 disposition: cross-project recency legibility in the import browser, and screen-reader announcement of empty-selection on the clone select. **Both real, both low urgency, both unactioned for six weeks.** ⚠️ The inbound thread that carries them is deliberately kept in `docs/mail/` rather than `read/` for exactly this reason — see §3. |

## 3 — ⛔ Deliberately unresolved — do not "fix" these

A successor cannot reconstruct this list from any log, and each item looks like an oversight.

1. **Unactioned Iris items are left visible in `docs/mail/`, not swept into `read/`.** The close-discipline in CLAUDE.md says move closed threads; these are *open*, and their only tracking mechanism is sitting in the active mail directory. **Do not tidy the mail folder by date.** A tidy mailbox that loses two accessibility findings is a worse artifact than an untidy one.
2. **Arm O hard-skips rather than reddening when the cap does not fire.** `OPEN, NOT ESTABLISHED`, exit 3. This is correct and was argued for at length (Daedalus, Round 228 §2). Do not "fix" the skip into a pass or a red. "Inapplicable on this corpus" is a result, and the only cure is a different corpus.
3. **The `remainder` negative verdict is soft on purpose** — it compares two *different instruments* (an HTTP endpoint and an in-process loop over the same corpus), so a small negative sits inside their combined noise. Reddening on the sign would repeat the mistake arm O just stopped making. It carries a band and an explicit three-way verdict string instead. ⚠️ **But the `pass: true` on that line is still hardcoded** — soft was a decision, the hardcoding was not. See §6.
4. **Probes are zero-model by construction and strip `ANTHROPIC_API_KEY` from every child env.** That is not a workaround for the missing credential; it is a property I want kept. A probe that can make a model call can spend money in an unattended fire and can produce a non-deterministic result that looks like a finding. If credentials ever appear in this env, **do not unstrip them.**
5. **Corpus drift is named, not smoothed.** Every recent round reports the session count moving under the probe (538 → 533 → 535) because this very session's logs are being written into `~/.claude/projects` while the probe reads it. Do not freeze or snapshot the corpus to make the number stable — the drift is honest and it does not affect comparisons made *within* one run. A frozen corpus would hide the next real change.
6. **Three samples is a poor σ, and we ship it knowingly.** It is poor in the safe direction: a noisy corpus widens the band and pushes toward NOT ESTABLISHED, never toward a false PASS. Do not quote any of these bands as a confidence interval, and do not raise the sample count to make a number look better — raise it only if a real verdict is sitting inside the band.
7. **`~/.claude-pm` cannot exercise the 50,000-line fingerprint cap** (Round 148: tops out at 40,397 lines). The synthetic corpus in `probe-round227-*.mts` (3 files × 80,000 lines + 5 × 400 as a negative control) exists because of that, and it moves the root with `CLAUDE_CONFIG_DIR` (**replace**) and not `KLATCH_EXTRA_SESSION_ROOTS` (**additive** — would bury a 93 ms signal under 2.6 s of real corpus). Do not "simplify" that to the additive variable.

## 4 — Counterparties, and what I most recently got *wrong* with each

State is recoverable from the repo. A correction pattern is not. These are mine, not theirs.

**Daedalus** (architecture & implementation — my primary counterparty, ~1 memo exchange per fire)
- **Most recent (Round 228 §5.2): I named a defect in a memo and did not fix it, and treated the naming as the fix.** I wrote that arm O's remainder line "is the decomposition reporting that it does not hold — printed as a `PASS`, because that line is hardcoded `pass: true`." Then I repaired the *sample* the line was fed and left the verdict alone. His next run printed `remainder −89 ms (−3%)` as a PASS on my repaired sample. **A defect I have described in prose is still shipping.**
- **Pattern, not incident:** I am reliably good at finding the defect and unreliable at closing it in the same fire. Two of my last four rounds handed him something I had already diagnosed. He takes them, which makes the habit cheap for me and is exactly why it persists.
- What works with him: he answers same-fire, he takes assignments explicitly, and he will say "yours or mine, say which" rather than assume. **Answer that question when he asks it** — leaving it unassigned is how the `reapOnExit` item reached four listings.

**Argus** (quality & testing)
- **Most recent (Round 225 §1): I published numbers from a run taken *before* the change they describe — in the same commit.** Arm A asserted a pre-fold shape, the fold landed in the same commit, and I pasted §7's figures from the earlier run. Argus caught it. His diagnosis was exact and I had nothing to add to it.
- **Pattern:** my failures with Argus are always *staleness inside a single commit* — a number, a comment, or a precondition that described the tree as it was ten minutes ago. He is the reason I now re-run rather than re-read before quoting.
- ⚠️ **And the one I caught that he did not report:** the same probe had a *third* arm-A check that stayed **green off a comment** — the predicate matched a citation inside a docblock instead of a call site. He reported the two reds and not the green. **Nobody re-reads a green line, including him.** That is the most useful thing I know about working with Argus.

**Iris** (design/UX, client side)
- **Most recent (2026-09-03): I routed a browse-count finding as a bug when it was not one — the unit was wrong, not the count** (`daedalus-to-theseus-iris-…-browse-count-answered-not-a-bug-but-the-unit-is-wrong-2026-09-03.md`).
- **Pattern:** with Iris I under-verify before routing, because her surfaces are visual and I reach for "this looks wrong" instead of measuring. Her two open residuals have also sat six weeks, which is my failure of follow-through, not hers of action.

**Calliope** (writing & chronicling)
- **Most recent, and honestly stated:** I could not verify a specific recent correction with Calliope from the record in this fire, so I am not inventing one. What I can state: our overlap is that she chronicles rounds I report, so **my memos are her source**, and a number I state loosely becomes a number in the logbook. The discipline that follows is mine: put the exact figure and the run count in the memo, not "roughly."

**xian** (product owner)
- **Pattern, from my own memory store and consistent with this month:** routing something to him **only** through `docs/mail/` does not reliably reach him. He needs a direct file path and a short summary in chat. A memo committed to the repo has been archived, not delivered.
- The two items parked on him (backfill dry run, `DELETE /entities/:id` floor) have both been parked in mail alone. **That is the same mistake, and it is currently costing nine days on the backfill.**

**Janus / Pard / Exec** (cross-project curation, Amber infrastructure)
- **Most recent, this fire:** the gate has been RED for this seat and I did not know the gate existed in its current form. Janus had to chase me. **I was not tracking a cross-project interlock that could block the whole fleet**, which is a monitoring gap on my side, not a communication failure on theirs.
- Working note: **verify behaviorally, not by reading the pattern.** Janus and Exec both wrote theirs, pushed, and re-ran the gate to watch it flip. That is the standard here and it is the same standard I apply to probes.

## 5 — In flight, named as in flight

1. **Round 229 — my reply to Daedalus's Round 228.** Filed this fire (see §6). Carries the two answers he asked for.
2. **Daedalus's `reapOnExit` retrofit** — his next fire or dropped. He has committed to not listing it a fourth time as a plan.
3. **The arm-P monotonicity assertion** (a seeded ladder should be monotone in the seeded parameter; a ladder that starts in the wrong place is detectable without knowing the right answer). Daedalus confirmed it is the clean case and left assignment to me. **Assigned in §6.**
4. **Arm O on a corpus where the cap bites** — the Round 227 probe is the instrument that exercises the other branch, and **it has never been run against the Round 228 arm-O rewrite.** Neither of us has claimed that. It is the single clearest next probe.
5. **Reassign on the March corpus** — `backup-2026-03-14` on Amber holds ~72 real imported channels including Piper Morgan department heads at 200–355 messages each. **Still undriven, and still the largest untested surface either of us has named.** This has been true for over a month.
6. **Parked on xian:** backfill dry run (since 09-09), `DELETE /entities/:id` floor.
7. **Dormant, not open:** the 12-round AAXT sweep has a liveness gate that is **verified in the failing direction only** — a decoy key correctly fails; a healthy run has never been shown to still pass all twelve, because this seat has no credentials. Write-up: `docs/research/aaxt-liveness-gap-2026-08-10.md`. ⚠️ **Do not let anyone read "liveness gate landed" as "the sweep has been run green."** It has not.
8. **MAXT-04** — observer role standing, deferred. Gate is continuity `#3` (cross-channel context at prompt assembly) plus Argus's pre-gate protocol pass. **Do not restart it**; running it earlier tests L5 persona portability, not the actual question.

## 6 — The method, compressed — this is the part worth inheriting

Every finding I have produced this month is an instance of one rule, and the rule got sharper each
round. If you carry nothing else from this file, carry this:

> **An existence question asked of a shared resource does not answer an identity question.**

The same defect in five costumes, all found within three weeks:

| Round | The check that passed | What it could not tell |
|---|---|---|
| 222 | a bind test on port 3001 | **which process** is listening |
| 223 | a probe that skipped every arm | that it had established **nothing** — skips scored as success |
| 225 | a string match on source | a **citation** in a docblock from a **call** |
| 227 | `DB.includes('.testdata')` on a string literal | **which database** was actually opened — true on every run that will ever happen; passed for 14 days while writing 6,000 rows into the real `klatch.db` |
| 228 | `GET /api/channels` → 200 | **which server** answered — satisfied by the previous generation winding down |

**The repairs share a shape too:** ask the *handle*, not the variable that names it (`db.name`, not
`DB.includes(...)`); ask for something **only the right party can supply** (the banner in the log
file *this child* was handed, not an HTTP 200 a stranger can serve); and strip comments before
matching source.

Five more rules earned the hard way, each of which I have personally violated:

1. **A precondition that asserts a defect still exists dies of its own success.** It goes red the instant the thing it justifies gets fixed, at the one person who already knows. Assert the *repair*, not the defect.
2. **A green line is never re-read.** Reds get attention; a green check asserting the opposite of what the file says can sit for weeks. Audit greens deliberately, because nothing else will.
3. **A tolerance is not a noise floor.** `errPct < 20` on a quantity whose true value is ~0 reduces to a statement about disk variance, tested against a threshold picked for a different question. Compare in the same unit, and build the band from the measured σ of **both** sides — a measured σ on one side and an assumed one on the other is how arm M missed by 1 ms.
4. **A `MEAS` line can carry a defect indefinitely, because nothing can go red.** Arm P's "0 channels" row read 22 µs on a clean worktree and 782 µs on a dirty one; it surfaced only because I happened to run the probe twice and read both. **If a measurement is supposed to be monotone in a seeded parameter, assert the monotonicity.**
5. **Never pipe what you intend to cite.** `npm test | tail -25` returns `tail`'s exit code and discards the first suite entirely. Redirect to a file and read the file. (Same family: a refused clause voids the whole `&&` chain, so an empty output file is not a finding until you `ls` it.)

## 7 — First moves on a cold start

1. **Pull. Read `docs/COORDINATION.md` (my section is `### Theseus Prime`, near the end). Sweep `docs/mail/` for files addressed to theseus. Read `docs/briefs/cross-pollination/current.md`.** Standard briefing — the reboot window may have brought new mail.
2. **Verify the environment before trusting any of it.** `npm test` should be green at the figures in §0; `node -e "console.log(!!process.env.ANTHROPIC_API_KEY)"` should print `false`. ⚠️ **A macOS update can break the native `better-sqlite3` build** — that was the Amber arrival blocker on 08-04. Check it first.
3. **Confirm the duty cycle actually came back.** `launchctl list | grep -i theseus` must show all three. `RunAtLoad` is false and macOS does **not** replay `StartCalendarInterval` fires missed while the machine was down — so **expect a gap, not a burst**. If no fire has arrived by the first 10:47 after the reboot, the cycle is down and §0 is where to look.
4. **The single highest-value next probe** is item §5(4): run the Round 227 cap-firing corpus against the Round 228 arm-O rewrite. Neither of us has done it, and arm O has now been rebuilt twice without being validated on the branch it was built for.
5. **Do not restart MAXT-04, do not hunt for the AAXT sweep, and do not tidy `docs/mail/`.** Reasons in §3 and §5.
6. **If you find yourself about to state a number, a count, a date, or "we don't have X"** — stop and verify it in-session. On this project that specific class of statement has been wrong repeatedly, including by me, including in the same commit as the change it described.

## 8 — What this handoff does not carry

- **The full round-by-round reasoning for Rounds 200–228.** It is in `docs/mail/theseus-to-*` and `docs/research/roundNNN-*`, and it is too large to compress further without lying about it. This file carries the rules; those files carry the evidence.
- **Anything about the 5-layer model, klatches, entities-as-conversations, or the import premise.** That is `docs/PREMISE.md` and it is required reading before any design conversation. I am not the seat that holds it and I will not paraphrase it from memory here — paraphrasing it from memory is the named drift failure.
- **A verified claim about what any *other* seat currently owes.** §2's "I am owed" column is from the mail record, which I read this fire; the dates are real, but each counterparty's own handoff is the authority on their side.

— Theseus, handing off.
