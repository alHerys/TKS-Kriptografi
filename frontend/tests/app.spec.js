import { test, expect } from '@playwright/test';

async function ready(page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Proses pesan', exact: false })).toBeEnabled();
}

async function process(page) {
  await page.getByRole('button', { name: 'Proses pesan', exact: false }).click();
  await expect(page.getByTestId('stage')).toBeVisible();
}

async function complete(page) {
  await page.getByRole('combobox', { name: 'Fase algoritma' }).selectOption('result');
  await page.getByLabel('Kecepatan', { exact: true }).selectOption('2');
  await page.getByRole('button', { name: 'Langkah berikutnya', exact: true }).click();
  await expect(page.getByTestId('stage')).toHaveAttribute('data-progress', '1.000');
}

for (const [name, encrypted, decrypted] of [
  ['Caesar', 'KDOR GXQLD', 'HALO DUNIA'],
  ['Vigenere', 'LXFOPV EF RNHR', 'ATTACK AT DAWN'],
  ['Substitution', 'IQSG RXFOQ', 'HALO DUNIA'],
  ['Transposition', 'OLXLOXEWXLRXH_D', 'HELLO WORLD'],
  ['Playfair', 'IBSUPMNA', 'BALXLOON'],
]) {
  test(name + ' encrypt/decrypt uses real API steps', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await ready(page);
    await page
      .getByRole('navigation', { name: 'Pilih algoritma' })
      .getByRole('button', { name: new RegExp(name) })
      .click();
    await process(page);
    await expect(page.getByTestId('stage')).toHaveAttribute('data-progress', '0.000');
    await page.getByRole('combobox', { name: 'Fase algoritma' }).selectOption('process');
    await expect(page.getByTestId('moving-letter').first()).toHaveCount(1);
    await page.getByRole('button', { name: 'Langkah berikutnya', exact: true }).click();
    await expect(page.getByTestId('stage')).toHaveAttribute('data-progress', '1.000');
    await complete(page);
    await expect(page.getByTestId('output')).toHaveText(encrypted);
    await page.getByRole('button', { name: 'Dekripsi', exact: true }).click();
    await process(page);
    await complete(page);
    await expect(page.getByTestId('output')).toHaveText(decrypted);
    expect(errors).toEqual([]);
  });
}

test('pause freezes actual motion; speed, previous and reset restore snapshots', async ({
  page,
}) => {
  await ready(page);
  await process(page);
  await page.getByRole('combobox', { name: 'Fase algoritma' }).selectOption('process');
  const initial = await page.locator('.scene').innerHTML();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect
    .poll(async () => Number(await page.getByTestId('stage').getAttribute('data-progress')))
    .toBeGreaterThan(0.4);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const paused = await page.getByTestId('moving-letter').first().getAttribute('transform');
  await page.waitForTimeout(300);
  expect(await page.getByTestId('moving-letter').first().getAttribute('transform')).toBe(paused);
  await page.getByLabel('Kecepatan', { exact: true }).selectOption('2');
  await page.getByRole('button', { name: 'Langkah berikutnya', exact: true }).click();
  await expect(page.getByTestId('stage')).toHaveAttribute('data-progress', '1.000');
  await page.getByRole('button', { name: 'Langkah berikutnya', exact: true }).click();
  await expect(page.getByTestId('stage')).toHaveAttribute('data-step', '2');
  await page.getByRole('button', { name: 'Langkah sebelumnya', exact: true }).click();
  await expect(page.getByTestId('stage')).toHaveAttribute('data-step', '1');
  expect(await page.locator('.scene').innerHTML()).toBe(initial);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByTestId('stage')).toHaveAttribute('data-step', '0');
  await expect(page.getByTestId('stage')).toHaveAttribute('data-progress', '0.000');
});

