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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-card text-secondary hover:bg-hover hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
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
          const match = /language-(\w+)/.exec(className || '');
          const codeString = String(children).replace(/\n$/, '');

          if (match) {
            return (
              <div className="group relative my-2 -mx-1">
                <div className="flex items-center justify-between px-3 py-1 bg-code-bg rounded-t text-xs text-muted border-b border-line">
                  {match[1]}
                </div>
                <CopyButton text={codeString} />
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
              <CopyButton text={codeString} />
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
