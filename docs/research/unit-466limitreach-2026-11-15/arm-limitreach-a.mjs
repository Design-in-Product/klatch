#!/usr/bin/env node
/**
 * unit-466limitreach — arm A
 *
 * Subject: the first of the two census items Theseus left unblocked for either
 * seat when he closed `unit-466rhscap` — which of this corpus's declared limits
 * have ever had their reach measured, and which only state a count.
 *
 * Pin: `9cc06dac`, named in PRE-REGISTRATION.md before this arm existed and
 * enforced in `enumerate.mjs`, which reads every byte through
 * `git show <PIN>:<path>`. At that pin this unit's directory does not exist, so
 * the instrument is outside its own population BY THE PIN, not by a name filter.
 * `A0` asserts that rather than letting me claim it.
 *
 * ## The hand map, and why the verdicts are hand-assigned
 *
 * 58 members is a hand-readable population, and the question — does this limit
 * state a count of missed things, and is the intersection of those with the
 * measured population stated — is not decidable by any regex I would trust. So
 * the member TEXT is sliced from source by `enumerate.mjs` and never typed here,
 * and only the VERDICT is hand-assigned. Every member of the hand map was read
 * in full before its verdict was written; where a 250-char reading would have
 * decided a borderline case, the full span was read instead (that is how
 * `arm-p12site-b.mjs` came out `SCOPE_NO_COUNT` rather than `COUNT_NO_REACH`:
 * its text promises to report the cap count, and states none itself).
 *
 * `A2` asserts the map and the enumeration cover each other exactly in BOTH
 * directions. A member with no verdict reddens, and a verdict naming no member
 * reddens. The second direction matters as much as the first: this corpus grows,
 * and a verdict left behind by a member that moved would otherwise sit in the
 * map scoring a coverage it no longer has.
 *
 * ## What this arm does NOT do
 *
 * It does not relax the pre-registered 20% `UNKEYED` ceiling, and it does not
 * add a seventh key to absorb the members no key fits. The ceiling is checked by
 * `A4` and, if it fires, `A5`/`A6`/`A7` print REFUSED and no class percentage is
 * published. Reaching a ceiling by adding keys after seeing the misses is the
 * move the pre-registration forbids by name.
 */
import { enumerateMembers, spellingCensus, corpusFiles, readAtPin, PIN, SELECTOR } from "./enumerate.mjs";
import { execFileSync } from "node:child_process";
import path from "node:path";

// Pinned once, so every git call in this arm is cwd-insensitive. `git ls-tree`
// resolves a pathspec against the child's cwd, which is how A0 first went
// vacuously green.
const REPO_ROOT = path.resolve(
  execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim(),
);

const legs = [];
const check = (id, ok, what) => {
  legs.push({ id, state: ok ? "GREEN" : "RED", what });
  return ok;
};
const refuse = (id, what) => {
  legs.push({ id, state: "REFUSED", what });
};

// ---------------------------------------------------------------- enumeration
const { members, rawLineHits, dupes } = enumerateMembers();
const census = spellingCensus();
const files = corpusFiles();

