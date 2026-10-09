---
name: publish
description: Apply Charles's edits in content.md to src/index.html, test, commit, push to main and confirm the change is live on charlesbannister.com. Use when Charles says publish, ship it, or put the content live.
---

# Publish content.md to the live site

Running `/publish` is Charles's go-ahead to push. Do not ask for a second confirmation unless something below says to stop.

## 0. Save a copy of content.md first

Before anything else, and before any edit to `content.md` (by you or a sync), copy it to `content-versions/content-YYYY-MM-DD-HHMMSS.md` (`mkdir -p content-versions && cp content.md "content-versions/content-$(date +%Y-%m-%d-%H%M%S).md"`). Skip the copy only if it is byte-identical to the newest file already there (`cmp`). Never edit or delete files in `content-versions/`. They are committed with the next publish.

## 1. Work out what changed

- `git fetch origin`. If `origin/main` has commits that touch `src/index.html` and aren't in local `main`, stop: the site changed elsewhere. Suggest committing `content.md`, pulling, and reconciling before publishing.
- Read `content.md`, `src/index.html` and `format.md` (next to this file).
- Compare `content.md` against the text in the committed `src/index.html` (`git show HEAD:src/index.html`) using the mapping in `format.md`. That difference is the edit. If there is none, say so and stop.
- If `src/index.html` already has uncommitted changes (a local preview of these edits), keep them, check they match `content.md`, and fix anything that doesn't.

## 2. Apply the edit

### Instructions in `<input>` tags

- Carry out every `<input>…</input>` instruction in `content.md` (see `format.md`). If one is unclear, or would break the single-page rules, ask before continuing.
- Once done, remove the `<input>` block from `content.md`, leaving whatever content the instruction produced, so it isn't applied twice. Never put the tag or its text in the HTML.

### Images

When `content.md` (or an `<input>` instruction) adds an image from a URL or a local path:
- Download or copy it into `src/assets/images/` with a short descriptive kebab-case name. Never hotlink.
- Resize to at most 1360px wide and convert to WebP (`magick in -resize '1360x>' -quality 82 out.webp`, or `cwebp -resize 1360 0 -q 82`). Keep the original only if Charles asks.
- Rewrite the `content.md` line to point at the local file (`![alt](src/assets/images/name.webp)`), and add the `<img>` to the HTML with real `width`/`height` (`sips -g pixelWidth -g pixelHeight`) and `loading="lazy"`.
- Alt text is required: if the brackets are empty, ask for it.
- If the source is clearly someone else's image (a stock site, another company's site), mention it and ask Charles to confirm it can be used.

### Text

- Update `src/index.html` so its text matches `content.md` exactly. Only touch the markup that needs to change; leave everything else byte-for-byte.
- Use Charles's wording as written. Do not rewrite, polish or "improve" it. British English throughout.
- If you spot a clear typo, a broken Markdown construct, or something that breaks the single-page rules in `format.md`, don't silently fix it: list it and ask before continuing. Anything Charles agrees to change goes into both `content.md` and the HTML.
- If the edit can't be expressed with the existing markup and CSS classes (a new kind of element), stop and propose the smallest markup/CSS change.

## 3. Check

- `npm test`. If a test fails because it asserts specific wording that Charles has intentionally changed, update that assertion and mention it. Any other failure: stop and report it.
- Start `npm run dev` in the background, fetch `http://localhost:5173/` and confirm the new text is present, then stop the server.

## 4. Ship

- Show `git diff --stat` and a short plain-English summary of the content changes.
- Commit `content.md`, any new `content-versions/` copies, the `src/` changes and any test change together, message like `Update homepage: <what changed>`. Push to `main`.
- `gh run watch` the "Deploy GitHub Pages" run for that commit (`gh run list --branch main --limit 1` to find it). If it fails, show the failing step's log and stop.
- Once deployed, `curl -s https://charlesbannister.com/` and confirm a distinctive phrase from the edit is there (allow a minute for the CDN; retry a few times before reporting a problem).
- Finish with one line: what went live and the URL.
