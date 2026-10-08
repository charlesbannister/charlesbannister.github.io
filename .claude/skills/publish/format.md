# content.md ↔ src/index.html mapping

`content.md` mirrors the editable text of `src/index.html`. Fixed page chrome is not in it: the brand block ("Charles<br>Bannister"), the profile image, the footer, fonts and stylesheet links.

| content.md | src/index.html |
| --- | --- |
| Frontmatter `title` | `<title>` |
| Frontmatter `description` | `<meta name="description">` |
| `# Heading` (one only) | `<h1 id="page-title">` in the header `.intro` |
| Paragraphs after `#`, before the first `##` | `<p>` elements after the `<h1>` in the header `.intro` |
| `## Heading` | A `<section id="…" aria-labelledby="…-title">` inside `<main>`, containing `<div class="wrap">` and `<h2 id="…-title">` |
| `### Heading` | `<h3>` inside the section |
| Paragraph. Each line is its own paragraph: a single line break in content.md means a new `<p>` | `<p>` |
| `1. **Label** text` list | `<ol class="projects">` with `<li><strong>Label</strong>` then the text on the next line. Indented continuation lines under an item become `<p>` elements inside that `<li>` (the first text line too, once there is more than one) |
| `- item` list | `<ul class="plain-list">` with `<li>` items |
| `**Term**` line directly followed by text lines (no blank line) | `<dt>Term</dt>` + `<dd>`; one text line is plain text in the `<dd>`, several become one `<p>` each; consecutive pairs share one `<dl>` |
| `[text](url)` external link | `<a href="url" target="_blank" rel="noopener">text</a>` |
| `**bold**` / `*italic*` or `_italic_` inline | `<strong>` / `<em>` |

Section ids: keep existing ids (`work`, `experience`, `freelance`, `hobbies`) for existing sections, matched by position and heading, even if the heading text changes. A new section gets a short lowercase slug id from its heading (one or two words). Sections appear in `<main>` in the same order as in `content.md`.

HTML style: two-space indentation matching the current file, straight apostrophes as typed, `&` written as `&amp;` in HTML, no `<br>` inside prose.

Single-page rules: no `<nav>`, no new pages, no `mailto:` links, no email address in plain form.
