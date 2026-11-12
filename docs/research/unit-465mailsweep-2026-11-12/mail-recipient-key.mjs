// Mail-recipient key for the Theseus close sweep, 2026-11-12.
//
// Spec re-derived from the 2026-11-11 STOP measurement (recorded in
// docs/operations/duty-cycle/theseus-tasks.md, "Mail close sweep"), NOT retyped from memory:
//
//  1. Population is enumerated with fs.readdirSync, never with a grep/ls pipeline, because a
//     pipeline hides its head and its exit code.
//  2. 42 of 98 live memos carried NO YAML front matter on 11/11 -- they use bold-markdown
//     headers, commonly MID-LINE (`**From:** X - **To:** Y`). A line-anchored `^to:` key
//     cannot see those, and under-reported this seat's own inbox by 8 of 28 (29%).
//  3. Unanchoring introduces the opposite error: `in-reply-to:` CONTAINS `to:`, and those
//     values are memo filenames that very often contain `theseus`. So the label must be
//     guarded: not preceded by a letter or a hyphen.
//
// The key reports, per memo: whether this seat is a `to:` recipient, a `cc:` recipient, the
// header style it was read under, and the captured header values -- so a hand check can see
// what the key saw rather than trusting its verdict.

import fs from 'node:fs';
import path from 'node:path';

const ME = /theseus/i;

// Guarded label: the label may start a line, or follow whitespace/punctuation/markdown
// emphasis, but must NOT be preceded by a letter or a hyphen -- which is what makes
// `in-reply-to:` read as `to:`.
//
// FIELD TERMINATOR -- the half the 11/11 prose spec did not record, and re-deriving the key
// from that prose alone reproduced the WRONG number (37/9 instead of 29/17). The bold-markdown
// style is single-line and puts several fields on it:
//     **From:** Daedalus - **To:** Pard - **cc:** Calliope, xian, ... Theseus - **Date:** ...
// A `[^\n]*` capture therefore swallows the `cc:` list into the `to:` value, and every memo
// where this seat is only cc'd on a single-line header reads as a `to:` recipient. The capture
// must stop at the next guarded field label on the same line.
const NEXT_LABEL = /(?<![A-Za-z-])\*{0,2}(?:to|cc|bcc|from|date|subject|re|reply-to|in-reply-to)\*{0,2}\s*:/i;

function truncateAtNextLabel(value) {
  const m = NEXT_LABEL.exec(value);
  if (!m) return value;
  // Drop a trailing markdown/bullet separator left behind by the cut.
  return value.slice(0, m.index).replace(/[\s*·.,;|-]+$/, '');
}

function headerValues(text, label) {
  const re = new RegExp(String.raw`(?<![A-Za-z-])\*{0,2}` + label + String.raw`\*{0,2}\s*:\s*\*{0,2}\s*([^\n]*)`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) out.push(truncateAtNextLabel(m[1]).trim());
  return out;
}

// A `to:`/`cc:` list can also be a YAML block list on the following lines:
//   to:
//     - Argus
// Capture those continuation lines too, or the key is blind to every block-list memo.
function blockListAfter(text, label) {
  const re = new RegExp(String.raw`(?<![A-Za-z-])` + label + String.raw`\s*:[ \t]*\n((?:[ \t]*-[^\n]*\n)+)`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) out.push(m[1].replace(/\s+/g, ' ').trim());
  return out;
}

export function classify(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  return files.map((f) => {
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    const hasYaml = /^---\n/.test(text);
    const to = [...headerValues(text, 'to'), ...blockListAfter(text, 'to')];
    const cc = [...headerValues(text, 'cc'), ...blockListAfter(text, 'cc')];
    const toMe = to.some((v) => ME.test(v));
    const ccMe = !toMe && cc.some((v) => ME.test(v));
    // Date is read off the filename's trailing YYYY-MM-DD, which every memo in this
    // directory is supposed to carry; reported as null when absent rather than guessed,
    // so an undated memo cannot fall silently into the "older than cut" bucket.
    const dm = f.match(/(\d{4}-\d{2}-\d{2})\.md$/);
    return { file: f, date: dm ? dm[1] : null, hasYaml, to, cc, toMe, ccMe };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2] ?? 'docs/mail';
  const CUT = process.argv[3] ?? '2026-11-07';
  const rows = classify(dir);
  const toMe = rows.filter((r) => r.toMe);
  const ccMe = rows.filter((r) => r.ccMe);
  const noYaml = rows.filter((r) => !r.hasYaml);
  const undated = rows.filter((r) => r.date === null);
  console.log(`POP ${rows.length} memo(s) in ${dir}`);
  console.log(`YAML ${rows.length - noYaml.length} with front matter / ${noYaml.length} without`);
  console.log(`UNDATED ${undated.length}` + (undated.length ? ': ' + undated.map((r) => r.file).join(', ') : ''));
  console.log(`TOME ${toMe.length} / CCME ${ccMe.length}`);
  const older = toMe.filter((r) => r.date !== null && r.date < CUT);
  const track = toMe.filter((r) => r.date === null || r.date >= CUT);
  console.log(`SPLIT at ${CUT}: ${older.length} older (close-sweep candidates) / ${track.length} at-or-after (live round track, or undated)`);
  console.log('--- CANDIDATES (older than cut, to-me) ---');
  for (const r of older.sort((a, b) => a.date.localeCompare(b.date))) {
    console.log(`${r.date}  ${r.hasYaml ? 'yaml' : 'bold'}  ${r.file}`);
    console.log(`           to=${JSON.stringify(r.to)}`);
  }
  console.log('--- AT-OR-AFTER CUT (to-me) ---');
  for (const r of track.sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))) {
    console.log(`${r.date}  ${r.file}`);
  }
}
