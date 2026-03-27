import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Props {
  content: string;
  theme?: 'light' | 'dark';
}

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
function extractFilename(code: string, language?: string): string {
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

function CodeActions({ text, language }: { text: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const filename = extractFilename(text, language);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="absolute top-1 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={handleSave}
        title={`Save as ${filename}`}
        className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-card text-secondary hover:bg-hover hover:text-primary transition-colors"
      >
        {saved ? (
          <span className="text-green-500">Saved!</span>
        ) : (
          <>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">{filename}</span>
            <span className="sm:hidden">Save</span>
          </>
        )}
      </button>
      <button
        onClick={handleCopy}
        className="px-2 py-1 text-xs rounded bg-card text-secondary hover:bg-hover hover:text-primary transition-colors"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

export function MarkdownContent({ content, theme }: Props) {
  const codeTheme = theme === 'dark' ? oneDark : oneLight;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Code blocks with syntax highlighting
        code({ node, className, children, ...props }) {
          const match = /language-([\w.+-]+)/.exec(className || '');
          const codeString = String(children).replace(/\n$/, '');

          if (match) {
            const lang = match[1];
            const detectedName = extractFilename(codeString, lang);
            // Show detected filename if it's more specific than the language tag
            const hasDetectedFile = !detectedName.startsWith('snippet.');
            return (
              <div className="group relative my-2 -mx-1">
                <div className="flex items-center gap-2 px-3 py-1 bg-code-bg rounded-t text-xs text-muted border-b border-line">
                  <span>{lang}</span>
                  {hasDetectedFile && (
                    <span className="opacity-60">{detectedName}</span>
                  )}
                </div>
                <CodeActions text={codeString} language={lang} />
                <SyntaxHighlighter
                  style={codeTheme}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    fontSize: '0.8rem',
                  }}
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            );
          }

          // Inline code — check if it's truly inline (no block-level parent)
          const isInline = !String(children).includes('\n');
          if (isInline) {
            return (
              <code
                className="px-1.5 py-0.5 rounded bg-code-bg text-accent-hover text-[0.85em] font-mono"
                {...props}
              >
                {children}
              </code>
            );
          }

          // Fenced code block without a language
          return (
            <div className="group relative my-2 -mx-1">
              <CodeActions text={codeString} />
              <pre className="bg-code-bg rounded p-3 overflow-x-auto text-sm font-mono text-primary">
                <code {...props}>{children}</code>
              </pre>
            </div>
          );
        },

        // Block elements
        p({ children }) {
          return <p className="mb-2 last:mb-0">{children}</p>;
        },
        ul({ children }) {
          return <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>;
        },
        li({ children }) {
          return <li className="text-sm">{children}</li>;
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-2 border-accent/50 pl-3 my-2 text-secondary italic">
              {children}
            </blockquote>
          );
        },
        h1({ children }) {
          return <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="text-base font-bold mb-1.5 mt-2.5 first:mt-0">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0">{children}</h3>;
        },
        strong({ children }) {
          return <strong className="font-semibold text-primary">{children}</strong>;
        },
        em({ children }) {
          return <em className="italic text-secondary">{children}</em>;
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hover underline"
            >
              {children}
            </a>
          );
        },
        hr() {
          return <hr className="border-line my-3" />;
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-2">
              <table className="text-sm border-collapse w-full">{children}</table>
            </div>
          );
        },
        thead({ children }) {
          return <thead className="border-b border-line-strong">{children}</thead>;
        },
        th({ children }) {
          return <th className="text-left px-2 py-1 text-xs font-semibold text-secondary">{children}</th>;
        },
        td({ children }) {
          return <td className="px-2 py-1 border-t border-line">{children}</td>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
