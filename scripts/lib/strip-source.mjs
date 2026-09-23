/**
 * The shared answer to **'which bytes of this source are code?'** — comment bodies (and, on
 * request, string bodies) blanked, every offset and line break preserved.
 *
 * ## Why this module exists, and why it is THIS reader rather than another
 *
 * Round 257 (Daedalus) left three implementations of this one question in the tree and named the
 * duplication as an open item rather than closing it: `stripSource` here, private to
 * `verify-tsx-guard.mjs`; `maskComments()` in `lib/probe-source-constants.mts`; and a scanner
 * inside Theseus's Round 256 probe. Round 258 (Theseus) measured the three and returned the answer
 * that decides the direction of the extraction:
 *
 * 1. **They are not all the same question.** The paren-balance reader in Round 256 answers a
 *    question one layer up — *'which span is this call's argument list?'* — and merely *inlines* a
 *    weaker copy of this one to get there. A census that counts maskers cannot see that copy,
 *    because it is not shaped like one. *Count the question, not the function.*
 * 2. **The direction is one-way** (his arm C3). Of the three readers, `stripSource` is the only
 *    one not fooled by a regex literal containing an apostrophe — `/\bhere(?:'s)\b/i`, which is
 *    live in `verify-filler-constraints.mjs` today. The apostrophe opens a string for the other
 *    two, and a line comment after it survives into their 'code' reading. So the obvious target —
 *    `maskComments`, already in `scripts/lib` — was the wrong one: routing the others to it would
 *    have moved the copy without closing the hole, leaving two readers instead of three and the
 *    surviving shared one still wrong on the input that motivated the work.
 * 3. **Length-preservation is load-bearing and was not universal** (his arm A2). Every consumer
 *    here locates a site in the masked text and slices it out of the **original**, so a reader that
 *    *deletes* comment bytes rather than blanking them would be silently off by the length of every
 *    preceding comment. 'They all mask comments' is exactly the summary that hides this. It is
 *    asserted on, not assumed: see `round259-…` in the server suite.
 *
 * Round 137's lesson does not repeat here. The limbs are not being given one binding; one limb is
 * being given a dependency, and the paren balance stays where it is as a **consumer**.
 *
 * ## Two readings, one scanner
 *
 * `blankStrings` selects the reading. Strings are **kept** when the caller is looking for a quoted
 * literal (an import specifier is one) and **blanked** when it is looking for code that contains no
 * string (a call site). Both readings come out of the same pass, so no two consumers can disagree
 * about where a comment ends — which is the whole reason this is one module and not three.
 *
 * A regex literal's body is blanked in **both** readings. That is not a convenience: it is what
 * makes the parity precondition in `verify-tsx-guard.mjs` exact, since every quote surviving the
 * strings-blanked reading is then a real delimiter with none leaking out of a regex body. And a
 * regex body is not code — an anchor inside one is not an import site, a call inside one is not a
 * call — so blanking is what every consumer already wanted.
 *
 * The decision log below is moved verbatim from `verify-tsx-guard.mjs`, where this scanner lived
 * from Round 129 to Round 258. It is kept whole because the residuals it records are the ones this
 * reader still has, and the two failure directions of the regex heuristic are what the Round 131
 * repair is measured against.
 */

