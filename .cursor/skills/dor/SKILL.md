---
name: dor
description: >-
  Check whether the project meets its Definition of Ready and produce a status
  report usable as context for the next implementation step. Use when the user
  runs /dor or asks "is the project ready?", "what's the project status?", or
  "check DoR".
disable-model-invocation: true
---

# Definition of Ready — Project Check

Audits the current project state and produces a DoR status report that can be
used as context for any subsequent implementation step.

## Process

Run every check below in order. For each one, gather real evidence — read files,
run commands, inspect output. Do not assume; verify.

### 1. Architecture documentation

- Read `docs/CODEBASE_MAP.md`
- Check it exists and its last-updated timestamp is recent relative to the git log
- Flag if files in `src/` exist that are not listed in the map

### 2. Test coverage

- Check `src/lib/__tests__/` and `tests/e2e/` exist and contain test files
- Run `npm test` (unit) and note pass/fail counts
- Run `npm run test:e2e` and note pass/fail counts
- Flag any failures

### 3. Code quality

- Run `npm run lint` and note any errors (warnings are informational)
- Flag any errors

### 4. Git hygiene

- Run `git status` — flag uncommitted changes that could affect the next step
- Run `git log --oneline -5` — note the recent commit history

### 5. Environment & tooling

- Confirm `node_modules/` exists (i.e. `npm install` has been run)
- Confirm `.cursor/mcp.json` exists and lists configured MCP servers

### 6. Open issues

- Check if any `TODO`, `FIXME`, or `HACK` comments exist in `src/`

---

## Output format

```markdown
# DoR Status Report — <date>

## Summary

<one sentence: READY / NOT READY, and why>

## Checks

| Check | Status | Notes |
|-------|--------|-------|
| Architecture docs | ✅ / ⚠️ / ❌ | … |
| Unit tests | ✅ / ⚠️ / ❌ | e.g. "14/14 passing" |
| E2E tests | ✅ / ⚠️ / ❌ | e.g. "13/13 passing" |
| Lint | ✅ / ⚠️ / ❌ | … |
| Git hygiene | ✅ / ⚠️ / ❌ | … |
| Environment | ✅ / ⚠️ / ❌ | … |
| Open TODOs | ✅ / ⚠️ / ❌ | … |

## Blockers

<list of ❌ items that must be resolved before starting new work — or "None">

## Warnings

<list of ⚠️ items worth noting but not blocking — or "None">

## Project snapshot

<3–5 bullet summary of current state, usable as context for the next prompt>

---
*Paste this report at the top of your next implementation prompt.*
```

**Status key:**
- ✅ Passes — no action needed
- ⚠️ Warning — notable but not blocking
- ❌ Blocker — must be resolved before starting new work
