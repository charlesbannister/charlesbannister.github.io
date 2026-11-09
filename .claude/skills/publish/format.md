# content.md ↔ src/index.html mapping

`content.md` mirrors the editable text of `src/index.html`. Fixed page chrome is not in it: the brand block ("Charles<br>Bannister"), the profile image, the location pin icon, the footer's name, GitHub and LinkedIn links, the sticky "Get in touch" button at the end of `<body>` (it repeats the header button's text and link), the contact form's endpoint, honeypot field, field names, types and autocomplete, the form script (including its "Sending…" and error messages), fonts and stylesheet links.

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
| `Location: text` (after `#`) | `<p class="location">` with the pin icon `<svg>` then `<span>text</span>` |
| `Button: [text](#id)` (after `#`) | `<p class="cta-row"><a class="cta" href="#id">text</a></p>` |
| `[text](url)` external link | `<a href="url" target="_blank" rel="noopener">text</a>` |
| `[text](#id)` link to a section | `<a href="#id">text</a>` (no `target`) |
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

The marquee's `aria-label` follows its row: "Marketing tools I work with" under Marketing & Analytics, "Technologies I work with" under Software. Some logo files predate the slug rule and keep their existing name: Microsoft Ads (Bing) → `microsoftbing.svg`, Google Merchant Center → `merchant-center.svg`, Google Analytics → `googleanalytics.svg`, Google Tag Manager → `googletagmanager.svg`, Search Console → `googlesearchconsole.svg`, Looker Studio → `looker.svg`, Google Sheets → `googlesheets.svg`, Apps Script → `googleappsscript.svg`.

## Areas of expertise rows

In the Areas of expertise section, the intro paragraph stays in the section's `.wrap`. Each `### Heading` followed by a `1. **Label** text` list is an expertise row placed after that `.wrap`:

```html
<div class="wrap wrap-wide expertise-row">
  <h3 id="<slug>-title" class="col-title">Heading</h3>
  <ul class="threads threads-<N>">   <!-- N = number of items -->
    <li><strong>Label</strong>
      <p>first text line</p>
      <p>each indented continuation line</p></li>
  </ul>
</div>
```

`<slug>` is the heading's first word lowercased (`marketing-title`, `software-title`). The row's `Logos:` line follows it as a marquee, so each row has its own logo strip.

## Reviews ("What people say")

- `Pull quote: quote — cite` directly under the `##` heading becomes `<blockquote class="pull-quote"><p>quote</p><cite>cite</cite></blockquote>`, placed inside the section's `.wrap` *before* the `<h2>`.
- Each review is a block of `> ` lines followed by a `— Name` line; blank lines separate reviews. Each `> ` line is one `<p>`. All reviews sit in one grid after the section's `.wrap`:

```html
<div class="wrap wrap-wide">
  <div class="reviews">
    <figure class="review">
      <blockquote><p>line one</p><p>line two</p></blockquote>
      <figcaption><span>Name</span></figcaption>
    </figure>
  </div>
</div>
```

## Upwork stats

The Upwork section uses one `<div class="wrap wrap-wide upwork">` instead of the plain `.wrap`. The heading and paragraphs go in `<div class="upwork-text">`; a line holding only a link becomes `<p class="stats-link">`. A `Stats:` line followed by `- **value** label` items becomes `<ul class="stats" aria-label="My Upwork record">` after `.upwork-text`, each item `<li><b>value</b><span>label</span></li>`.

## Columns of lists (`####`)

Consecutive `#### Heading` + `- item` list groups form `<div class="do-cols">`, one `<div>` per group holding `<h4>Heading</h4>` and a `<ul class="plain-list">`.

## Contact form ("Get in touch")

A `Form:` line followed by `- ` items is the contact form `<form class="contact-form" data-contact data-endpoint="…" novalidate>`. Its fields sit in `<div class="contact-fields">`, in order:

- `- Label | placeholder: text` is a `<label>` plus its `<input>` (or `<textarea rows="5">` for the message) with that `placeholder`. Without `| placeholder:` the field has none.
- A label ending `(optional)` writes that part as `<span class="opt">(optional)</span>` and the field is not `required`; every other field is `required`.
- `- Button: text` is `<button type="submit" class="contact-send">text</button>`.

`Sent title:` and `Sent text:` are the message shown after sending, in `<div class="contact-thanks" role="status">`: `<p class="contact-thanks-title">` then a plain `<p>`.

Section ids: keep existing ids (`work`, `experience`, `reviews`, `upwork`, `freelance`, `contact`, `hobbies`) for existing sections, matched by position and heading, even if the heading text changes. A new section gets a short lowercase slug id from its heading (one or two words). Sections appear in `<main>` in the same order as in `content.md`.

HTML style: two-space indentation matching the current file, straight apostrophes as typed, `&` written as `&amp;` in HTML, no `<br>` inside prose.

Single-page rules: no `<nav>`, no new pages, no `mailto:` links, no email address in plain form.
