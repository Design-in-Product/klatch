# unit-522 ADDENDUM — which of the 133 are real, registered before the post-hoc exists

**Registered after the arm's measuring drive (`98d750306418`) and before any line of
`posthoc-which-133.mjs` existed.**

## What the arm returned, and the two things it cannot settle

`UNIT-LABEL` measured **133** against a registered `[1, 6]` — **P1 REFUTED by a factor of twenty**
— and the reach figure **P10 REFUTED at 132** against `[1, 4]`. `CROSS-BYTE-CMP` **1**,
`LENGTH-TO-LENGTH` **1204** (P4 REFUTED, registered `[20, 400]`), `NO-COMPARISON` share **64.06%**
(P5b REFUTED, registered `[85, 99]`), total sites **14868** over **651** files.

Two predictions were registered OPEN precisely because the arm cannot settle them, and reading the
arm's own whole-line output shows a **third class I did not declare at all**:

```
docs/research/round420-instruments/drive-his-419.mjs:132   unit token: "B"
    const n = Math.max(A.length, B.length);
```

The `B` here is a **variable named `B`**, reached across a comma in **code position**. It is not a
unit label and `A.length` is not labelled as bytes. My `UNIT_TAIL` closer class admits `,` and
whitespace, so an identifier `B` in the next argument satisfies it. **An undifferentiated
containment match again — the second one in this unit, after `=>`.** The first was caught by a
planted KP before any census ran; this one was caught only by reading the whole lines the arm
printed, which is the entire reason the arm has no truncating display field.

## The discriminator, and why it is the module that was the wrong answer an hour ago

`scripts/lib/strip-source.mjs` blanks comment and (optionally) string bodies **preserving length**,
so a character's index survives the blanking. §2 of the pre-registration refused it for the census
because the unit label lives *inside* a string. For **separating** the classes it is exactly right:

- token position blanked by the **comments-only** pass → the site is **in a comment** (L1 prose).
- token position blanked only by the **strings** pass → the token is **inside a string or template
  literal** → a real unit label.
- token position **survives both** → the token is **code** → an identifier named `B`, the class
  above.

> The same shared reader is the wrong answer to one question in this unit and the right answer to
> the next one, four sections apart. Argus's and Daedalus's standing lesson is "check `scripts/lib`
> before hand-rolling"; this unit adds that *which* question you are asking decides whether the
> lib's answer is the right one, and the module does not know which you asked.

## Predictions

| # | Claim | Interval |
|---|---|---|
| **PH1** | `IDENT-IN-CODE` false positives among the 133 — the `B`-as-variable class | `[2, 25]` |
| **PH2** | `IN-COMMENT` (L1 prose) sites among the 133 | `[0, 5]` |
| **PH3** | `LABEL-IN-STRING` — real unit labels, the corrected census figure | `[100, 131]` |
| **PH4** | distinct FILES holding a real unit label | `[30, 90]` |
| **PH5** | `unit-520`'s own site (`posthoc-whose-plants.mjs:37`) is **1** of the real labels — the host is a member of its own census | exactly 1 |
| **PH6** | the `B` / `bytes` / `byte` split among real labels: `B` share, percent | `[25, 75]` |
| **PH7** | **KP, both directions, before the figures are published:** a planted `${s.length} B` inside a template keys `LABEL-IN-STRING`; a planted `Math.max(A.length, B.length)` keys `IDENT-IN-CODE`; a planted `// ${x.length} bytes` keys `IN-COMMENT`. | 3 of 3 |
| **PH8** | **The Buffer question, and it is a limit not a figure.** A `Buffer`'s `.length` genuinely **is** bytes, so a correct `B` label exists. Whether a given subject is a Buffer is **not decidable from the site's line** — registered as a named residual, resolved by hand-reading the printed subject names, not by the reader. | RESIDUAL |

## What this addendum does not claim

PH3 is a **corrected census**, not a defect count. A real unit label on a string read with
`encoding: 'utf8'` is a **latent** mislabel: it agrees with `wc -c` on pure-ASCII content and
disagrees the moment a dash is typed, which is how `unit-520` §7 found its own. Whether any given
site's content is ASCII at runtime is **not** a source question, and this unit does not pretend to
answer it. **L3 of the pre-registration still stands and is still unmeasured**: a byte figure held
in a plainly-named variable is unreachable for `CROSS-BYTE-CMP`, and that is the form the original
defect actually took at the shell.
