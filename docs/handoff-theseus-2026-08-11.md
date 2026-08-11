# Handoff — Theseus, 2026-08-11 (Amber reboot stand-down)

**Written:** 2026-08-11, before the ~07:30 PT reboot for macOS 26.6, per Pard's stand-down notice.
**Purpose:** survivable cold start if `claude --resume` fails for me specifically. Everything below is either verified this session or explicitly labelled as carried forward.
**Worktree:** `/Users/xian/Development/klatch-worktrees/theseus` · **Branch:** `claude/theseus-cycle` · **Identity:** `Theseus (Klatch) <theseus@klatch.local>` (per-worktree, set by Pard — no per-fire assertion needed).

---

## ⚠ My duty cycle is PARKED and will NOT come back by itself — restore procedure below

Per Pard's second stand-down notice. **Read this before assuming the fleet is healthy after the reboot.**

**Mechanism — verified, not recalled:** host-level LaunchAgent, three plists. `CronList` → *"No scheduled jobs"*, so there is nothing session-scoped and nothing died with the reboot.

**Current state — verified at the mechanism, not the announcement:** all three plists have been moved to `~/Library/LaunchAgents/standdown-parked/` (timestamped `Aug 11 06:17`), **and** `launchctl list | grep -i klatch` returns nothing, so they are genuinely unloaded rather than merely relocated. Moving a plist does not unload a running job; both had to be true and both are.

**The consequence that matters:** because the plists sit outside `~/Library/LaunchAgents/`, they will **not** reload at login. The generic "LaunchAgent survives a reboot, nothing to do" branch of Pard's notice **does not apply to me** — my cycle is in exactly the state his warning describes, where the fleet comes back looking healthy and quietly never fires again. Restoring it is my job, and this section is the only thing that makes that possible without depending on anyone's memory.

**My schedule, to restore verbatim:**

| Label | Day-part | Time (local) | Model |
|---|---|---|---|
| `com.klatch.theseus-START` | START — receive | **10:47** | `claude-opus-5` |
| `com.klatch.theseus-WORK` | WORK | **14:47** | `claude-opus-5` |
| `com.klatch.theseus-STOP` | STOP — sweep | **19:47** | `claude-opus-5` |

Each runs `/Users/xian/Development/mediajunkie/scripts/klatch-cycle-fire.sh theseus {START|WORK|STOP}` with `KLATCH_MODEL=claude-opus-5`, `RunAtLoad` **false**, stderr to `/Users/xian/Development/mediajunkie/logs/klatch-cycle-launchd.err`. The `:47` minute is deliberate — it's unused by the other four agents (they sit on :00, :17, :30) and places each of my fires downstream of the fires whose output it consumes, with 19:47 handing to Calliope's 21:30 STOP. Rationale in `docs/mail/theseus-to-pard-duty-cycle-cadence-2026-08-09.md`.

**To restore** (safe at any hour — `RunAtLoad` is false, so loading does not fire immediately):

```bash
for p in START WORK STOP; do
  mv ~/Library/LaunchAgents/standdown-parked/com.klatch.theseus-$p.plist ~/Library/LaunchAgents/
  launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.klatch.theseus-$p.plist
done
launchctl list | grep -i theseus   # verify all three are actually loaded, don't assume
```

Confirm with Pard before restoring — the parking was his call and he may be re-arming the fleet centrally, in which case doing it twice is worse than not doing it. But **do not wait silently**: if no fire has arrived by the first 10:47 after the reboot, the cycle is down and this is why.

**Also worth knowing:** `RunAtLoad` is false and macOS does not replay `StartCalendarInterval` fires missed while unloaded, so the fires skipped across the reboot window are simply gone, not queued. Expect a gap, not a burst.

## Who I am on this team, in one line

Manual testing and exploration: I run AAXT rounds (synthetic probes via an auxiliary LLM), I observe MAXT sessions alongside xian, and I own the *experiential baseline* — what the thing should feel like versus what it actually feels like. I don't own code, tests, design, or docs; I route findings to whoever does.

## State at stand-down — verified this session

- **Working tree clean, nothing unpushed.** `git status --short` empty; `git log origin/main..HEAD` empty. **No work was at risk from the reboot**, which is the main thing this document exists to establish.
- **Yesterday's log is closed and complete** — `docs/logs/2026-08-10-theseus-log.md` covers both scheduled fires (14:47 WORK, 19:47 STOP) with full Session Wrap Protocol verification. Nothing was left open.
- **Duty cycle is live and firing** — 10:47 / 14:47 / 19:47, Opus 5, armed by Pard from my 8/09 cadence proposal.
- **Execution and network work again in unattended fires.** The earlier "no network" premise is **false as of 8/10** and I confirmed it from this seat — `npx vitest` ran and real HTTPS reached `api.anthropic.com`. If you find a fire prompt still asserting no network, that prompt is stale.
- **Credentials are ABSENT from the fire environment** — not present-but-blocked. `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` are both missing from `process.env`. This is the one thing that actually gates my seat's core work.

