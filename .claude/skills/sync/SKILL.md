---
name: sync
description: Refresh content.md from the live source of the homepage (src/index.html on origin/main) so Charles can edit the latest text. Use when Charles says sync, refresh content, or wants to start editing the site.
---

# Sync content.md from the site

Goal: `content.md` exactly mirrors the current text of `src/index.html`, ready for Charles to edit.

1. `git fetch origin` then check `git status`. If local `main` is behind `origin/main` and the working tree is clean, `git pull --ff-only`. If there are local uncommitted changes, stop and tell Charles what they are before doing anything else.
2. If `content.md` has uncommitted edits (`git diff --quiet content.md` fails), stop and ask: those edits are probably unpublished work. Options: publish them first (`/publish`), or discard them and resync.
3. Read `src/index.html` and `.claude/skills/publish/format.md`. Regenerate `content.md` from the HTML using that mapping. Copy the text verbatim: do not reword, fix or tidy anything.
4. Show `git diff --stat content.md`. If it changed, summarise in a line or two what differed (e.g. "the site had a newer hobbies paragraph"). If nothing changed, say it's already up to date.
5. Do not commit. Tell Charles `content.md` is ready to edit and to run `/publish` when done.
