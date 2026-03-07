import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Props {
  content: string;
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
      className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export function MarkdownContent({ content }: Props) {
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
                <div className="flex items-center justify-between px-3 py-1 bg-gray-900 rounded-t text-xs text-gray-400 border-b border-gray-700">
                  {match[1]}
                </div>
                <CopyButton text={codeString} />
                <SyntaxHighlighter
                  style={oneDark}
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
                className="px-1.5 py-0.5 rounded bg-gray-700/60 text-indigo-300 text-[0.85em] font-mono"
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
              <pre className="bg-gray-900 rounded p-3 overflow-x-auto text-sm font-mono text-gray-200">
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
            <blockquote className="border-l-2 border-indigo-500/50 pl-3 my-2 text-gray-400 italic">
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
          return <strong className="font-semibold text-white">{children}</strong>;
        },
        em({ children }) {
          return <em className="italic text-gray-300">{children}</em>;
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              {children}
            </a>
          );
        },
        hr() {
          return <hr className="border-gray-700 my-3" />;
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-2">
              <table className="text-sm border-collapse w-full">{children}</table>
            </div>
          );
        },
        thead({ children }) {
          return <thead className="border-b border-gray-600">{children}</thead>;
        },
        th({ children }) {
          return <th className="text-left px-2 py-1 text-xs font-semibold text-gray-300">{children}</th>;
        },
        td({ children }) {
          return <td className="px-2 py-1 border-t border-gray-700/50">{children}</td>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
