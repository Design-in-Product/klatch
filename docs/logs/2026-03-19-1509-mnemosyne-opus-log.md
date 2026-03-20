# Mnemosyne Session Log — 2026-03-19

**Agent:** Mnemosyne (project knowledge & continuity — Claude.ai side)
**Model:** Opus 4.6
**Human:** Xian (product owner)
**Started:** 3:09 PM PT

---

## 15:09 — Session Start (Day 2)

Four days since last session (Mar 15). Xian will gather repo updates and refresh knowledge files.

**Standing staleness note:** At close of last session, four knowledge files were known stale (CLAUDE.md, README.md, ROADMAP.md, ROSTER.md — Calliope updated in repo). COORDINATION.md changes daily. After four days, assume all knowledge files may have drifted. Full freshness check pending when updates arrive.

## 15:09 — Research Assignment

Topic: Claude environment bridging — Claude for Mac, Cowork, Code capabilities, and how they relate to connecting Claude.ai Project content with Claude Code project folders.

Core question: Can Claude Code on Mac connect directly to a Claude Project (claude.ai)?

Starting point: xian received an answer suggesting third-party tools (ClaudeSync, VSCode extensions) and local workarounds. Torres article at producttalk.org has a comparison table of Claude environments.

Assignment: Investigate these ideas, map to Klatch goals — potential solution stack components, inspiration, alternatives, limitations. Initial research pass; second targeted pass after knowledge files are refreshed.

## 15:15 — Research: Claude Environment Bridging

### Sources consulted
- Torres article (producttalk.org) — detailed comparison table of Claude.ai / Projects / Desktop / Code
- ClaudeSync (GitHub: jahwag/ClaudeSync) — third-party Python tool for syncing local files to claude.ai Projects
- claudesync-vscode (GitHub: rexdotsh) — VS Code extension variant
- Anthropic's Cowork product page and blog post (claude.com)
- VentureBeat coverage of Cowork launch (Jan 2026) and Windows launch (Feb 2026)
- Simon Willison's first impressions of Cowork (Jan 2026)
- DataCamp Cowork tutorial (Jan 2026)
- Medium architecture analysis (Lanham, Feb 2026)
- GitHub issue #2511 on claude-code repo: feature request to connect Claude Code to Claude Projects
- klatch.ing main site (stale at v0.6; blog path returns 404)

### Key findings documented in conversation below.

## 15:50 — Research Report Drafted

See conversation for full initial analysis delivered to xian.

## 15:25 — Xian Follow-up Questions

**TOS question resolved:** Klatch has NO TOS exposure from ClaudeSync's approach. ClaudeSync scrapes session keys and uses undocumented claude.ai internal APIs — that's the risk. Klatch uses the public Anthropic API with a standard API key, and reads only local export files (JSONL, ZIP) the user already possesses. Clean separation. Imitating ClaudeSync's method would carry the same risk; monitoring for an official API from Anthropic is the right approach.

**Blog accessed:** Two posts live at klatch.ing/web/blog/. AXT post and newer wireframe-first design post. The wireframe post introduces significant terminology changes: "chat" for 1:1 conversations, "klatch" for multi-entity group channels. New `type` column in channels table. This is new since last session's knowledge files.

**Website staleness confirmed:** klatch.ing root serves v0.6 content. Blog section is current. Likely a divergence between web/index.html and the repo README, or a deployment issue.

## 15:35 — Memo to Calliope

Wrote memo flagging website staleness at klatch.ing. Specific issues: v0.6 feature list, two-person team section, outdated roadmap. Blog section healthy. Offered to verify content accuracy on updates.

## 16:27 — Knowledge Refresh (Partial — Direct File Read)

Search index still building. Read files directly from /mnt/project/. Major new material absorbed:

### Files read this session
- COORDINATION.md (current as of ~Mar 18)
- SIDEBAR.md (new — full sidebar design spec)
- datamodelthoughts.csv (27-row decision record mapping Klatch concepts across environments)
- PUBLISHING.md (new — blog publishing workflow)
- RELEASE-RUNBOOK.md (new — version/release process)
- README.md (updated to v0.8.6 with 5-layer prompt assembly)
- Daedalus log Mar 18 (v0.8.6 release, issues #8-14 resolved, 685 tests)
- Daedalus log Mar 16 (sidebar design session — chat/klatch terminology origin)
- Calliope log Mar 18 (wireframe-first blog post published)

### Key state changes since Mar 15
- **v0.8.6 released** (was v0.8.5). Sidebar redesign, 5-layer prompt architecture, project settings panel.
- **5-layer prompt assembly** confirmed: kit briefing → project instructions → project memory → channel addendum → entity prompt. Layer 3 (project memory) split from layer 2 (project instructions) — clean separation of structure vs. accumulated knowledge.
- **685 tests** (was 493 at my last session). 569 server + 116 client.
- **Chat/Klatch terminology** now official. channels.type discriminator implemented.
- **Sidebar design spec** complete (SIDEBAR.md). Project-first accordion, chats above klatches, unassigned section, controls at bottom.
- **Issues #8, #9, #11, #12, #13, #14 resolved.** Unified save patterns, entity panel simplification, prompt layer indicator, kit briefing acknowledgment.
- **Step 11 (Export to Claude Code)** added to roadmap — the cross-platform bridge feature.
- **PUBLISHING.md and RELEASE-RUNBOOK.md** — new operational docs. Blog publishing workflow formalized; release versioning protocol documented.
- **Blog post #2 live:** "You Can't Vibe Your Way to a Glossary" — wireframe-first design, introduces chat/klatch terminology, data model CSV as decision record.

### Data model CSV — critical for research task
The CSV maps 27 Klatch concepts across 5 environments (Claude.ai, Claude Code filesystem, Claude Code cloud, Klatch UI, implementation status). This is exactly the schema comparison Torres's table invited. Key observations:
- 14 rows marked ✅ (implemented)
- 7 rows marked ⏳ (partial/planned)
- 2 rows marked ⚠️ (partially implemented with caveats)
- Several rows flagged NOT SUPPORTED across Claude.ai and Claude Code columns — these are Klatch-native concepts (chat/klatch distinction, entity prompts, klatch topics)
- Project resources and file I/O are the major unimplemented areas

### Coordination status
- Argus: assigned Rounds 6-8 (project reassignment tests, sidebar tests, prompt assembly tests)
- Daedalus: available, next up is model provenance indicator or klatch creation UI
- Theseus: available, awaiting P1 fix for clean AXT re-test
- Ariadne: available (Klatch-native, lives in SQLite)

### Website status
- klatch.ing root: README, current at v0.8.6 ✅
- klatch.ing/web/: Calliope updated features, roadmap, team section today ✅
- Blog: two posts live, both accessible ✅
- Demo video: still v0.6.0 footage (known gap, low priority)

## 17:05 — Second Analysis: Environment Bridging Report

Wrote full analysis report (`environment-bridging-analysis.md`). Five sections:

**1. Torres Table vs. Klatch Data Model.** Aligned Torres's 5 dimensions against our 27-row CSV. Found our CSV is richer on prompt layering, import provenance, and the chat/klatch distinction but missing Torres's "portability" and "personalized shortcuts" dimensions. Recommended 4 new CSV rows.

**2. Five Environments Reassessed.** Mapped Claude.ai, Claude Code, Desktop, Cowork, and Agent Skills against Klatch's capabilities. Each environment has things Klatch doesn't (tool use, MCP, file I/O, browser automation) and lacks things Klatch has (multi-entity orchestration, 5-layer assembly, cross-environment import, visual prompt inspection).

**3. Strategic Opportunities.** Four identified:
- 3A: Step 11 (Export to Claude Code) — highest leverage. Klatch as "brain," Code as "hands."
- 3B: Cowork folder bridge — materialize project as a folder for Cowork to operate on.
- 3C: MCP as future integration surface — entity-level MCP configuration.
- 3D: Klatch as the missing "Project API" — positioning insight. We're building what GitHub #2511 asks Anthropic to build.

**4. Gaps and Watchlist.** Six gaps catalogued (file I/O, shortcuts, tool use, export, model provenance, project resources). Five external developments to monitor (Project API, Skills maturity, Cowork plugins, MCP growth, GitHub #2511).

**5. Blog relevance.** Three findings worth writing about publicly: unique 5-layer assembly, import/export as the community-requested bridge, Torres portability argument.

### Key insight from the analysis
Klatch's positioning is stronger than "a chat UI for the API." It's a **project context manager that unifies Claude's fragmented environments.** The 5-layer prompt assembly, the import pipeline, and the planned export (Step 11) together make it the bridge the community is asking Anthropic to build natively. This framing should inform the blog, the README's "Why" section, and any public messaging.

## 19:42 — Session Close

Xian approved the environment bridging analysis. Report will be shared with the team for roadmap integration.

**Deliverables this session:**
- Environment bridging research (initial pass + full analysis report)
- Memo to Calliope (website freshness — acted on same day)
- TOS analysis (Klatch is clean; ClaudeSync approach carries risk)
- Knowledge refresh from 15+ new project files (4 days of team activity absorbed)
- Session log

**Key output:** The positioning insight — Klatch as a project context manager unifying Claude's fragmented environments, not just a chat UI. This framing and the four recommended CSV additions should feed into roadmap planning.

**Standing items for next session:**
- Ask xian for fresh COORDINATION.md (it'll be stale again)
- AXT testing is coming — agents originating in this project will be tested
- Available for roadmap integration work based on the analysis
- Continue monitoring: Anthropic Project API, Agent Skills maturity, Cowork plugins, MCP ecosystem, GitHub #2511