// ------------------------------------------------------------------ hand map
//
// Keyed on member id (`<path>:<line>`). Ids are asserted unique by
// enumerate.mjs, because a duplicate id would let one verdict cover two members
// while A2's coverage check still passed.
const R = "docs/research/";
const HAND = {
  // ---- SCOPE_NO_COUNT: a kind limit with no cardinality. Theseus's
  // count-vs-reach defect is INAPPLICABLE to these, not absent from them.
  [R + "lib/attested-rounds.mjs:719"]: "SCOPE_NO_COUNT",
  [R + "round445-capability-test/README.md:114"]: "SCOPE_NO_COUNT",
  [R + "round445-capability-test/verify-request-shapes.mjs:1"]: "SCOPE_NO_COUNT",
  [R + "unit-464rec-2026-10-31/PRE-REGISTRATION.md:117"]: "SCOPE_NO_COUNT",
  [R + "unit-465byteslabel-2026-11-13/PRE-REGISTRATION.md:83"]: "SCOPE_NO_COUNT",
  [R + "unit-465byteslabel-2026-11-13/PRE-REGISTRATION.md:86"]: "SCOPE_NO_COUNT",
  [R + "unit-465byteslabel-2026-11-13/PRE-REGISTRATION.md:88"]: "SCOPE_NO_COUNT",
  [R + "unit-465byteslabel-2026-11-13/RESULTS.md:161"]: "SCOPE_NO_COUNT",
  [R + "unit-465byteslabel-2026-11-13/RESULTS.md:163"]: "SCOPE_NO_COUNT",
  [R + "unit-465byteslabel-2026-11-13/RESULTS.md:166"]: "SCOPE_NO_COUNT",
  [R + "unit-465chainfloor-2026-11-13/RESULTS.md:136"]: "SCOPE_NO_COUNT",
  [R + "unit-465chainfloor-2026-11-13/RESULTS.md:151"]: "SCOPE_NO_COUNT",
  [R + "unit-465chainfloor-2026-11-13/RESULTS.md:215"]: "SCOPE_NO_COUNT",
  [R + "unit-465floorstates-2026-11-14/RESULTS.md:155"]: "SCOPE_NO_COUNT",
  [R + "unit-465floorstates-2026-11-14/RESULTS.md:159"]: "SCOPE_NO_COUNT",
  [R + "unit-465headpop-2026-11-14/PRE-REG-B.md:45"]: "SCOPE_NO_COUNT",
  [R + "unit-465headpop-2026-11-14/PRE-REG-B.md:47"]: "SCOPE_NO_COUNT",
  [R + "unit-465headpop-2026-11-14/PRE-REG-B.md:49"]: "SCOPE_NO_COUNT",
  [R + "unit-465p12site-2026-11-14/arm-p12site-a.mjs:1"]: "SCOPE_NO_COUNT",
  [R + "unit-465p12site-2026-11-14/arm-p12site-b.mjs:1"]: "SCOPE_NO_COUNT",
  [R + "unit-465refusalfate-2026-11-14/RESULTS.md:198"]: "SCOPE_NO_COUNT",
  [R + "unit-465refusalfate-2026-11-14/RESULTS.md:200"]: "SCOPE_NO_COUNT",
  [R + "unit-465refusalfate-2026-11-14/arm-refusalfate-a.mjs:1"]: "SCOPE_NO_COUNT",
  [R + "unit-465schemacollide-2026-11-14/RESULTS.md:156"]: "SCOPE_NO_COUNT",
  [R + "unit-465schemacollide-2026-11-14/RESULTS.md:160"]: "SCOPE_NO_COUNT",

  // ---- COUNT_WITH_REACH: states a number of missed things AND the
  // intersection of those with the population actually measured.
  [R + "round456-instruments/README.md:188"]: "COUNT_WITH_REACH",
  [R + "round458-instruments/README.md:130"]: "COUNT_WITH_REACH",
  [R + "unit-465schemacollide-2026-11-14/RESULTS.md:164"]: "COUNT_WITH_REACH",

  // ---- COUNT_NO_REACH: the defect Theseus named. A number, and no reach.
  [R + "round458-instruments/README.md:133"]: "COUNT_NO_REACH",
  [R + "unit-465p12site-2026-11-14/RESULTS.md:93"]: "COUNT_NO_REACH",
  [R + "unit-465refusalfate-2026-11-14/RESULTS.md:204"]: "COUNT_NO_REACH",
  [R + "unit-465refusalfate-2026-11-14/RESULTS.md:205"]: "COUNT_NO_REACH",

  // ---- COMMENTARY: matches the selector, declares no limit. Prose ABOUT a
  // limit, including every arm header that names the limit it grades.
  [R + "round457-instruments/README.md:9"]: "COMMENTARY",
  [R + "round457-instruments/grade-recording-completeness-across-the-whole-corpus.mjs:1"]: "COMMENTARY",
  [R + "unit-465foilchain-2026-11-13/PRE-REGISTRATION.md:12"]: "COMMENTARY",
  [R + "unit-465foilchain-2026-11-13/arm-foilchain-a.mjs:1"]: "COMMENTARY",
  [R + "unit-465foilchain-2026-11-13/arm-foilchain-a.mjs:277"]: "COMMENTARY",
  [R + "unit-466rhscap-2026-11-14/PRE-REGISTRATION.md:29"]: "COMMENTARY",
  [R + "unit-466rhscap-2026-11-14/RESULTS.md:43"]: "COMMENTARY",
  [R + "unit-466rhscap-2026-11-14/RESULTS.md:115"]: "COMMENTARY",
  [R + "unit-466rhscap-2026-11-14/RESULTS.md:138"]: "COMMENTARY",
  [R + "unit-466rhscap-2026-11-14/arm-rhscap-a.mjs:1"]: "COMMENTARY",

  // ---- UNKEYED: a refusal, NOT a class. Every one of these sits inside a
  // `## Declared limits` section and is not a limit on a measurement at all:
  // hygiene gates, routing notes ("still his", "not taken"), and scope
  // decisions ("no cure is proposed", "nothing here touches"). They are recorded
  // as refusals because inventing a seventh key for them after seeing them is
  // exactly how a ceiling gets cleared by the instrument rather than by the
  // corpus.
  [R + "round458-instruments/README.md:137"]: "UNKEYED",
  [R + "round458-instruments/README.md:140"]: "UNKEYED",
  [R + "round458-instruments/README.md:142"]: "UNKEYED",
  [R + "unit-464rec-2026-10-31/PRE-REGISTRATION.md:121"]: "UNKEYED",
  [R + "unit-464rec-2026-10-31/PRE-REGISTRATION.md:123"]: "UNKEYED",
  [R + "unit-464rec-2026-10-31/PRE-REGISTRATION.md:124"]: "UNKEYED",
  [R + "unit-465byteslabel-2026-11-13/RESULTS.md:168"]: "UNKEYED",
  [R + "unit-465byteslabel-2026-11-13/RESULTS.md:170"]: "UNKEYED",
  [R + "unit-465floorstates-2026-11-14/RESULTS.md:161"]: "UNKEYED",
  [R + "unit-465floorstates-2026-11-14/RESULTS.md:163"]: "UNKEYED",
  [R + "unit-465floorstates-2026-11-14/RESULTS.md:166"]: "UNKEYED",
  [R + "unit-465headpop-2026-11-14/PRE-REG.md:63"]: "UNKEYED",
  [R + "unit-465headpop-2026-11-14/PRE-REG.md:66"]: "UNKEYED",
  [R + "unit-465headpop-2026-11-14/PRE-REG.md:67"]: "UNKEYED",
  [R + "unit-465schemacollide-2026-11-14/RESULTS.md:166"]: "UNKEYED",
  [R + "unit-465schemacollide-2026-11-14/RESULTS.md:167"]: "UNKEYED",
};

