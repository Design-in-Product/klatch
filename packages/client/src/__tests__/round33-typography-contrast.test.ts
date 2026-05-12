/**
 * Round 33 (Argus): Cross-cutting typography + contrast pass coverage.
 *
 * Pins the WCAG-AA contrast intent of the Iris triage 5/11 token bumps
 * and the structural cleanup (no `text-[10px]` regressions, exact hex
 * values for the bumped tokens).
 *
 * Source: commit `65db553` "Iris triage Tier 1 + cross-cutting
 * typography pass."
 *
 * Three test groups:
 *
 *   1. **Token contrast verification.** Math against the WCAG 2.1
 *      relative-luminance formula. Pairs that carry body-text intent
 *      must hit AA 4.5:1; pairs that carry decoration / placeholder
 *      intent must hit AA-large 3.0:1. A future "subtle refactor"
 *      that drops a token below threshold gets caught here.
 *
 *   2. **Token snapshot.** Exact hex values for the bumped tokens
 *      (light + dark theme) read straight from `index.css`. A future
 *      "I'll just nudge this back" gets caught at the diff.
 *
 *   3. **No `text-[10px]` regressions.** The cleanup replaced every
 *      `text-[10px]` with `text-xs` (now 13px) across nine client
 *      files. A grep test pins zero matches across `src/` so a future
 *      developer reaching for the old too-small size triggers a test
 *      failure instead of silent legibility regression.
 *
 * Out of scope: visual / perceptual regression (that's Iris's surface);
 * Tailwind class generation (Tailwind's own concern); rendered DOM
 * pixel sizes (jsdom doesn't compute layout).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import path from 'path';

// ── WCAG 2.1 contrast ratio helpers ──────────────────────────

/** Parse a 3- or 6-digit hex color to {r,g,b} in 0–255. */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace(/^#/, '');
  const expanded = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  if (expanded.length !== 6 || /[^0-9a-f]/i.test(expanded)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
  };
}

