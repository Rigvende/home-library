export type ReadingStatus = 'unread' | 'reading' | 'read';

export type Book = {
  id: string;
  title: string;
  author: string;
  year?: number;
  isbn?: string;
  notes?: string;
  status: ReadingStatus;
  addedAt: string;
  updatedAt: string;
};

const STORAGE_KEY = 'homeLibrary.books.v1';

export function loadBooks(): Book[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isBookLike).map(normalizeBook);
  } catch {
    return [];
  }
}

export function saveBooks(books: Book[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

export function createBook(input: Omit<Book, 'id' | 'addedAt' | 'updatedAt'>): Book {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    ...input,
    addedAt: now,
    updatedAt: now,
  };
}

export function updateBook(existing: Book, patch: Partial<Omit<Book, 'id' | 'addedAt'>>): Book {
  return {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

function isBookLike(v: unknown): v is Partial<Book> {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === 'string' && typeof o.title === 'string' && typeof o.author === 'string';
}

function normalizeBook(b: Partial<Book>): Book {
  const now = new Date().toISOString();
  const status: ReadingStatus =
    b.status === 'read' || b.status === 'reading' || b.status === 'unread' ? b.status : 'unread';

  return {
    id: b.id ?? crypto.randomUUID(),
    title: b.title ?? 'Untitled',
    author: b.author ?? 'Unknown',
    year: typeof b.year === 'number' ? b.year : undefined,
    isbn: typeof b.isbn === 'string' ? b.isbn : undefined,
    notes: typeof b.notes === 'string' ? b.notes : undefined,
    status,
    addedAt: typeof b.addedAt === 'string' ? b.addedAt : now,
    updatedAt: typeof b.updatedAt === 'string' ? b.updatedAt : now,
  };
}

