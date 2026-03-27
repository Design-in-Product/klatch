/** Map language identifiers to file extensions */
const LANG_EXTENSIONS: Record<string, string> = {
  typescript: 'ts', javascript: 'js', python: 'py', rust: 'rs', go: 'go',
  java: 'java', css: 'css', html: 'html', json: 'json', yaml: 'yml',
  markdown: 'md', md: 'md', sql: 'sql', bash: 'sh', shell: 'sh', sh: 'sh',
  tsx: 'tsx', jsx: 'jsx', ts: 'ts', js: 'js', py: 'py',
  toml: 'toml', xml: 'xml', ruby: 'rb', php: 'php', swift: 'swift',
  kotlin: 'kt', scala: 'scala', c: 'c', cpp: 'cpp', csharp: 'cs',
  dockerfile: 'Dockerfile', makefile: 'Makefile', text: 'txt', txt: 'txt',
  csv: 'csv', ini: 'ini', env: 'env', graphql: 'graphql', proto: 'proto',
};

/** Pattern matching a filename with extension (e.g., "config.json", "src/App.tsx") */
const FILENAME_PATTERN = /[\w./-]+\.\w{1,10}/;

/**
 * Extract a filename from code block context.
 *
 * Checks (in priority order):
 * 1. First-line comment containing a filename/path
 * 2. Language tag that is itself a filename (e.g., ```package.json)
 * 3. Language-based default extension
 * 4. "snippet.txt" fallback
 */
export function extractFilename(code: string, language?: string): string {
  const firstLine = code.split('\n')[0]?.trim() || '';

  // 1. First-line comment with a path or filename
  //    Matches: // path/to/file.ts, # file.py, /* file.css */, -- schema.sql, <!-- index.html -->
  const commentPrefixes = /^(?:\/\/|#|\/\*|<!--|--|\*)\s*/;
  const commentSuffixes = /\s*(?:\*\/|-->)?$/;
  if (commentPrefixes.test(firstLine)) {
    const stripped = firstLine.replace(commentPrefixes, '').replace(commentSuffixes, '').trim();
    const filenameMatch = stripped.match(FILENAME_PATTERN);
    if (filenameMatch) {
      // Use just the basename (last path segment)
      return filenameMatch[0].split('/').pop() || filenameMatch[0];
    }
  }

  // 2. Language tag that looks like a filename (e.g., ```config.json or ```Dockerfile)
  if (language) {
    if (FILENAME_PATTERN.test(language)) {
      return language.split('/').pop() || language;
    }
    // Special cases: some language tags are already the filename
    if (language.toLowerCase() === 'dockerfile') return 'Dockerfile';
    if (language.toLowerCase() === 'makefile') return 'Makefile';
  }

  // 3. Language-based default
  if (language) {
    const ext = LANG_EXTENSIONS[language.toLowerCase()] || language.toLowerCase();
    return `snippet.${ext}`;
  }

  // 4. No language, no hints — check if content looks like markdown
  if (code.match(/^#{1,6}\s/m) || code.match(/^\*\*[^*]+\*\*/m) || code.match(/^-\s/m)) {
    return 'document.md';
  }

  return 'snippet.txt';
}
