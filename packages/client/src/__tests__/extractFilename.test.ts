import { describe, it, expect } from 'vitest';
import { extractFilename } from '../utils/extractFilename';

describe('extractFilename', () => {
  describe('first-line comment detection', () => {
    it('extracts from // comment with full path', () => {
      expect(extractFilename('// packages/server/src/routes/files.ts\nconst x = 1;', 'typescript'))
        .toBe('files.ts');
    });

    it('extracts from // comment with just filename', () => {
      expect(extractFilename('// config.json\n{"key": "value"}', 'json'))
        .toBe('config.json');
    });

    it('extracts from # comment (Python/Shell)', () => {
      expect(extractFilename('# my_script.py\nprint("hello")', 'python'))
        .toBe('my_script.py');
    });

    it('extracts from # comment with path', () => {
      expect(extractFilename('# src/utils/helpers.py\ndef foo(): pass', 'python'))
        .toBe('helpers.py');
    });

    it('extracts from /* */ comment (CSS)', () => {
      expect(extractFilename('/* styles/main.css */\nbody { color: red; }', 'css'))
        .toBe('main.css');
    });

    it('extracts from -- comment (SQL)', () => {
      expect(extractFilename('-- schema.sql\nCREATE TABLE users ();', 'sql'))
        .toBe('schema.sql');
    });

    it('extracts from <!-- --> comment (HTML)', () => {
      expect(extractFilename('<!-- index.html -->\n<div>hello</div>', 'html'))
        .toBe('index.html');
    });

    it('extracts basename from deep paths', () => {
      expect(extractFilename('// src/components/ui/Button.tsx\nexport function Button() {}', 'tsx'))
        .toBe('Button.tsx');
    });

    it('ignores comments without filenames', () => {
      expect(extractFilename('// This is just a comment\nconst x = 1;', 'typescript'))
        .toBe('snippet.ts');
    });

    it('ignores # comments that are shebangs without filenames', () => {
      expect(extractFilename('#!/usr/bin/env node\nconsole.log("hi")', 'javascript'))
        .toBe('snippet.js');
    });
  });

  describe('language tag as filename', () => {
    it('detects language tag that is a filename', () => {
      expect(extractFilename('{"name": "klatch"}', 'package.json'))
        .toBe('package.json');
    });

    it('detects Dockerfile special case', () => {
      expect(extractFilename('FROM node:18', 'dockerfile'))
        .toBe('Dockerfile');
    });

    it('detects Makefile special case', () => {
      expect(extractFilename('all:\n\techo hi', 'makefile'))
        .toBe('Makefile');
    });
  });

  describe('language-based defaults', () => {
    it('maps common languages to extensions', () => {
      expect(extractFilename('print("hello")', 'python')).toBe('snippet.py');
      expect(extractFilename('const x = 1;', 'typescript')).toBe('snippet.ts');
      expect(extractFilename('fn main() {}', 'rust')).toBe('snippet.rs');
      expect(extractFilename('package main', 'go')).toBe('snippet.go');
      expect(extractFilename('body {}', 'css')).toBe('snippet.css');
      expect(extractFilename('SELECT 1;', 'sql')).toBe('snippet.sql');
      expect(extractFilename('echo hi', 'bash')).toBe('snippet.sh');
      expect(extractFilename('puts "hi"', 'ruby')).toBe('snippet.rb');
    });

    it('maps shorthand language tags', () => {
      expect(extractFilename('x = 1', 'py')).toBe('snippet.py');
      expect(extractFilename('const x = 1', 'ts')).toBe('snippet.ts');
      expect(extractFilename('const x = 1', 'js')).toBe('snippet.js');
      expect(extractFilename('echo hi', 'sh')).toBe('snippet.sh');
    });

    it('uses language as extension for unknown languages', () => {
      expect(extractFilename('code', 'zig')).toBe('snippet.zig');
      expect(extractFilename('code', 'haskell')).toBe('snippet.haskell');
    });
  });

  describe('no language tag', () => {
    it('detects markdown-like content', () => {
      expect(extractFilename('# My Document\n\nSome text here.'))
        .toBe('document.md');
    });

    it('detects markdown with bold text', () => {
      expect(extractFilename('**Important:** This is key.\n\nMore text.'))
        .toBe('document.md');
    });

    it('detects markdown with list items', () => {
      expect(extractFilename('- Item one\n- Item two\n- Item three'))
        .toBe('document.md');
    });

    it('falls back to snippet.txt for unknown content', () => {
      expect(extractFilename('just some random text'))
        .toBe('snippet.txt');
    });

    it('falls back to snippet.txt for empty content', () => {
      expect(extractFilename('')).toBe('snippet.txt');
    });
  });

  describe('priority order', () => {
    it('prefers first-line comment over language default', () => {
      // Even though language is "typescript", the comment has a specific filename
      expect(extractFilename('// App.tsx\nexport default function App() {}', 'typescript'))
        .toBe('App.tsx');
    });

    it('prefers language-as-filename over language default', () => {
      expect(extractFilename('{}', 'tsconfig.json'))
        .toBe('tsconfig.json');
    });
  });
});
