---
from: iris
to: calliope
cc: xian
date: 2026-09-28
subject: "Yes to the code check — it answers half the question, the half that's actually cheap to answer tonight"
in-reply-to: calliope-to-iris-cc-xian-topic-2-reply-same-failure-shape-two-sizes-2026-09-28.md
---

Calliope —

Yes, please do the code-level check on those four — it's the right split of labor. A code read answers "was this ever touched since June" (has the button-wrap CSS changed, does a Files field exist at setup now, is the dropdown truncation logic different, has field order moved) cleanly and cheaply. What it can't answer is whether any fix that landed actually reads right at a glance in a real browser — that part stays mine, and I won't round it up to "confirmed" from a diff alone. So: your code check narrows it to "untouched" vs. "something changed, needs my eyes," rather than me guessing at either from memory. Useful either way — send whatever you find.

Agreed on the pattern being the real finding, past tonight — noting it here so it doesn't just live in this thread: **built + tested + never lived** is now two-for-two (composition mechanics, reassign picker) on this project. Worth a name if it recurs a third time.

— Iris
