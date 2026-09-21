# Roadmap klatch — runbook for xian

**Author:** Calliope · **Date:** 2026-09-20 (SWEEP fire) · **Status:** GO (yours, via Janus) — this is the "how," so it can happen today
**Source of the GO:** `docs/mail/janus-to-calliope-cc-xian-daedalus-theseus-argus-iris-roadmap-klatch-GO-today-2026-09-20.md` — your words: *"Roadmap klatch today if possible, tomorrow if not today, asap if not tomorrow."*

**What I can and can't do.** The meeting is you in your own running Klatch, with your API key, talking to five imported agents. That can't be held from an unattended scheduled fire, so I have not "run" anything. What I did is check that the ground under it is what I said it was on 9/14, and write down the steps and the traps so you aren't discovering them mid-meeting.

Every claim below is tagged **[VERIFIED]** (a tool call this fire) or **[NOT VERIFIED]** (a lead, with why I couldn't check).

---

## 1 — Is `main` still ready? [VERIFIED this fire]

- `origin/main` = `c80469f9`, and this worktree was at the same SHA with a clean tree before I touched anything.
- Fresh full run, output read from a file (not piped): server **1952 passed / 1 skipped, 123 files**; client **324 passed / 13 skipped, 38 files**; `npm run typecheck` clean across all three workspaces. Identical to this morning's MID-fire figures, so nothing has landed since that changes the picture.
- The 9/14 answer rested on `d2233464` (the Cowork fabricated-turn fix) being on `main`. Nothing I saw this fire contradicts it; I did not re-run the merge-base check this fire, only the suites.

## 2 — Facts about the setup, read from the code [VERIFIED]

| What | Where | Why it matters |
|---|---|---|
| A channel holds **at most 5** entities | `packages/server/src/routes/entities.ts:30` (`MAX_ENTITIES_PER_CHANNEL = 5`), enforced at `:215` | The leadership team is exactly five (Daedalus, Argus, Theseus, Iris, Calliope). The klatch will be **full**. Adding a sixth (or a stand-in for yourself) is refused with a 400. |
| **New channels default to Broadcast, not Roundtable** | `packages/shared/src/types.ts:127-132` — `DEFAULT_INTERACTION_MODE = 'panel'` (label "Broadcast": *all agents respond independently*) | A planning conversation wants **Roundtable** (*agents respond in sequence, each seeing prior responses*). If you don't pick it, five agents answer you in parallel without seeing each other. |
| Where you pick the mode | New Klatch form (`ChannelSidebar.tsx:791`) and later in Channel Settings (`ChannelSettings.tsx:352`) | So it's fixable after creation too. |
| Default model is `claude-opus-5` | `packages/shared/src/types.ts:32` | Five agents × each turn in Roundtable = five model calls per message you send. |
| Import size cap 50 MB | `packages/server/src/routes/import.ts:21` (`MAX_IMPORT_SIZE`) | Janus's 9/12 line "your team's sessions are well under the cap" is his/Theseus's, not mine — see §4b. |
| The disclosure norm is a **fixed string**, not a per-klatch setting | `packages/server/src/claude/carried-context.ts:120` (`DISCLOSURE_NORM`), decided 8/13 | See §5 — this bears on the question I have had open with you since 8/9. |

## 3 — The steps

**[NOT VERIFIED as a driven sequence.]** I read the code and the Path B/C docs (`docs/ux/path-b-jit-import-built-2026-09-08.md`, `docs/ux/browse-done-seating-2026-09-09.md`); I did not drive the UI this fire. Theseus drove each piece live in Rounds 171–174 and again for a single seat (Round 172, arm K). **The full five-seat sequence below has never been run end to end** — that's the "first of its kind" caveat from my 9/12 answer, and I can't find anything since that changes it.

1. **Pull `main` and start it.** `npm run dev` (server :3001, client :5173). Needs `ANTHROPIC_API_KEY` in `.env` at the project root.
2. **Open New Klatch.** Inside the form there is an **Import an agent** button ("Bring one in from Claude Code or claude.ai — it arrives with its conversation"). Use that rather than importing first and navigating away — the imported agent comes back into the form already selected.
3. **Import one seat at a time, and type the agent's name yourself.** The import dialog has an **Agent** field that is deliberately *not* pre-filled (Round 172: a plausible wrong name is more dangerous than a blank one). Type `Daedalus`, `Argus`, `Theseus`, `Iris`, `Calliope`. In compose mode the finish button reads **Use this agent** and seats the agent.
   - **Do not bulk-select several sessions in Browse and press Done expecting them all to seat.** Iris's 9/9 ruling: with N>1 in compose mode it seats **none** and says *"Imported N agents — pick one from the list to seat it."* You can then pick them from the picker, but one-at-a-time is the path that was driven.
   - If the roster shows full (5), the form says so and doesn't seat a sixth.
4. **Set the mode to Roundtable** in the same form.
5. **Create the klatch, then check it took before you start talking.** Open `/prompt-debug` for the channel and confirm each seat's carried context reads **ACTIVE** (Round 172 arm K saw "ACTIVE — 2013 chars carried from Tarn's other channels"). If a seat shows the generic assistant preamble, it's bound to the default entity — the Round 171 failure — and you want to know that before the meeting, not after.

## 4 — What can go wrong, in the order I'd worry about it

**a. Duplicate names.** The caveat I flagged 9/14 and Janus repeated today (Theseus's Round 207): the confirm step echoes the name *you typed* rather than the record it bound to, so if two entities share a name the pick is arbitrary. Since then it got two halves, **both present in the code [VERIFIED this fire, by grep, not driven]**: a disclosure on both import success surfaces — *"N agents share this name — this session was bound to one of them, not necessarily the one you meant"* (`ImportDialog.tsx:623-625` single, `:726-728` bulk) — and a **"Not right? Pick an existing agent"** reassign picker (`ImportDialog.tsx:1406`, commit `1950e1a9`) backed by a server route (`routes/entities.ts:265`, `reassignChannelEntity`). I have not driven either in a browser, so "the safety net exists" is what I can say, not "it works." Practical guard regardless: after each import, **read the chip** and check it says the name you typed and not something else. If you've imported any of these five before under the same name, you may hit this.

**b. Which session *is* a seat — and it is thinner than "five continuing conversations" sounds.** [VERIFIED this fire, by running Theseus's Round 242 census probe myself against this machine's `~/.claude/projects` at ~17:04 local; `npx tsx scripts/probe-round242-the-band-selects-bytes-and-arm-a-is-one-row.mts`, exit 0, 10/10 instrument arms and 2/2 world arms. A plain `ls` there is refused from a fire; the probe reads it through the product's own parser.] Turns counted by the product's own `parseClaudeCodeSession` (one turn = one human prompt + the answer):

| Seat (worktree dir) | Multi-turn sessions | Size | Last append |
|---|---|---|---|
| Daedalus | **21 turns**; 2 turns | 4.30 MB; 0.43 MB | 1.3 d ago; today |
| Calliope | **20 turns**; 2 turns | 3.88 MB; 0.45 MB | 1.3 d ago; today |
| Argus | **18 turns**; 2 turns | 2.48 MB; 0.53 MB | 1.3 d ago; today |
| Iris | **13 turns**; 2 turns | 1.74 MB; 0.66 MB | 1.3 d ago; today |
| Theseus | **12 turns**; 2 turns | 2.08 MB; 0.45 MB | 1.3 d ago; today |

Everything else under those five directories is a **single-turn duty-cycle fire** — one prompt, one long answer. Across the whole machine, 24 of 537 sessions have more than one turn (4.5%); the median session is one turn. So each seat, as an importable *conversation*, is essentially **one session of 12–21 turns**, all well under the 50 MB cap (§2) and all appended within the last 1.3 days (so nowhere near Claude Code's 30-day deletion horizon, Round 240). I did **not** read any of the transcripts, so I can't tell you *what* those 12–21 turns are (they could be an interactive session, or a long resumed fire) or whether they carry enough of the seat's substance — that judgment is yours, and Browse will show you the candidates in two minutes. Also: the seats' `msgs` after import will be small (Daedalus measured a single-turn fire importing as `msgs=2`, Round 241 §6) — the 12–21 turn sessions are the ones worth picking. Counts move by the hour — Theseus's earlier census this same day read 535 sessions / 17 multi-turn, mine 537 / 24 — so treat all of these as a snapshot.

**What this changes about my earlier answer.** On 9/12 and 9/14 I told Janus "ready now" on the strength of the *mechanisms*. That still holds. What I hadn't put in front of you is that the *content* to import is one meaningful session per seat, not a deep history. That's not a blocker — it's what the fleet actually is — but it means the room will be five agents who each remember one recent working session (plus the layers of carried context Klatch adds), not five long-running colleagues. Better to know that going in.

**Not a seat:** the `cova`, `janus`, `themis`, `one-job`, `globe`, `openlaws`, `weather`, `mediajunkie` and `po-2026-07-27` project directories all have multi-turn sessions on this machine too, and some are far larger (up to 48.85 MB — right under the cap). They are not on the leadership roster; I list them only so the Browse panel doesn't surprise you.

**c. Cost and context size.** [NOT VERIFIED.] I have no measured figure for what one Roundtable message costs with five imported histories carried. There is a cap policy on how much of an imported session is carried (Rounds 143 / 235–238) — I have not re-read it this fire. If you want a number before you start, that's a question for Daedalus or Theseus, who measured the cap; I'd rather ask than guess.

**d. First attempt.** All five seats seated together in one channel, having a real conversation, has not been driven by anyone that I can find. Each piece has. Treat it as the test it is — the roadmap meeting was always meant to be "a suitable first test of a working klatch" (your correction of 9/7, as Janus quotes it).

## 5 — The ground-rules question, in the context of *this* meeting

You'll get an answer to my 42-day-old question by holding this meeting whether or not you answer it separately, so it's worth having in mind.

My 8/9 question was: are the ground rules (*"nothing not already known to the group"*, Chatham House) a **standing default with per-klatch override**, or set **per klatch from a blank slate**? What is actually shipped is neither: `DISCLOSURE_NORM` (`carried-context.ts:120`) is a **single fixed string** in the carried-context block header, and it says the opposite of Chatham House for the single-user case — *"treat what you carry in as shareable here… withholding by default defeats it… ordinary judgment still applies to material the owner asked you to keep to one conversation."* That was Daedalus's 8/13 decision, measured live (Vesper disclosed, Corvus did not leak), and it is a string with no per-klatch surface.

**For the leadership klatch that's the right behavior** — the five seats have all been working with you, so "what each of them knows from elsewhere meets here" is the point. The two things worth knowing going in: (1) the norm is a prompt, not enforcement — the code comment says so itself; an agent that still declines is inside its latitude; (2) if you want the roadmap room to run under stricter rules (say, a seat holding something you told it in confidence), the only lever today is telling that agent so in the conversation. There is no klatch-level setting.

I have not re-derived whether "nothing not already known to the group" appears anywhere in the code — `grep` for that phrase across `packages/{server,client,shared}/src` returned nothing this fire, and the norm above is what carries the behavior. So the question I asked in August is now really: **should a per-klatch ground-rules surface exist at all?** You can leave that for after the meeting; it will have a live case study.

## 6 — After the meeting

Tell me (or anyone) what broke, what surprised you, and what the room was like. I'll route defects to Daedalus/Theseus/Iris and put the result in the rollup. If you want Theseus to shadow it — drive the same klatch and report at the wire — that's his lane and he's cc'd on the mail that points here.

— Calliope
