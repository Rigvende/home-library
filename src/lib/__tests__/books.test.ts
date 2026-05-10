import { describe, it, expect, beforeEach } from 'vitest';
import { createBook, updateBook, loadBooks, saveBooks } from '../books';
import type { Book } from '../books';

// ─── createBook ────────────────────────────────────────────────────────────

describe('createBook', () => {
  it('stamps id, addedAt, and updatedAt onto the input', () => {
    const book = createBook({ title: 'Dune', author: 'Frank Herbert', status: 'unread' });

    expect(book.id).toBeTypeOf('string');
    expect(book.id).toHaveLength(36); // UUID v4
    expect(book.addedAt).toBeTypeOf('string');
    expect(book.updatedAt).toBeTypeOf('string');
    expect(book.addedAt).toEqual(book.updatedAt);
  });

  it('preserves all supplied fields', () => {
    const book = createBook({
      title: '1984',
      author: 'George Orwell',
      year: 1949,
      isbn: '978-0-452-28423-4',
      notes: 'A classic.',
      status: 'read',
    });

    expect(book.title).toBe('1984');
    expect(book.author).toBe('George Orwell');
    expect(book.year).toBe(1949);
    expect(book.isbn).toBe('978-0-452-28423-4');
    expect(book.notes).toBe('A classic.');
    expect(book.status).toBe('read');
  });

  it('generates a unique id per call', () => {
    const a = createBook({ title: 'A', author: 'A', status: 'unread' });
    const b = createBook({ title: 'B', author: 'B', status: 'unread' });
    expect(a.id).not.toBe(b.id);
  });
});

// ─── updateBook ────────────────────────────────────────────────────────────

describe('updateBook', () => {
  const base: Book = {
    id: 'test-id',
    title: 'Dune',
    author: 'Frank Herbert',
    status: 'unread',
    addedAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  it('merges patch fields into the existing book', () => {
    const updated = updateBook(base, { status: 'read', notes: 'Loved it.' });
    expect(updated.status).toBe('read');
    expect(updated.notes).toBe('Loved it.');
    expect(updated).not.toBe(base);
    expect(base.status).toBe('unread');
    expect(base.notes).toBeUndefined();
  });

  it('preserves fields not included in the patch', () => {
    const updated = updateBook(base, { status: 'reading' });
    expect(updated.title).toBe('Dune');
    expect(updated.author).toBe('Frank Herbert');
    expect(updated.id).toBe('test-id');
    expect(updated.addedAt).toBe('2024-01-01T00:00:00.000Z');
    expect(updated).not.toBe(base);
    expect(base.status).toBe('unread');
  });

  it('bumps updatedAt to a later timestamp', () => {
    const updated = updateBook(base, { status: 'read' });
    expect(updated.updatedAt).not.toBe(base.updatedAt);
  });

  it('never changes the id or addedAt', () => {
    const updated = updateBook(base, { title: 'Dune Messiah' });
    expect(updated.id).toBe(base.id);
    expect(updated.addedAt).toBe(base.addedAt);
  });
});

// ─── loadBooks / saveBooks ─────────────────────────────────────────────────

describe('loadBooks', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns an empty array when storage is empty', () => {
    expect(loadBooks()).toEqual([]);
  });

  it('returns an empty array for invalid JSON', () => {
    localStorage.setItem('homeLibrary.books.v1', 'not-json');
    expect(loadBooks()).toEqual([]);
  });

  it('returns an empty array when value is not an array', () => {
    localStorage.setItem('homeLibrary.books.v1', JSON.stringify({ title: 'Dune' }));
    expect(loadBooks()).toEqual([]);
  });

  it('filters out entries missing required fields', () => {
    const invalid = [{ id: '1' }, { title: 'No author' }, { id: '2', title: 'T', author: 'A' }];
    localStorage.setItem('homeLibrary.books.v1', JSON.stringify(invalid));
    const books = loadBooks();
    expect(books).toHaveLength(1);
    expect(books[0].title).toBe('T');
  });

  it('normalizes an invalid status to "unread"', () => {
    const raw = [{ id: '1', title: 'T', author: 'A', status: 'gibberish' }];
    localStorage.setItem('homeLibrary.books.v1', JSON.stringify(raw));
    expect(loadBooks()[0].status).toBe('unread');
  });
});

describe('saveBooks + loadBooks round-trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and restores a list of books', () => {
    const book = createBook({ title: 'Brave New World', author: 'Aldous Huxley', status: 'reading' });
    saveBooks([book]);
    const loaded = loadBooks();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].title).toBe('Brave New World');
    expect(loaded[0].author).toBe('Aldous Huxley');
    expect(loaded[0].status).toBe('reading');
    expect(loaded[0].id).toBe(book.id);
  });

  it('persists an empty list and returns []', () => {
    saveBooks([]);
    expect(loadBooks()).toEqual([]);
  });
});
