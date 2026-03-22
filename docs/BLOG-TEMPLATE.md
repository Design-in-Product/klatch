# Blog Publishing Template

Reference for Calliope when converting approved drafts to HTML. Use this instead of reverse-engineering the existing posts.

---

## File locations

| Item | Path |
|------|------|
| Markdown drafts (for editing) | `docs/drafts/SLUG.md` |
| Published HTML | `blog/SLUG.html` |
| Blog index | `blog/index.html` |
| Stylesheet | `styles.css` (repo root, linked as `../styles.css`) |
| Images | `blog/FILENAME.png` or `blog/FILENAME.svg` |

---

## HTML skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>POST TITLE — Klatch</title>
  <meta name="description" content="EXCERPT (1-2 sentences)">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect x='10' y='8' width='8.5' height='48' rx='4.25' ry='4.25' fill='%23111827'/><rect x='18.5' y='28' width='24' height='8' rx='4' ry='4' fill='%23111827' transform='rotate(-40,18.5,32)'/><rect x='18.5' y='28' width='26' height='8' rx='4' ry='4' fill='%23111827' transform='rotate(40, 18.5,32)'/><circle cx='50.5' cy='12' r='5' fill='%23EF4444'/></svg>">
  <link rel="stylesheet" href="../styles.css">
</head>
<body>

  <!-- NAVIGATION — copy verbatim, no changes -->
  <nav>
    <div class="nav-inner">
      <a href="/" class="nav-logo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="24" height="24" aria-hidden="true">
          <rect x="10" y="8" width="8.5" height="48" rx="4.25" ry="4.25" fill="#111827"/>
          <rect x="18.5" y="28" width="24" height="8" rx="4" ry="4" fill="#111827" transform="rotate(-40, 18.5, 32)"/>
          <rect x="18.5" y="28" width="26" height="8" rx="4" ry="4" fill="#111827" transform="rotate(40, 18.5, 32)"/>
          <circle cx="50.5" cy="12" r="5" fill="#EF4444"/>
        </svg>
        klatch
      </a>
      <ul class="nav-links">
        <li><a href="/#quickstart">Quick start</a></li>
        <li><a href="./">Blog</a></li>
        <li><a href="https://github.com/Design-in-Product/klatch">GitHub</a></li>
      </ul>
    </div>
  </nav>

  <div class="container">

    <!-- ARTICLE HEADER -->
    <div class="article-header">
      <a href="./" class="article-back">← Blog</a>
      <h1 class="article-title">POST TITLE</h1>
      <div class="article-meta">
        <span class="article-date">MONTH YEAR</span>
        <div class="article-authors">
          <!-- Always include both if xian + Calliope. Remove one if solo. -->
          <span class="author author-human">
            <svg viewBox="0 0 14 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <text x="7" y="15" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-style="italic" font-size="16" fill="currentColor">&#x03C7;</text>
            </svg>
            xian
          </span>
          <span class="author author-ai">
            <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M10 2 L17 8 L10 19 L3 8 Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              <line x1="10" y1="11" x2="10" y2="19" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
            </svg>
            Calliope
          </span>
        </div>
      </div>
    </div>

    <!-- HERO FIGURE — SVG or image -->
    <figure class="article-figure" aria-label="BRIEF DESCRIPTION OF FIGURE">
      <!-- Option A: inline SVG (preferred for diagrams) -->
      <svg viewBox="0 0 640 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="hero-title">
        <title id="hero-title">FULL ALT TEXT FOR ACCESSIBILITY</title>
        <!-- SVG content here -->
      </svg>

      <!-- Option B: image file -->
      <!-- <img src="FILENAME.png" alt="ALT TEXT" style="width: 100%; max-width: 640px; border-radius: 4px; border: 1px solid var(--border); display: block; margin: 0 auto;"> -->

      <figcaption>CAPTION TEXT</figcaption>
    </figure>

    <!-- ARTICLE BODY -->
    <div class="article-body">

      <p>OPENING PARAGRAPH</p>

      <h2>SECTION HEADING</h2>

      <p>PARAGRAPH</p>

      <!-- INLINE IMAGE (mid-article, e.g. the wireframe photo) -->
      <figure class="article-figure" aria-label="DESCRIPTION">
        <img src="FILENAME.png" alt="ALT TEXT" style="width: 100%; max-width: 400px; border-radius: 4px; border: 1px solid var(--border); display: block; margin: 0 auto;">
        <figcaption>CAPTION</figcaption>
      </figure>

      <!-- BLOCKQUOTE -->
      <blockquote>"QUOTED TEXT"</blockquote>

      <!-- CODE (inline) -->
      <p>Use <code>type: 'chat' | 'klatch'</code> inline.</p>

      <!-- CODE BLOCK -->
      <pre><code>multi-line
code here</code></pre>

      <!-- TABLE -->
      <table>
        <thead><tr><th>Col 1</th><th>Col 2</th></tr></thead>
        <tbody>
          <tr><td>Val</td><td>Val</td></tr>
        </tbody>
      </table>

      <!-- DIVIDER + FOOTNOTE (use at end of body before footer) -->
      <hr>
      <p style="font-size: 0.85rem; color: var(--text-dim);"><em>FOOTNOTE TEXT</em></p>

    </div>

    <!-- FOOTER — copy verbatim -->
    <footer>
      <p>CC BY 4.0 &middot; <a href="https://github.com/Design-in-Product/klatch">GitHub</a> &middot; <a href="../">klatch.ing</a> &middot; <a href="./">Blog</a></p>
    </footer>

  </div>

</body>
</html>
```

---

## Blog index card

Add to `blog/index.html` inside `<section class="blog-list">`. New posts go **first** (top of list):

```html
<a href="SLUG.html" class="post-card">
  <div class="post-card-image">
    <!-- Option A: image -->
    <img src="FILENAME.png" alt="ALT TEXT">
    <!-- Option B: SVG (paste the hero SVG here, stripped of title element) -->
  </div>
  <div class="post-card-body">
    <div class="post-card-title">POST TITLE</div>
    <div class="post-card-meta">MONTH YEAR &middot; xian + Calliope</div>
    <div class="post-card-excerpt">EXCERPT (matches meta description, 1-2 sentences)</div>
  </div>
</a>
```

---

## Markdown → HTML conversion notes

| Markdown | HTML |
|----------|------|
| `# Heading` | `<h1>` (only for title, in article-header) |
| `## Heading` | `<h2>` |
| `### Heading` | `<h3>` |
| `**bold**` | `<strong>` |
| `*italic*` | `<em>` |
| `` `code` `` | `<code>` |
| `[text](url)` | `<a href="url">text</a>` |
| `> blockquote` | `<blockquote>` |
| `---` (thematic break) | `<hr>` |
| `[image.png]` placeholder | `<figure>` + `<img>` block (see above) |
| Table | `<table>` with `<thead>` and `<tbody>` |

**Character encoding:** Use `&middot;` for ·, `&mdash;` for —, `&rsquo;` for ' if needed. Emoji (✅ etc.) can be used as-is in HTML.

---

## Publishing checklist

- [ ] `docs/drafts/SLUG.md` approved by xian
- [ ] HTML written to `blog/SLUG.html`
- [ ] Hero SVG or image present in `blog/` if needed
- [ ] `blog/index.html` updated with new post card (new post at top)
- [ ] All internal links verified (`../styles.css`, `./`, `../`)
- [ ] Meta description matches excerpt
- [ ] Committed and pushed to `origin/main`
- [ ] `docs/drafts/SLUG.md` can be kept as source-of-record (do not delete)
