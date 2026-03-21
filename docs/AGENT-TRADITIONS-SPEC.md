# Agent Traditions Documents — Scope

**Proposed by:** Calliope (with xian)
**Date:** 2026-03-20
**Status:** Scoped, not yet implemented

---

## The Problem

Agent sessions start with a context window that contains the conversation history but no persistent memory of working style, standing conventions, or accumulated institutional knowledge. An agent at session start is oriented by CLAUDE.md (the project-level instructions) and their entity prompt (a brief description in the database), but lacks the richer layer of "how we do things around here" that makes a team member useful rather than just capable.

This matters more as the team grows and sessions become more frequent. Each session, agents are reconstructing conventions from context rather than carrying them.

## The Proposal

A `docs/agents/` directory containing one Markdown file per agent. Each file captures what we might call that agent's **traditions** — the accumulated working knowledge that makes their sessions productive, beyond what CLAUDE.md covers.

This becomes the primary content of Layer 5 (entity prompt) in the five-layer prompt model, in durable document form rather than text buried in a database field.

## File naming

```
docs/agents/calliope.md
docs/agents/daedalus.md
docs/agents/argus.md
docs/agents/theseus.md
docs/agents/mnemosyne.md
```

## Structure of each traditions document

Each file should cover:

### 1. Role and purpose
A crisp description of what this agent does and why they exist on the team. More specific than ROSTER.md — operational, not biographical.

### 2. Working style
How this agent prefers to work: communication patterns, documentation habits, how they handle uncertainty, what they escalate vs. resolve independently.

### 3. Standing responsibilities
Recurring tasks and ownership that belong to this agent regardless of what's in COORDINATION.md. For example: Calliope owns the logbook, writes memos to team members, reviews the blog. Argus owns the test suite, round-by-round.

### 4. Conventions and standards
Agent-specific conventions that aren't covered in the project-level CLAUDE.md. For example: Argus's round-numbering pattern, Calliope's blog post publishing workflow, Theseus's P-number priority system for findings.

### 5. Key relationships
How this agent works with each other agent and with xian. What they produce that others consume, and what they depend on from others.

### 6. Institutional memory
Things this agent knows that aren't written down elsewhere. Historical decisions, lessons learned, context that would be lost if the agent were re-created from scratch.

### 7. Standing instructions
Specific behavioral rules for this agent, beyond the project-wide rules. For example: Calliope checks for mail before doing anything else; Argus never force-pushes.

---

## Implementation order

1. **Calliope first** — as chronicler, I can write my own document as a reference example
2. **Argus second** — urgently needs reinforced conventions after the reliability incident
3. **Daedalus, Theseus, Mnemosyne** — in any order, potentially self-authored with light editorial review

## Integration with prompt assembly

Once these documents exist, they should be:
- Included in the Claude.ai project knowledge files for cloud-side agents (Mnemosyne, any cloud roles)
- Referenced in each agent's entity prompt in the Klatch database: "Your traditions document is at docs/agents/NAME.md — read it at session start"
- Committed to the repo so Mnemosyne can audit them for drift

## Maintenance

Traditions documents are living files. They should be updated:
- When a new convention is established
- When a standing responsibility changes
- After a significant incident (e.g., Argus's document should now include the force-push prohibition explicitly)
- Quarterly audit by Mnemosyne as part of her knowledge stewardship role

---

## Next action

Calliope to draft `docs/agents/calliope.md` as the reference example. Argus's document to follow with urgency given the current reliability work.
