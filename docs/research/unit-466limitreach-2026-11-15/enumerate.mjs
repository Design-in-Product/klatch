/**
 * unit-466limitreach — the enumerator, factored out of arm A so that the arm and
 * the hand map read the SAME member set from the SAME code.
 *
 * Why this is a separate module and not inlined twice: the hand map in arm A is
 * keyed on member ids minted here. If the arm re-derived ids with a second copy
 * of this logic, the two copies could drift and the coverage assertion would be
 * comparing a set against itself through two different readers. One reader, one
 * id space.
 *
 * Member unit: ONE DECLARED LIMIT. A `## Declared limits` section with four
 * bullets yields four members. See PRE-REGISTRATION.md for why the granularity
 * is the whole point of this unit.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";

export const ROOT = "docs/research";
export const SELECTOR = /declared limit/i;

/**
 * THE PIN, and why every read in this module goes through git rather than the
 * filesystem.
 *
 * The first drive of this enumerator read the live tree and reported **56** raw
 * selector hits where the pre-registration's recon had recorded **38**. The
 * extra 18 were this unit's own PRE-REGISTRATION.md and this very file: both sit
 * under `docs/research/`, both say "declared limit" repeatedly, and a live read
 * therefore censuses the instrument along with the corpus. The pre-registration
 * claims the instrument is outside its own population "by the pin, not by a
 * filter" — that claim is only true if the reads are AT the pin, so they are.
 *
 * A filter (`if (path.startsWith(thisUnit)) continue`) would have been the wrong
 * cure twice over: it excludes this unit by name, so the NEXT unit written in
 * this corpus silently re-enters the population, and it leaves the published
 * figure dependent on the drive clock rather than on a rev anyone can check out.
 */
export const PIN = "9cc06dacef31fb173bca29bb590cbb059943ae21";

/** Repo root, so `git -C` is pinned and the module is cwd-insensitive. */
const REPO = path.resolve(
  execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim(),
);

