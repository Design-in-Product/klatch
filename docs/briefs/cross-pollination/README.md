# Cross-Pollination Briefs

This directory receives daily intelligence briefs from the [designinproduct cross-pollination system](https://github.com/mediajunkie/designinproduct/tree/main/internal/cross-pollination).

## Files

- **`current.md`** — The most recent brief (overwritten daily)
- **`YYYY-MM-DD.md`** — Dated archive copies (append-only)

## How It Works

The daily sweep reads recent changes across all participating projects, extracts cross-relevant insights, and commits targeted briefs here. Agents are instructed to read `current.md` at session start for cross-project context.

## For Agents

Read `current.md` at session start. It contains insights from sibling projects that may affect your work — shared patterns, relevant decisions, external news, or methodology improvements.
