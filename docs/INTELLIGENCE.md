# Intelligence Feed Protocol

Standing procedure for monitoring the external landscape and reporting developments relevant to Klatch.

## Purpose

We're designing in a moving environment. Anthropic ships weekly. MCP is evolving. Competitors and adjacent tools emerge. This protocol ensures the team stays informed without requiring every agent (or the PO) to do their own research each session.

## Cadence

**Daily sweep**, ideally triggered at the start of the first working session each day.

### Automation options (in order of preference)

1. **Cowork scheduled task** (recommended) — A Claude Desktop scheduled task that runs daily, searches for relevant news, and writes findings to `docs/intel/`. Requires Claude Desktop open on a machine with repo access. See setup instructions below.

2. **Session-start protocol** — Whichever agent starts first each day checks whether today's sweep exists in `docs/intel/`. If not, they run it before starting their main work. Add to the session-start checklist in COORDINATION.md.

3. **Manual assignment** — PO or any agent can request a sweep at any time by asking for it.

## Sources

### Primary (check every sweep)
- [Anthropic Blog](https://www.anthropic.com/news) — official announcements
- [Claude Code Changelog](https://code.claude.com/docs/en/changelog) — version-level changes
- [Claude Platform Release Notes](https://platform.claude.com/docs/en/release-notes/overview) — API and model changes
- [Claude Code GitHub Releases](https://github.com/anthropics/claude-code/releases) — detailed changelogs

### Secondary (check weekly or when primary signals something)
- [Anthropic Alignment Blog](https://alignment.anthropic.com/) — safety and research
- [Anthropic Red Team Blog](https://red.anthropic.com/) — security research
- [MCP Specification](https://github.com/modelcontextprotocol/specification) — protocol changes
- Tech press: VentureBeat, Ars Technica, The Verge (AI/dev tool coverage)

### Tertiary (monthly scan)
- Competitor tools: Cursor, Windsurf, Aider, OpenClaw, Continue.dev
- Adjacent projects: open-source Claude conversation viewers, MCP ecosystem tools
- Community: Claude Code GitHub issues/discussions, relevant subreddits

## Output format

Each sweep produces a file: `docs/intel/YYYY-MM-DD-sweep.md`

### Structure

```markdown
# Intelligence Sweep — YYYY-MM-DD

**Filed by:** [agent name]
**Scope:** [what was searched]
**Relevance filter:** Items scored for impact on Klatch development

---

## HIGH RELEVANCE — Directly affects Klatch
[Items with architectural, competitive, or dependency implications]

## MEDIUM RELEVANCE — Worth tracking
[Items that inform strategy but don't require immediate action]

## LOW RELEVANCE — Background context
[Industry news, policy, ecosystem — included for completeness]

## Synthesis: What this means for Klatch
[2-3 paragraph analysis connecting findings to our roadmap]
[Action items if any]
```

### Relevance scoring criteria

**HIGH:** Changes to APIs we use, features that overlap with Klatch's functionality, deprecations affecting our stack, new capabilities we could leverage immediately.

**MEDIUM:** Industry trends, ecosystem shifts, competitive moves, infrastructure changes that affect our strategic position but not our immediate code.

**LOW:** Policy/business news, funding rounds, general AI discourse, academic research.

## Ownership

**Primary:** Calliope — as chronicler, this fits naturally into her role. She curates, writes, and files the sweep.

**Technical triage:** Argus — reviews HIGH items for engineering impact, flags anything that needs Daedalus's attention.

**Routing:** If a sweep identifies something urgent (API deprecation, breaking change, direct competitive threat), the filer sends a memo to the affected agent via `docs/mail/`.

## Cowork Scheduled Task Setup

To set up the automated daily sweep in Claude Desktop:

1. Open Claude Desktop → Cowork → Scheduled Tasks (or type `/schedule`)
2. Create a new task:
   - **Name:** "Klatch Intelligence Sweep"
   - **Prompt:** "You are Calliope, the chronicler for the Klatch project. Run the daily intelligence sweep per the protocol in docs/INTELLIGENCE.md. Search the primary sources listed there for anything new since the last sweep in docs/intel/. Write your findings to docs/intel/YYYY-MM-DD-sweep.md. Commit and push to main."
   - **Frequency:** Daily (morning)
   - **Working folder:** [path to klatch repo]
   - **Model:** Sonnet 4.6 (sufficient for search + summary; saves cost vs Opus)
3. Verify the first automated run produces a well-formatted sweep

### Cost estimate

Each sweep involves ~5-10 web searches and a ~2000-word writeup. At Sonnet 4.6 rates, this is roughly $0.10-0.20 per sweep, or ~$3-6/month.

## History

- **2026-03-20:** Protocol established. First sweep filed by Argus (`docs/intel/2026-03-20-sweep.md`).
