/**
 * Round 89 — the `opaque` count that `--all-tracked` prints about its own reach, and the
 * control without which that count is the thing it was added to prevent.
 *
 * Theseus's Round 88 §5.1 asked for the count; the argument for it is the one I made for the
 * `unparsed` bucket in Round 87, one level out. `measure-marker-floor.mjs --all-tracked` reads
 * every tracked file's bytes and used to print "nothing tracked is outside it" — a sentence no
 * measurement could contradict. Four tracked files hold DEFLATE-compressed text, contribute
 * nothing to the scan, and read zero in all five categories. In the printout that zero was
 * indistinguishable from a clean-corpus zero.
 *
 * **Why the count needs a test and not just a run.** `opaque` is now a number that can move,
 * which means it can also rot to 0 and look like good news — the exact failure mode
 * `REACHABLE_R54` had, and the reason `round85-marker-floor.test.ts` exists at all. A detector
 * nothing currently trips is indistinguishable from a detector nothing *can* trip, so the
 * containers below are constructed here rather than read from the repo.
 *
 * Constructed, not pasted, and assembled from `RECALL_MARKER_PHRASES` for the reason every
 * control on this arm is: a pasted marker drifts with the build and would certify a stale
 * detector as healthy.
 */

import { describe, it, expect } from 'vitest';
import { deflateRawSync, gzipSync } from 'zlib';
import { RECALL_MARKER_PHRASES } from '../claude/recall.js';
import { CARRIED_CONTEXT_MAX_MESSAGE_CHARS } from '../claude/carried-context.js';
import { readFileSync } from 'fs';
import { join } from 'path';
// @ts-expect-error — plain ESM helper shared with scripts/, no types by design
import { buildRecogniser } from '../../../../scripts/lib/recall-recogniser.mjs';
// @ts-expect-error — same
import { buildFloorClassifier } from '../../../../scripts/lib/marker-floor.mjs';
// @ts-expect-error — same
import { classifyContainer, decodesLosslessly } from '../../../../scripts/lib/opaque-container.mjs';

const P = RECALL_MARKER_PHRASES;
const { patterns } = buildRecogniser(P);
const { classify } = buildFloorClassifier(P, CARRIED_CONTEXT_MAX_MESSAGE_CHARS, patterns);

/** A marker by construction rather than by transcription. */
const wellFormed =
  `${P.open}2${P.interiorPrefix}${P.interiorPhrase}${P.interiorSuffix}${P.close}`;

/**
 * Build a single-entry zip by hand, so the control depends on no packaging library.
 *
 * `method` is the only variable that matters here: 8 (deflate) must read opaque, 0 (stored)
 * must not, and the difference is the whole reason the detector walks local file headers
 * instead of trusting the `PK\x03\x04` magic. `research/claude-export-format-analysis.docx`
 * is a real mixed case — 22 entries, 4 stored — so "is a zip" and "is unreadable" genuinely
 * are different questions.
 *
 * Only the local file header and entry data are emitted. The detector walks from offset 0 and
 * stops when the signature no longer matches, so a central directory would be inert; leaving
 * it out keeps the control readable and tests the path that actually runs.
 */
function zipEntry(name: string, content: string, method: 0 | 8): Buffer {
  const raw = Buffer.from(content, 'utf8');
  const data = method === 8 ? deflateRawSync(raw) : raw;
  const nameBuf = Buffer.from(name, 'utf8');
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0); // local file header signature
  header.writeUInt16LE(20, 4); // version needed
  header.writeUInt16LE(0, 6); // flags — bit 3 clear, so sizes live here
  header.writeUInt16LE(method, 8);
  header.writeUInt32LE(0, 14); // crc32 — never read by the detector
  header.writeUInt32LE(data.length, 18); // compressed size: how it finds the next header
  header.writeUInt32LE(raw.length, 22);
  header.writeUInt16LE(nameBuf.length, 26);
  header.writeUInt16LE(0, 28); // extra length
  return Buffer.concat([header, nameBuf, data]);
}