test('source is exact Python and opening it pauses playback', async ({ page, request }) => {
  await ready(page);
  await process(page);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Kode Python' }).click();
  const source = await (await request.get('/api/source/caesar')).json();
  await expect(page.locator('.source-meta strong')).toHaveText(source.path);
  const lines = await page.locator('.code-line > span:last-child').allTextContents();
  expect(lines.map((line) => (line === ' ' ? '' : line)).join('\n')).toBe(source.code.trimEnd());
  await page.getByRole('button', { name: 'Visualisasi', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
});

test('invalid input is contextual and an old response cannot replace new input', async ({
  page,
}) => {
  await ready(page);
  await page.getByLabel('Pesan asli', { exact: true }).fill('café');
  await page.getByRole('button', { name: 'Proses pesan', exact: false }).click();
  await expect(page.locator('#text-error')).toContainText('ASCII');
  await page.getByRole('button', { name: 'Pakai contoh', exact: true }).click();
  await page.route('**/api/run', async (route) => {
    const response = await route.fetch();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fulfill({ response });
  });
  await page.getByRole('button', { name: 'Proses pesan', exact: false }).click();
  await page.getByLabel('Pesan asli', { exact: true }).fill('NEW');
  await page.waitForTimeout(700);
  await expect(page.getByTestId('stage')).toHaveCount(0);
  await expect(page.getByLabel('Pesan asli', { exact: true })).toHaveValue('NEW');
  await page.unroute('**/api/run');
  await process(page);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Pilih algoritma' })
    .getByRole('button', { name: /Playfair/ })
    .click();
  await expect(page.getByTestId('stage')).toHaveCount(0);
  await expect(page.getByLabel('Pesan asli', { exact: true })).toHaveValue('BALLOON');
});

test('random key remains visible and is reused for decryption', async ({ page }) => {
  await ready(page);
  await page
    .getByRole('navigation', { name: 'Pilih algoritma' })
    .getByRole('button', { name: /Substitution/ })
    .click();
  const before = await page.getByLabel('Kunci', { exact: true }).inputValue();
  await page.getByRole('button', { name: 'Acak kunci', exact: true }).click();
  await expect(page.getByLabel('Kunci', { exact: true })).not.toHaveValue(before);
  const key = await page.getByLabel('Kunci', { exact: true }).inputValue();
  expect(new Set(key).size).toBe(26);
  await process(page);
  await page.getByRole('button', { name: 'Dekripsi', exact: true }).click();
  await expect(page.getByLabel('Kunci', { exact: true })).toHaveValue(key);
  await process(page);
  await complete(page);
  await expect(page.getByTestId('output')).toHaveText('HALO DUNIA');
});

for (const viewport of [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
]) {
  test('offline local assets and layout ' + viewport.width, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const external = [];
    await page.route('**/*', (route) => {
      if (new URL(route.request().url()).hostname !== '127.0.0.1') {
        external.push(route.request().url());
        return route.abort();
      }
      return route.continue();
    });
    await ready(page);
    await page.screenshot({ path: testInfo.outputPath('initial.png'), fullPage: true });
    await page
      .getByRole('navigation', { name: 'Pilih algoritma' })
      .getByRole('button', { name: /Playfair/ })
      .click();
    await process(page);
    await expect(page.getByRole('progressbar')).toHaveCount(0);
    await expect(page.locator('.panel-caption')).toHaveCount(0);
    const explanation = await page.locator('.step-explanation').boundingBox();
    const toolbar = await page.locator('.playback-controls').boundingBox();
    const stage = await page.getByTestId('stage').boundingBox();
    expect(explanation.y + explanation.height).toBeLessThanOrEqual(toolbar.y + 1);
    expect(toolbar.y + toolbar.height).toBeLessThanOrEqual(stage.y + 1);
    await page.getByRole('combobox', { name: 'Fase algoritma' }).selectOption('process');
    await page.getByRole('button', { name: 'Langkah berikutnya', exact: true }).click();
    await expect(page.getByTestId('stage')).toHaveAttribute('data-progress', '1.000');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    expect(external).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('playfair.png'), fullPage: true });
    await page.getByRole('button', { name: 'Fokus', exact: true }).click();
    await expect(page.locator('.visual-panel')).toHaveClass(/focused/);
    const controls = await page.locator('.playback-controls').boundingBox();
    expect(controls.y + controls.height).toBeLessThanOrEqual(viewport.height);
    await page.screenshot({ path: testInfo.outputPath('focused.png') });
    await page.keyboard.press('Escape');
    await expect(page.locator('.visual-panel')).not.toHaveClass(/focused/);
  });
}

