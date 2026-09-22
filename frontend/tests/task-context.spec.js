import { test, expect } from '@playwright/test';
import { createTaskContext, taskSnapshot } from '../src/lib/task-context.js';

test('long comparisons follow the active character and reset to the beginning', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/');
  await page.getByLabel('Pesan asli', { exact: true }).fill('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(7));
  await page.getByRole('button', { name: 'Proses pesan', exact: false }).click();
  await page.getByRole('combobox', { name: 'Fase algoritma' }).selectOption('result');
  await page.getByRole('button', { name: 'Langkah sebelumnya' }).click();
  const scroller = page.locator('.comparison-scroll');
  await expect.poll(() => scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  const active = await page.locator('.result-cell.active').boundingBox();
  const viewport = await scroller.boundingBox();
  expect(active.x).toBeGreaterThanOrEqual(viewport.x);
  expect(active.x + active.width).toBeLessThanOrEqual(viewport.x + viewport.width + 1);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect.poll(() => scroller.evaluate((element) => element.scrollLeft)).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('task projections match Python traces for all algorithms in both directions', async ({
  request,
}) => {
  const catalog = await (await request.get('/api/algorithms')).json();
  for (const item of catalog) {
    for (const mode of ['encrypt', 'decrypt']) {
      const response = await request.post('/api/run', {
        data: {
          algorithm: item.id,
          mode,
          text: mode === 'encrypt' ? item.text : item.ciphertext,
          key: item.key,
        },
      });
      expect(response.ok()).toBe(true);
      const run = await response.json();
      const task = createTaskContext(run, item.name);
      for (const [index, step] of run.steps.entries()) {
        const before = taskSnapshot(task, index, false);
        const after = taskSnapshot(task, index, true);
        expect(before.output).toBe(run.steps[index - 1]?.output ?? '');
        expect(after.output).toBe(step.output);
        if (step.phase === 'process') {
          const source = before.cells.find((cell) => cell.sourceActive);
          expect(source.input).toBe(step.data.input);
          const target = after.cells.find((cell) => cell.targetActive);
          if (step.kind === 'fill') expect(target).toBeUndefined();
          else expect(target.output).toBe(step.data.output ?? step.data.input);
        }
      }
      const final = taskSnapshot(task, run.steps.length - 1, true);
      expect(final.cells.map((cell) => cell.output).join('')).toBe(run.output);
    }
  }
});

test('normalization, filler, whitespace and empty legacy cleanup remain explicit', async ({
  request,
}) => {
  for (const data of [
    { algorithm: 'caesar', mode: 'decrypt', text: 'Ab z!\n', key: -29 },
    { algorithm: 'caesar', mode: 'encrypt', text: ' \t!?', key: 3 },
    {
      algorithm: 'substitution',
      mode: 'encrypt',
      text: 'hi!\n',
      key: 'QWERTYUIOPASDFGHJKLZXCVBNM',
    },
    { algorithm: 'playfair', mode: 'encrypt', text: 'J, XX!', key: 'MONARCHY' },
    { algorithm: 'transposition', mode: 'decrypt', text: 'XXX', key: 'KEY' },
  ]) {
    const run = await (await request.post('/api/run', { data })).json();
    const task = createTaskContext(run, data.algorithm);
    expect(task.run.input).toBe(data.text);
    const final = taskSnapshot(task, run.steps.length - 1, true);
    expect(final.cells.map((cell) => cell.output).join('')).toBe(run.output);
    if (data.text === 'XXX') {
      expect(final.output).toBe('');
      expect(final.cells.every((cell) => cell.removed)).toBe(true);
      expect(final.note).toContain('seluruh X');
    }
    if (data.key === -29) expect(task.rule).toContain('3 posisi ke kanan');
    if (data.algorithm === 'playfair') expect(final.note).toContain('filler X/Q');
  }
});

for (const width of [1366, 390]) {
  test(`task goal and aligned characters stay synchronized at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Proses pesan', exact: false }).click();
    await expect(page.locator('.task-summary')).toContainText('HALO DUNIA');
    await expect(page.locator('.task-rule')).toContainText('3 posisi ke kanan');
    await page.getByRole('combobox', { name: 'Fase algoritma' }).selectOption('process');
    const next = page.getByRole('button', { name: 'Langkah berikutnya' });
    await next.dblclick();
    await expect(page.getByTestId('output')).toHaveText('K');
    await next.dblclick();
    await expect(page.getByTestId('output')).toHaveText('KD');
    await expect(page.locator('.source-cell.active')).toHaveText('A');
    await expect(page.locator('.result-cell.active')).toHaveText('D');
    await expect(page.locator('.step-explanation')).toContainText('Huruf 2 dari 9');
    await expect(page.locator('.result-cell.pending')).toHaveCount(8);
    await page.getByRole('button', { name: 'Langkah sebelumnya' }).click();
    await expect(page.locator('.source-cell.active')).toHaveText('H');
    await expect(page.getByTestId('output')).toHaveText('…');
    await page.getByRole('button', { name: 'Fokus', exact: true }).click();
    await expect(page.locator('.task-summary')).toBeVisible();
    await expect(page.locator('.task-message')).toContainText('HALO DUNIA');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(page.locator('.source-cell.active')).toHaveCount(0);
    await page.getByLabel('Kunci pergeseran', { exact: true }).fill('4');
    await expect(page.locator('.task-summary')).toHaveCount(0);
  });
}

test('Playfair pairs and Transposition source positions are not presented as simple substitution', async ({
  page,
}) => {
  await page.goto('/');
  const nav = page.getByRole('navigation');
  await nav.getByRole('button', { name: 'Playfair', exact: true }).click();
  await page.getByRole('button', { name: 'Proses pesan', exact: false }).click();
  await page.getByRole('combobox', { name: 'Fase algoritma' }).selectOption('process');
  expect(await page.locator('.source-cell').allTextContents()).toEqual(['BA', 'LX', 'LO', 'ON']);
  await expect(page.locator('.task-message')).toContainText('BALLOON');
  await expect(page.locator('.comparison-note')).toContainText('filler X/Q');
  await nav.getByRole('button', { name: 'Transposition', exact: true }).click();
  await page.getByRole('button', { name: 'Proses pesan', exact: false }).click();
  await page.getByRole('combobox', { name: 'Fase algoritma' }).selectOption('result');
  await page.getByRole('button', { name: 'Langkah sebelumnya' }).click();
  await expect(page.locator('.source-cell.active')).toHaveCount(1);
  await expect(page.locator('.result-cell.active')).toHaveCount(1);
  await expect(page.locator('.comparison-note')).toContainText('Posisi sumber dan hasil berbeda');
  await expect(page.locator('.step-explanation')).toContainText('Posisi sumber');
});
