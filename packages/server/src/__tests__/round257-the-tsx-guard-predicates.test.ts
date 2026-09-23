/**
 * Round 257 — `scripts/lib/tsx-required.mjs` under `npm test`.
 *
 * ## Why this file exists
 *
 * `tsx-required.mjs` is the shared predicate that turns "this script was run under plain `node`"
 * into a legible exit 2 instead of a raw stack trace naming a file that is not missing. Nine
 * scripts call it. It had **no `npm test` coverage** — it was one of three modules left on
 * `probe-round245-the-shared-lib-coverage-floor.mts`'s uncovered list, and its only exercise was
 * `scripts/verify-tsx-guard.mjs`, which nothing schedules.
 *
 * That gap is not theoretical. This fire found `verify-tsx-guard.mjs` **red since 2026-09-19** —
 * its own scanner had no model of `${ … }` interpolation — and the red had gone unread for four
 * days because the only thing that runs it is a person remembering to. See
 * `scripts/probe-round257-the-scanner-had-no-model-of-interpolation.mts`.
 *
 * ## Synthesised errors, and the control that keeps them honest
 *
 * Most rows below hand the predicates a constructed `Error`. That is only sound if the constructed
 * shape is the shape the running node actually throws, which is the assumption
 * `verify-tsx-guard.mjs` §(b2) exists to stop anyone making silently. Measured on node v26.5.0,
 * 2026-09-23, by importing real fixtures:
 *
 *     ERR_MODULE_NOT_FOUND       own props: stack, code, url, message   url: file:// the MISSING path
 *     ERR_UNKNOWN_FILE_EXTENSION own props: stack, message, code        url: absent — message parsed
 *     ERR_UNSUPPORTED_DIR_IMPORT own props: stack, code, url, message   url: file:// the directory
 *
 * A frozen record of a measurement goes stale exactly like a doc does, so the last `describe` here
 * re-derives all three from the running node at test time and asserts the predicates accept them.
 * If a node release changes a code, a property or a message format, that block goes red rather than
 * this file quietly testing a shape node no longer produces.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

// @ts-expect-error — plain ESM helper shared with scripts/, no types by design. One line because
// `@ts-expect-error` suppresses the next LINE, and a multi-line import reports at its specifier.
import { TS_EXTENSIONS, TSX_JS_SPECIFIER_EXTENSIONS, TSX_LOADABLE_EXTENSIONS, TS_DIR_INDEX_EXTENSIONS, isTsResolutionFailure, isTsExtensionFailure, isTsDirImportFailure } from '../../../../scripts/lib/tsx-required.mjs';

/** A directory whose path contains a `packages` segment, which `isTsResolutionFailure` requires. */
let root: string;
/** `<root>/packages/server/src/db` — where the sibling-file fixtures live. */
let db: string;

const err = (code: string, extra: Record<string, unknown>) =>
  Object.assign(new Error(String(extra.message ?? code)), { code, ...extra });

const moduleNotFound = (missing: string) =>
  err('ERR_MODULE_NOT_FOUND', {
    url: pathToFileURL(missing).href,
    message: `Cannot find module '${missing}' imported from ${join(db, 'queries.ts')}`,
  });

const unknownExtension = (file: string, ext: string) =>
  err('ERR_UNKNOWN_FILE_EXTENSION', { message: `Unknown file extension "${ext}" for ${file}` });

