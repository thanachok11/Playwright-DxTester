import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}


  // Standard login form elements (from Codegen)
  usernameInput() {
    return this.page.getByRole('textbox', { name: 'User Name' });
  }

  passwordInput() {
    return this.page.getByRole('textbox', { name: 'Password', exact: true });
  }

  loginButtonEn() {
    return this.page.getByRole('button', { name: '   Login' });
  }

  // COMROLE configuration (top-right corner)
  comRoleTrigger() {
    return this.page.locator('i').first();
  }

  comRoleUsername() {
    return this.page.locator('#mat-input-0');
  }

  comRolePassword() {
    return this.page.getByRole('textbox', { name: 'Enter your password' });
  }

  comRoleSaveButton() {
    return this.page.getByRole('button', { name: 'Save' });
  }

  async login(username: string, password: string) {
    await this.usernameInput().click();
    await this.usernameInput().fill(username);
    await this.passwordInput().click();
    await this.passwordInput().fill(password);
    await this.loginButtonEn().click();
  }

  async loginWithComRole(comUsername: string, comPassword: string, username: string, password: string) {
    await this.comRoleTrigger().click();
    await this.comRoleUsername().click();
    await this.comRoleUsername().fill(comUsername);
    await this.comRolePassword().click();
    await this.comRolePassword().fill(comPassword);
    await this.comRoleSaveButton().click();

    // รอให้ Modal Backdrop หายไปก่อน (ถ้ามี)
    await this.page.locator('.cdk-overlay-backdrop').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    await this.login(username, password);
  }

  async configureComRole(comUsername: string, comPassword: string) {
    await this.comRoleTrigger().click();
    await this.comRoleUsername().fill(comUsername);
    await this.comRolePassword().fill(comPassword);
    await this.comRoleSaveButton().click();
  }
}