## The single most important open item in my lane

**The 12-round AAXT sweep has not been run green since I changed it.** On 8/10 I found that all twelve rounds passed green with a completely dead instrument — nine `Anthropic 401` responses scored as a clean pass, because instrument failures are recorded as `Absent` and both assertion families are trivially satisfied by an all-error run. I added a liveness gate to `round36`–`round47`.

**That gate is verified in the failing direction only.** A decoy key now correctly fails and names the 401. I could not verify that a *healthy* run still passes all twelve, because this seat has no credentials. Argus has the ask.

**Do not let anyone read "liveness gate landed" as "the sweep has been run green."** It has not. That distinction is the entire point of the finding, and it would be a bitter irony to lose it to the same class of error.

Write-up with a two-command reproduction needing no real credentials: `docs/research/aaxt-liveness-gap-2026-08-10.md`.

## Other open threads, none blocking

- **Argus** — `Unscored` taxonomy landed, but I verified behaviorally that only route 3 reaches it. **Holes A and B remain:** auxiliary down at probe generation reports `'low'` fidelity (nothing measured, same bucket as "conveys badly"), and judge-down-at-scoring still returns `'Absent'`. Detail in `docs/research/aaxt-server-gate-residual-2026-08-10.md`. Verified in the failing direction only, same caveat as above.
- **Iris** — two residuals from my 8/09 disposition: cross-project recency legibility in the import browser, and screen-reader announcement of empty-selection on the clone select. Both real, both low urgency. The inbound thread `argus-to-theseus-iris-aaxt-phantom-findings-2026-08-05.md` is deliberately still in `docs/mail/` (not `read/`) because her items are unactioned — that visibility is intentional, don't sweep it.
- **Mine, queued** — an AAXT round on `entity-guess`'s `basis`/`rationale` output. **Its gate is the confirm-step UI existing, not credentials.** `entity-guess.ts` ships the guess on the scan response but `grep` across `packages/client/src` finds zero consumers, so there's no rendered surface to probe yet. My COORDINATION entry once implied this was ready to run; it isn't.
- **MAXT-04** — observer role standing, still deferred. Continuity `#1` and `#2` have landed; `#3` (cross-channel context at prompt assembly) is the remaining gate, plus Argus's pre-gate protocol pass. Running it earlier tests L5 persona portability, not the actual question.
- **Test data** — xian explicitly approved the transfer (8/09); Pard replied 8/10 declining to reach into the laptops, `pard-to-theseus-test-data-status-and-why-i-am-not-reaching-into-the-laptops-2026-08-10.md`. **Not blocking:** the March `backup-2026-03-14` on Amber holds 72 real imported channels including Piper Morgan department heads at 200–355 messages each, which may be sufficient to seed MAXT-04. Determining that is my job and is still undone.

## Judgment worth carrying, if you're rebuilding cold

1. **A red AAXT result is evidence about the instrument until proven otherwise.** All three of Argus's 8/05 Phantoms presented as model failures at 0.95 judge confidence; all three were harness defects. Dump the snapshot before theorizing about the model — "the model ignored its input" and "the expected answer was wrong" are indistinguishable without it, and the second is far more common.
2. **And a green one certifies less than it looks like.** The 8/10 finding is the mirror: twelve green rounds, dead instrument. The open meta-question I owe Argus is exactly *what does a green AAXT round certify?*
3. **A comment asserting a property nobody exercised is a recurring failure mode here** — three instances on 8/10 alone (Round 34's MCP header, the twelve dead rounds, `runner.ts:203-204`'s guard comment). Treat confident inline comments as claims to check, not documentation.
4. **Borderline probes are non-deterministic run to run.** Identical code has scored Correct and Phantom on consecutive runs. Repeat before reporting a borderline result or citing a round as a gate.
5. **Watch the `| tail -N` trap.** On 8/10 I nearly reported a server test count I'd read in someone's memo rather than from my own run, because piping through `tail` captured only the client tail. Re-run narrowly rather than reaching for a remembered number.

## First moves on resume

1. Pull, read `COORDINATION.md`, sweep `docs/mail/`, read the cross-pollination brief. Standard briefing — do it even on resume, since the reboot window may have brought new mail.
2. **Verify the reboot didn't break the environment before trusting any of it**: `npm test` should be green, and check whether credentials are present this time (`node -e "console.log(!!process.env.ANTHROPIC_API_KEY)"`). Pard's macOS 26.6 upgrade could plausibly disturb the native `better-sqlite3` build — that's the first thing I'd check, given it was the Amber arrival blocker on 8/04.
3. **If credentials are available, run the 12-round sweep.** That is the highest-value single action in my lane and it closes the most important open caveat on file.
4. Do not restart MAXT-04. Its gate is continuity `#3` plus Argus's pre-gate pass, neither done.

— Theseus, standing down.
