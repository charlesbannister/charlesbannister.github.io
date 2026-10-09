# content.md ↔ src/index.html mapping

`content.md` mirrors the editable text of `src/index.html`. Fixed page chrome is not in it: the brand block ("Charles<br>Bannister"), the profile image, the footer's name and GitHub link, fonts and stylesheet links.

| content.md | src/index.html |
| --- | --- |
| Frontmatter `title` | `<title>` |
| Frontmatter `description` | `<meta name="description">` |
| Frontmatter `footer_quote` / `footer_quote_by` | `<blockquote class="footer-quote">` in the footer: `<p>` quote, `<cite>` author |
| `# Heading` (one only) | `<h1 id="page-title">` in the header `.intro` |
| Paragraphs after `#`, before the first `##` | `<p>` elements after the `<h1>` in the header `.intro` |
| `## Heading` | A `<section id="…" aria-labelledby="…-title">` inside `<main>`, containing `<div class="wrap">` and `<h2 id="…-title">` |
| `### Heading` | `<h3>` inside the section |
| Paragraph. Each line is its own paragraph: a single line break in content.md means a new `<p>` | `<p>` |
| `1. **Label** text` list | `<ol class="projects">` with `<li><strong>Label</strong>` then the text on the next line. Indented continuation lines under an item become `<p>` elements inside that `<li>` (the first text line too, once there is more than one) |
| `- item` list | `<ul class="plain-list">` with `<li>` items |
| `**Term**` line directly followed by text lines (no blank line) | A `<div>` holding `<dt>Term</dt>` + `<dd>`, so each entry is its own block; one text line is plain text in the `<dd>`, several become one `<p>` each; consecutive entries share one `<dl>`. A `**Term**` with no text gets a `<div>` with just the `<dt>` |
| `[text](url)` external link | `<a href="url" target="_blank" rel="noopener">text</a>` |
| `**bold**` / `*italic*` or `_italic_` inline | `<strong>` / `<em>` |

## Instructions: `<input>…</input>`

Anything inside `<input>…</input>` in content.md is an instruction from Charles to Claude, not page content. It can sit anywhere (inline or on its own lines, one line or several) and refers to the content around it, e.g. `<input>add this photo here: https://…</input>` or `<input>make this list two columns</input>`. Never publish the tag or its text.

## Images

`![alt text](source)` becomes `<img src="assets/images/<name>.webp" alt="alt text" width="…" height="…" loading="lazy">`. Images are always served from this site, never hotlinked.

`![alt text](source "note")`, an image with a Markdown title, becomes a flip card: the image flips to show the note on hover, keyboard focus or tap.

```html
<figure class="flip" tabindex="0">
  <div class="flip-inner">
    <img class="flip-front" src="assets/images/<name>.webp" alt="alt text" width="…" height="…" loading="lazy">
    <p class="flip-back">note</p>
  </div>
</figure>
```

Image lines on consecutive lines (no blank line between) form a row: `<div class="flip-row">` holding the flip cards, three across on desktop and stacked on phones.

An image line directly followed by an italic line (`_caption_`) is a photo with a caption:

```html
<figure class="photo">
  <img src="assets/images/<name>.webp" alt="alt text" width="…" height="…" loading="lazy">
  <figcaption>caption</figcaption>
</figure>
```

Single images and photos are centred. A flip card takes the image's shape: square by default, `flip-portrait` (3:4) for portrait photos. Add `flip-small` (200px) when Charles asks for a smaller card. Frankie's photo uses both, plus `flip-left` to sit left-aligned instead of centred. `flip-light` gives the back the page background (`--bg`) with dark green (`--forest`) text; the Blackpool FC card uses it. Images are resized to at most 1360px wide (album covers and logos can stay at their original size if smaller). SVG sources are rendered to WebP.

## Logo marquee

A `Logos: Name, Name, …` line becomes a full-width scrolling band of technology logos at that point in the section, placed after the section's `.wrap` div (so it spans the page):

```html
<div class="logo-marquee" role="region" aria-label="Technologies I work with">
  <ul class="logo-track">
    <li><img src="assets/logos/<slug>.svg" alt="" width="28" height="28"><span>Name</span></li>
    …
  </ul>
  <ul class="logo-track" aria-hidden="true"> …the same items again, for the seamless loop… </ul>
</div>
```

`<slug>` is the name lowercased with runs of non-alphanumerics turned into `-` (`Node.js` → `node-js`, `GitHub Actions` → `github-actions`). For a new name, get its SVG from Simple Icons (`https://cdn.jsdelivr.net/npm/simple-icons@<pinned version>/icons/<slug>.svg`; search their slug list if it differs), or Devicon if Simple Icons doesn't have it (AWS comes from Devicon). Recolour it to `#2f4a35` and save it as `src/assets/logos/<slug>.svg`. Order in the band follows the order in the line.

Section ids: keep existing ids (`work`, `experience`, `freelance`, `hobbies`) for existing sections, matched by position and heading, even if the heading text changes. A new section gets a short lowercase slug id from its heading (one or two words). Sections appear in `<main>` in the same order as in `content.md`.

HTML style: two-space indentation matching the current file, straight apostrophes as typed, `&` written as `&amp;` in HTML, no `<br>` inside prose.

Single-page rules: no `<nav>`, no new pages, no `mailto:` links, no email address in plain form.