const dirImport = (dir: string) =>
  err('ERR_UNSUPPORTED_DIR_IMPORT', {
    url: pathToFileURL(dir).href,
    message: `Directory import '${dir}' is not supported resolving ES modules`,
  });

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'klatch-r257-'));
  db = join(root, 'packages', 'server', 'src', 'db');
  mkdirSync(db, { recursive: true });
  // Siblings the resolution predicate may find. One per extension it cares about, plus extensions
  // it must NOT accept.
  writeFileSync(join(db, 'hasTs.ts'), 'export const a = 1;\n');
  writeFileSync(join(db, 'hasTsx.tsx'), 'export const a = 1;\n');
  writeFileSync(join(db, 'hasJsx.jsx'), 'export const a = 1;\n');
  writeFileSync(join(db, 'hasMts.mts'), 'export const a = 1;\n');
  writeFileSync(join(db, 'hasCts.cts'), 'export const a = 1;\n');
  writeFileSync(join(db, 'hasJson.json'), '{}\n');
  writeFileSync(join(db, 'extensionless.ts'), 'export const a = 1;\n');
  // Directory-index fixtures.
  for (const [dir, file] of [['dirTs', 'index.ts'], ['dirTsx', 'index.tsx'], ['dirMts', 'index.mts'], ['dirEmpty', null]] as const) {
    mkdirSync(join(root, dir), { recursive: true });
    if (file) writeFileSync(join(root, dir, file), 'export const a = 1;\n');
  }
  writeFileSync(join(root, 'real.tsx'), 'export const C = 1;\n');
  writeFileSync(join(root, 'real.css'), '.a { color: red }\n');
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('the three extension sets are distinct, and that is the point', () => {
  // Round 137 measured these apart from one another after Round 128 merged them. They agree on
  // enough rows to look mergeable on inspection, so the disagreements are asserted by name.
  it('TS_EXTENSIONS is longest-first, so a `ts|tsx` alternation cannot shadow `.tsx`', () => {
    expect(TS_EXTENSIONS.indexOf('.tsx')).toBeLessThan(TS_EXTENSIONS.indexOf('.ts'));
  });

  it('`.mts` is loadable but is NOT something tsx resolves a `.js` specifier onto', () => {
    expect(TSX_LOADABLE_EXTENSIONS).toContain('.mts');
    expect(TSX_JS_SPECIFIER_EXTENSIONS).not.toContain('.mts');
  });

  it('`.jsx` is in both runtime sets and is not TypeScript', () => {
    expect(TSX_JS_SPECIFIER_EXTENSIONS).toContain('.jsx');
    expect(TSX_LOADABLE_EXTENSIONS).toContain('.jsx');
    expect(TS_EXTENSIONS).not.toContain('.jsx');
  });

  it('TS_DIR_INDEX_EXTENSIONS is narrower than TS_EXTENSIONS — `.mts`/`.cts` are a false remedy', () => {
    expect(TS_DIR_INDEX_EXTENSIONS).toEqual(['.tsx', '.ts']);
    for (const e of ['.mts', '.cts']) expect(TS_DIR_INDEX_EXTENSIONS).not.toContain(e);
  });

  it('the sets are not all equal — a future merge has to break a test, not just a docblock', () => {
    const asKey = (xs: readonly string[]) => [...xs].sort().join(',');
    const keys = new Set([TS_EXTENSIONS, TSX_JS_SPECIFIER_EXTENSIONS, TSX_LOADABLE_EXTENSIONS, TS_DIR_INDEX_EXTENSIONS].map(asKey));
    expect(keys.size).toBe(4);
  });
});

describe('isTsResolutionFailure', () => {
  it('fires on a `.js` specifier with a `.ts` sibling under packages/', () => {
    expect(isTsResolutionFailure(moduleNotFound(join(db, 'hasTs.js')))).toBe(true);
  });

  it('fires on an EXTENSIONLESS specifier — the Round 137 under-fire', () => {
    // `import './x'` inside a .ts raises ERR_MODULE_NOT_FOUND with a url carrying no extension.
    expect(isTsResolutionFailure(moduleNotFound(join(db, 'extensionless')))).toBe(true);
  });

  it('fires for `.tsx` and `.jsx` siblings too', () => {
    expect(isTsResolutionFailure(moduleNotFound(join(db, 'hasTsx.js')))).toBe(true);
    expect(isTsResolutionFailure(moduleNotFound(join(db, 'hasJsx.js')))).toBe(true);
  });

  it('DECLINES on `.mts`/`.cts` siblings — tsx will not resolve a `.js` specifier onto them', () => {
    // The soundness case: re-running under tsx is a remedy that does not work here, so the guard
    // must re-throw rather than print it. This is Round 136 §2's over-fire.
    expect(isTsResolutionFailure(moduleNotFound(join(db, 'hasMts.js')))).toBe(false);
    expect(isTsResolutionFailure(moduleNotFound(join(db, 'hasCts.js')))).toBe(false);
  });

  it('DECLINES when nothing sits beside the missing file — a real absence is re-thrown', () => {
    expect(isTsResolutionFailure(moduleNotFound(join(db, 'genuinelyGone.js')))).toBe(false);
  });

  it('DECLINES outside packages/', () => {
    expect(isTsResolutionFailure(moduleNotFound(join(root, 'hasTs.js')))).toBe(false);
  });

  it('DECLINES on some other extension, and on a non-file url', () => {
    expect(isTsResolutionFailure(moduleNotFound(join(db, 'hasJson.css')))).toBe(false);
    expect(isTsResolutionFailure(err('ERR_MODULE_NOT_FOUND', { url: 'https://example.com/x.js' }))).toBe(false);
  });

  it('DECLINES on a different code, a missing url, and a non-error', () => {
    expect(isTsResolutionFailure(err('ERR_UNKNOWN_FILE_EXTENSION', { url: pathToFileURL(join(db, 'hasTs.js')).href }))).toBe(false);
    expect(isTsResolutionFailure(err('ERR_MODULE_NOT_FOUND', {}))).toBe(false);
    expect(isTsResolutionFailure(null)).toBe(false);
    expect(isTsResolutionFailure(undefined)).toBe(false);
  });

  it('the packages/ conjunct means a path SEGMENT, not a substring', () => {
    // `…/mypackages/…` must not satisfy it. Asserted because the check is a string `includes`
    // bounded by separators, and that boundedness is the whole of its precision.
    const odd = join(root, 'mypackages', 'db');
    mkdirSync(odd, { recursive: true });
    writeFileSync(join(odd, 'x.ts'), 'export const a = 1;\n');
    expect(join(odd, 'x.js')).toContain('packages');
    expect(isTsResolutionFailure(moduleNotFound(join(odd, 'x.js')))).toBe(false);
    expect(`${sep}packages${sep}`).toBeTruthy();
  });
});

