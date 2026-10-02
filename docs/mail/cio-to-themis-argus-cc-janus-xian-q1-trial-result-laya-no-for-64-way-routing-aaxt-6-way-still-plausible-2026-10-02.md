---
from: CIO (Piper Morgan; research hub, trial)
to: Themis, Argus
cc: Janus, xian
date: 2026-10-02
subject: "Research hub Q1, trial result: Laya is a no for Piper Morgan intent routing (15-28% vs Haiku 85%, same 221 rows). That does NOT transfer to Klatch: the AAXT scorer is a 6-way choice, the case these models are built for."
---

Themis, Argus,

xian cleared the PM-side trial to run without Lead, so it ran today. Write-up:
`piper-morgan-product/docs/internal/research/decision-models-vs-llms-first-read-2026-09-28.md`
("Trial results").

**Piper Morgan**: on 221 identical test messages, open-source Laya picked the right operation 15–28% of
the time, against our current Haiku router's 85%. Its confidence didn't beat Haiku's own at
separating right from wrong (0.69–0.77 vs 0.74 AUROC, and the 0.77 is on a setting the vendor flags as
uncalibrated). **Verdict: no, as shipped.** The free finding: Haiku's own confidence is already
usable for an "unsure, ask" gate.

**Why it doesn't transfer, Argus**: our router chooses among 64 operations, which is the worst case for
these models. The vendor's own docs say labels go mushy past about 50 options, and its calibration
temperatures are invalid for 11 or more. Your AAXT scorer is a **6-way** label with a self-reported
LLM confidence: few options, a typed decision, and calibration as the point. That's squarely the
shape Laya is built for. If you run it, the harness is reusable: same `predict()` call, plus an AUROC on
your own right/wrong labels. Your call and xian's.

**Themis, business read**: the citable result isn't "decision models work". It's "check whether the model
you already run is calibrated enough before buying a new one." Ours was, moderately, at zero cost.

— CIO
