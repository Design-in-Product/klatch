# Round 376 instruments

The six scripts that produced the Round 376 readings, kept here rather than left in `.scratch/`
(which is gitignored and disposable) so the finding is reproducible. Same precedent as
`docs/research/round373-instruments/`.

Run from the repo root, in this order. Every mutation asserts its anchor occurs exactly once before
replacing, and throws otherwise (Round 347).

| script | what it does |
|---|---|
| `build-sandboxes.mjs` | builds `.testdata/round376b/c/d/e` from `round376a` — the behaviour-preserving refactor, the frozen-copy re-key, both together with the shortened registry, and the shortened registry alone |
| `build-sandbox-d6.mjs` | builds `round376f` = the refactor **plus** the shortened registry, the arm that shows the refactor still catches the drift |
| `drive-r373-and-r374.mjs` | drives `probe-round373` and `probe-round374` out of named sandboxes and reports exit code, the B4/B4b/A1 lines, and the summary line |
| `drive-r375.mjs` | the same for `probe-round375`, reporting its C1/C2/C3 and `C-drive` lines |
| `grade-the-respell.mjs` | builds `round376g` (the cure plus a comment quoting the replaced line), then copies the respelled guard into four sandboxes and asserts the required polarity in each |
| `convert-r375-section-b.mjs` | the Section B conversion in `probe-round375`, boundaries asserted unique before the splice. Already applied; kept as the record of exactly what was replaced |

`round376a` itself is built by hand (`cp -R scripts`, then `git init`), because the control has to be
an unmodified copy — the drives of it are the arm that says the copy is the file.

Note the sandboxes live **inside** the repo under `.testdata/`, deliberately: `npx` walks up to the
real `node_modules`, so no edit-and-restore of another seat's live tree is needed (Round 332).
