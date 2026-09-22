import { test, expect } from '@playwright/test';

test('all Python files stay exact and highlighting follows both themes', async ({
  page,
  request,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Kode Python' }).click();
  for (const [name, id] of [
    ['Caesar', 'caesar'],
    ['Vigenere', 'vigenere'],
    ['Substitution', 'substitution'],
    ['Transposition', 'transposition'],
    ['Playfair', 'playfair'],
  ]) {
    await page.getByRole('navigation').getByRole('button', { name, exact: true }).click();
    const source = await (await request.get('/api/source/' + id)).json();
    await expect(page.locator('.source-meta strong')).toHaveText(source.path);
    const code = await page.locator('.code-line > span:last-child').allTextContents();
    expect(code.map((line) => (line === ' ' ? '' : line)).join('\n')).toBe(source.code.trimEnd());
    await expect(page.locator('.hljs-keyword').first()).toHaveCSS('color', 'rgb(136, 57, 239)');
    await expect(page.locator('.hljs-string').first()).toHaveCSS('color', 'rgb(64, 160, 43)');
    await page.getByRole('button', { name: 'Aktifkan mode gelap' }).click();
    await expect(page.locator('.hljs-keyword').first()).toHaveCSS('color', 'rgb(203, 166, 247)');
    await expect(page.locator('.hljs-string').first()).toHaveCSS('color', 'rgb(166, 227, 161)');
    expect(await page.locator('.code-line > span:last-child').allTextContents()).toEqual(code);
    await page.getByRole('button', { name: 'Aktifkan mode terang' }).click();
  }
});

test('multiline strings and HTML-looking source remain literal and safe on mobile', async ({
  page,
}) => {
  const code =
    '"""First line\n<img src=x onerror="window.injected=true">\nLast line"""\n\ndef demo():\n    return 42\n';
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/source/caesar', (route) =>
    route.fulfill({ json: { path: 'algorithms/Caesar/caesar.py', code } }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Kode Python' }).click();
  await expect(page.locator('.code-line')).toHaveCount(6);
  const lines = await page.locator('.code-line > span:last-child').allTextContents();
  expect(lines.map((line) => (line === ' ' ? '' : line)).join('\n')).toBe(code.trimEnd());
  for (let i = 0; i < 3; i++)
    await expect(page.locator('.code-line').nth(i).locator('.hljs-string')).toHaveCount(1);
  await expect(page.locator('.code-scroll img')).toHaveCount(0);
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Fokus', exact: true }).click();
  await expect(page.locator('.visual-panel')).toHaveClass(/focused/);
  await expect(page.locator('.hljs-number')).toHaveText('42');
});
