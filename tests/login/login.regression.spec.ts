import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';

test.describe('Login Regression Tests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('TC01: Successful Login with Valid Credentials', async ({ page }) => {
    const username = process.env.USERNAME2 || 'dtest';
    const password = process.env.PASSWORD || '1';

    await loginPage.loginWithComRole('com1', 'passo', username, password);
    await page.waitForURL(/\/(main|dashboard)/, { timeout: 30000 });
    await expect(page).toHaveURL(/\/(main|dashboard)/);
  });

  test('TC02: Failed Login with Invalid Username', async ({ page }) => {
    const invalidUser = 'invalid_user_123';
    await loginPage.loginWithComRole('com1', 'passo', invalidUser, '1');
    
    // Expect to stay on login page
    await page.waitForTimeout(3000);
    await expect(page).not.toHaveURL(/\/(main|dashboard)/);
    // Optionally check for error message if known
  });

  test('TC03: Failed Login with Invalid Password', async ({ page }) => {
    const username = process.env.USERNAME2 || 'dtest';
    await loginPage.loginWithComRole('com1', 'passo', username, 'wrong_pass');
    
    // Expect to stay on login page
    await page.waitForTimeout(3000);
    await expect(page).not.toHaveURL(/\/(main|dashboard)/);
  });

  test('TC04: Verify COMROLE Settings Popup', async ({ page }) => {
    await loginPage.comRoleTrigger().click();
    await expect(loginPage.comRoleUsername()).toBeVisible();
    await expect(loginPage.comRolePassword()).toBeVisible();
    
    // Close or save
    await loginPage.comRoleUsername().fill('test_com');
    await loginPage.comRolePassword().fill('test_pass');
    await loginPage.comRoleSaveButton().click();
    
    // Backdrop should disappear
    await page.locator('.cdk-overlay-backdrop').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  });
});
