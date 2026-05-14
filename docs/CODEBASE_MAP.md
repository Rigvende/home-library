# Codebase Map — Home Library

> Generated: 2026-05-14. Re-run `/cartograph` after adding files or modules.

---

## 1. Repository Structure

```
home-library/
├── src/
│   ├── app/
│   │   ├── favicon.ico             # Browser tab icon
│   │   ├── globals.css             # Tailwind v4 global styles + CSS custom properties
│   │   ├── layout.tsx              # Root layout — Geist fonts, metadata, <html>/<body> wrapper
│   │   └── page.tsx                # "/" route — thin shell that mounts <LibraryApp />
│   ├── components/
│   │   └── LibraryApp.tsx          # Main UI — all library state, forms, list, and sub-components
│   ├── lib/
│   │   ├── books.ts                # Domain model, localStorage persistence, CRUD helpers
│   │   └── __tests__/
│   │       └── books.test.ts       # Unit tests (Vitest + jsdom) — 14 tests across 4 suites
│   └── test/
│       └── setup.ts                # Vitest global setup — imports @testing-library/jest-dom
├── tests/
│   └── e2e/
│       └── library.spec.ts         # Playwright E2E tests — 13 tests across 5 feature groups
├── docs/
│   └── CODEBASE_MAP.md             # This file
├── AGENTS.md                       # Next.js agent rules (read before writing framework code)
├── CLAUDE.md                       # Agent entry point — references this map
├── next.config.ts                  # Next.js configuration (currently empty/default)
├── playwright.config.ts            # Playwright: Chromium only, baseURL localhost:3000
├── vitest.config.ts                # Vitest: jsdom environment, @ alias → src/
├── tsconfig.json                   # TypeScript config
└── package.json                    # Dependencies and npm scripts
```

---

## 2. Module Responsibilities

| Module | Role |
|--------|------|
| `src/lib/books.ts` | Domain layer: `Book` type, `ReadingStatus` union, `loadBooks`, `saveBooks`, `createBook`, `updateBook`, and private helpers `isBookLike` / `normalizeBook` |
| `src/components/LibraryApp.tsx` | Entire UI: add/edit form, book list, search input, status toggle, delete. Also owns internal sub-components `Field` and `StatusPill` |
| `src/app/page.tsx` | Next.js App Router route for `/` — renders `<LibraryApp />` with no additional logic |
| `src/app/layout.tsx` | Root layout: loads Geist Sans + Geist Mono via `next/font/google`, sets `<title>` and `<meta description>`, wraps children in `<html>`/`<body>` |
| `src/app/globals.css` | Tailwind v4 entry (`@import "tailwindcss"`), CSS variables for background/foreground, dark-mode media query, tap-highlight reset |
| `src/test/setup.ts` | Extends Vitest's `expect` with `@testing-library/jest-dom` matchers (e.g. `toBeVisible`, `toHaveValue`) |
| `src/lib/__tests__/books.test.ts` | 14 unit tests covering `createBook` (3), `updateBook` (4), `loadBooks` (5), and `saveBooks`+`loadBooks` round-trip (2) |
| `tests/e2e/library.spec.ts` | 13 Playwright tests covering: add (4), search (3), delete (1), edit (2), read-status toggle (2), persistence (1) |
| `next.config.ts` | Minimal Next.js config — no custom options set |
| `playwright.config.ts` | Chromium-only, `baseURL: http://localhost:3000`, retries: 1, auto-starts `npm run dev` via `webServer` |
| `vitest.config.ts` | jsdom environment, globals enabled, `@` alias → `./src`, excludes `tests/e2e/**` |

---

## 3. Key Entry Points

| Entry Point | Path | Description |
|-------------|------|-------------|
| App shell | `src/app/layout.tsx` | First file Next.js evaluates for every request; provides fonts and HTML wrapper |
| Home route | `src/app/page.tsx` | Renders the entire application (`<LibraryApp />`) |
| Main component | `src/components/LibraryApp.tsx` | All interactive logic lives here (`'use client'`) |
| Domain API | `src/lib/books.ts` | Public exports consumed by `LibraryApp` and test suites |
| Unit tests | `src/lib/__tests__/books.test.ts` | `vitest run` / `npm test` |
| E2E tests | `tests/e2e/library.spec.ts` | `playwright test` / `npm run test:e2e` |

---

## 4. Data Model

