# PRE-REGISTRATION-C — unit-467rawjson arm C: then where IS the live-round population?

**Theseus, 2026-11-16 (START fire).** Pushed to `origin/main` **before `arm-rawjson-c.mjs` exists.**
Arm B is `8618e343`.

## §1 Why arm C exists — Q4's refutation has a mechanism, and it is mine

`Q4` predicted at least one of the six `-live` probes names an `/api/…messages` path in its own
source. **Refuted at 0.** An UNREGISTERED read of one member (recorded here as unregistered, before
the arm, so it carries no credit) shows why:

```
scripts/probe-round213-reassign-live-http.mts:75   const BASE = `http://127.0.0.1:${PORT}/api`;
scripts/probe-round213-reassign-live-http.mts:163  const res = await fetch(`${BASE}${pathname}`, {
```

**The path is assembled from a base constant and a variable.** The literal `/api/messages` never
appears, so a key on the literal finds nothing. That is my own item 3 (the 127 interpolated
literals) arriving as a blindness in a key I wrote ten minutes ago, in the same unit where arm A's
hand key had already been replaced for the same family of reason.

**And the second thing that read shows is worse for step 1.** Line 5 and lines 10-13 of that probe
say what `-live-http` means:

> `PATCH /api/channels/:channelId/entities/:entityId` … `app.request` on the real Hono app with a
> real (in-memory) database … `app.request` hands Hono a Request object that the test constructed.
> A socket hands it …

**`-live` there means a live SOCKET, not a live MODEL CALL.** Step 1 §2 wrote "the `-live` suffix on
all six is the relevant signal: these are the carried-context and layer-assembly rounds the ruling
was written about." For at least this member that sentence is **false about what the suffix means**,
and it was the sentence that made the six look like the ruling's subject.

## §2 The question arm C answers

If the 12 are scrubs, controls and fixtures (arm B), and the six own no model token (arm B), then
**which probes, if any, can cause a live model call?** The only remaining route in this corpus is
*through the product*: POST a message to a running server and let `packages/server/src/claude/client.ts`
call the SDK. So the key has to be a **message-POST route**, interpolation-tolerant, plus the
**key state of the environment the server is spawned with**.

Census over all 155 probe files, three readings, all over `stripSource(src, false)`:

- **route** — a `/messages`-shaped path segment, whether written whole or assembled: a `/messages`
  token inside any template literal or string, *not* requiring the `/api` prefix on the same literal.
- **spawn-with-key** — does the file spawn anything with `ANTHROPIC_API_KEY` set to `''`/deleted
  (scrubbed), or spawn without touching it (inherited, i.e. a real key if the fire has one)?
- **owns a call** — arm B's live-code `messages.create` test, re-run over all 155 rather than 12.

## §3 Predictions

**T1 — the `/messages` route key finds strictly more probes than the literal `/api/messages` key
did.** `>0` against arm B's 0 over the six, and reported over all 155. Low information on its own;
it is the precondition for T2-T4 meaning anything.

**T2 — at least one probe both names a `/messages` route AND spawns a server without scrubbing
`ANTHROPIC_API_KEY`.** That set is the live-round population candidate the ruling's writer would
have to hook. **If T2 is refuted at 0, the probe corpus contains no path to a live model call at
all**, and the raw-JSON ruling's producer is not in `scripts/probe-*` — it is the app, driven by
hand. That is the answer that changes the item, and I am registering it as the one I expect NOT to
see, because a corpus that scrubs the key in 9 of 12 places looks like one that scrubs it everywhere.

**T3 — `messages.create` in live code is absent from ALL 155, not just the 12.** The strong form.
If refuted, the member it finds is the seam, and arm B's "the `model` class is not the live-round
population" needs the stronger statement that the class *missed* a live caller.

**T4 — `DETECTORS.model` flags at least one probe that T2's route key does NOT, and vice versa.**
Two keys, two populations: if each finds members the other misses, the `model` class is not merely
over-broad, it is *misaligned* with the live-call question, and the next detector has to be the
route key rather than a widened token key.

## §4 RED conditions

- **U1.** The 155-file population arm C reads ≠ 155, or ≠ the instrument's own `population()` count.
- **U2.** `stripSource` throws on any member.
- **U3.** Arm C's re-run of arm B's live-`messages.create` test over the 12 disagrees with arm B's
  own answer for those 12. The wider census must reproduce the narrower one on the shared slice.
- **U4.** `git status --porcelain packages scripts docs/research/lib` non-empty.

## §5 Declared limits

1. **A route token is not a POST.** `/messages` appearing in a probe's source does not establish
   that it is posted to, nor that the server was up. Arm C reports a *candidate* population and says
   so; narrowing it to actual POSTs is a per-file read, not a key.
2. **"Spawns without scrubbing" is not "has a key."** Whether a real `ANTHROPIC_API_KEY` is in the
   environment is a property of the fire, not of the source. The census reports what the source does
   to the variable, which is the only part that is versioned.
3. **Still a source reading.** Nothing here executes a probe. Limits 1-3 of PRE-REGISTRATION.md
   stand unchanged, including that a live round cannot be run non-interactively.
4. Pin unchanged: `1f675ebf`.

— Theseus
