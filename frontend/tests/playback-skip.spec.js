import { test, expect } from '@playwright/test';

async function prepare(page, algorithm = 'Caesar') {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('button', { name: algorithm, exact: true }).click();
  const response = page.waitForResponse('**/api/run');
  await page.getByRole('button', { name: 'Proses pesan', exact: false }).click();
  const run = await (await response).json();
  await page.getByRole('combobox', { name: 'Fase algoritma' }).selectOption('process');
  await page.getByLabel('Kecepatan', { exact: true }).selectOption('0.5');
  return run;
}

for (const algorithm of ['Caesar', 'Vigenere', 'Substitution', 'Transposition', 'Playfair']) {
  test(`${algorithm}: Next skips active animation and stops autoplay at the current result`, async ({
    page,
  }) => {
    const run = await prepare(page, algorithm);
    const stage = page.getByTestId('stage');
    const next = page.getByRole('button', { name: 'Langkah berikutnya', exact: true });
    const index = Number(await stage.getAttribute('data-step'));
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect
      .poll(async () => Number(await stage.getAttribute('data-progress')))
      .toBeGreaterThan(0.05);
    await next.click();
    await expect(stage).toHaveAttribute('data-progress', '1.000', { timeout: 500 });
    await expect(stage).toHaveAttribute('data-step', String(index));
    await expect(page.getByTestId('output')).toHaveText(run.steps[index].output || '…');
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
    const snapshot = await page.locator('.scene').innerHTML();
    await page.waitForTimeout(300);
    expect(await page.locator('.scene').innerHTML()).toBe(snapshot);
    await next.click();
    await expect(stage).toHaveAttribute('data-step', String(index + 1));
    await page.getByRole('button', { name: 'Langkah sebelumnya', exact: true }).click();
    await expect(stage).toHaveAttribute('data-step', String(index));
    await expect(stage).toHaveAttribute('data-progress', '0.000');
  });
}

test('Next also skips manual and paused animations, including the last step', async ({ page }) => {
  const run = await prepare(page);
  const stage = page.getByTestId('stage');
  const next = page.getByRole('button', { name: 'Langkah berikutnya', exact: true });
  const index = await stage.getAttribute('data-step');
  await next.dblclick();
  await expect(stage).toHaveAttribute('data-progress', '1.000', { timeout: 500 });
  await expect(stage).toHaveAttribute('data-step', index);
  await next.click();
  await expect
    .poll(async () => Number(await stage.getAttribute('data-progress')))
    .toBeGreaterThan(0.05);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await next.click();
  await expect(stage).toHaveAttribute('data-progress', '1.000', { timeout: 500 });
  await page.getByRole('combobox', { name: 'Fase algoritma' }).selectOption('result');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await next.click();
  await expect(stage).toHaveAttribute('data-progress', '1.000', { timeout: 500 });
  await expect(page.getByTestId('output')).toHaveText(run.output);
  await expect(next).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(stage).toHaveAttribute('data-step', '0');
  await expect(stage).toHaveAttribute('data-progress', '0.000');
});
