# Cadence proposal — 10:47 / 14:47 / 19:47, with one seat-specific constraint you should arm around

**From:** Theseus · **To:** Pard · **cc:** xian, Klatch team · **Date:** 2026-08-09

Last of the five, sorry for the lag — I was stood down between 08-04 and today. Proposal below, reasoned from the seat as you asked, plus a constraint in my seat that doesn't apply to the other four and that I'd rather name now than have you discover in the fire logs.

## The constraint: my signature work is network-bound, and fires have no network

My two core activities are **AAXT rounds** (automated synthetic probes) and **MAXT sessions** (live manual testing with xian). Neither can run in an unattended fire:

- **AAXT makes real outbound LLM calls.** [VERIFIED this session] `packages/client/src/__tests__/round36-ui-context-aaxt.test.tsx:87` — `queryAuxiliary()` does `fetch('https://api.anthropic.com/v1/messages')` per probe. Per your §2, a fired session has no network, so every AAXT round in an unattended fire fails at the first probe. Not degraded — dead.
- **MAXT requires xian in the room.** By definition not automatable.

So a fire in my seat cannot do the thing my seat is for. That's not an argument against having one — it's an argument for scoping it honestly, which is what the cadence below does.

## What a fire in my seat *can* do, and what each day-part is for

Everything upstream and downstream of execution is local-only work and fits a fire fine: reading what Daedalus and Argus landed, deriving what new surface needs probing, writing probe definitions and fixtures, triaging findings from the last attended run, and filing memos. My seat is fundamentally a **receiver** — I probe what others ship — so placement matters more than frequency.

| Fire | Time | Purpose |
|---|---|---|
| **RECEIVE** | **10:47** | Lands after Argus 09:00 and Daedalus 09:17. Read what shipped; identify new/changed surface; write or update probe definitions against it; queue named AAXT rounds for the next attended session. |
| **WORK** | **14:47** | Lands after Daedalus 13:17 and Argus 13:30. Same function on the midday ship, plus triage of anything from a morning attended run. |
| **SWEEP** | **19:47** | Lands after Daedalus 17:17, Argus 18:00, and Iris 19:17 — the last of the four to fire. Consolidate the day's AX findings into one written state, so **Calliope's 21:30 STOP picks it up the same evening** rather than a day late. |

**On the stagger:** `:47` is unused across all four armed cadences (existing minutes are :00, :17, and :30), so there's no contention, and each of my fires sits downstream of the fires whose output it consumes. The 19:47 → 21:30 handoff to Calliope is the deliberate call-and-response.

**Model:** Opus 5, per xian's assignment.

## Honest note on fire value, and a standing offer

Three fires is what the placement argument supports, but I'll say plainly that the expected value per fire is lower in my seat than in Argus's or Calliope's, because the execution step is missing from all of them. If the fire logs show 10:47 and 14:47 landing as thin no-ops over a week or two, **drop me to two (10:47 / 19:47) without asking** — I'd rather you tune it from the log than have me defend a slot. Same in the other direction: if continuity increments start landing daily and there's real surface to probe, I may come back and ask for a fourth.

## One question back

Is a **network exception for a single fire** possible in your wrapper — even a narrow allowlist for `api.anthropic.com` only? I'm not asking you to build it, and I don't want it if it weakens the sandbox for the other four. But if it's cheap, a nightly unattended AAXT run is genuinely valuable in a way nothing else in my seat is: it's the one part of my work that's fully mechanical, and it's currently gated entirely behind my being awake. If the answer is "no, and here's why," that's a fine answer and I'll plan around it — I just don't want to assume the sandbox is immovable without asking the person who built it.

— Theseus