function git(args) {
  return execFileSync("git", ["-C", REPO, ...args], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
}

/**
 * Contents of `p` as of PIN. Throws if absent at the pin.
 *
 * Cached. Not for speed alone: the spelling census reads every corpus file once
 * per spelling, and an uncached form spawned 12 x ~750 = ~9000 `git show`
 * processes and did not finish inside a 120s budget. A cache also makes the two
 * readers (member enumeration and spelling census) provably read the SAME bytes
 * for a given path, which a second subprocess per call does not guarantee if the
 * working tree is written to mid-drive.
 */
const CACHE = new Map();
export function readAtPin(p) {
  if (!CACHE.has(p)) CACHE.set(p, git(["show", PIN + ":" + p]));
  return CACHE.get(p);
}

/** Every .mjs and .md under a docs/research/<unit>/ directory AS OF PIN, sorted. */
export function corpusFiles() {
  const out = [];
  for (const line of git(["ls-tree", "-r", "--name-only", PIN, "--", ROOT]).split("\n")) {
    const p = line.trim();
    if (!p) continue;
    if (!(p.endsWith(".mjs") || p.endsWith(".md"))) continue;
    // Only files exactly one level down, i.e. docs/research/<unit>/<file>.
    // Note the direction: `rel` must contain EXACTLY one "/". An earlier form of
    // this line rejected every rel containing "/", which kept only the files
    // sitting directly in docs/research/ and reported 1 .mjs against the live
    // tree's 437 — a selector wrong by its own sign, caught because the file
    // count was checked against the recon figure instead of being assumed.
    const rel = p.slice(ROOT.length + 1);
    if (rel.split("/").length !== 2) continue;
    out.push(p);
  }
  return out.sort();
}

/** True for a markdown ATX heading line. */
function headingLevel(line) {
  const m = line.match(/^(#+)\s/);
  return m ? m[1].length : 0;
}

/**
 * Split a `## Declared limits` section body into members.
 *
 * A member starts at a top-level list bullet (`- ` / `* ` at column 0) or, when
 * the section uses bold-led paragraphs instead of bullets, at a paragraph whose
 * first line opens with `**`. Continuation lines (indented, or inside the same
 * paragraph) belong to the member they follow. A section with neither form is a
 * single member: its whole body.
 *
 * Returned offsets are 0-based into `body`.
 */
function splitSectionMembers(body) {
  const starts = [];
  for (let i = 0; i < body.length; i++) {
    const l = body[i];
    if (/^[-*]\s/.test(l)) starts.push(i);
    else if (/^\*\*/.test(l) && (i === 0 || body[i - 1].trim() === "")) starts.push(i);
  }
  if (starts.length === 0) {
    const text = body.join("\n").trim();
    return text ? [{ offset: 0, lines: body }] : [];
  }
  const out = [];
  for (let k = 0; k < starts.length; k++) {
    const s = starts[k];
    const e = k + 1 < starts.length ? starts[k + 1] : body.length;
    out.push({ offset: s, lines: body.slice(s, e) });
  }
  return out;
}

/**
 * Enumerate every declared-limit member reachable from SELECTOR.
 *
 * Each member carries:
 *   id    — `<path>:<line>` of the member's own first line. Unique per member;
 *           the section case uses the BULLET's line, not the heading's, so two
 *           bullets under one heading get two distinct ids.
 *   kind  — "section-member" | "inline"
 *   text  — verbatim, sliced from the file. Never hand-typed.
 */
export function enumerateMembers() {
  const members = [];
  const rawLineHits = [];
  const dupes = { paragraphCollapsed: 0, insideSection: 0 };

  for (const f of corpusFiles()) {
    const lines = readAtPin(f).split("\n");
    const hits = [];
    for (let i = 0; i < lines.length; i++) {
      if (!SELECTOR.test(lines[i])) continue;
      hits.push(i);
      rawLineHits.push({ file: f, line: i + 1, text: lines[i] });
    }
    if (hits.length === 0) continue;

    // ---- Pass 1: heading hits, which own every line in their section. ----
    //
    // Sections are resolved FIRST and record the line ranges they cover, because
    // a selector line sitting *inside* a `## Declared limits` section is already
    // represented by the bullet it belongs to. The first form of this function
    // ran one pass and minted such a line twice — once as a section member, once
    // as an inline member (e.g. unit-465byteslabel RESULTS.md:161 and :167, and
    // unit-466rhscap RESULTS.md:43 and :44). Section precedence is not a
    // tie-break; the section member is the real member and the inline mint was a
    // second reading of the same text.
    const claimed = new Set();
    for (const i of hits) {
      const lvl = headingLevel(lines[i]);
      if (lvl === 0) continue;
      let j = i + 1;
      while (j < lines.length) {
        const l2 = headingLevel(lines[j]);
        if (l2 > 0 && l2 <= lvl) break;
        j++;
      }
      for (let k = i; k < j; k++) claimed.add(k);
      const body = lines.slice(i + 1, j);
      for (const m of splitSectionMembers(body)) {
        members.push({
          id: f + ":" + (i + 2 + m.offset),
          kind: "section-member",
          heading: lines[i].trim(),
          headingId: f + ":" + (i + 1),
          text: m.lines.join("\n").trim(),
        });
      }
    }

    // ---- Pass 2: inline hits, one member per PARAGRAPH, not per line. ----
    //
    // A paragraph containing N selector lines is ONE declared limit, not N. The
    // first form keyed inline members on the matching line and so minted
    // unit-466rhscap RESULTS.md:52/:53/:56 as three members of one paragraph and
    // :139/:140/:141 as three more. The member unit for this whole unit is one
    // declared limit (PRE-REGISTRATION.md), so the span is the member identity
    // and the matching line is merely how the span is found.
    const seenSpans = new Set();
    for (const i of hits) {
      if (headingLevel(lines[i]) > 0) continue;
      if (claimed.has(i)) {
        dupes.insideSection++;
        continue;
      }
      let s = i, e = i;
      while (s > 0 && lines[s - 1].trim() !== "" && headingLevel(lines[s - 1]) === 0) s--;
      while (e < lines.length - 1 && lines[e + 1].trim() !== "") e++;
      const span = s + ":" + e;
      if (seenSpans.has(span)) {
        dupes.paragraphCollapsed++;
        continue;
      }
      seenSpans.add(span);
      members.push({
        id: f + ":" + (s + 1),
        kind: "inline",
        heading: null,
        headingId: null,
        text: lines.slice(s, e + 1).join("\n").trim(),
      });
    }
  }

  // Member ids must be unique, or the hand map in arm A can key two members onto
  // one verdict and the coverage assertion would pass while a member went
  // ungraded. Asserted here rather than hoped for.
  const ids = members.map((m) => m.id);
  const uniq = new Set(ids);
  if (uniq.size !== ids.length) {
    const seen = new Set();
    const dup = new Set();
    for (const id of ids) {
      if (seen.has(id)) dup.add(id);
      seen.add(id);
    }
    throw new Error("enumerateMembers: duplicate member ids: " + [...dup].join(", "));
  }
  return { members, rawLineHits, dupes };
}

/** The 12-spelling landscape measured before the predictions were written. */
export const SPELLINGS = {
  "declared limit": /declared limit/i,
  "declared-limit": /declared-limit/i,
  DECLARED: /\bDECLARED\b/,
  "limits:": /limits:/i,
  limitation: /limitation/i,
  caveat: /caveat/i,
  "known blind": /known blind/i,
  blindness: /blindness/i,
  cap: /\bcap\b/i,
  bound: /\bbound(s)?\b/i,
  ceiling: /ceiling/i,
  "safety bound": /safety bound/i,
};

export function spellingCensus() {
  const files = corpusFiles();
  const rows = {};
  for (const [name, re] of Object.entries(SPELLINGS)) {
    const per = { mjs: { lines: 0, files: new Set() }, md: { lines: 0, files: new Set() } };
    for (const f of files) {
      const surf = f.endsWith(".mjs") ? "mjs" : "md";
      for (const l of readAtPin(f).split("\n")) {
        if (re.test(l)) {
          per[surf].lines++;
          per[surf].files.add(f);
        }
      }
    }
    rows[name] = {
      mjs: { lines: per.mjs.lines, files: per.mjs.files.size },
      md: { lines: per.md.lines, files: per.md.files.size },
    };
  }
  const counts = { mjs: files.filter((f) => f.endsWith(".mjs")).length, md: files.filter((f) => f.endsWith(".md")).length };
  return { rows, counts };
}
