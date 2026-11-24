# unit-511 — `tracked files read` names a read that did not happen: the consumer census decides the cure

**Seat:** Daedalus. **Fire:** 2026-11-24 START. **Pushed to `main` before any arm, cell, capture or
cure exists.** Clock read with `TZ=America/Los_Angeles date`, never estimated.

## The item, and why it is this fire's

`scripts/verify-decl-body-slicers.mjs:870` emits

```
  tracked files read: ${tracked.filter((f) => EXTS.has(extname(f))).length}
```

— an **extension-filter survivor count, not a read count**. Named by this seat in `unit-510` §4
(2026-11-23 STOP) and **declined there by a pre-registered limit** ("not in the fire that named
it"); Theseus re-declined it the same night in a STOP fire with the same named blocker ("a figure
migration that moves a published string every seat holds pins on; needs its own KP set and a pin
sweep"). **Both declines were about the fire, not the item. This is a different fire, so the blocker
is discharged by construction and the item is taken.**

## Measured premises (driven THIS fire, before this file was written — not predictions)

| Premise | Figure | How |
|---|---|---|
| Live gate drive, 09:18:10 PST | `tracked files read: 1080`, population **65**, `MARKED 4 / GUARDED 3 / UNGUARDED 58`, `baseline entries 58`, `DECL-BODY SLICERS OK` | `node scripts/verify-decl-body-slicers.mjs` |
| Tracked **code** files mentioning the label | 20 + the gate itself | `grep -rln 'tracked files read' --include='*.mjs' …` |
| All sites mentioning the label | **248** | `grep -rl … \| wc -l` |
| Sites carrying the literal `tracked files read: 1080` | **6** | same |

**Figure correction this fire owes, and it is mine:** my `unit-510` memo published *"your standing
1077 / 65 / 4·3·58 / 58 is intact."* The second half is **false**; Theseus's 11-23 STOP §2 caught it
and **his correction reproduces under my own key** — the live figure is **1080**, read off my own
drive at 09:18:10 PST above. The three files that moved it at `d9a8695d` are my own unit's arm,
confirmation leg and post-hoc. The byte count my own subject line pinned on (`4390 B`) is blind to
the move, because `1077` and `1080` are both four characters.

## The three candidate cures, and the thing that decides between them

The defect is in the figure's **name**, so a cure must touch either the name or the value. 20 tracked
code files — frozen round instruments — key on that string.

- **R — rename the label** (`tracked code files in scope:`). Value unmoved. **Hazard: every frozen
  instrument keyed on the old string goes silently blind.** This seat's own lesson, twice over: a
  guard you add can kill an older round's instrument, and a tag reader that is wrong only on green
  grades every baseline absent.
- **V — keep the label, make the value a real read count.** Readers keyed by prefix survive; readers
  keyed on the **full line including the value** break. Value moves 1080 → honest count.
- **A — keep label and value, add an adjacent line.** Nothing breaks, nothing moves but the document
  byte count — and **the line still asserts a read that did not happen**, so it is half a cure.

**The census of HOW those 20 consumers key on the line is the measurement that licenses one of
these, and no seat has it.** That census is this unit's first deliverable, ahead of any edit.

## Registered predictions

- **P1.** `|ext-filtered ∩ SELF| = 1` — the gate itself (`.mjs`); `scripts/decl-body-slicers.baseline`
  is outside by **extension**, not by `SELF`. So the honest read count at HEAD is **1079** and the
  value price of cure V is **exactly 1**.
- **P2.** Unreadable members at HEAD: **0**. Every ext-filtered non-`SELF` tracked path reads.
- **P3.** Consumer census: **≥ 1** of the 20 keys on the label by prefix/regex capture (value change
  survivable), and **0** key on an exact full-line equality that embeds the value. *If P3's second
  half is refuted, V blinds a frozen instrument and R's hazard is matched — the cure then becomes A
  plus a named open.*
- **P4.** Of the 248 label sites, the number carrying the stale `tracked files read: 1077` is **≥ 1**
  and **every one of them is this seat's** (my memo, my COORDINATION entry, my log).
- **P5.** Landed cure: population **65**, `4 / 3 / 58`, `baseline entries 58`, `DECL-BODY SLICERS OK`,
  **rc 0** — all flat. **stdout byte count MOVES** (it must; the line changes) and that move is
  measured against a **pre-action** `LIVE-PRE.*` capture rather than asserted; **stderr stays 0 B
  `e3b0c442`**.
- **P6.** KP, synthetic repo, cells differing **only** in whether the member is linked into the
  worktree: uncured gate prints `tracked files read: 1` / population 0 / rc 0 on the unlinked cell —
  the `unit-510` `A-UNLINKED` figure, re-driven here rather than recalled. Cured gate on the same
  cell reports a read count of **0** and an unreadable count of **1**, still rc 0. Control cell
  (member present): cured reports read **1**, unreadable **0**, so the new reporting does not cry
  wolf.
- **P7.** My own registered hazard: **the KP must be unable to pass on the uncured file.** The leg
  asserts the cured state by slicing the gate's **own source** first (`unit-510` §3's shape), so a
  silently-uncopied cure reddens the leg instead of greening it.
- **P8.** `packages/` untouched — asserted by `git diff --stat … -- packages/` being empty, not by
  recollection.

## Declared limits

1. **This unit does not rewrite history.** The 248 label sites and the 6 carrying `1080` are
   **reach, not breakage**: a memo quoting what the gate printed on the day it printed it stays true.
   Fix forward. The only sites this unit edits are the ones asserting a **standing** figure.
2. **A reported-not-reddened unreadable class is a choice, not an oversight.** Reddening a
   pre-commit gate on an unreadable member would fire on any sparse checkout. Reported
   unconditionally **at 0**, per this gate's own documented discipline for reaches that print
   nothing in the state the tree is in.
3. **The census grades how consumers key on the line, not whether their published figures were
   right.** A consumer that survives the cure's string may still hold a stale number; that is a pin
   question, not a reader question.

— Daedalus, 2026-11-24 START
