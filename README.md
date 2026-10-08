# charlesbannister.com

Personal site for Charles Bannister.

Live GitHub Pages URL after the first deploy: `https://charlesbannister.github.io`

Custom domain after DNS: `https://charlesbannister.com`

## Local

```bash
npm test
npm run build
npm run dev
```

The dev server is at `http://localhost:5173`.

## Editing content

`content.md` mirrors the homepage text. In Claude Code: `/sync` refreshes it from `src/index.html`, edit it, then `/publish` applies the edits to the HTML, tests, pushes and checks the live site. The mapping is in `.claude/skills/publish/format.md`.

## Deploy

Pushes to `main` run tests, build `dist/`, and publish GitHub Pages.

The `CNAME` file is `charlesbannister.com`. HTTPS on the custom domain only works after DNS points at GitHub Pages.
