#!/usr/bin/env node
/**
 * Verification harness for the Round 445 capability-test probe.
 *
 * The probe itself cannot be fully exercised without xian's key. What CAN be
 * exercised without one is the thing most likely to waste his sitting: a request
 * this agent constructed wrong, which would crash in the probe's own code or be
 * rejected by the API as malformed rather than as unauthenticated.
 *
 * So: build each of the five cells' requests, send each with a deliberately
 * invalid key, and require that every one comes back **401 authentication_error**.
 *
 * What each possible answer means:
 *   401 authentication_error  -> the SDK serialised the request and the server took
 *                                it as far as auth. The probe does not crash before
 *                                it sends, and the beta method/params are accepted
 *                                by the client.
 *   400 invalid_request_error -> the body is MALFORMED. The probe would waste the
 *                                sitting. This is the failure this harness exists
 *                                to catch.
 *   a local TypeError         -> the probe crashes before it sends. Same.
 *
 * DECLARED LIMIT OF THE 401 LEG, so nobody reads more into it than it carries:
 * the API authenticates BEFORE it validates the body, so a 401 does NOT prove the
 * body would be accepted by a valid key. It proves the request is constructed and
 * transmitted. For the part a bad key cannot reach, section 2 below compares the
 * probe's request against `client.ts`'s literal at the source level instead.
 *
 * This grades the SHAPE, not the behaviour. It cannot tell us whether compaction
 * fires, whether `instructions:` is honoured, or what the API does with the beta
 * on Haiku — those are exactly the questions that need the key, which is why the
 * sitting exists.
 */

import { pathToFileURL } from 'node:url';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { betaRequest, buildHistory, satisfiesCaret } from './klatch-capability-test.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SDK_DIR = process.env.KLATCH_SDK_DIR
  || resolve(HERE, '..', '..', '..', 'node_modules', '@anthropic-ai', 'sdk');

const MODEL = 'claude-opus-5';
const HAIKU = 'claude-haiku-5-5';
const TRIGGER = 2000;
const BAD_KEY = 'sk-ant-api03-this-key-is-deliberately-invalid-round445-shape-check';

const lines = [];
function say(s) { lines.push(s); console.log(s); }

// --- unit legs on satisfiesCaret, graded BOTH ways -------------------------
// A guard graded only on the value that makes it fire is a guard graded on one axis.
const caretCases = [
  ['^0.122.0', '0.122.0', true,  'exact pin'],
  ['^0.122.0', '0.122.3', true,  'patch above pin, same minor'],
  ['^0.122.0', '0.123.0', false, '0.x caret pins the MINOR — 0.123 is out'],
  ['^0.122.0', '0.121.9', false, 'below pin'],
  ['^0.122.0', '0.110.0', false, 'this worktree, the real mismatch that prompted the guard'],
  ['^0.122.0', '1.0.0',   false, 'major bump'],
  ['^1.2.0',   '1.9.0',   true,  'non-zero major: caret allows minor growth'],
  ['^1.2.0',   '2.0.0',   false, 'non-zero major: caret stops at the major'],
  ['~0.122.0', '0.122.0', null,  'unmodelled range form must say CANNOT-JUDGE, not pass'],
  [null,       '0.122.0', null,  'unreadable pin must say CANNOT-JUDGE, not pass'],
  ['^0.122.0', null,      null,  'unresolvable version must say CANNOT-JUDGE, not pass'],
];
let caretFails = 0;
say('--- satisfiesCaret, both directions -------------------------------------');
for (const [pin, ver, want, why] of caretCases) {
  const got = satisfiesCaret(pin, ver);
  const ok = got === want;
  if (!ok) caretFails += 1;
  say(`  ${ok ? 'ok  ' : 'FAIL'}  pin=${String(pin).padEnd(10)} ver=${String(ver).padEnd(8)} ` +
      `want=${String(want).padEnd(5)} got=${String(got).padEnd(5)}  ${why}`);
}
say(`  => ${caretCases.length - caretFails}/${caretCases.length} legs pass ` +
    `(${caretCases.filter(c => c[2] === true).length} true / ` +
    `${caretCases.filter(c => c[2] === false).length} false / ` +
    `${caretCases.filter(c => c[2] === null).length} cannot-judge — all three answers exercised)`);