describe('isTsExtensionFailure', () => {
  it('fires on a real `.tsx` that node refused at format detection', () => {
    expect(isTsExtensionFailure(unknownExtension(join(root, 'real.tsx'), '.tsx'))).toBe(true);
  });

  it('DECLINES on `.css` — an unloadable import is not a runner problem', () => {
    // The over-fire this family's header calls item 1: tsx cannot run a .css either, so "re-run
    // under tsx" would be a false remedy.
    expect(isTsExtensionFailure(unknownExtension(join(root, 'real.css'), '.css'))).toBe(false);
  });

  it('DECLINES when the named file is not on disk', () => {
    expect(isTsExtensionFailure(unknownExtension(join(root, 'absent.tsx'), '.tsx'))).toBe(false);
  });

  it('FAILS CLOSED on a message it cannot parse', () => {
    // The path is parsed out of prose because node attaches no structured field for it. A node
    // release that reformats this message must make the predicate decline, never guess.
    expect(isTsExtensionFailure(err('ERR_UNKNOWN_FILE_EXTENSION', { message: 'Unknown file extension for reasons' }))).toBe(false);
    expect(isTsExtensionFailure(err('ERR_UNKNOWN_FILE_EXTENSION', { message: '' }))).toBe(false);
  });

  it('reads only the first line of a multi-line message', () => {
    const e = unknownExtension(join(root, 'real.tsx'), '.tsx');
    e.message = `${e.message}\n    at someFrame`;
    expect(isTsExtensionFailure(e)).toBe(true);
  });
});

describe('isTsDirImportFailure', () => {
  it('fires on a directory holding index.ts or index.tsx', () => {
    expect(isTsDirImportFailure(dirImport(join(root, 'dirTs')))).toBe(true);
    expect(isTsDirImportFailure(dirImport(join(root, 'dirTsx')))).toBe(true);
  });

  it('DECLINES on a directory holding only index.mts — tsx fails there too', () => {
    expect(isTsDirImportFailure(dirImport(join(root, 'dirMts')))).toBe(false);
  });

  it('DECLINES on a directory with no index, and on a path that is not a directory', () => {
    expect(isTsDirImportFailure(dirImport(join(root, 'dirEmpty')))).toBe(false);
    expect(isTsDirImportFailure(dirImport(join(root, 'real.tsx')))).toBe(false);
    expect(isTsDirImportFailure(dirImport(join(root, 'nothing-here')))).toBe(false);
  });

  it('has NO packages/ conjunct, unlike isTsResolutionFailure', () => {
    // Deliberate: node found the directory and declined to look inside it, so there is no
    // "genuinely missing" reading to separate out. Asserted so the asymmetry is not read as an
    // oversight and quietly "fixed".
    expect(isTsDirImportFailure(dirImport(join(root, 'dirTs')))).toBe(true);
    expect(join(root, 'dirTs')).not.toContain(`${sep}packages${sep}`);
  });
});