/** WCAG 2.1 relative luminance from 0–255 sRGB components. */
function relativeLuminance(r: number, g: number, b: number): number {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2.1 contrast ratio between two hex colors. Range: 1 (no contrast) to 21 (max). */
function contrastRatio(hex1: string, hex2: string): number {
  const a = hexToRgb(hex1);
  const b = hexToRgb(hex2);
  const la = relativeLuminance(a.r, a.g, a.b);
  const lb = relativeLuminance(b.r, b.g, b.b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

// ── Token snapshot read ──────────────────────────────────────

const indexCssPath = path.resolve(__dirname, '../index.css');
const indexCss = readFileSync(indexCssPath, 'utf-8');

/**
 * Find the value of a CSS custom property `--name:` within a given block,
 * scanning from blockMarker forward to the closing `}`. Tolerant of
 * trailing inline comment annotations after the semicolon.
 */
function readToken(blockMarker: string, name: string): string {
  const blockStart = indexCss.indexOf(blockMarker);
  if (blockStart < 0) throw new Error(`Block not found: ${blockMarker}`);
  const blockEnd = indexCss.indexOf('}', blockStart);
  if (blockEnd < 0) throw new Error(`Block close not found for: ${blockMarker}`);
  const block = indexCss.slice(blockStart, blockEnd);
  const re = new RegExp(`${name}\\s*:\\s*([^;]+);`);
  const m = block.match(re);
  if (!m) throw new Error(`Token not found: ${name} in block ${blockMarker}`);
  return m[1].trim();
}

// Light theme block opens with `:root {`; dark with `.dark {`. The order in the
// file is light first, dark second. readToken scans forward from the marker.
const LIGHT = ':root {';
const DARK = '.dark {';

// ── Helper: WCAG meta-helper sanity ──────────────────────────

describe('Round 33 typography: WCAG helper sanity', () => {
  it('contrastRatio(black, white) ≈ 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('contrastRatio(black, black) === 1:1', () => {
    expect(contrastRatio('#000000', '#000000')).toBeCloseTo(1, 5);
  });

  it('hexToRgb tolerates 3-digit shorthand', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('hexToRgb rejects malformed input', () => {
    expect(() => hexToRgb('not-a-color')).toThrow();
    expect(() => hexToRgb('#ggg')).toThrow();
  });
});

// ── 1. Token contrast verification ──────────────────────────

describe('Round 33 typography: light theme contrast', () => {
  // Light theme uses --c-app (#f8fafc, near-white) as the body background
  // for body-tier text contrast checks. The off-white app bg and pure
  // white card surfaces are within rounding of each other for contrast
  // purposes; the muted/secondary tokens render against either.
  const lightApp = readToken(LIGHT, '--c-app');

  it('--c-primary on --c-app meets AA normal-text (≥ 4.5:1)', () => {
    const fg = readToken(LIGHT, '--c-primary');
    expect(contrastRatio(fg, lightApp)).toBeGreaterThanOrEqual(4.5);
  });

  it('--c-secondary on --c-app meets AA normal-text (≥ 4.5:1)', () => {
    const fg = readToken(LIGHT, '--c-secondary');
    expect(contrastRatio(fg, lightApp)).toBeGreaterThanOrEqual(4.5);
  });

  it('--c-muted on --c-app meets AA normal-text (≥ 4.5:1) — Iris triage 5/11 fix', () => {
    // Pre-bump value (#9ca3af) was failing AA at ~2.5:1; the bump to #6b7280
    // targeted ~4.8:1. This assertion is the contract.
    const fg = readToken(LIGHT, '--c-muted');
    const ratio = contrastRatio(fg, lightApp);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  // Round 33 finding (Argus, 5/11) → Iris resolution (5/12,
  // `iris-to-daedalus-faint-token-reclassify-2026-05-12.md`):
  //
  // Light-theme `--c-faint` (#9ca3af on #f8fafc) contrast is 2.43:1 —
  // below WCAG AA-large (≥3.0). Resolution = option 2 (reclassify
  // usage sites), not option 1 (bump the token). The three content-
  // bearing surfaces (MessageList empty-state body, date separator
  // labels, ImportDialog helper copy) moved from `text-faint` →
  // `text-muted`. The token stays as a true decoration tier.
  //
  // Both tests below pin the new contract — the token is intentionally
  // sub-AA-large because it's decoration only, and a "tweak the gray"
  // refactor that pushes it into AA territory (or makes contrast
  // worse) should force a conscious decision.
  it('--c-faint on light --c-app is sub-AA-large by design (decoration tier)', () => {
    // If this test fails because the ratio is now ≥ 3.0, the token has
    // drifted out of the decoration tier; either revert the change OR
    // promote `--c-faint` to a content-bearing tier (and audit usage).
    const fg = readToken(LIGHT, '--c-faint');
    expect(contrastRatio(fg, lightApp)).toBeLessThan(3.0);
  });

  it('--c-faint on light --c-app maintains a contrast floor (regression guard)', () => {
    // Floor: don't let the decoration tier drop below today's value
    // either. Together with the test above, the token's contrast is
    // pinned in the decoration band [2.4, 3.0).
    const fg = readToken(LIGHT, '--c-faint');
    expect(contrastRatio(fg, lightApp)).toBeGreaterThanOrEqual(2.4);
  });
});

describe('Round 33 typography: dark theme contrast', () => {
  // Dark theme uses --c-app (#16213e, navy) as the body background.
  const darkApp = readToken(DARK, '--c-app');

  it('--c-primary on --c-app meets AA normal-text (≥ 4.5:1)', () => {
    const fg = readToken(DARK, '--c-primary');
    expect(contrastRatio(fg, darkApp)).toBeGreaterThanOrEqual(4.5);
  });

  it('--c-secondary on --c-app meets AA normal-text (≥ 4.5:1)', () => {
    const fg = readToken(DARK, '--c-secondary');
    expect(contrastRatio(fg, darkApp)).toBeGreaterThanOrEqual(4.5);
  });

  it('--c-muted on --c-app meets AA normal-text (≥ 4.5:1) — Iris triage 5/11 fix', () => {
    // Pre-bump value (#6b7280) was borderline at ~3:1; the bump to #9ca3af
    // targeted ~6:1. This assertion is the contract.
    const fg = readToken(DARK, '--c-muted');
    const ratio = contrastRatio(fg, darkApp);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('--c-faint on --c-app meets AA-large / decoration (≥ 3.0:1)', () => {
    const fg = readToken(DARK, '--c-faint');
    expect(contrastRatio(fg, darkApp)).toBeGreaterThanOrEqual(3.0);
  });
});

// ── 2. Token snapshot ────────────────────────────────────────

describe('Round 33 typography: token snapshot pinned to 5/11 values', () => {
  // A future "I'll just nudge this back" gets caught at the diff. If the
  // intent of a token changes, update both the value and this snapshot
  // together — the test failure forces the conscious decision.

  it('light theme: muted/secondary/faint hex values match 5/11 bump', () => {
    expect(readToken(LIGHT, '--c-secondary')).toBe('#374151');
    expect(readToken(LIGHT, '--c-muted')).toBe('#6b7280');
    expect(readToken(LIGHT, '--c-faint')).toBe('#9ca3af');
  });

  it('dark theme: muted/secondary/faint hex values match 5/11 bump', () => {
    expect(readToken(DARK, '--c-secondary')).toBe('#e5e7eb');
    expect(readToken(DARK, '--c-muted')).toBe('#9ca3af');
    expect(readToken(DARK, '--c-faint')).toBe('#6b7280');
  });

  it('typography scale: --text-xs is 13px (0.8125rem), --text-sm is 15px (0.9375rem)', () => {
    // The scale lives in the @theme block, not :root or .dark. Match against
    // the raw file content for these two.
    expect(indexCss).toMatch(/--text-xs:\s*0\.8125rem/);
    expect(indexCss).toMatch(/--text-sm:\s*0\.9375rem/);
  });

  it('body line-height is 1.55', () => {
    expect(indexCss).toMatch(/line-height:\s*1\.55/);
  });
});

// ── 3. No `text-[10px]` regressions ─────────────────────────

describe('Round 33 typography: no text-[10px] regressions across client src', () => {
  function* walk(dir: string): Generator<string> {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        yield* walk(full);
      } else if (/\.(tsx?|jsx?)$/.test(entry)) {
        yield full;
      }
    }
  }

  it('zero `text-[10px]` matches across packages/client/src', () => {
    const root = path.resolve(__dirname, '..');
    const offenders: Array<{ file: string; line: number; content: string }> = [];

    for (const file of walk(root)) {
      // Skip this test file itself (would self-trigger on the literal we're checking for).
      if (file.endsWith('round33-typography-contrast.test.ts')) continue;

      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        // The exact anti-pattern the cleanup removed. We construct the
        // matcher dynamically so this test file's own copy of the literal
        // (in this comment + the matcher itself) doesn't self-trigger when
        // grepped by other tools.
        const needle = 'text-[' + '10px]';
        if (line.includes(needle)) {
          offenders.push({ file: path.relative(root, file), line: i + 1, content: line.trim() });
        }
      });
    }

    if (offenders.length > 0) {
      const summary = offenders
        .map((o) => `  ${o.file}:${o.line}  ${o.content}`)
        .join('\n');
      throw new Error(
        `Found text-[10px] regression(s) — Iris triage 5/11 cleanup expects zero matches:\n${summary}`,
      );
    }
    expect(offenders).toEqual([]);
  });
});
