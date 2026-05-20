import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.locator('body').click();
  await page.locator('body').click();
  await page.locator('body').click();
  await page.goto('http://localhost:3000/');
  await page.getByRole('region', { name: 'Map' }).click({
    position: {
      x: 82,
      y: 71
    }
  });
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.getByRole('region', { name: 'Map' }).click({
    position: {
      x: 614,
      y: 356
    }
  });
  await page.getByRole('button', { name: 'Zoom in' }).dblclick();
  await page.getByRole('region', { name: 'Map' }).click({
    position: {
      x: 472,
      y: 405
    }
  });
  await page.getByRole('button', { name: 'Zoom in' }).dblclick();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.getByRole('button', { name: 'Zoom out' }).click();
  await page.getByRole('button', { name: 'Zoom out' }).click();
  await page.getByRole('region', { name: 'Map' }).click({
    position: {
      x: 276,
      y: 258
    }
  });
  await page.getByText('Driver 13894900').click();
  await expect(page.locator('#root')).toContainText('Driver 13894900');
  await page.getByRole('region', { name: 'Map' }).click({
    position: {
      x: 522,
      y: 366
    }
  });
  await page.getByText('2850').click();
  await page.getByRole('button', { name: 'D1 Driver 1691B3DB KMGZ106C' }).click();
  await page.getByRole('button', { name: 'On Trip', exact: true }).click();
  await expect(page.getByTestId('virtuoso-item-list')).toContainText('On Trip');
});