```typescript
type ReadingStatus = 'unread' | 'reading' | 'read';

type Book = {
  id: string;        // crypto.randomUUID() — UUID v4, length 36
  title: string;
  author: string;
  year?: number;     // publication year, integer
  isbn?: string;
  notes?: string;
  status: ReadingStatus;
  addedAt: string;   // ISO 8601 timestamp, set once at creation
  updatedAt: string; // ISO 8601 timestamp, bumped on every updateBook() call
};
```

Internal form state (`Draft`) mirrors `Book` but with string fields for controlled inputs before parsing (e.g. `year: string` instead of `number | undefined`).

---

## 5. Data Flow

```
localStorage["homeLibrary.books.v1"]
        │
        │  loadBooks()          normalizeBook() + isBookLike() guards
        ▼
  LibraryApp — useState<Book[]>(books)
        │
        │  user actions
        ├─ onSubmit()  ──►  createBook() or updateBook()  ──►  setBooks()
        ├─ remove(id)  ──────────────────────────────────►  setBooks()
        └─ toggleRead(id)  ─────────────────────────────►  setBooks() via updateBook()
        │
        │  useEffect([books])   (guarded by hydrated ref — skips initial mount)
        ▼
  saveBooks()  ──►  localStorage["homeLibrary.books.v1"]
```

### Hydration Guard

Two `useEffect` calls are registered in order:

1. **Save effect** `useEffect(() => { if (hydrated.current) saveBooks(books); }, [books])` — registered first; does nothing until `hydrated.current` is `true`.
2. **Load effect** `useEffect(() => { setBooks(loadBooks()); hydrated.current = true; }, [])` — runs on mount, reads `localStorage`, then flips the flag so subsequent saves are allowed.

This prevents an empty write from wiping localStorage on first render.

### Search / Filter

`filtered` is a `useMemo` derived from `[books, query]`:
- Sorts by `updatedAt` descending (most recently modified first).
- When `query` is non-empty, filters against a concatenated haystack of `title + author + isbn + notes + year` (case-insensitive).

---

## 6. Component Tree

```
RootLayout                        (src/app/layout.tsx)
└── Home                          (src/app/page.tsx)
    └── LibraryApp                (src/components/LibraryApp.tsx)  ['use client']
        ├── <header>              book count display
        ├── <section> Add/Edit    form panel
        │   └── Field × 5        label wrapper (title, author, year/status, isbn, notes)
        └── <section> Book List   search + list panel
            └── per-book row
                └── StatusPill   colored badge (Unread / Reading / Read)
```

---

## 7. Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.2.4 | App Router framework — SSR/SSG + `next/font` |
| `react` / `react-dom` | 19.2.4 | UI rendering |
| `tailwindcss` | ^4 | Utility-first CSS (v4 — `@import "tailwindcss"` syntax) |
| `typescript` | ^5 | Static type checking |
| `vitest` | ^4.1.5 | Unit test runner |
| `@testing-library/react` | ^16.3.2 | React rendering helpers for unit tests |
| `@testing-library/jest-dom` | ^6.9.1 | DOM assertion matchers |
| `jsdom` | ^29.1.1 | Browser-like DOM for Vitest |
| `@playwright/test` | ^1.59.1 | E2E browser automation |
| `@vitejs/plugin-react` | ^6.0.1 | Vite/Vitest React transform |
| `@tailwindcss/postcss` | ^4 | PostCSS integration for Tailwind v4 |
| `@rolldown/binding-win32-x64-msvc` | ^1.0.0 | Native rolldown binding for Windows (required by Vitest v4 on Win) |

---

## 8. npm Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev` | Start development server on port 3000 |
| `build` | `next build` | Production build |
| `start` | `next start` | Serve production build |
| `lint` | `eslint` | Lint source files (eslint-config-next) |
| `test` | `vitest run` | Run unit tests once |
| `test:watch` | `vitest` | Unit tests in watch mode |
| `test:e2e` | `playwright test` | Run E2E tests (starts dev server automatically) |

---

## 9. How to Update This Map

When new files, types, components, or modules are added:
1. Update the corresponding section(s) above.
2. Re-run `/cartograph` to regenerate this file from the skill template.
3. If new `.cursor/rules/*.mdc` files are created, ensure each contains:
   ```
   For detailed architecture, see docs/CODEBASE_MAP.md.
   ```
