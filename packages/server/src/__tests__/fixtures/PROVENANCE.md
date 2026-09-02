# Fixture provenance

Every `.jsonl` fixture in this directory records the Claude Code version it represents in
`provenance.json`, and `fixture-provenance.test.ts` fails if an entry is missing or if the
set has not been reviewed inside `reviewIntervalDays`.

## Why this file exists

On 2026-08-28 an audit found nine fabricated turns in seventy-five (12%) on a real
transcript, a `memories.json` path that returned empty on every real export, and three
declared artifact types that were never emitted. All of them had survived 100+ rounds of
building and testing.

The common cause was not carelessness. It was that **the fixtures encoded the format the
team intended rather than the format Claude Code emits**, and nothing made that visible.
Every fixture was hand-written in March 2026 against Claude Code 2.1.19/2.1.30. By August
the shipping version was ~2.1.251 — 220+ releases later — and the tests were still proving
that the parser handles a format nobody runs.

Meanwhile `exports/sessions/theseus-2026-03-22.jsonl`, a real 1,001-event capture, had been
committed to this repo since March and **no test had ever read it**.

Claude Code's transcript format is documented as internal and changing between versions
(`code.claude.com/docs/en/sessions`). Every observed change over the past year has been
*additive*, which a whitelist parser tolerates — and which a test suite pinned to an old
fixture cannot detect, because the new shapes simply never appear in it.

## The two things that guard against a repeat

1. **This manifest.** Staleness is now a failing test with a date on it, not something
   nobody happens to notice.
2. **The integrity receipt** (`ImportIntegrity`, returned on every import). You cannot write
   a regression test for an injection type that does not exist yet, but you can assert that
   the counts look sane, and make the numbers visible when they do not.

## Refreshing

Run `scripts/refresh-import-fixtures.sh` on a machine with a live `~/.claude/projects`.
It captures recent real sessions, reports what shapes they contain and which are new
relative to this manifest, and writes a redacted structural fixture. Then update
`lastReviewed` here.

**Do not delete the old fixtures when adding new ones.** They are the back-compat floor:
they prove that transcripts predating `permissionMode` still parse under the legacy
boundary test rather than emitting zero turns.

## A note on scratch files

Some tests write a temporary transcript into this directory and remove it in a `finally`
block. The manifest check ignores anything matching `temp-*` or `*-temp.jsonl` so a
leftover from a crashed run does not present as an undocumented fixture.

Those tests would be better using `os.tmpdir()` — a scratch file in the fixtures directory
is indistinguishable from a fixture until someone reads the code. Left as-is here because
changing them was outside the scope of the 2026-08-28 audit.
