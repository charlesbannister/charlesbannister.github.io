---
description: Initialize Julie for charlesbannister.com site
agent: julie
---

Initialize Julie for the current project using the existing Julie registration artifacts first.

Treat the current working directory as the target project root.

Use these registration artifacts as the source of truth whenever they exist:

- `~/julie/agent-memory/projects/charlesbannister-com-site/project.json`
- `~/julie/agent-memory/projects/charlesbannister-com-site/context.md` (project primer)
- `~/julie/agent-memory/project-index.json` → `projects.charlesbannister-com-site` (switching only)
- `./AGENTS.md`
- `./opencode.json`

If the cache entry or primer file is missing, stale, or points at a different path, rerun Julie's project-registration flow for this exact project before continuing.

Then give a short initialization summary:

- project name / slug / path / kind
- language(s) and stack
- build/test commands
- important docs, conventions, or gotchas
- registration warnings, if any

Keep this fast. Prefer cached/local registration data over fresh rediscovery unless the registration is missing or mismatched.

End with: `Julie is initialized for charlesbannister-com-site and ready to work here.`
Then ask what the user wants to do next.
