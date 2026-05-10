---
name: cartograph
description: Produce a structured map of the codebase — modules, components, types, data-flow, and dependencies. Use when the user asks to "map the codebase", "show the architecture", "describe the project structure", "what files exist", "how does data flow", or asks for a dependency or module overview.
disable-model-invocation: true
---

# Cartograph

Produces a structured map of this Next.js + React + TypeScript project.

## Expected outcome

Write (or overwrite) `docs/CODEBASE_MAP.md` with the full map. The file must cover:
1. Repository structure (annotated directory tree)
2. Major modules and their responsibilities
3. Key entry points
4. Important relationships (data flow, imports, dependencies)

After writing the file, ensure `CLAUDE.md` contains the line:

```
For detailed architecture, see docs/CODEBASE_MAP.md.
```

Add the same line to every `.cursor/rules/*.mdc` file.

## Project snapshot

```
home-library/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout — fonts (Geist), metadata, body wrapper
│   │   ├── page.tsx                # Entry page — mounts <LibraryApp />
│   │   └── globals.css             # Tailwind v4 global styles
│   ├── components/
│   │   └── LibraryApp.tsx          # Main UI — all library state & interactions
│   ├── lib/
│   │   ├── books.ts                # Domain model, localStorage persistence, CRUD helpers
│   │   └── __tests__/
│   │       └── books.test.ts       # Unit tests (Vitest)
│   └── test/
│       └── setup.ts                # Vitest global setup
├── tests/
│   └── e2e/
│       └── library.spec.ts         # Playwright E2E tests
├── docs/
│   └── CODEBASE_MAP.md             # Generated architecture map (output of this skill)
├── playwright.config.ts
├── vitest.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

## Module responsibilities

| Module | Role |
|--------|------|
| `src/lib/books.ts` | Domain: `Book` type, `ReadingStatus`, `loadBooks`, `saveBooks`, `createBook`, `updateBook` |
| `src/components/LibraryApp.tsx` | UI: renders book list, add/edit/delete forms, status filters |
| `src/app/page.tsx` | Route: shell that mounts `<LibraryApp />` |
| `src/app/layout.tsx` | Layout: fonts, metadata, body styling |
| `src/lib/__tests__/books.test.ts` | Unit tests — 14 tests via Vitest + jsdom |
| `tests/e2e/library.spec.ts` | E2E tests — 13 tests via Playwright |

## Data model

```typescript
type ReadingStatus = 'unread' | 'reading' | 'read';

type Book = {
  id: string;          // crypto.randomUUID()
  title: string;
  author: string;
  year?: number;
  isbn?: string;
  notes?: string;
  status: ReadingStatus;
  addedAt: string;     // ISO timestamp
  updatedAt: string;   // ISO timestamp
};
```

## Data flow

```
localStorage
  └─ loadBooks() ──► LibraryApp (useState)
                          │
               add / edit / delete
                          │
                     saveBooks() ──► localStorage
```

## Key dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.2.4 | Framework (App Router) |
| `react` / `react-dom` | 19.2.4 | UI rendering |
| `tailwindcss` | ^4 | Styling |
| `typescript` | ^5 | Type safety |

## How to update this map

When new files, types, or modules are added:
1. Update this skill's **Project snapshot**, **Module responsibilities**, **Data model**, and **Data flow** sections.
2. Regenerate `docs/CODEBASE_MAP.md` to reflect the current state.