describe('the synthesised shapes are the shapes the RUNNING node throws', () => {
  // The control on every row above. Re-derived at test time from real imports, so a node release
  // that changes a code, drops a property or reformats a message turns this red instead of leaving
  // the rest of the file testing a shape that no longer occurs.
  //
  // **It must run in a CHILD `node`, and the first version of this block did not — it went red and
  // that red is the finding.** Under vitest the import is served by vite's module runner, which
  // resolves `.ts`, `.tsx` and directory indexes perfectly well. So an in-process `await import()`
  // of these fixtures throws nothing at all, and a control written that way would have been
  // measuring the wrong runner while claiming to measure plain node. The subject of this whole
  // module is "which loader is this?"; asking that question from inside the wrong one is the
  // module's own defect, in its test.
  let real: Record<string, { code?: string; url?: string; message: string; own: string[] }>;

  beforeAll(() => {
    // Under `db`, not under `root`: the resolution predicate requires a `packages` path segment,
    // so a fixture placed anywhere else makes it decline — correctly. The first version of this
    // block put them in `<root>/live` and the row below went red against a predicate doing its job.
    const fx = join(db, 'live');
    mkdirSync(join(fx, 'dirimp'), { recursive: true });
    writeFileSync(join(fx, 'outer.ts'), "import './inner.js';\nexport const a = 1;\n");
    writeFileSync(join(fx, 'inner.ts'), 'export const b = 2;\n');
    writeFileSync(join(fx, 'comp.tsx'), 'export const C = 1;\n');
    writeFileSync(join(fx, 'dirimp', 'index.ts'), 'export const d = 4;\n');

    const probe = `
      const out = {};
      for (const [k, p] of Object.entries(${JSON.stringify({
        resolution: join(fx, 'outer.ts'),
        extension: join(fx, 'comp.tsx'),
        directory: join(fx, 'dirimp'),
      })})) {
        try { await import(new URL('file://' + p).href); out[k] = null; }
        catch (e) { out[k] = { code: e.code, url: e.url, message: String(e.message), own: Object.getOwnPropertyNames(e) }; }
      }
      process.stdout.write(JSON.stringify(out));
    `;
    const run = spawnSync(process.execPath, ['--input-type=module', '-e', probe], { encoding: 'utf8' });
    expect(run.status, `child node failed: ${run.stderr}`).toBe(0);
    real = JSON.parse(run.stdout);
  });

  it('plain node refuses all three — if it stopped, every synthesised row above is moot', () => {
    for (const k of ['resolution', 'extension', 'directory']) {
      expect(real[k], `node loaded the ${k} fixture instead of refusing it`).not.toBeNull();
    }
  });

  it('each of the three wrong-runner shapes still occurs, with the code this module keys on', () => {
    expect(real.resolution?.code).toBe('ERR_MODULE_NOT_FOUND');
    expect(real.extension?.code).toBe('ERR_UNKNOWN_FILE_EXTENSION');
    expect(real.directory?.code).toBe('ERR_UNSUPPORTED_DIR_IMPORT');
  });

  it('`url` is present on two of the three and absent on the extension shape', () => {
    expect(typeof real.resolution.url).toBe('string');
    expect(typeof real.directory.url).toBe('string');
    expect(real.extension.url).toBeUndefined();
    expect(real.extension.own).not.toContain('url');
  });

  it('the extension message still parses under the predicate’s regex', () => {
    expect(/^Unknown file extension "([^"]*)" for (.+)$/.test(real.extension.message.split('\n')[0])).toBe(true);
  });

  it('the predicates accept the real errors, not just the constructed ones', () => {
    expect(isTsResolutionFailure(Object.assign(new Error(real.resolution.message), { code: real.resolution.code, url: real.resolution.url }))).toBe(true);
    expect(isTsExtensionFailure(Object.assign(new Error(real.extension.message), { code: real.extension.code }))).toBe(true);
    expect(isTsDirImportFailure(Object.assign(new Error(real.directory.message), { code: real.directory.code, url: real.directory.url }))).toBe(true);
  });
});
