import type { Context } from 'hono';

/**
 * Headroom for the multipart envelope itself — boundaries, part headers, and
 * any sibling text fields — so a file of exactly the cap is never refused by a
 * *declared* size that includes the wrapper around it.
 *
 * Measured at **187 bytes** for a single-part 2 MB upload from Node's fetch
 * (`scripts/probe-import-multipart-cap.mts`, arm B). 1 MB is far more than any
 * realistic envelope, which is the point: being too small breaks the one
 * property this guard is required to have (below), while being too large only
 * means an already-doomed body gets buffered and then refused by the exact
 * check — which is exactly what happened before this guard existed.
 */
export const MULTIPART_ENVELOPE_ALLOWANCE = 1024 * 1024;

/**
 * Refuse an oversized multipart upload BEFORE the body is read.
 *
 * ## The property this guard must have, and why the rules below look timid
 *
 * **It can only ever reject earlier — never accept something that was
 * previously refused, and never refuse something that was previously accepted.**
 * Content-Length is a number the *client* chose, and it describes the envelope,
 * not the file. So every case where it might be lying, absent, or merely
 * imprecise falls through to the exact check that reads the file:
 *
 * - **Header absent** → fall through. (HTTP/1.1 chunked, and some clients.)
 * - **Not a finite positive number** → fall through rather than guess.
 * - **Within `MULTIPART_ENVELOPE_ALLOWANCE` of the cap** → fall through, because
 *   the declared number includes wrapper bytes the cap does not count.
 *
 * Which leaves exactly one case it acts on: a body whose own declared size is
 * unambiguously past the cap even after crediting the envelope. That one it
 * refuses without reading a byte.
 *
 * ## Why before the read and not after
 *
 * Measured 2026-09-04 (Round 151): `formData()` buffers the whole body first,
 * so a 70.3 MB upload refused by a handler-level size check still peaked at
 * 169.6 MB over baseline — and refusing it one check *earlier* in the same
 * handler peaked at 170.5 MB. Identical, because neither check is what does the
 * reading. Only a header check runs before the allocation.
 *
 * Measured again from the other side 2026-09-15 (Round 217, Theseus): on a
 * route with **no** pre-read check, a request declaring 200 MB and then sending
 * nothing gets **no response at all** — the server sits holding the socket open
 * waiting for bytes a client promised and never sent (`no response in 4004ms`).
 * The four capped sites answered the identical request immediately. So the cost
 * of not having this guard is not only memory; it is that the route stops
 * answering.
 *
 * ## This does not change what size is allowed
 *
 * The per-file check stays where it is and remains the authority — `file.size`
 * in `import.ts`, `validateFile()` in `files.ts`. This only stops us buffering
 * bodies that are already, unambiguously, too big.
 *
 * ## Why the message is a callback
 *
 * The two route families word their refusals differently and should keep doing
 * so: `import.ts` says `Maximum is 50MB.`, `files.ts` follows `storage.ts`'s
 * `Maximum is 10 MB.`, and a user only ever meets one of them — next to that
 * family's *other* sentences, which is what it has to agree with. Collapsing
 * them into one shared string would make this helper's sentence disagree with
 * the exact check sitting three lines below it at one of the two call sites.
 *
 * What must not be duplicated is the fall-through logic above, because every
 * one of those three rules is a correctness rule and a second copy is a second
 * thing to get wrong. Shared logic, per-family voice.
 *
 * Both callers pass a message that says **"uploaded"**, which the exact checks
 * deliberately omit — it is the one word distinguishing "your envelope declared
 * this much" from "the file you sent measured this much". Keep it.
 */
export function rejectOversizeBeforeRead(
  c: Context,
  maxBytes: number,
  formatMessage: (declaredBytes: number, maxBytes: number) => string
): Response | null {
  const raw = c.req.header('content-length');
  if (!raw) return null;
  const declared = Number(raw);
  if (!Number.isFinite(declared) || declared <= 0) return null;
  if (declared <= maxBytes + MULTIPART_ENVELOPE_ALLOWANCE) return null;
  return c.json({ error: formatMessage(declared, maxBytes) }, 400);
}