// Which members are THIS SEAT's own work, for P4. Authorship is by unit, read
// off the units this seat authored; it is not inferred from the text.
const MINE_UNITS = [
  "unit-465p12site-2026-11-14",
  "unit-465chainfloor-2026-11-13",
  "unit-465floorstates-2026-11-14",
  "unit-465schemacollide-2026-11-14",
  "round456-instruments",
  "round458-instruments",
];
const isMine = (id) => MINE_UNITS.some((u) => id.startsWith(R + u + "/"));

// ------------------------------------------------------------------ A0: pin gate
//
// The pin must not contain this unit's own directory. Asserted by asking git,
// not by trusting the constant.
// The first drive of this leg called `git ls-tree` with NO `-C`. Driven from the
// unit directory, the pathspec resolved against the child's cwd, matched nothing,
// and the leg went GREEN — for any pin, including one that contains this unit.
// A gate whose red depends on a path resolving correctly needs the resolution
// itself asserted, so this leg now carries a MATCHED POSITIVE CONTROL: the same
// call at HEAD must FIND this unit's files. If the pathspec is wrong, the control
// comes back empty and A0 reddens instead of passing on a mistake.
const SELFDIR = R + "unit-466limitreach-2026-11-15";
const lsTree = (rev) =>
  execFileSync("git", ["-C", REPO_ROOT, "ls-tree", "-r", "--name-only", rev, "--", SELFDIR], {
    encoding: "utf8",
  }).trim();

let atPin = null;
let atHead = null;
try {
  atPin = lsTree(PIN);
  atHead = lsTree("HEAD");
} catch {
  /* leave null; the leg reddens below */
}
const controlFound = atHead !== null && atHead !== "";
const pinExcludesSelf = atPin === "";
const A0 = check(
  "A0",
  controlFound && pinExcludesSelf && !members.some((m) => m.id.includes("unit-466limitreach")),
  `GATE: control at HEAD finds this unit (${controlFound ? atHead.split("\n").length + " files" : "NOTHING — pathspec unresolved"}), the pin finds none (${atPin === "" ? "empty" : "NON-EMPTY"}), and no member is this unit's text`,
);

