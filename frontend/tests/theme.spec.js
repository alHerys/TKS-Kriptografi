import { test, expect } from '@playwright/test';

for (const width of [1366, 390]) {
  test(`theme toggle follows system, persists and preserves playback at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    const toggle = page.locator('.theme-toggle');
    await expect(toggle).toHaveAccessibleName('Aktifkan mode gelap');
    await expect(page.getByRole('combobox', { name: 'Tema warna' })).toHaveCount(0);

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(toggle).toHaveAccessibleName('Aktifkan mode terang');
    const nav = await page.getByRole('navigation', { name: 'Pilih algoritma' }).boundingBox();
    const button = await toggle.boundingBox();
    expect(button.y).toBe(12);
    expect(width - (button.x + button.width)).toBe(12);
    expect(button.y + button.height).toBeLessThan(nav.y);
    const workspace = await page.locator('.workspace').boundingBox();
    expect(nav.x).toBe(workspace.x);
    expect(nav.width).toBe(workspace.width);

    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'latte');
    await page.reload();
    await expect(toggle).toHaveAccessibleName('Aktifkan mode gelap');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'latte');

    await page.getByRole('button', { name: 'Proses pesan', exact: false }).click();
    const stage = page.getByTestId('stage');
    await expect(stage).toBeVisible();
    await page.getByRole('combobox', { name: 'Fase algoritma' }).selectOption('process');
    const step = await stage.getAttribute('data-step');
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'mocha');
    await expect(stage).toHaveAttribute('data-step', step);
    await expect(toggle).toHaveAccessibleName('Aktifkan mode terang');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(toggle).toHaveAccessibleName('Aktifkan mode terang');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'mocha');
    await expect(toggle).toHaveAccessibleName('Aktifkan mode terang');
  });
}
