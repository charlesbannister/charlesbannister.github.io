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

`content.md` mirrors the homepage text. In Claude Code: `/sync` refreshes it from `src/index.html`, edit it, then `/publish` applies the edits to the HTML, tests, pushes and checks the live site. The mapping is in `.claude/skills/publish/format.md`. Both commands save a timestamped copy of `content.md` to `content-versions/` before changing anything.

## Deploy

Pushes to `main` run tests, build `dist/`, and publish GitHub Pages.

The `CNAME` file is `charlesbannister.com`. HTTPS on the custom domain only works after DNS points at GitHub Pages.

## Contact form

The homepage form posts JSON to a small AWS Lambda (function URL) in the Shabba AWS account (`216989108664`, `us-east-2`, stack `charlesbannister-contact-form`). It emails each message to Charles through SES from `website@shabba.io`, with the visitor as Reply-To. Spam guards: hidden `website` honeypot, at least 3 seconds on the page, length limits, 5 messages an hour per IP. Logs: CloudWatch `/aws/lambda/charlesbannister-contact-form` (one JSON line per request, no message text).

Code: `infra/contact-form/handler.py`. Deploy after a change: `TO_ADDRESS=<inbox> infra/contact-form/deploy.sh` (runs `build.py`, which inlines the handler into `template.yaml`; inline code is limited to 4096 bytes). The recipient is a stack parameter so it stays out of this public repo.