// ------------------------------------------------- A1: reproduce the recon census
//
// The pre-registration recorded the spelling landscape as reconnaissance. A1
// reproduces it AT THE PIN. The `declared limit` row is the one the whole unit
// rests on, so it is the one asserted.
const dl = census.rows["declared limit"];
const rawTotal = rawLineHits.length;
const A1 = check(
  "A1",
  dl.mjs.lines === 9 && dl.md.lines === 28 && rawTotal === 37 && files.length === 745,
  `GATE: at the pin, /declared limit/i = ${dl.mjs.lines} .mjs + ${dl.md.lines} .md = ${rawTotal} lines over ${files.length} corpus files`,
);

const guarded = A0 && A1;

// ---------------------------------------------------- A2: hand map covers members
const memberIds = new Set(members.map((m) => m.id));
const handIds = new Set(Object.keys(HAND));
const unmapped = [...memberIds].filter((id) => !handIds.has(id));
const orphanVerdicts = [...handIds].filter((id) => !memberIds.has(id));
const A2 = guarded
  ? check(
      "A2",
      unmapped.length === 0 && orphanVerdicts.length === 0,
      `members with no verdict: ${unmapped.length}; verdicts naming no member: ${orphanVerdicts.length}`,
    )
  : (refuse("A2", "prefused on A0/A1"), false);

// ---------------------------------------------------------- P1: population size
const tally = {};
for (const m of members) {
  const v = HAND[m.id] ?? "UNKEYED";
  tally[v] = (tally[v] ?? 0) + 1;
}
const P1 = guarded
  ? check("P1", members.length >= 40 && members.length <= 70, `members = ${members.length}, predicted 40-70`)
  : (refuse("P1", "prefused on A0/A1"), false);

// --------------------------------------------- A4: the pre-registered 20% ceiling
const unkeyed = tally.UNKEYED ?? 0;
const unkeyedPct = (unkeyed / members.length) * 100;
const ceilingHeld = unkeyedPct <= 20;
const A4 = guarded
  ? check(
      "A4",
      ceilingHeld,
      `CEILING: UNKEYED = ${unkeyed}/${members.length} = ${unkeyedPct.toFixed(1)}% (pre-registered ceiling 20%)`,
    )
  : (refuse("A4", "prefused on A0/A1"), false);

// P2/P3/P4 are class-count predictions. They are VOID if the ceiling fired —
// that is the pre-registered consequence, and it applies to a prediction that
// would have landed just as much as to one that would not.
const countBearing = (tally.COUNT_NO_REACH ?? 0) + (tally.COUNT_WITH_REACH ?? 0);
const nonCommentary = members.length - (tally.COMMENTARY ?? 0);

if (guarded && ceilingHeld) {
  check("P2", countBearing / nonCommentary < 0.5, `count-bearing ${countBearing}/${nonCommentary} of non-COMMENTARY`);
  check("P3", (tally.COUNT_WITH_REACH ?? 0) <= 3, `COUNT_WITH_REACH = ${tally.COUNT_WITH_REACH ?? 0}, predicted <= 3`);
  const mineNoReach = members.filter((m) => HAND[m.id] === "COUNT_NO_REACH" && isMine(m.id));
  check("P4", mineNoReach.length >= 2, `my own COUNT_NO_REACH = ${mineNoReach.length}, predicted >= 2`);
} else {
  refuse("P2", "VOID by the pre-registered ceiling — no class percentage is published");
  refuse("P3", "VOID by the pre-registered ceiling — no class percentage is published");
  refuse("P4", "VOID by the pre-registered ceiling — no class percentage is published");
}

// ------------------------------- P5: the reach of THIS unit's own declared limit
//
// My declared limit is that the population is keyed on the literal spelling
// `/declared limit/i`. Its reach is the number of bona fide declared limits the
// spelling cannot see. Measured here rather than implied — that is the whole
// point of taking this item.
//
// Key: a file that carries a limit-declaring HEADING under another name, and
// that never matches SELECTOR anywhere. A heading is used rather than a bare
// mention because "blindness" appears in 160 .mjs lines as ordinary prose, and a
// containment match over prose would not distinguish a declaration from a
// discussion.
const OTHER_HEADING = /^#+\s.*\b(blindness|blind spots?|caveats?|limitations?|known limits?|what this (cannot|does not) (see|measure))\b/i;
const invisible = [];
for (const f of files) {
  const src = readAtPin(f);
  if (SELECTOR.test(src)) continue;
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (OTHER_HEADING.test(lines[i])) invisible.push({ file: f, line: i + 1, heading: lines[i].trim() });
  }
}
const P5 = guarded
  ? check(
      "P5",
      invisible.length >= 1,
      `limit-declaring headings under another name, in files the selector never matches: ${invisible.length}`,
    )
  : (refuse("P5", "prefused on A0/A1"), false);

