'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Book, ReadingStatus } from '@/lib/books';
import { createBook, loadBooks, saveBooks, updateBook } from '@/lib/books';

type Draft = {
  title: string;
  author: string;
  year: string;
  isbn: string;
  notes: string;
  status: ReadingStatus;
};

const emptyDraft: Draft = {
  title: '',
  author: '',
  year: '',
  isbn: '',
  notes: '',
  status: 'unread',
};

export function LibraryApp() {
  const [books, setBooks] = useState<Book[]>(() => loadBooks());
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    saveBooks(books);
  }, [books]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...books].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (!q) return list;
    return list.filter((b) => {
      const hay = `${b.title} ${b.author} ${b.isbn ?? ''} ${b.notes ?? ''} ${b.year ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [books, query]);

  const editingBook = useMemo(
    () => (editingId ? books.find((b) => b.id === editingId) ?? null : null),
    [books, editingId],
  );

  function resetForm() {
    setDraft(emptyDraft);
    setEditingId(null);
  }

  function startEdit(b: Book) {
    setEditingId(b.id);
    setDraft({
      title: b.title,
      author: b.author,
      year: b.year ? String(b.year) : '',
      isbn: b.isbn ?? '',
      notes: b.notes ?? '',
      status: b.status,
    });
  }

  function remove(id: string) {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    if (editingId === id) resetForm();
  }

  function toggleRead(id: string) {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const nextStatus: ReadingStatus = b.status === 'read' ? 'unread' : 'read';
        return updateBook(b, { status: nextStatus });
      }),
    );
  }

  function onSubmit(e: Pick<Event, 'preventDefault'>) {
    e.preventDefault();
    const title = draft.title.trim();
    const author = draft.author.trim();
    if (!title || !author) return;

    const yearNum = draft.year.trim() ? Number(draft.year.trim()) : undefined;
    const year = yearNum && Number.isFinite(yearNum) ? Math.trunc(yearNum) : undefined;

    if (editingBook) {
      setBooks((prev) =>
        prev.map((b) =>
          b.id === editingBook.id
            ? updateBook(b, {
                title,
                author,
                year,
                isbn: draft.isbn.trim() || undefined,
                notes: draft.notes.trim() || undefined,
                status: draft.status,
              })
            : b,
        ),
      );
      resetForm();
      return;
    }

    const newBook = createBook({
      title,
      author,
      year,
      isbn: draft.isbn.trim() || undefined,
      notes: draft.notes.trim() || undefined,
      status: draft.status,
    });
    setBooks((prev) => [newBook, ...prev]);
    setDraft(emptyDraft);
  }

  return (
    <div className='min-h-dvh bg-gradient-to-b from-zinc-50 to-white text-zinc-900'>
      <div className='mx-auto w-full max-w-6xl px-4 py-10 sm:px-6'>
        <header className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>Home Library</h1>
            <p className='text-sm text-zinc-600'>Add, search, and manage your books. Saved locally in this browser.</p>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-zinc-600'>
              {books.length} {books.length === 1 ? 'book' : 'books'}
            </span>
          </div>
        </header>

        <div className='mt-8 grid gap-6 lg:grid-cols-[420px_1fr]'>
          <section className='rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <h2 className='text-base font-semibold'>{editingBook ? 'Edit book' : 'Add a book'}</h2>
                <p className='mt-1 text-sm text-zinc-600'>Title and author are required.</p>
              </div>
              {editingBook ? (
                <button
                  type='button'
                  onClick={resetForm}
                  className='rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50'
                >
                  Cancel
                </button>
              ) : null}
            </div>

            <form onSubmit={onSubmit} className='mt-4 space-y-4'>
              <Field label='Title'>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  className='w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-zinc-950/10 focus:ring-4'
                  placeholder='The Hobbit'
                  autoComplete='off'
                />
              </Field>

              <Field label='Author'>
                <input
                  value={draft.author}
                  onChange={(e) => setDraft((d) => ({ ...d, author: e.target.value }))}
                  className='w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-zinc-950/10 focus:ring-4'
                  placeholder='J.R.R. Tolkien'
                  autoComplete='off'
                />
              </Field>

              <div className='grid grid-cols-2 gap-3'>
                <Field label='Year'>
                  <input
                    value={draft.year}
                    onChange={(e) => setDraft((d) => ({ ...d, year: e.target.value }))}
                    className='w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-zinc-950/10 focus:ring-4'
                    placeholder='1937'
                    inputMode='numeric'
                    autoComplete='off'
                  />
                </Field>
                <Field label='Status'>
                  <select
                    value={draft.status}
                    onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as ReadingStatus }))}
                    className='w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-zinc-950/10 focus:ring-4'
                  >
                    <option value='unread'>Unread</option>
                    <option value='reading'>Reading</option>
                    <option value='read'>Read</option>
                  </select>
                </Field>
              </div>

              <Field label='ISBN (optional)'>
                <input
                  value={draft.isbn}
                  onChange={(e) => setDraft((d) => ({ ...d, isbn: e.target.value }))}
                  className='w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-zinc-950/10 focus:ring-4'
                  placeholder='978-0-261-10221-7'
                  autoComplete='off'
                />
              </Field>

              <Field label='Notes (optional)'>
                <textarea
                  value={draft.notes}
                  onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                  className='min-h-24 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-zinc-950/10 focus:ring-4'
                  placeholder='Where you bought it, loaned to someone, favorite quote…'
                />
              </Field>

              <button
                type='submit'
                className='inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-zinc-950/10'
              >
                {editingBook ? 'Save changes' : 'Add book'}
              </button>
            </form>
          </section>

          <section className='rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <h2 className='text-base font-semibold'>Your books</h2>
                <p className='mt-1 text-sm text-zinc-600'>Search by title, author, year, ISBN, or notes.</p>
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className='w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-zinc-950/10 focus:ring-4 sm:max-w-xs'
                placeholder='Search…'
              />
            </div>

            <div className='mt-4 divide-y divide-zinc-100 rounded-xl border border-zinc-100'>
              {filtered.length === 0 ? (
                <div className='px-4 py-10 text-center text-sm text-zinc-600'>
                  No books yet. Add your first one on the left.
                </div>
              ) : (
                filtered.map((b) => (
                  <div key={b.id} className='flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='min-w-0'>
                      <div className='flex items-center gap-2'>
                        <p className='truncate text-sm font-semibold'>{b.title}</p>
                        <StatusPill status={b.status} />
                      </div>
                      <p className='mt-0.5 truncate text-sm text-zinc-600'>
                        {b.author}
                        {typeof b.year === 'number' ? ` • ${b.year}` : ''}
                        {b.isbn ? ` • ISBN ${b.isbn}` : ''}
                      </p>
                      {b.notes ? <p className='mt-2 line-clamp-2 text-sm text-zinc-700'>{b.notes}</p> : null}
                    </div>

                    <div className='flex shrink-0 items-center gap-2'>
                      <button
                        type='button'
                        onClick={() => toggleRead(b.id)}
                        className='rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50'
                      >
                        {b.status === 'read' ? 'Mark unread' : 'Mark read'}
                      </button>
                      <button
                        type='button'
                        onClick={() => startEdit(b)}
                        className='rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50'
                      >
                        Edit
                      </button>
                      <button
                        type='button'
                        onClick={() => remove(b.id)}
                        className='rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100'
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className='block'>
      <span className='mb-1.5 block text-sm font-medium text-zinc-800'>{label}</span>
      {children}
    </label>
  );
}

function StatusPill({ status }: { status: ReadingStatus }) {
  const cfg =
    status === 'read'
      ? { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', label: 'Read' }
      : status === 'reading'
        ? { cls: 'bg-amber-50 text-amber-800 ring-amber-200', label: 'Reading' }
        : { cls: 'bg-zinc-50 text-zinc-700 ring-zinc-200', label: 'Unread' };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

