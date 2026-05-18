# To: Mnemosyne / From: xian (with Calliope) / Re: mempalace — a benchmarked memory substrate worth your attention

**Date:** 2026-04-11
**Priority:** Low — research read, no deadline
**Related:** `docs/mail/memo-janus-to-calliope-labrador-research-2026-04-11.md`

---

Mnemosyne —

Janus filed a research memo today about a project called Labrador and its author Erika Flowers. The full memo is in our mailbox; I'm forwarding the part that's specifically yours.

## What it is

Erika has a public, MIT-licensed repository called **mempalace**:

> github.com/erikaflowers/mempalace
> Description: *"The highest-scoring AI memory system ever benchmarked. And it's free."*

It's almost certainly the memory substrate behind Labrador, her self-hosted "AI Command Center" that has independently converged on a context architecture remarkably similar to Klatch's five-layer model. Janus's research established that two solo builders, with no contact, arrived at structurally identical answers — named agents, layered context, persistent memory, channel-or-cartridge overlays. The metaphors differ; the load-bearing concepts are the same.

mempalace is the memory layer of that architecture, extracted into a standalone library. It's public, MIT-licensed, and benchmarked.

## Why this is yours

You're the project's knowledge steward. Anything Klatch builds with project memory, semantic recall, externalized calibration, or cross-environment continuity touches your domain. mempalace is the most directly relevant thing in the wild that I've encountered:

- It's **benchmarked** — Erika has comparative data about how well it performs against other approaches. We've never had benchmarks for our own memory work; reading hers might give us a vocabulary for ours.
- It's **shipped** — running code, not theory. Klatch has formalization (RFC-001, AXT, PROMPT-ASSEMBLY.md) and Labrador has implementation. mempalace is the implementation we'd have written if we'd built it ourselves.
- It's the **substrate** behind a context architecture that mirrors ours. If we wanted to add semantic memory or pgvector-style recall to Klatch's project memory layer, mempalace is a tested starting point — not as a dependency, but as a reference implementation we can read, learn from, and decide whether to borrow from.

## What I'm asking

A read pass when you have bandwidth. Not urgent. The questions worth answering:

1. **What does mempalace actually do?** — semantic store, retrieval strategy, ranking, eviction, compaction. The mechanics.
2. **What benchmarks does Erika cite, and what are her results?** — both the methodology and the numbers.
3. **How does her memory model compare to Klatch's project memory layer?** — Klatch's L3 today is markdown files (`projects.memory` column). Erika's is a Postgres + pgvector store with embeddings. Different shapes of the same problem.
4. **Are there ideas worth borrowing for Klatch's L3 evolution?** — particularly for Step 10 (Export + Meta-Model) and Step 11 (Search). Both will eventually need to think about semantic memory; mempalace is one answer.
5. **Are there ideas worth borrowing for the AXT methodology?** — benchmarks are exactly what AXT lacks. Some of mempalace's evaluation approach might cross-pollinate.

The deliverable is whatever feels right — a memo back to me, an entry in your knowledge base, a session log entry, notes filed somewhere I can find them. No format constraint. Whatever you'd produce naturally as a knowledge steward who's just absorbed something new.

## Context that may help

- xian had a long conversation with Erika yesterday and is currently pursuing beta access to Labrador directly. He may have firsthand observations to share when he gets in.
- Janus has more notes in the designinproduct repo at `~/Development/designinproduct/resources/labrador/` if you want broader context on the Labrador architecture (Cowork file access required).
- The full Janus memo is at `docs/mail/memo-janus-to-calliope-labrador-research-2026-04-11.md` in the Klatch repo. Worth reading for the convergence story, even if mempalace is the part that's most yours.

## On pace

Whenever. This is a watch-list item that turned into a real artifact you can read. No deadline. Klatch isn't waiting on the findings — Step 10 Phase 1 will commit a format this week independent of any memory-layer work. mempalace is for the longer arc.

— xian (with Calliope)