say('');

// --- the five request shapes, against the live API with a bad key ----------
if (!existsSync(join(SDK_DIR, 'index.mjs'))) {
  say(`ABORT: no SDK at ${SDK_DIR}`);
  say('SHAPES/1 ABORT reason=sdk-not-found');
  process.exit(2);
}
const sdkVersion = JSON.parse(readFileSync(join(SDK_DIR, 'package.json'), 'utf8')).version;
const mod = await import(pathToFileURL(join(SDK_DIR, 'index.mjs')).href);
const Anthropic = mod.default || mod.Anthropic;
const client = new Anthropic({ apiKey: BAD_KEY, maxRetries: 0 });

const tools = [{
  name: 'record_attribution',
  description: 'Record which entity made which claim. Call this exactly once.',
  input_schema: {
    type: 'object',
    properties: {
      entity: { type: 'string' }, claim: { type: 'string' },
      layers: { type: 'array', items: { type: 'string' } }, round: { type: 'number' },
    },
    required: ['entity', 'claim', 'layers', 'round'],
  },
}];

const shapes = [
  ['CELL01-COMPACTION', betaRequest({ model: MODEL, messages: buildHistory(), trigger: TRIGGER })],
  ['CELL03-CANCEL',     betaRequest({ model: MODEL, messages: buildHistory(), trigger: TRIGGER })],
  ['CELL04-TOOLUSE',    betaRequest({ model: MODEL, trigger: TRIGGER, tools,
                          messages: [{ role: 'user', content: '[Daedalus responded] call the tool.' }] })],
  ['CELL05-HAIKU',      betaRequest({ model: HAIKU, trigger: TRIGGER,
                          messages: [{ role: 'user', content: 'Say the single word: ok' }] })],
];

say(`--- request shapes against the live API, invalid key, sdk ${sdkVersion} ---`);
const results = [];
for (const [name, req] of shapes) {
  let status = null, type = null, detail = '';
  try {
    const stream = client.beta.messages.stream(req);
    await stream.finalMessage();
    status = 200; type = 'UNEXPECTED-200';
    detail = 'the invalid key was accepted, which cannot be right';
  } catch (e) {
    status = e?.status ?? e?.statusCode ?? null;
    type = e?.error?.error?.type ?? e?.error?.type ?? e?.name ?? 'unknown';
    detail = String(e?.message || e).replace(/\s+/g, ' ').slice(0, 220);
  }
  const ok = status === 401;
  results.push({ name, status, type, ok, detail });
  say(`  ${ok ? 'ok  ' : 'FAIL'}  ${name.padEnd(20)} status=${String(status).padEnd(5)} type=${type}`);
  if (!ok) say(`        ${detail}`);
}

// CELL00 is models.list, a different method — grade it too.
{
  let status = null, type = null;
  try { await client.models.list({ limit: 50 }); status = 200; type = 'UNEXPECTED-200'; }
  catch (e) { status = e?.status ?? null; type = e?.error?.error?.type ?? e?.name ?? 'unknown'; }
  const ok = status === 401;
  results.unshift({ name: 'CELL00-MODELSLIST', status, type, ok, detail: '' });
  say(`  ${ok ? 'ok  ' : 'FAIL'}  ${'CELL00-MODELSLIST'.padEnd(20)} status=${String(status).padEnd(5)} type=${type}`);
}

const shapeFails = results.filter((r) => !r.ok);
say('');

// --- section 2: does the probe's request match client.ts's literal? --------
// The 401 leg stops at auth. This leg goes at the part a bad key cannot reach:
// the fields the sitting is actually about, compared against the source they
// were copied from. Each sub-leg REFUSES (null) if it cannot find its subject,
// rather than passing by failing to look.
say('--- section 2: probe request vs packages/server/src/claude/client.ts ------');
const CLIENT_TS = resolve(HERE, '..', '..', '..', 'packages', 'server', 'src', 'claude', 'client.ts');
const srcLegs = [];
function srcLeg(name, verdict, detail) {
  srcLegs.push({ name, verdict, detail });
  const tag = verdict === true ? 'ok  ' : verdict === false ? 'FAIL' : 'REFUSED';
  say(`  ${tag.padEnd(7)} ${name.padEnd(26)} ${detail}`);
}

