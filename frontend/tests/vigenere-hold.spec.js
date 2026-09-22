import { test, expect } from '@playwright/test';

async function start(page, algorithm = 'Vigenere') {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('button', { name: algorithm, exact: true }).click();
  await page.getByRole('button', { name: 'Proses pesan', exact: false }).click();
  await page.getByRole('combobox', { name: 'Fase algoritma' }).selectOption('process');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
}

test('Vigenere holds its completed result before autoplay advances', async ({ page }) => {
  await start(page);
  const stage = page.getByTestId('stage');
  await expect(stage).toHaveAttribute('data-holding', 'true');
  await expect(stage).toHaveAttribute('data-progress', '1.000');
  await expect(page.getByTestId('output')).toHaveText('L');
  const index = Number(await stage.getAttribute('data-step'));
  const snapshot = await page.locator('.scene').innerHTML();
  await page.waitForTimeout(400);
  await expect(stage).toHaveAttribute('data-step', String(index));
  expect(await page.locator('.scene').innerHTML()).toBe(snapshot);
  await expect(stage).toHaveAttribute('data-step', String(index + 1));
});

test('Vigenere hold supports pause, resume, skip and reset', async ({ page }) => {
  await start(page);
  const stage = page.getByTestId('stage');
  await expect(stage).toHaveAttribute('data-holding', 'true');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const index = await stage.getAttribute('data-step');
  await page.waitForTimeout(1100);
  await expect(stage).toHaveAttribute('data-holding', 'true');
  await expect(stage).toHaveAttribute('data-step', index);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(stage).toHaveAttribute('data-holding', 'true');
  await page.getByRole('button', { name: 'Langkah berikutnya' }).click();
  await expect(stage).toHaveAttribute('data-holding', 'false');
  await expect(stage).toHaveAttribute('data-progress', '1.000');
  await expect(stage).toHaveAttribute('data-step', index);
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Langkah berikutnya' }).click();
  await expect(stage).toHaveAttribute('data-step', String(Number(index) + 1));
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.waitForTimeout(1100);
  await expect(stage).toHaveAttribute('data-step', '0');
  await expect(stage).toHaveAttribute('data-holding', 'false');
});

test('Vigenere hold follows playback speed, including reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page);
  const stage = page.getByTestId('stage');
  await page.getByLabel('Kecepatan', { exact: true }).selectOption('0.5');
  await expect(stage).toHaveAttribute('data-holding', 'true');
  const index = Number(await stage.getAttribute('data-step'));
  await page.waitForTimeout(1100);
  await expect(stage).toHaveAttribute('data-step', String(index));
  await page.getByLabel('Kecepatan', { exact: true }).selectOption('2');
  await expect(stage).toHaveAttribute('data-step', String(index + 1), { timeout: 1000 });
});
