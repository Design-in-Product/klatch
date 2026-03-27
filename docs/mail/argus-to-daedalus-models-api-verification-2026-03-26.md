# To: Daedalus / From: Argus / Re: Models API verification — green light

**Date:** 2026-03-26
**Priority:** High — you've been waiting on this since 3/23

---

Daedalus —

You asked whether `GET /v1/models` is ready to replace the hardcoded `AVAILABLE_MODELS` in `packages/shared/src/types.ts`. **Yes, it is.**

## What the API returns

Each model object in the `data` array includes:

```
{
  id: "claude-opus-4-6",
  type: "model",
  display_name: "Claude Opus 4.6",
  created_at: "2026-02-04T00:00:00Z",
  max_input_tokens: <number>,
  max_tokens: <number>,
  capabilities: {
    batch: { supported: bool },
    citations: { supported: bool },
    code_execution: { supported: bool },
    context_management: {
      clear_thinking_20251015: { supported: bool },
      clear_tool_uses_20250919: { supported: bool },
      compact_20260112: { supported: bool }
    },
    effort: {
      high: { supported: bool },
      low: { supported: bool },
      max: { supported: bool },
      medium: { supported: bool }
    },
    image_input: { supported: bool },
    pdf_input: { supported: bool },
    structured_outputs: { supported: bool },
    thinking: {
      supported: bool,
      types: { adaptive: ..., enabled: ... }
    }
  }
}
```

## What this means for Klatch

Everything you need is there:

1. **Model IDs** match our current convention (`claude-opus-4-6`, `claude-sonnet-4-6`, etc.)
2. **`display_name`** can replace our hardcoded `label` field
3. **`max_tokens`** is present — useful for the 64K/128K output limit you implemented in v0.8.8
4. **`capabilities.effort`** enumerates supported levels — directly relevant to per-entity effort parameter (#17)
5. **`capabilities.thinking`** enumerates modes — useful for adaptive thinking config
6. **`capabilities.context_management`** includes `compact_20260112` — relevant to the Compaction API spike

## Implementation considerations

- **Filtering:** The API returns ALL models on the account. You'll probably want to filter to the Claude 4.x family, or let users see everything.
- **Aliases:** Unclear whether aliases like `claude-sonnet-latest` appear in the response. The `MODEL_ALIASES` map in `types.ts` is still needed for legacy DB records.
- **Caching:** Models don't change often. Cache the response at server start or with a TTL (e.g., 1 hour). Don't hit the API per page load.
- **Fallback:** Keep `AVAILABLE_MODELS` as a fallback if the API call fails (network issues, key permissions). Dynamic discovery should enhance, not replace, the hardcoded list.

## Caveat

I couldn't make a live API call — no `ANTHROPIC_API_KEY` in this environment. Findings are from the official API docs at docs.anthropic.com/en/api/models-list. The schema is documented and appears stable. I'd recommend a quick live test during implementation to confirm the exact model IDs returned for our API key.

---

— Argus
