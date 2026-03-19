# Blog Publishing Workflow

How blog posts get from idea to live on klatch.ing/web/blog/.

## The workflow

1. **Draft in Markdown** — Calliope writes (or we discuss and agree on structure, then Calliope writes) a draft at `docs/drafts/post-name.md`. The draft contains prose only — no HTML, no SVGs. A front matter block at the top carries the metadata:

   ```markdown
   ---
   title: You Can't Vibe Your Way to a Glossary
   date: March 2026
   authors: xian + Calliope
   excerpt: On drawing wireframes with a reMarkable before talking to the AI...
   hero: wireframe-png   # or: hero: empty-room-svg, or: hero: none
   slug: wireframe-first-design
   ---
   ```

2. **Edit in plain text** — xian edits the `.md` file in any editor. This is the authoring surface. No HTML knowledge required.

3. **Approve** — when the draft is ready, xian says "publish" (or similar). Calliope reads the draft, converts it to HTML using the blog template, handles hero figures and any special elements, and writes to `web/blog/[slug].html`.

4. **Publish** — Calliope also updates `web/blog/index.html` with the new post card (including image preview), then commits and pushes. GitHub Pages deploys automatically.

## What goes in the draft vs. what Calliope handles at publish time

**In the draft (prose):**
- All body text
- Blockquotes
- Code snippets (fenced with backticks)
- Section headings (##)
- Image references via `![alt](filename.png)` — Calliope wraps these in `<figure>` with appropriate caption

**Handled at publish (not in draft):**
- Hero SVG or image (specified by `hero:` in front matter)
- Nav, footer, `<head>`, stylesheet links
- Author signature marks (pen nib + χ)
- Post card in blog index (title, excerpt, preview image)
- Any inline SVG diagrams — discuss during drafting if a post needs one

## Hero types

| `hero:` value | What Calliope generates |
|---|---|
| `wireframe-png` | Uses `sidebar-wireframe.png` as full-width figure |
| `empty-room-svg` | Renders the empty room SVG from the AXT post |
| `dot-grid-svg` | Dot-grid sidebar sketch SVG (wireframe post hero) |
| `none` | No hero figure; article starts immediately |
| `custom` | Discuss during drafting |

New hero types can be added as the post library grows.

## Draft naming convention

`docs/drafts/YYYY-MM-DD-slug.md` — e.g. `docs/drafts/2026-03-16-wireframe-first-design.md`.

Drafts stay in `docs/drafts/` after publishing as the canonical prose source. They are the record of what was written before HTML production decisions were layered on top.

## Keeping this workflow working

This document is the protocol. If the workflow changes (e.g. we add a build step, a template file, or a skill), update this document. The skill (if created) should reference this document for the full specification.

## Demo video workflow (planned)

A parallel workflow for demo videos is planned — a Playwright script that drives the live app and records to MP4. When that's built, it will be documented here or in a sibling `DEMOS.md`.