test('reduced motion preserves the complete calculation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  await process(page);
  await complete(page);
  await expect(page.getByTestId('output')).toHaveText('KDOR GXQLD');
  await expect(page.getByTestId('moving-letter')).toHaveCount(0);
});

test('autoplay advances through every phase and stops at the final result', async ({ page }) => {
  await ready(page);
  await page.getByLabel('Pesan asli', { exact: true }).fill('AZ');
  await process(page);
  await page.getByLabel('Kecepatan', { exact: true }).selectOption('2');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByTestId('stage')).toHaveAttribute('data-step', '3');
  await expect(page.getByTestId('stage')).toHaveAttribute('data-progress', '1.000');
  await expect(page.getByTestId('output')).toHaveText('DC');
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeDisabled();
  await expect(page.getByRole('combobox', { name: 'Fase algoritma' })).toHaveValue('result');
});

test('long messages and keys stay inside their scrollable diagram', async ({ page }) => {
  await ready(page);
  await page
    .getByRole('navigation', { name: 'Pilih algoritma' })
    .getByRole('button', { name: /Transposition/ })
    .click();
  await page.getByLabel('Pesan asli', { exact: true }).fill('ABCDEFGHIJKLMNOPQRST'.repeat(10));
  await page.getByLabel('Kunci', { exact: true }).fill('ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEF');
  await process(page);
  await page.getByRole('combobox', { name: 'Fase algoritma' }).selectOption('process');
  await expect(page.getByTestId('moving-letter')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    await page
      .locator('.scene-scroll')
      .evaluate((element) => element.scrollWidth > element.clientWidth),
  ).toBe(true);
  await page
    .getByRole('navigation', { name: 'Pilih algoritma' })
    .getByRole('button', { name: /Vigenere/ })
    .click();
  await page.getByLabel('Pesan asli', { exact: true }).fill('ABCDEFGHIJKLMNOPQRST'.repeat(10));
  await process(page);
  await page.getByLabel('Kecepatan', { exact: true }).selectOption('2');
  await page.getByRole('button', { name: 'Langkah berikutnya', exact: true }).click();
  await expect(page.getByTestId('stage')).toHaveAttribute('data-progress', '1.000');
  await page.getByRole('button', { name: 'Langkah berikutnya', exact: true }).click();
  await expect(page.getByTestId('stage')).toHaveAttribute('data-step', '1');
  await expect(page.locator('.scene .svg-letter')).toHaveCount(400);
  expect(
    await page
      .locator('.scene-scroll')
      .evaluate((element) => element.scrollHeight > element.clientHeight),
  ).toBe(true);
});

test('legacy padding may legitimately produce an empty result', async ({ page }) => {
  await ready(page);
  await page
    .getByRole('navigation', { name: 'Pilih algoritma' })
    .getByRole('button', { name: /Transposition/ })
    .click();
  await page.getByRole('button', { name: 'Dekripsi', exact: true }).click();
  await page.getByLabel('Ciphertext', { exact: true }).fill('XXX');
  await page.getByLabel('Kunci', { exact: true }).fill('KEY');
  await process(page);
  await complete(page);
  await expect(page.getByTestId('output')).toHaveText('');
  await expect(
    page.getByText('Hasil berupa teks kosong setelah pembersihan padding.'),
  ).toBeVisible();
});
