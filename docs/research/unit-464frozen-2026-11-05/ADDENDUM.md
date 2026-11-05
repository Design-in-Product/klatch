# unit-464frozen — ADDENDUM: four more arms, registered after drive3 and before drive4

**Registered by:** Theseus · **2026-11-05, WORK fire** · model Opus 5

Registered **after** `drive1`/`drive2`/`drive3` and `probe-notes`, **before** `drive4-anchor.mjs`
exists. Pushed to `main` before that driver is written. What prompted it:

1. **`A7DOC` hit its registered cell `{GENTRY}` for a reason other than the one I registered.** I
   registered it as *"one digit inside the §2.1g span — declared as a reproduction of his
   `A1FIGURE`."* The first digit inside the span is the `2` in the span's own **start anchor**
   (`### 2.1g`), so the mutation renamed the heading. It is a **rename arm I mislabelled**, not a
   reproduction of his figure-edit arm. The registered `FAILED` reason (`FROZEN` in the list) also
   held — `FAILED: SHAPE, FROZEN` — so the cell is a genuine HIT, for a second reason I had not
   registered. Recorded here rather than re-cut. [[feedback_a_hand_typed_kp_is_not_a_slice]]
2. **What that arm exposed.** With the heading renamed, the repaired leg did **not** report
   `start anchor absent`. `text.indexOf('### 2.1g')` found the **next** occurrence of the literal and
   reported `SPAN: §2.1g → ### 2.1a …, 5106 bytes`, with `BLOCK: MEASURED-BLOCK-V15 found in the
   span` — on a span made of **prose that quotes those tokens**.
3. **Measured, across revs, before registering (declared):** occurrences of the literal `### 2.1g` in
   `LEG-CLASS-CONVENTION.md` — `5ba1af73` (`PIN`) **0**, `a3607d5a` (`ENTRY_REV`, the frozen baseline)
   **1**, `b785c227` (one commit before §2.1p) **1**, `5875315a` (§2.1p lands) **4**, `HEAD` **4**.
   Line-start headings: **1** at every rev that has any. The three new occurrences are all inside
   `## Part B — the GENTRY leg, repaired` — **the entry written this fire to document the repair.**

So the anchor was unique at every rev the repaired leg had to read, until the repair's own write-up
quoted it three times. Today it still resolves to the heading only because the heading has the lower
byte offset (35262 < 96114).

## Registered predictions — conjunct level, because the RED set is `{GENTRY}` for three of four

| # | Arm | Mutation | Predicted |
|---|-----|----------|-----------|
| P12 | **A8FIGURE** | first digit **after the heading line** (inside the entry body) | `{GENTRY}`, `FAILED: FROZEN` **only**; `SPAN` ok, `SHAPE` 2 headings, `BLOCK` ok, `HIST` ok. This is the actual reproduction of his `A1FIGURE`. |
| P13 | **A9RENAME** | heading `### 2.1g ` → `### 2.1G ` (one byte, case) | `{GENTRY}`, `FAILED: SHAPE, FROZEN`; `SPAN` **ok** and **not** `start anchor absent`, reporting the relocated span at byte **96114**, **5106** bytes, end `### 2.1a`; `BLOCK` **ok** off prose |
| P14 | **A10TAILONLY** | delete `## Part B — the GENTRY leg, repaired` and everything to the end of document | **`∅`** — the three prose occurrences are inert while the heading is present |
| P15 | **A11BOTH** | A9RENAME **and** A10TAILONLY together | `{GENTRY}` with `SPAN` reporting **`start anchor absent: ### 2.1g`** — the refusal A9RENAME should have given |

**P14 and P15 are the isolation pair for P13.** P13 alone cannot distinguish "the leg relocated to a
second occurrence" from "the leg mis-slices a renamed heading somehow." P14 shows the second
occurrence is unreachable while the first is present; P15 shows the leg refuses correctly once the
second occurrence is gone. Together they key the behaviour on **occurrence count**, which is the
variable I am claiming. [[topic_cripples_and_counterfactuals]]

If **P14 lands `{GENTRY}`**, deleting the tail moves the span and my "inert" claim is refuted.
If **P15's `SPAN` is anything but a refusal**, the cause is not the second occurrence and P13's
reading is refuted — I will report that, not re-cut.

**Not claimed here:** that this is reachable in normal use. The heading is append-only under §2.1e and
nobody renames it. The claim is about the **predicate**, which keys on first-match over the whole
document in a document that quotes its own anchors — and about the **note**, which says it found
`§2.1g` when §2.1g is not what it found.

— Theseus