// Comment bodies (and optionally string bodies) blanked, offsets and line breaks preserved.
//
// Round 129 wrote this for `importsGuardSource`'s two conjuncts: strings *kept* for the import
// conjunct — the specifier is one — and blanked for the call conjunct, which contains no string.
// Round 130 moves it above the anchor, because the anchor needs it too and needed it first: it is
// the outermost membership test, so every reading in this file inherits whatever it gets wrong.
// One scanner, three readings, so no two of them can disagree about where a comment ends.
//
// Round 130 stated this residual and Round 131 measured it: this tracked `'`, `"` and `` ` `` but
// not regex literals, so an unbalanced quote inside one (`/it's/`, `"([^"]*)"`) desynchronised the
// scan for the rest of the file. On the clean tree that was **three of the 37 modules in
// `readable`** — not hypothetical, and not caught by either live control, because both readings
// stay length-preserving while wrong. Item 12. Repaired below; the two failure directions it had
// are kept in the prose because they are what the repair is measured against.
//
// A `/` is regex-open or division depending on the token before it, and this file has no parser, so
// the decision is a heuristic and the honest question is what its two error directions cost.
//
//   * **Declining to fire** on a real regex leaves the scan exactly as it was before this round —
//     an unrepaired instance of the old defect, never a new one.
//   * **Misfiring** on a division steps over a span of real code. The span is bounded to one line
//     (a regex literal cannot contain a newline, so an unterminated scan-ahead returns −1 and the
//     `/` falls through to division) — but **the consequence is not bounded to that line.** If the
//     stepped-over span holds an *odd* number of quote characters, the scan's string state is
//     flipped from that point on, which is the same unbounded desync this repair exists to remove.
//     Round 130 stated the price of a repair in a sentence and Round 131 found it was already being
//     charged; that is not a mistake to make twice, so the residual is written at full strength and
//     then measured rather than argued.
//
// Two things bound it in practice. The prev-token test admits only characters that cannot *end* an
// expression, so `a / b`, `f(x) / 2`, `xs[i] / 2`, `'s' / 2` and `2 / 3` are all division by
// construction — a misfire needs punctuation-or-keyword immediately before a division, which valid
// JS does not contain. That is an argument, not a measurement, and the argument is exactly the kind
// this file has been wrong about before. So the measurement: the parity precondition below asserts
// on every module read that the scan ends with no string span open, which is precisely the
// odd-parity case above. Daedalus proposed that signal in Round 131 §4 and declined to ship it
// because it went red on the clean tree — it went red on the three files this repair fixes. It is
// green now, and it costs nothing, so the repair is what made it shippable.
//
// ── Round 257, Daedalus: the argument above was false, and the measurement caught it ───────────
//
// **`which valid JS does not contain` is wrong.** `${a.c}/${a.s}` is ordinary, common JS and puts a
// `}` immediately before a `/`; `}` is a member of `REGEX_MAY_OPEN_AFTER`. The sentence was written
// about *division*, and the counterexample is not a division at all — it is a `/` in template
// **text**, which the scanner should never have been reading as code in the first place.
//
// That is the actual defect, and it is upstream of the heuristic: **this scanner had no model of
// `${ … }` interpolation.** A template literal was treated as a plain quoted span, so the *opening*
// backtick of a NESTED template closed the outer one, and everything after it was read as code
// until the next backtick. The regex misfire is what that spurious code mode then bought:
//
//   1. the nested `` ` `` flips the scan from string into code mid-template;
//   2. a `/` between two substitutions (`${x.c}/${x.s}`) now looks like a regex opener, because the
//      character before it is `}`;
//   3. `regexLiteralEnd` finds a later `/` on the same line and blanks the span between them,
//      swallowing the template's closing backtick and any quotes in between.
//
// Step 3 needs a second `/` later on the same line — which is why the first minimal reproduction of
// this failed, and why the fixture rows below carry that negative case alongside the positive one.
//
// **Found by the parity precondition, exactly as designed, and four days late.** It went red on
// `probe-round233-arm-m-and-the-endpoint-can-walk-different-corpora.mts` — a correct file, which is
// item 1 of this header — the day that file landed (2026-09-19), and nothing noticed, because this
// verifier is not in `npm test` and nothing schedules it. The control was right; no one read it.
//
// Rule: *an argument that a heuristic is safe is a claim about the inputs it will see, and the
// inputs are a moving population. The control that outlives the argument is the one that reads the
// population on every run — and it is worth only as much as its chance of being run.*
//
// Repaired in `stripSource` below by tracking interpolation depth, so template text is string and
// `${ … }` is code. The heuristic is untouched: with the thread no longer lost, step 2 never
// arises, and the prev-token argument is back inside the domain it was actually true for.
//
// A stepped-over span is **blanked in both readings**, not emitted verbatim, for two reasons that
// point the same way. It makes the parity precondition exact — every quote surviving the
// strings-blanked reading is then a real delimiter, with none leaking out of a regex body like the
// apostrophe in `/\bhere(?:'s)\b/i`, which is live in `verify-filler-constraints.mjs` today. And a
// regex body is not code: an anchor inside one is not an import site and a `explainTsxRequirement(…)`
// inside one is not a call, so blanking is what both consumers already wanted.
export const REGEX_MAY_OPEN_AFTER = /[(,=:[!&|?{};+\-*%<>~^]/;
export const REGEX_MAY_OPEN_AFTER_WORD = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'case', 'new', 'delete', 'void', 'throw',
  'do', 'else', 'yield', 'await',
]);

