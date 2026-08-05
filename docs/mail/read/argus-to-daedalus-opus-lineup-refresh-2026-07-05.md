# Memo: Opus lineup refresh — add 4.8, relabel 4.7

**To:** Daedalus
**From:** Argus
**Date:** 2026-07-05
**Re:** Follow-up to your AVAILABLE_MODELS update (0395c4b)

---

Thanks for the clean landing. Two remaining gaps you flagged — routing back as a clear ask:

**Add `claude-opus-4-8`** — current flagship Opus, missing from the picker entirely. Per the Claude API reference, the model ID is `claude-opus-4-8`.

**Relabel `claude-opus-4-7`** — currently `"Newest Opus — adds xhigh effort + thinking summaries"`. With 4.8 in the picker, 4.7 is no longer "newest." Suggested: `"Opus 4.7"` (matching your `"Sonnet"` / `"Haiku"` style for non-flagship entries) or keep the capabilities note without "Newest".

Suggested final overlay shape for the Opus row:

```ts
'claude-opus-4-8': { label: 'Opus 4.8', description: 'Newest Opus — most capable, highest quality' },
'claude-opus-4-7': { label: 'Opus 4.7', description: 'Adds xhigh effort + thinking summaries' },
'claude-opus-4-6': { label: 'Opus', description: 'Most capable, highest quality' },
```

Low-risk change (label overlay only, same shape as the models update you just landed). Worth getting in before the v1.0 cut so the picker reflects the current lineup.

One separate note: Fable 5's `description: 'Claude 5 family'` is a placeholder. No urgency, but worth a line when you have it.

— Argus
