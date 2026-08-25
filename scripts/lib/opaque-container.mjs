/**
 * Is a tracked file's text reachable by reading its bytes?
 *
 * Written 2026-08-25 (Round 89) for `measure-marker-floor.mjs --all-tracked`, at Theseus's
 * Round 88 §5.1 request, and for the reason he gave — which is the argument I made for the
 * `unparsed` bucket, one level out.
 *
 * `--all-tracked` printed "nothing tracked is outside it". That sentence cannot be wrong,
 * which is exactly what is wrong with it. The mode enumerates every tracked *file* and reads
 * each one's bytes; a file whose text is DEFLATE-compressed contributes nothing and reads
 * zero in all five categories, and a zero from a container is indistinguishable in the
 * printout from a zero from a clean corpus. Round 88 measured that gap from the outside:
 * 0 of 17 and 0 of 29 inflated lines over 12 chars in the two claude-ai fixtures are findable
 * in the raw decode. A total loss, not a sampling one. This turns that into a number the mode
 * prints about itself.
 *
 * ## Two things this is deliberately not
 *
 * **Not an extension list.** `--all-tracked` exists because enumerations a human maintains go
 * stale — twice on this arm a corpus was tracked the whole time and simply missing from
 * someone's list. Re-introducing `.zip`/`.docx`/`.xlsx` as a maintained list would put the
 * same defect back one level in. Detection is by leading magic bytes only.
 *
 * **Not a magic-byte flag either, where it can be cheaper to check than to assume.** For the
 * zip family, magic says "this is a container", not "its text is unreachable" — a zip whose
 * entries are all *stored* (method 0) holds its text in the clear and the mode reads it fine.
 * So the zip branch walks local file headers and counts entries that are actually compressed.
 * `research/claude-export-format-analysis.docx` is the case that makes this worth the twenty
 * lines: 22 entries, 4 of them stored. "Opaque" is then a measured property of the bytes
 * rather than a guess from the first four of them.
 *
 * ## What it still cannot see, stated rather than implied
 *
 * bzip2, xz, zstd and any container not led by one of the magics below read as plain and are
 * counted as covered. If one lands in the tracked set this returns the wrong answer, quietly.
 * That is a smaller and more visible hole than the sentence it replaces, not a closed one.
 */

const ZIP_LOCAL_HEADER = 0x04034b50; // 'PK\x03\x04', little-endian
const ZIP_CENTRAL_HEADER = 0x02014b50; // 'PK\x01\x02' — first entry of the central directory
const ZIP_EOCD = 0x06054b50; // 'PK\x05\x06' — end of central directory, an archive with no entries
const GZIP_MAGIC = [0x1f, 0x8b];

/**
 * Walk a zip's local file headers from offset 0, counting entries and compressed entries.
 *
 * Stops at the first entry whose general-purpose flag bit 3 is set: that entry's sizes live in
 * a trailing data descriptor rather than the header, so the offset of the *next* header is not
 * knowable from here without parsing the central directory. `complete: false` says so, and the
 * counts returned are a floor rather than a total — which is enough, because one compressed
 * entry already settles the only question being asked.
 * `research/1f171719-….jsonl.zip` is written this way and is why the case is handled instead
 * of asserted away.
 *
 * ## Why `complete` is a positive check and not an absence of known failures (Round 91)
 *
 * Until Round 91 this returned `complete: true` for every exit that wasn't the bit-3 guard —
 * that is, `complete` meant "no failure I check for happened", which is the same shape as the
 * `--all-tracked` sentence this whole module exists to replace. Theseus's Round 90 mutation
 * check found the cost of that on the guard itself; the same shape was still here one level in,
 * because bit 3 is not the only way to not know the next offset:
 *
 * - **zip64.** A size that doesn't fit 32 bits is written as `0xFFFFFFFF` with the real value in
 *   the extra field. Reading the 32-bit field and believing it sends `off` past the end of the
 *   buffer, the loop condition fails, and the old code called that finished. Worse than the
 *   bit-3 case: if the first entry is *stored* (the tracked `.docx` has four such records) the
 *   walk returns `compressed: 0` → `opaque: false` for an archive whose text is unreachable,
 *   which is the exact zero this module was written to stop printing.
 * - **A truncated or garbage tail.** Landing anywhere that isn't a header was also "finished".
 *
 * Note what is deliberately *not* here: a `compressedSize === 0xFFFFFFFF` special case. I wrote
 * one, then found no buffer under 4 GB could tell it apart from the overshoot rule below, which
 * catches the sentinel as an instance of the general problem — a size field larger than what
 * followed it. A branch no test can reach is the thing this arm keeps finding in other people's
 * code, and one general rule beating a growing list of named cases is the same argument as
 * "not an extension list" above.
 *
 * So the walk now says it finished only where a zip actually ends: it consumed the buffer
 * exactly, or it stopped on the central directory. Everything else is a floor and says so.
 * Checked against all four tracked containers before landing — every one keeps the answer it
 * had, three via the central directory and `jsonl.zip` via the bit-3 guard as before.
 *
 * The bit-3 guard stays, and is not made redundant by this. Under the new rule an unguarded
 * walk would usually *also* report incomplete, having stumbled into compressed data — but
 * "stopped in the right place" and "stopped somewhere that happened to look wrong" are
 * different, and the difference shows up in `entries`: data can contain a well-formed local
 * file header, and an unguarded walk landing on one counts a phantom entry and then claims to
 * have finished. `round89-opaque-containers.test.ts` pins that case directly.
 */