describe('opaque containers — what --all-tracked does not read', () => {
  it('flags a DEFLATE zip as opaque and a stored-only zip as readable', () => {
    const deflated = classifyContainer(zipEntry('conv.json', wellFormed, 8));
    expect(deflated).toMatchObject({ opaque: true, kind: 'zip', entries: 1, compressed: 1 });

    // Same magic bytes, same structure, text in the clear. If this ever reports opaque, the
    // detector has degraded to the extension-list-by-another-name that Round 88 §5.1 ruled out.
    const stored = classifyContainer(zipEntry('conv.json', wellFormed, 0));
    expect(stored).toMatchObject({ opaque: false, kind: 'zip', entries: 1, compressed: 0 });
  });

  it('counts entries across a multi-entry mixed zip, as the tracked .docx is', () => {
    const mixed = Buffer.concat([
      zipEntry('word/', '', 0),
      zipEntry('word/document.xml', wellFormed, 8),
      zipEntry('docProps/', '', 0),
    ]);
    expect(classifyContainer(mixed)).toMatchObject({
      opaque: true, entries: 3, compressed: 1, complete: true,
    });
  });

  it('treats gzip as opaque without a walk, and plain text as plain', () => {
    expect(classifyContainer(gzipSync(Buffer.from(wellFormed)))).toMatchObject({
      opaque: true, kind: 'gzip',
    });
    expect(classifyContainer(Buffer.from(`prose around ${wellFormed} and after`))).toMatchObject({
      opaque: false, kind: 'plain',
    });
  });

  /**
   * The load-bearing one: this is what the `opaque` count is *asserting about the corpus*.
   *
   * A whole marker, compressed, is not merely harder to find — it is not present in the bytes
   * as a substring at all, so every one of the five categories reads zero and the cheapest
   * possible detector (`line.includes(P.open)`) never fires. That is why an opaque file's five
   * zeros cannot be reported as a clean-corpus result.
   */
  it('a marker inside a DEFLATE entry is absent from the bytes, not merely unread', () => {
    const zip = zipEntry('conversations/conv.json', `{"text": "${wellFormed}"}`, 8);
    const asText = zip.toString('utf8');

    expect(asText.includes(P.open)).toBe(false);
    const counts = classify(asText);
    for (const bucket of ['read', 'severed', 'unparsed', 'embedded', 'residue']) {
      expect(counts[bucket]).toBe(0);
    }

    // Uncompressed, the identical bytes land in `embedded` — JSON quotes the value, so the
    // opener sits past column zero with its close on the line. Same marker, same wrapper, and
    // the only difference is the compression method. Without this half, the zeros above would
    // be consistent with the marker simply never having been there.
    const stored = zipEntry('conversations/conv.json', `{"text": "${wellFormed}"}`, 0);
    expect(classify(stored.toString('utf8')).embedded).toBe(1);
  });

  /**
   * Round 88 §4 named `round17-compaction-effort.test.ts` "a tracked source file whose bytes are
   * not valid UTF-8". They are valid; the file carries three literal U+FFFD characters inside
   * comment rules, a scar from an earlier lossy edit. A U+FFFD-presence check cannot tell the
   * two apart and a byte round-trip can, which is why `decodesLosslessly` is written the way it
   * is. Asserted against the real tracked file, because the claim was about that file.
   */
  it('distinguishes a literal U+FFFD from a lossy decode', () => {
    const scarred = join(__dirname, 'round17-compaction-effort.test.ts');
    const buf = readFileSync(scarred);
    expect(buf.toString('utf8')).toContain('�');
    expect(decodesLosslessly(buf, buf.toString('utf8'))).toBe(true);

    // Genuinely invalid: a lone continuation byte. Decodes to U+FFFD, which re-encodes to three
    // bytes, so the round-trip catches it.
    const invalid = Buffer.from([0x68, 0x69, 0x80]);
    expect(decodesLosslessly(invalid, invalid.toString('utf8'))).toBe(false);
  });

  /**
   * The two shipped claude-ai fixtures are driven through `claude-ai-zip.ts` into
   * `messages.content` rows by `claude-ai-import.test.ts` — a real corpus that `--all-tracked`
   * cannot see. If either is ever rewritten with stored entries this expectation flips, which
   * is the correct outcome: the coverage gap really would have closed and the count should say so.
   */
  it('the tracked claude-ai fixtures are opaque to a byte scan', () => {
    const dir = join(__dirname, 'fixtures', 'claude-ai');
    for (const name of ['test-export.zip', 'test-tools-export.zip']) {
      const buf = readFileSync(join(dir, name));
      expect(classifyContainer(buf).opaque).toBe(true);
    }
  });
});
