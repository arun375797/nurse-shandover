import { test, expect } from '@playwright/test';

test('nurse handover happy path', async ({ page }) => {
  const mr = `SYN-E2E-${Date.now()}`;
  const name = 'Synthetic E2E Patient';

  await page.goto('/login');
  await page.getByLabel('Email').fill('nurse.dev@bedsiderelay.local');
  await page.getByLabel('Password').fill('NurseDev!234');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('heading', { name: 'Patients' })).toBeVisible();
  await page.getByRole('button', { name: '+ Add Patient' }).first().click();

  await expect(page.getByRole('heading', { name: /Add Patient Handover/i })).toBeVisible();
  await page.getByLabel('Patient Name').fill(name);
  await page.getByLabel('MR Number').fill(mr);
  await page.getByLabel('Pending items').fill('Synthetic pending labs');
  await page.getByRole('button', { name: 'Save Patient' }).click();

  await expect(page.getByRole('heading', { name: 'Patients' })).toBeVisible();
  await expect(page.getByText(name).first()).toBeVisible();
  await expect(page.getByText(mr).first()).toBeVisible();

  await page.getByRole('link', { name }).first().click();
  await expect(page.getByLabel('Patient Name')).toHaveValue(name);
  await page.getByLabel('Pending items').fill('Synthetic pending labs — updated');
  await page.getByRole('button', { name: 'Save Patient' }).click();
  await expect(page.getByRole('heading', { name: 'Patients' })).toBeVisible();

  await page.getByRole('link', { name }).first().click();
  await expect(page.getByLabel('Pending items')).toHaveValue('Synthetic pending labs — updated');

  await page.getByRole('button', { name: 'Delete Patient' }).click();
  await expect(page.getByRole('dialog')).toContainText(name);
  await expect(page.getByRole('dialog')).toContainText(mr);
  await page.getByRole('button', { name: 'Archive Patient' }).click();

  await expect(page.getByRole('heading', { name: 'Patients' })).toBeVisible();
  await expect(page.getByText(name)).toHaveCount(0);
});