function walkZipEntries(buf) {
  let off = 0;
  let entries = 0;
  let compressed = 0;
  while (off + 30 <= buf.length && buf.readUInt32LE(off) === ZIP_LOCAL_HEADER) {
    const flags = buf.readUInt16LE(off + 6);
    const method = buf.readUInt16LE(off + 8);
    const compressedSize = buf.readUInt32LE(off + 18);
    const nameLen = buf.readUInt16LE(off + 26);
    const extraLen = buf.readUInt16LE(off + 28);
    entries++;
    if (method !== 0) compressed++;
    if (flags & 0x08) return { entries, compressed, complete: false };
    off += 30 + nameLen + extraLen + compressedSize;
  }
  // Consumed the buffer exactly: every entry was read and nothing is left to misread. This is
  // the shape the hand-built controls take, which carry no central directory by design.
  if (off === buf.length) return { entries, compressed, complete: true };
  // Fewer than four bytes left to identify — either a truncated tail, or a size field larger
  // than what followed it and `off` is now past the end. One check covers both: overshooting
  // implies there is nothing left to read. (A separate `off > buf.length` branch was written
  // here and removed; the Round 91 mutation matrix showed no input could distinguish it.)
  if (off + 4 > buf.length) return { entries, compressed, complete: false };
  const sig = buf.readUInt32LE(off);
  return { entries, compressed, complete: sig === ZIP_CENTRAL_HEADER || sig === ZIP_EOCD };
}

/**
 * @param buf a file's bytes
 * @returns `{ opaque, kind, entries, compressed, complete }`. `opaque` is true only when the
 *          bytes are known to hold compressed content, so a stored-only zip reports
 *          `kind: 'zip'` with `opaque: false` and is counted as covered — correctly, since
 *          the mode's decode does reach its text.
 *
 *          **Read `opaque` together with `complete`; alone it has three meanings, not two.**
 *          `opaque: true` is sound whatever `complete` says — one compressed entry settles the
 *          question and no later entry can unsettle it. `opaque: false` means two different
 *          things: with `complete: true` it is a finding (the walk saw every entry and none
 *          was compressed), and with `complete: false` it is only the absence of one (a
 *          compressed entry may sit past where the walk stopped). Callers that bucket files as
 *          reached-or-not must treat the second as indeterminate rather than as reached —
 *          counting it as reached re-creates, for one file, the unfalsifiable zero that
 *          `--all-tracked` used to print for the whole corpus. `measure-marker-floor.mjs`
 *          prints it as its own line for that reason.
 */
export function classifyContainer(buf) {
  const plain = { opaque: false, kind: 'plain', entries: 0, compressed: 0, complete: true };
  if (buf.length >= 4 && buf.readUInt32LE(0) === ZIP_LOCAL_HEADER) {
    const { entries, compressed, complete } = walkZipEntries(buf);
    return { opaque: compressed > 0, kind: 'zip', entries, compressed, complete };
  }
  if (buf.length >= 2 && buf[0] === GZIP_MAGIC[0] && buf[1] === GZIP_MAGIC[1]) {
    // A gzip member is a DEFLATE stream by definition of the format; there is no stored mode
    // to check for, so there is nothing to walk.
    return { opaque: true, kind: 'gzip', entries: 1, compressed: 1, complete: true };
  }
  return plain;
}

/**
 * Did decoding these bytes as UTF-8 lose any of them?
 *
 * The round-trip is the test, **not** the presence of U+FFFD in the decoded string, and the
 * difference is not academic: `round17-compaction-effort.test.ts` carries three literal U+FFFD
 * characters inside comment rules — a scar from some earlier lossy edit — while its bytes are
 * perfectly valid UTF-8 and its text is fully readable. A U+FFFD-presence check calls that file
 * corrupt (Round 88 §4 did, and named it "a tracked source file whose bytes are not valid
 * UTF-8"); the round-trip calls it what it is. Every byte sequence that decodes without loss
 * re-encodes to itself, so equality of lengths is exact here rather than a heuristic.
 *
 * Lossy is not the same as opaque and must not be reported as it: the two SQLite backups decode
 * lossily and are still fully searchable for marker text, because page payloads are stored as
 * plain UTF-8. That property is the entire reason `--all-tracked` can stand in for `--db`.
 */
export function decodesLosslessly(buf, text) {
  return Buffer.byteLength(text) === buf.length;
}
