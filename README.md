# charlesbannister.com

Personal site for Charles Bannister.

The public homepage has no mockup section, emails, or contact buttons.

Live GitHub Pages URL after the first deploy: `https://charlesbannister.github.io`

Custom domain after DNS: `https://charlesbannister.com`

## Local

```bash
npm test
npm run build
npm run dev
```

The dev server is at `http://localhost:5173`.

## Mockups

The washer-disinfectors landing page stays at `/mockups/washer-disinfectors/`. It is a direct URL only; the homepage does not list it.

Mockups are copied out of client production repos so they can be shared without deploying that whole codebase.

## Deploy

Pushes to `main` run tests, build `dist/`, and publish GitHub Pages.

The `CNAME` file is `charlesbannister.com`. HTTPS on the custom domain only works after DNS points at GitHub Pages.
