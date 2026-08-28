# charlesbannister.com — Agent Notes

## Project Overview

Static personal website and mockup host for Charles Bannister. Implementation lives in this repository. Non-code coordination lives in `/Users/charlesbannister/charlesbannister_root`.

## Observability

Tier 0. This is a static GitHub Pages site with no runtime application server, database, or backend logging surface.

## Julie Registration

This project is registered with Julie (`~/julie`). Julie and all subagents (planner, coder, verify, explorer, etc.) have full permission to read, edit, and run commands within this project directory. See `opencode.json` for the exact permission set.

- **Cache:** `~/julie/agent-memory/projects/charlesbannister-com-site/project.json`
- **Primer:** `~/julie/agent-memory/projects/charlesbannister-com-site/context.md`
- **Switch index:** `~/julie/agent-memory/project-index.json` → `projects.charlesbannister-com-site`
- **Init commands:** `/charlesbannister-com-site-init`, `/cbs-init`
- **Command files:** `/Users/charlesbannister/projects/charlesbannister.com/.opencode/commands/charlesbannister-com-site-init.md`, `/Users/charlesbannister/projects/charlesbannister.com/.opencode/commands/cbs-init.md`
- **Plans:** `/Users/charlesbannister/charlesbannister_root/plans/<descriptive-plan-folder>/`
- **Run artifacts:** `/Users/charlesbannister/projects/charlesbannister.com/.agent-runs/`

Agents should load the primer before working on this project.
