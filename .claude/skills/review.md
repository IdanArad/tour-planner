---
name: review
description: Run a full QA review on the codebase (build, lint, security, conventions)
user_invocable: true
---

# Code Review Skill

Run a comprehensive review of the Tour Planner codebase.

## Steps:

1. Run `npm run lint` and `npm run build` — report any errors
2. Use the qa-reviewer agent to check:
   - Security (hardcoded secrets, auth gaps, XSS)
   - Convention compliance (@/ imports, component size, shadcn/ui patterns)
   - Data integrity (org_id FKs, snake_case/camelCase mapping)
   - UX consistency (loading states, error handling, empty states)
3. Report findings with file:line references and suggested fixes
4. Overall verdict: APPROVE, REQUEST_CHANGES, or NEEDS_DISCUSSION