// --------------------------------------- P6: my own over-report hazard, measured
//
// The prediction was that counting RAW LINES as members would OVER-report the
// member population by >= 20%, because >= 8 of the raw lines declare no limit.
// Both halves are measured here. Note the pre-registration said "38 raw lines";
// no run ever printed 38 — it was my own eyeball count of an unsummed list, and
// the measured figure at the pin is 37. P6 is graded against 37.
const commentary = tally.COMMENTARY ?? 0;
const overReportPct = ((rawTotal - members.length) / members.length) * 100;
const P6 = guarded
  ? check(
      "P6",
      commentary >= 8 && overReportPct >= 20,
      `COMMENTARY = ${commentary} (predicted >= 8); raw lines ${rawTotal} vs members ${members.length} = ${overReportPct.toFixed(1)}% (predicted >= +20%)`,
    )
  : (refuse("P6", "prefused on A0/A1"), false);

// -------------------------------------------------------------------- recording
console.log("unit-466limitreach arm A — have this corpus's declared limits ever had their reach measured?");
console.log(`pin=${PIN}`);
console.log(`corpus at pin: ${files.length} files (${census.counts.mjs} .mjs + ${census.counts.md} .md)`);
console.log(`raw selector lines: ${rawTotal}   members: ${members.length}`);
console.log(`enumeration dedupe: ${dupes.paragraphCollapsed} collapsed to their paragraph, ${dupes.insideSection} already inside a section member`);
console.log("");

console.log("class tally (printed in full; see A4 for whether it is publishable)");
for (const k of ["SCOPE_NO_COUNT", "COUNT_WITH_REACH", "COUNT_NO_REACH", "BLOCKED", "COMMENTARY", "UNKEYED"]) {
  console.log(`  ${k.padEnd(18)} ${String(tally[k] ?? 0).padStart(3)}`);
}
console.log("");

console.log("COUNT_NO_REACH members — the defect Theseus named, in full:");
for (const m of members.filter((x) => HAND[x.id] === "COUNT_NO_REACH")) {
  console.log(`  ${isMine(m.id) ? "[MINE]" : "[    ]"} ${m.id}`);
  console.log(`          ${m.text.replace(/\s+/g, " ").trim().slice(0, 150)}`);
}
console.log("");

console.log("COUNT_WITH_REACH members:");
for (const m of members.filter((x) => HAND[x.id] === "COUNT_WITH_REACH")) {
  console.log(`  ${isMine(m.id) ? "[MINE]" : "[    ]"} ${m.id}`);
}
console.log("");

console.log(`P5 — declared limits invisible to my own selector (${invisible.length}):`);
for (const h of invisible) console.log(`  ${h.file}:${h.line}  ${h.heading}`);
console.log("");

if (unmapped.length) {
  console.log("MEMBERS WITH NO HAND VERDICT:");
  for (const id of unmapped) console.log("  " + id);
}
if (orphanVerdicts.length) {
  console.log("HAND VERDICTS NAMING NO MEMBER:");
  for (const id of orphanVerdicts) console.log("  " + id);
}

console.log("legs");
for (const l of legs) console.log(`  ${l.id.padEnd(4)} ${l.state.padEnd(8)} ${l.what}`);

const red = legs.filter((l) => l.state === "RED").map((l) => l.id);
const refused = legs.filter((l) => l.state === "REFUSED").map((l) => l.id);
console.log("");
console.log(
  `VERDICT/1 ${red.length ? "RED" : "GREEN"} legs=${legs.length} red=[${red.join(",")}] refused=[${refused.join(",")}] preds=6 refuted=[${
    [["P1", P1], ["P5", P5], ["P6", P6]].filter(([, v]) => v === false).map(([k]) => k).join(",")
  }] prefused=[${refused.filter((r) => r.startsWith("P")).join(",")}]`,
);
process.exit(red.length ? 1 : 0);
