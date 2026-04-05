import { test as setup, expect } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import { LoginPage } from '../pages/login.page';

const authFile = path.join(__dirname, '../.auth/user.json');

setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const username = process.env.USERNAME2!;
  const password = process.env.PASSWORD!;

  // Authenticate using the configured BASE_URL
  console.log(`Authenticating via ${process.env.BASE_URL || 'default URL'}...`);
  await page.goto('/login');
  await loginPage.loginWithComRole('com1', 'passo', username, password);
  await page.waitForURL(/\/(main|dashboard)/, { timeout: 30000 });

  // Handle potential modals/popups (like the 'Verbal Order' check in Cypress)
  const bodyText = await page.innerText('body');
  if (bodyText.includes('Verbal Order')) {
      const farButton = page.locator('.far').first();
      if (await farButton.isVisible()) {
          await farButton.click();
      }
  }

  const finalFarButton = page.locator('.far').first();
    if (await finalFarButton.isVisible()) {
        await finalFarButton.click();
    }
    
  await page.waitForTimeout(2000);
  
  // Store the state (now contains cookies for both origins)
  await page.context().storageState({ path: authFile });
});
