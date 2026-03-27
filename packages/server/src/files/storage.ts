import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// ── Configuration ────────────────────────────────────────────

/** Max file size: 10 MB (conservative start, bump later) */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Allowed MIME type prefixes (permissive — we can tighten later) */
const ALLOWED_MIME_PREFIXES = [
  'text/',
  'image/',
  'application/json',
  'application/pdf',
  'application/javascript',
  'application/typescript',
  'application/xml',
  'application/yaml',
  'application/x-yaml',
];

// ── Storage directory ────────────────────────────────────────

/**
 * Get the file storage directory.
 * Default: `klatch-files/` sibling to `klatch.db` (project root).
 * Respects `KLATCH_FILES_DIR` env var for testing.
 */
export function getFilesDir(): string {
  if (process.env.KLATCH_FILES_DIR) return process.env.KLATCH_FILES_DIR;
  return path.join(process.cwd(), 'klatch-files');
}

/** Ensure the storage directory exists */
function ensureDir(): void {
  const dir = getFilesDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ── Validation ───────────────────────────────────────────────

export function validateFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): { valid: true } | { valid: false; reason: string } {
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (buffer.length / (1024 * 1024)).toFixed(1);
    return { valid: false, reason: `File too large (${sizeMB} MB). Maximum is 10 MB.` };
  }

  if (buffer.length === 0) {
    return { valid: false, reason: 'File is empty.' };
  }

  const isAllowed = ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
  if (!isAllowed) {
    return { valid: false, reason: `File type "${mimeType}" is not supported.` };
  }

  // Sanitize filename — no path traversal
  const baseName = path.basename(fileName);
  if (baseName !== fileName || fileName.includes('..')) {
    return { valid: false, reason: 'Invalid filename.' };
  }

  return { valid: true };
}

// ── File operations ──────────────────────────────────────────

export interface SavedFile {
  storageKey: string;
  filePath: string;
  sizeBytes: number;
}

/**
 * Save a file to disk. Returns storage key for retrieval.
 * Storage key format: `{uuid}_{sanitized_filename}`
 */
export function saveFile(buffer: Buffer, originalName: string, _mimeType: string): SavedFile {
  ensureDir();

  const sanitized = path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageKey = `${randomUUID()}_${sanitized}`;
  const filePath = path.join(getFilesDir(), storageKey);

  fs.writeFileSync(filePath, buffer);

  return {
    storageKey,
    filePath,
    sizeBytes: buffer.length,
  };
}

/** Get the absolute path for a stored file */
export function getFilePath(storageKey: string): string | null {
  // Prevent path traversal
  const safe = path.basename(storageKey);
  if (safe !== storageKey) return null;

  const filePath = path.join(getFilesDir(), safe);
  if (!fs.existsSync(filePath)) return null;

  return filePath;
}

/** Read a stored file as a Buffer */
export function readFile(storageKey: string): Buffer | null {
  const filePath = getFilePath(storageKey);
  if (!filePath) return null;
  return fs.readFileSync(filePath);
}

/** Delete a stored file */
export function deleteFile(storageKey: string): boolean {
  const filePath = getFilePath(storageKey);
  if (!filePath) return false;
  fs.unlinkSync(filePath);
  return true;
}

// ── MIME helpers ──────────────────────────────────────────────

/** Is this a text-based file that can be inlined in context? */
export function isTextFile(mimeType: string): boolean {
  return (
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/javascript' ||
    mimeType === 'application/typescript' ||
    mimeType === 'application/xml' ||
    mimeType === 'application/yaml' ||
    mimeType === 'application/x-yaml'
  );
}

/** Is this an image the Anthropic API can accept? */
export function isImageFile(mimeType: string): boolean {
  return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType);
}
