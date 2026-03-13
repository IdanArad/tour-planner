---
name: preflight
description: Pre-commit checks — lint, build, and verify before committing
user_invocable: true
---

# Preflight Check Skill

Run all checks before committing code.

## Steps:

1. Run `npm run lint` — must pass with zero errors/warnings
2. Run `npm run build` — must compile successfully
3. Run `git diff --stat` to show what changed
4. If any issues found, fix them automatically
5. Report: READY TO COMMIT or ISSUES FOUND (with details)
