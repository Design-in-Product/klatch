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
   * The floor branch, added by Theseus in Round 90 because a mutation check found it uncovered.
   *
   * Deleting the flag-bit-3 guard from `walkZipEntries` left all six assertions above green while
   * changing the answer on a real tracked file: `research/1f171719-….jsonl.zip` goes
   * `complete: false` → `complete: true`, which is Round 89 §2's `1/1+` silently becoming `1/1`.
   * A floor reported as a total is the same over-claim as "nothing tracked is outside it" —
   * the sentence this whole module exists to replace — so the branch that keeps it a floor needs
   * an assertion and not just a comment.
   *
   * Bit 3 means the entry's sizes live in a trailing data descriptor, not the header, so the
   * next header's offset is unknowable from here. The walk must stop and say so. Two entries are
   * written and the walk must report ONE: that gap is the point, and asserting the count is a
   * floor rather than a total is what distinguishes stopping from finishing.
   */
  it('reports a floor, not a total, when an entry defers its sizes to a data descriptor', () => {
    const deferred = zipEntry('conversations/conv.json', wellFormed, 8);
    deferred.writeUInt16LE(0x08, 6); // flag bit 3
    deferred.writeUInt32LE(0, 18); // sizes are in the descriptor now, so the header lies
    deferred.writeUInt32LE(0, 22);

    const twoEntries = Buffer.concat([deferred, zipEntry('conversations/b.json', wellFormed, 0)]);
    const seen = classifyContainer(twoEntries);

    expect(seen).toMatchObject({ opaque: true, kind: 'zip', complete: false });
    // The buffer holds two entries; the walk can only vouch for the one it read past.
    expect(seen.entries).toBe(1);
    expect(seen.compressed).toBe(1);

    // One compressed entry already settles opacity, which is why stopping early is safe here
    // and would not be if `opaque` depended on the entries the walk never reached.
    expect(classifyContainer(twoEntries).opaque).toBe(true);
  });

  /**
   * Round 91 — the guard above, pinned on the field it actually protects.
   *
   * Making `complete` a positive check (Round 91: the walk finished only if it consumed the
   * buffer exactly or stopped on the central directory) would have quietly un-killed Theseus's
   * M5. Deleting the bit-3 guard makes the walk land mid-data, and under the new rule that is
   * *itself* `complete: false` — so mutant and real agree on `complete` and the control above
   * passes on both. I measured that before landing the rule rather than after.
   *
   * What the guard prevents is not the stop, it is the stumble. Compressed data can contain a
   * well-formed local file header; the unguarded walk lands on whatever is at
   * `30 + nameLen + extraLen + 0` and counts it. Here that is a planted header, so the guarded
   * walk reports 1 entry and the unguarded one reports 2 — and then claims it finished, because
   * it consumed the planted entry's declared size exactly. The distinguishing field is
   * `entries`, so that is what this asserts.
   *
   * Built by hand rather than with `zipEntry` because the point is a header sitting where entry
   * data belongs, which that helper cannot express.
   */
  it('does not count a header planted in an entry it was told not to read past', () => {
    const localHeader = (name: string, method: 0 | 8, compressedSize: number): Buffer => {
      const nameBuf = Buffer.from(name, 'utf8');
      const h = Buffer.alloc(30);
      h.writeUInt32LE(0x04034b50, 0);
      h.writeUInt16LE(20, 4);
      h.writeUInt16LE(0, 6);
      h.writeUInt16LE(method, 8);
      h.writeUInt32LE(compressedSize, 18);
      h.writeUInt32LE(compressedSize, 22);
      h.writeUInt16LE(nameBuf.length, 26);
      h.writeUInt16LE(0, 28);
      return Buffer.concat([h, nameBuf]);
    };

    const payload = deflateRawSync(Buffer.from(wellFormed, 'utf8'));
    const deferred = localHeader('a.json', 8, 0); // bit 3 set below; sizes zeroed as the format requires
    deferred.writeUInt16LE(0x08, 6);

    // `deferred`'s data begins with a header the walk must never reach.
    const withPlant = Buffer.concat([deferred, localHeader('planted.json', 8, payload.length), payload]);
    const seen = classifyContainer(withPlant);

    // One entry, not two: the guard stopped the walk before the plant.
    expect(seen.entries).toBe(1);
    expect(seen.compressed).toBe(1);
    expect(seen.complete).toBe(false);
  });

  /**
   * Round 91 — bit 3 was not the only way to not know the next offset, and this one moves
   * `opaque` rather than just `complete`.
   *
   * zip64 writes `0xFFFFFFFF` into the 32-bit size fields and puts the real value in the extra
   * field. Believing the 32-bit field sends the walk past the end of the buffer; before Round 91
   * the loop condition then failed and the walk called that finished. The second case is the one
   * that pays for the fix: when the sentinel sits on a *stored* first entry — and the tracked
   * `.docx` carries four stored directory records, so this is not an invented shape — the walk
   * returned `compressed: 0` and therefore `opaque: false` for an archive whose text it never
   * reached. That is exactly the unfalsifiable zero the module was written to stop printing,
   * rebuilt inside the module.
   */
  it('treats a zip64 sentinel size as a stop, not as a size', () => {
    const sentinel = (buf: Buffer): Buffer => {
      buf.writeUInt32LE(0xffffffff, 18);
      buf.writeUInt32LE(0xffffffff, 22);
      return buf;
    };

    // Deflated first entry: `opaque` was already true, so only the over-claim moves.
    const deflatedFirst = Buffer.concat([
      sentinel(zipEntry('a.json', wellFormed, 8)),
      zipEntry('b.json', wellFormed, 8),
    ]);
    expect(classifyContainer(deflatedFirst)).toMatchObject({
      opaque: true,
      kind: 'zip',
      entries: 1,
      complete: false,
    });

    // Stored first entry: the walk sees no compressed entry and must not report that as a
    // finding. `opaque: false` with `complete: false` is indeterminate, and
    // `measure-marker-floor.mjs` buckets it apart from the files it actually read.
    const storedFirst = Buffer.concat([
      sentinel(zipEntry('word/', '', 0)),
      zipEntry('word/document.xml', wellFormed, 8),
    ]);
    const seen = classifyContainer(storedFirst);
    expect(seen).toMatchObject({ opaque: false, kind: 'zip', compressed: 0 });
    expect(seen.complete).toBe(false);
  });

  /**
   * Round 91 — a truncated tail is a stop too. Three bytes are too few to identify as anything,
   * and calling that "finished" is the same over-claim in its smallest form.
   */
  it('does not call a truncated tail a finished walk', () => {
    const truncated = Buffer.concat([zipEntry('a.json', wellFormed, 8), Buffer.from([0x50, 0x4b, 0x03])]);
    expect(classifyContainer(truncated)).toMatchObject({ opaque: true, entries: 1, complete: false });
  });

  /**
   * Round 91 — landing on a signature that is neither a header nor a terminator.
   *
   * The Round 91 mutation matrix found this uncovered: replacing the final signature test with
   * a bare `complete: true` (or with `sig !== 0`, i.e. "anything that isn't padding ends an
   * archive") left every other assertion in this file green. Reaching that line at all requires
   * the walk to stop mid-buffer with four or more bytes in hand, and until this control nothing
   * did — the truncated case above stops three bytes short, and the central-directory case
   * below hits a real terminator.
   *
   * This is also the mid-data landing in its own right, which is how M5 failed before the guard
   * existed: an entry that under-declares its compressed size sends the walk into the middle of
   * its own payload. `0x5a5a5a5a` is deliberately non-zero, so a rule of "any signature ends
   * the archive" fails here rather than passing by accident.
   */
  it('does not accept an arbitrary signature as the end of the archive', () => {
    const filler = Buffer.alloc(200, 0x5a); // 'ZZZZ…' — not a zip signature, and not padding
    const nameBuf = Buffer.from('a.json', 'utf8');
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0, 6);
    header.writeUInt16LE(8, 8);
    header.writeUInt32LE(4, 18); // under-declared: the payload is 200 bytes, not 4
    header.writeUInt32LE(4, 22);
    header.writeUInt16LE(nameBuf.length, 26);
    header.writeUInt16LE(0, 28);

    const underDeclared = Buffer.concat([header, nameBuf, filler]);
    const seen = classifyContainer(underDeclared);

    expect(seen.entries).toBe(1);
    // It stopped inside the entry's own data. That is not a finished archive.
    expect(seen.complete).toBe(false);
  });

  /**
   * Round 91 — the other half of the positive check, which the cases above cannot show: the
   * walk must still say `complete: true` where a zip genuinely ends. Without this, "report a
   * floor" degenerates into "report a floor always", which is honest and useless — and every
   * assertion above would still pass.
   */
  it('still reports a finished walk where the archive actually ends', () => {
    // Consumed exactly: the hand-built controls in this file carry no central directory.
    expect(classifyContainer(zipEntry('a.json', wellFormed, 8)).complete).toBe(true);

    // Stopped on the central directory, which is where the four tracked containers stop.
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    const withCentral = Buffer.concat([zipEntry('a.json', wellFormed, 8), central]);
    expect(classifyContainer(withCentral)).toMatchObject({ entries: 1, complete: true });
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