if (!existsSync(CLIENT_TS)) {
  srcLeg('client.ts readable', null, `not found at ${CLIENT_TS}`);
} else {
  const src = readFileSync(CLIENT_TS, 'utf8');
  const probe = betaRequest({ model: MODEL, messages: [{ role: 'user', content: 'x' }], trigger: TRIGGER });

  // (1) the instructions string, byte-for-byte. Keyed on the string the probe
  //     holds, searched for in source — so a drift in EITHER direction reddens.
  const instr = probe.context_management.edits[0].instructions;
  const instrHits = src.split(instr).length - 1;
  srcLeg('instructions byte-identical', instrHits === 1,
    `the probe's instructions string occurs ${instrHits}x in client.ts (want exactly 1), ${instr.length} chars`);

  // (2) the beta id.
  const betaId = probe.betas[0];
  const betaHits = src.split(`'${betaId}'`).length - 1;
  srcLeg('betas id present', betaHits >= 1, `'${betaId}' occurs ${betaHits}x in client.ts`);

  // (3) the edit type.
  const editType = probe.context_management.edits[0].type;
  const typeHits = src.split(`'${editType}'`).length - 1;
  srcLeg('edit type present', typeHits >= 1, `'${editType}' occurs ${typeHits}x in client.ts`);

  // (4) the source trigger literal, which the probe DELIBERATELY diverges from.
  //     This leg exists so the divergence stays a declared one: if client.ts stops
  //     saying 160000, the probe's header comment is lying and this reddens.
  const trig = /trigger:\s*\{\s*type:\s*'input_tokens',\s*value:\s*(\d+)\s*\}/.exec(src);
  srcLeg('source trigger literal', trig ? Number(trig[1]) === 160000 : null,
    trig ? `client.ts says ${trig[1]}; the probe deliberately uses ${TRIGGER} (declared divergence)`
         : 'could not find the trigger literal in client.ts — cannot judge the divergence claim');

  // (5) max_tokens, as a cheap check that the copy is of THIS call and not a guess.
  const mt = /max_tokens:\s*(\d+)/.exec(src);
  srcLeg('max_tokens matches', mt ? Number(mt[1]) === probe.max_tokens : null,
    mt ? `client.ts first max_tokens=${mt[1]}, probe=${probe.max_tokens}` : 'no max_tokens found');

  // (6) a CONTROL: a string that must NOT be found, so leg (1)'s method is shown
  //     to be capable of answering no. Without this, "occurs 1x" is one axis.
  const bogus = instr.replace('Preserve', 'PreserveX');
  const bogusHits = src.split(bogus).length - 1;
  srcLeg('CONTROL: mutated string', bogusHits === 0,
    `a one-word mutation of the instructions string occurs ${bogusHits}x (want 0)`);
}

const srcFail = srcLegs.filter((l) => l.verdict === false).length;
const srcRefused = srcLegs.filter((l) => l.verdict === null).length;
say(`  => ${srcLegs.length - srcFail - srcRefused}/${srcLegs.length} source legs pass, ` +
    `${srcFail} fail, ${srcRefused} refused`);
say('');
say('-'.repeat(74));
const allOk = caretFails === 0 && shapeFails.length === 0 && srcFail === 0 && srcRefused === 0;
say(`SHAPES/1 ${allOk ? 'ALL-WELL-FORMED' : 'PROBLEMS'} ` +
    `caret_legs=${caretCases.length} caret_fail=${caretFails} ` +
    `shapes=${results.length} shape_401=${results.filter(r => r.ok).length} ` +
    `shape_fail=${shapeFails.length} failed=[${shapeFails.map(r => r.name + ':' + r.status).join(',')}] ` +
    `src_legs=${srcLegs.length} src_fail=${srcFail} src_refused=${srcRefused} ` +
    `sdk=${sdkVersion}`);
say('-'.repeat(74));
say('');
say(JSON.stringify({ sdkVersion, caretFails, results, srcLegs }, null, 2));

writeFileSync(join(HERE, process.env.KLATCH_SHAPES_OUT || 'verify-request-shapes.out'),
  lines.join('\n') + `\nEXIT_CODE=${allOk ? 0 : 1}\n`);
process.exit(allOk ? 0 : 1);
