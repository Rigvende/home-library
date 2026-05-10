import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

// ─── Add book ──────────────────────────────────────────────────────────────

test('adds a book and shows it in the list', async ({ page }) => {
  await page.getByPlaceholder('The Hobbit').fill('Dune');
  await page.getByPlaceholder('J.R.R. Tolkien').fill('Frank Herbert');
  await page.getByRole('button', { name: 'Add book' }).click();

  await expect(page.getByText('Dune')).toBeVisible();
  await expect(page.getByText('Frank Herbert')).toBeVisible();
  await expect(page.getByText('1 book')).toBeVisible();
});

test('does not add a book when title is missing', async ({ page }) => {
  await page.getByPlaceholder('J.R.R. Tolkien').fill('Frank Herbert');
  await page.getByRole('button', { name: 'Add book' }).click();

  await expect(page.getByText('0 books')).toBeVisible();
});

test('does not add a book when author is missing', async ({ page }) => {
  await page.getByPlaceholder('The Hobbit').fill('Dune');
  await page.getByRole('button', { name: 'Add book' }).click();

  await expect(page.getByText('0 books')).toBeVisible();
});

test('resets the form after adding a book', async ({ page }) => {
  await page.getByPlaceholder('The Hobbit').fill('Dune');
  await page.getByPlaceholder('J.R.R. Tolkien').fill('Frank Herbert');
  await page.getByRole('button', { name: 'Add book' }).click();

  await expect(page.getByPlaceholder('The Hobbit')).toHaveValue('');
  await expect(page.getByPlaceholder('J.R.R. Tolkien')).toHaveValue('');
});

// ─── Search ────────────────────────────────────────────────────────────────

test('search filters the book list by author', async ({ page }) => {
  for (const [title, author] of [
    ['1984', 'George Orwell'],
    ['Brave New World', 'Aldous Huxley'],
    ['The Great Gatsby', 'F. Scott Fitzgerald'],
  ]) {
    await page.getByPlaceholder('The Hobbit').fill(title);
    await page.getByPlaceholder('J.R.R. Tolkien').fill(author);
    await page.getByRole('button', { name: 'Add book' }).click();
  }

  await page.getByPlaceholder('Search…').fill('orwell');

  await expect(page.getByText('1984')).toBeVisible();
  await expect(page.getByText('George Orwell')).toBeVisible();
  await expect(page.getByText('Brave New World')).not.toBeVisible();
  await expect(page.getByText('The Great Gatsby')).not.toBeVisible();
});

test('search filters the book list by title', async ({ page }) => {
  for (const [title, author] of [
    ['Dune', 'Frank Herbert'],
    ['1984', 'George Orwell'],
  ]) {
    await page.getByPlaceholder('The Hobbit').fill(title);
    await page.getByPlaceholder('J.R.R. Tolkien').fill(author);
    await page.getByRole('button', { name: 'Add book' }).click();
  }

  await page.getByPlaceholder('Search…').fill('dune');

  await expect(page.getByText('Dune')).toBeVisible();
  await expect(page.getByText('1984')).not.toBeVisible();
});

test('clearing the search shows all books again', async ({ page }) => {
  await page.getByPlaceholder('The Hobbit').fill('Dune');
  await page.getByPlaceholder('J.R.R. Tolkien').fill('Frank Herbert');
  await page.getByRole('button', { name: 'Add book' }).click();

  await page.getByPlaceholder('The Hobbit').fill('1984');
  await page.getByPlaceholder('J.R.R. Tolkien').fill('George Orwell');
  await page.getByRole('button', { name: 'Add book' }).click();

  await page.getByPlaceholder('Search…').fill('dune');
  await page.getByPlaceholder('Search…').clear();

  await expect(page.getByText('Dune')).toBeVisible();
  await expect(page.getByText('1984')).toBeVisible();
});

// ─── Delete ────────────────────────────────────────────────────────────────

test('deletes a book and removes it from the list', async ({ page }) => {
  await page.getByPlaceholder('The Hobbit').fill('Dune');
  await page.getByPlaceholder('J.R.R. Tolkien').fill('Frank Herbert');
  await page.getByRole('button', { name: 'Add book' }).click();

  await page.getByRole('button', { name: 'Delete' }).click();

  await expect(page.getByText('Dune')).not.toBeVisible();
  await expect(page.getByText('0 books')).toBeVisible();
});

// ─── Edit ──────────────────────────────────────────────────────────────────

test('edits a book and shows updated values', async ({ page }) => {
  await page.getByPlaceholder('The Hobbit').fill('Dun');
  await page.getByPlaceholder('J.R.R. Tolkien').fill('Frank Herbert');
  await page.getByRole('button', { name: 'Add book' }).click();

  await page.getByRole('button', { name: 'Edit' }).click();

  await expect(page.getByRole('heading', { name: 'Edit book' })).toBeVisible();

  await page.getByPlaceholder('The Hobbit').fill('Dune');
  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect(page.getByText('Dune')).toBeVisible();
  await expect(page.getByText('Dun', { exact: true })).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Add a book' })).toBeVisible();
});

test('cancel edit restores the add form', async ({ page }) => {
  await page.getByPlaceholder('The Hobbit').fill('Dune');
  await page.getByPlaceholder('J.R.R. Tolkien').fill('Frank Herbert');
  await page.getByRole('button', { name: 'Add book' }).click();

  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page.getByRole('heading', { name: 'Add a book' })).toBeVisible();
  await expect(page.getByPlaceholder('The Hobbit')).toHaveValue('');
});

// ─── Toggle read status ────────────────────────────────────────────────────

test('mark read toggles the status badge to Read', async ({ page }) => {
  await page.getByPlaceholder('The Hobbit').fill('Dune');
  await page.getByPlaceholder('J.R.R. Tolkien').fill('Frank Herbert');
  await page.getByRole('button', { name: 'Add book' }).click();

  const bookList = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Your books' }) });
  await expect(bookList.getByText('Unread', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Mark read' }).click();

  await expect(bookList.getByText('Read', { exact: true })).toBeVisible();
  await expect(bookList.getByText('Unread', { exact: true })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark unread' })).toBeVisible();
});

test('mark unread toggles the status badge back to Unread', async ({ page }) => {
  await page.getByPlaceholder('The Hobbit').fill('Dune');
  await page.getByPlaceholder('J.R.R. Tolkien').fill('Frank Herbert');
  await page.getByRole('button', { name: 'Add book' }).click();

  await page.getByRole('button', { name: 'Mark read' }).click();
  await page.getByRole('button', { name: 'Mark unread' }).click();

  const bookList = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Your books' }) });
  await expect(bookList.getByText('Unread', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark read' })).toBeVisible();
});

// ─── Persistence ───────────────────────────────────────────────────────────

test('books persist across page reloads', async ({ page }) => {
  await page.getByPlaceholder('The Hobbit').fill('Dune');
  await page.getByPlaceholder('J.R.R. Tolkien').fill('Frank Herbert');
  await page.getByRole('button', { name: 'Add book' }).click();

  await page.reload();

  await expect(page.getByText('Dune')).toBeVisible();
  await expect(page.getByText('Frank Herbert')).toBeVisible();
  await expect(page.getByText('1 book')).toBeVisible();
});
