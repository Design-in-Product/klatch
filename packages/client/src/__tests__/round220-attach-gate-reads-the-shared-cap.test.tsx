/**
 * Round 220 — the browser's attach gate enforces the *shared* cap, not a copy.
 *
 * ## Why this is the enforcer that mattered most
 *
 * Theseus's Round 219 §6(a) named two disagreeing sentences, both server-side.
 * Grepping for the literal found a third enforcer he had no reason to look at:
 * `MessageInput.handleFileSelect` held `file.size > 10 * 1024 * 1024` and
 * `'File too large. Maximum size is 10 MB.'`, neither derived from anything.
 *
 * A disagreeing *sentence* is a confusing error message. A disagreeing
 * *threshold* here is worse than that: it produces no error message at all on
 * the server side, because the request is never sent. Raise the server cap to
 * 20 MB and this gate keeps refusing 15 MB files, with the server perfectly
 * willing to take them and no log line anywhere saying so.
 *
 * ## Driven at a cap the constant does not hold
 *
 * `@klatch/shared` is mocked to 2 MB — a value no literal in the tree holds —
 * so a re-hardcoded `10 * 1024 * 1024` in the component reddens the threshold
 * checks and a re-hardcoded `10 MB` reddens the sentence check. At the shipped
 * cap both would pass; that is the whole reason for the mock (Round 219 §6(a):
 * *"only mutating the constant shows it"*).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const MOCK_CAP = vi.hoisted(() => 2 * 1024 * 1024);

vi.mock('@klatch/shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@klatch/shared')>()),
  MAX_FILE_SIZE_BYTES: MOCK_CAP,
}));

const { MessageInput, attachmentTooLargeMessage } = await import('../components/MessageInput');
const { MAX_FILE_SIZE_BYTES } = await import('@klatch/shared');

/**
 * A File of a declared size without allocating it. The gate reads `file.size`
 * and nothing else, so this exercises the real predicate; allocating 3 MB in
 * jsdom for every case would buy nothing.
 */
function fileOfSize(bytes: number, name = 'attachment.txt'): File {
  const f = new File(['x'], name, { type: 'text/plain' });
  Object.defineProperty(f, 'size', { value: bytes });
  return f;
}

function renderInput() {
  render(
    <MessageInput
      onSend={vi.fn()}
      onSendWithFile={vi.fn()}
      disabled={false}
      isStreaming={false}
    />
  );
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

let alerted: string[];

beforeEach(() => {
  alerted = [];
  vi.stubGlobal('alert', (msg: string) => alerted.push(msg));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Round 220 — attachmentTooLargeMessage', () => {
  it('names whatever cap it is given', () => {
    expect(attachmentTooLargeMessage(2 * 1024 * 1024)).toBe(
      'File too large. Maximum size is 2 MB.'
    );
    expect(attachmentTooLargeMessage(10 * 1024 * 1024)).toBe(
      'File too large. Maximum size is 10 MB.'
    );
  });

  it('keeps its own voice — no measured size, unlike either server sentence', () => {
    // The server's two refusals both report the size they saw ("3.0 MB",
    // "200.0 MB uploaded") because they have one. The browser is refusing a
    // file the user is looking at. Sharing the number must not have collapsed
    // the three into one string.
    const msg = attachmentTooLargeMessage(MOCK_CAP);

    expect(msg).not.toMatch(/\(.*MB.*\)/);
    expect(msg).not.toContain('uploaded');
  });

  it('has no default cap — the argument is required', () => {
    // Same structural check as the server file, for the same reason: a default
    // binds the declaring module's constant, which `vi.mock` does not replace,
    // so a defaulted call would answer about a different limit than the gate.
    expect(attachmentTooLargeMessage.length).toBe(1);
  });
});

describe('Round 220 — the gate itself', () => {
  it('the component under test is running the mocked cap, not 10 MB', () => {
    // Premise check. Without it, a mock that failed to apply leaves every
    // assertion below passing against the shipped cap and proving nothing.
    expect(MAX_FILE_SIZE_BYTES).toBe(MOCK_CAP);
    expect(MAX_FILE_SIZE_BYTES).not.toBe(10 * 1024 * 1024);
  });

  it('refuses a file over the mocked cap, and says the mocked cap', () => {
    // 3 MB is comfortably under the shipped 10 MB. A component still holding
    // its own literal accepts this file silently.
    const input = renderInput();

    fireEvent.change(input, { target: { files: [fileOfSize(3 * 1024 * 1024)] } });

    expect(alerted).toEqual(['File too large. Maximum size is 2 MB.']);
    expect(screen.queryByText('attachment.txt')).not.toBeInTheDocument();
  });

  it('accepts a file under the mocked cap — the threshold moved, it did not just tighten', () => {
    const input = renderInput();

    fireEvent.change(input, { target: { files: [fileOfSize(1024 * 1024)] } });

    expect(alerted).toEqual([]);
    expect(screen.getByText('attachment.txt')).toBeInTheDocument();
  });

  it('a file of exactly the cap is accepted; one byte more is not', () => {
    // The boundary, stated on both sides. `>` not `>=` — `validateFile` on the
    // server uses `buffer.length > MAX_FILE_SIZE_BYTES`, and a browser gate
    // that refused the exact cap would reject a file the server accepts, which
    // is the same divergence in the other direction.
    const atCap = renderInput();
    fireEvent.change(atCap, { target: { files: [fileOfSize(MOCK_CAP, 'exact.txt')] } });

    expect(alerted).toEqual([]);
    expect(screen.getByText('exact.txt')).toBeInTheDocument();

    const overByOne = renderInput();
    fireEvent.change(overByOne, { target: { files: [fileOfSize(MOCK_CAP + 1, 'over.txt')] } });

    expect(alerted).toEqual(['File too large. Maximum size is 2 MB.']);
    expect(screen.queryByText('over.txt')).not.toBeInTheDocument();
  });
});