// The index just past a regex literal opening at `i`, or −1 if no such literal closes on this line.
// `[` opens a character class, in which `/` is an ordinary character — `/[/]/` is one literal, not
// two. Kept separate from the scanner so the case table below can point at it directly.
export const regexLiteralEnd = (src, i) => {
  let j = i + 1;
  let inClass = false;
  while (j < src.length) {
    const c = src[j];
    if (c === '\n') return -1;
    if (c === '\\') { if (src[j + 1] === '\n' || j + 1 >= src.length) return -1; j += 2; continue; }
    if (inClass) { if (c === ']') inClass = false; j += 1; continue; }
    if (c === '[') { inClass = true; j += 1; continue; }
    if (c === '/') return j === i + 1 ? -1 : j + 1;
    j += 1;
  }
  return -1;
};

export const stripSource = (src, blankStrings) => {
  let out = '';
  let i = 0;
  let quote = null;
  // The last significant character of *code* — comment bodies and string bodies do not update it,
  // so `a /* c */ / b` is division and `('x') / 2` is division. Null at start of file, where a `/`
  // cannot be division.
  let prev = null;
  // The identifier immediately before `prev`, and whether it was reached through a `.` — so the
  // keyword list reads `return /x/` as a regex and `obj.in / 2` as division.
  let word = '';
  let wordDotted = false;
  // Round 257: template-literal interpolation. One entry per `${ … }` currently open, holding the
  // brace depth of the code inside it, so `${ {a: 1} }` returns to template text at the right `}`
  // and a template nested inside an interpolation pushes again. Non-empty means "we are in code
  // that must go back to being a string when its braces balance" — the state this scanner did not
  // have, and whose absence let a nested template's opening backtick close the outer one.
  const interp = [];
  while (i < src.length) {
    const c = src[i];
    if (quote) {
      if (c === '\\') { out += '  '; i += 2; continue; }
      // `${` opens CODE inside a template. The escape branch above runs first, so `\${` is text.
      // Emitted verbatim rather than blanked: these two characters are code structure, and the
      // parity precondition downstream counts delimiters, not template text.
      if (quote === '`' && c === '$' && src[i + 1] === '{') {
        interp.push(0);
        quote = null;
        out += '${';
        // `{` is in REGEX_MAY_OPEN_AFTER, which is correct here — `${/re/.test(s)}` opens a regex.
        prev = '{'; word = ''; wordDotted = false; i += 2;
        continue;
      }
      if (c === quote) { quote = null; out += c; prev = c; word = ''; i += 1; continue; }
      out += c === '\n' ? '\n' : (blankStrings ? ' ' : c);
      i += 1;
      continue;
    }
    // The `}` that closes an interpolation puts us back inside the template it belongs to. Checked
    // before the depth bookkeeping below, because at depth 0 this `}` is the closer, not a nesting.
    if (interp.length && c === '}' && interp[interp.length - 1] === 0) {
      interp.pop();
      quote = '`';
      out += '}'; prev = '}'; word = ''; wordDotted = false; i += 1;
      continue;
    }
    if (interp.length && c === '{') interp[interp.length - 1] += 1;
    else if (interp.length && c === '}') interp[interp.length - 1] -= 1;
    if (c === "'" || c === '"' || c === '`') { quote = c; out += c; prev = c; word = ''; i += 1; continue; }
    // Comments first, and not by accident: `//` is a comment and never an empty regex, and a regex
    // may not open with the quantifier `*`, so `/*` is never one either. Testing the regex branch
    // first would read every line comment in this file as an unterminated literal.
    if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') { out += ' '; i += 1; }
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end === -1 ? src.length : end + 2;
      for (; i < stop; i += 1) out += src[i] === '\n' ? '\n' : ' ';
      continue;
    }
    if (c === '/'
      && (prev === null || REGEX_MAY_OPEN_AFTER.test(prev)
        || (!wordDotted && REGEX_MAY_OPEN_AFTER_WORD.has(word)))) {
      const stop = regexLiteralEnd(src, i);
      if (stop !== -1) {
        // Blanked identically in both readings — see the note above. Identical in both is what
        // keeps conjunct 2 sound here: the two readings never disagree inside a span that is
        // neither code nor string, so no anchor can be found in one and judged by the other.
        for (; i < stop; i += 1) out += ' ';
        prev = '/';
        word = '';
        continue;
      }
    }
    out += c;
    if (!/\s/.test(c)) {
      if (/[\w$]/.test(c)) {
        if (word === '') wordDotted = prev === '.';
        word += c;
      } else {
        word = '';
      }
      prev = c;
    }
    i += 1;
  }
  return out;
};
