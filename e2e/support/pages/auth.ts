import type { TestAccount } from '../accounts';
import { type } from '../screen';
import { ScreenObject } from './screen-object';

export class SignInScreen extends ScreenObject {
  async open(): Promise<void> {
    await this.page.goto('/auth?mode=login');
    await this.arrive(this.heading('Welcome back'));
  }

  /** Signs in and waits for Today. */
  async as(account: TestAccount): Promise<void> {
    await type(this.page.locator('input[name="email"]'), account.email);
    await type(this.page.locator('input[name="password"]'), account.password);
    await this.page.locator('ion-button.main-submit-btn').tap();
    await this.arrive(this.heading(`Hi ${account.username}`));
  }

  isShown() {
    return this.heading('Welcome back');
  }
}

export class RegisterScreen extends ScreenObject {
  async open(): Promise<void> {
    await this.page.goto('/auth?mode=register');
    await this.arrive(this.heading('Create your account'));
  }

  async register(account: TestAccount): Promise<void> {
    await type(this.page.locator('input[name="email"]'), account.email);
    await type(this.page.locator('input[name="username"]'), account.username);
    await type(this.page.locator('input[name="password"]'), account.password);
    await type(this.page.locator('input[name="confirmPassword"]'), account.password);
    await this.page.locator('ion-button.main-submit-btn').tap();
    await this.arrive(this.heading('What would you like help with?'));
  }

  isShown() {
    return this.heading('Create your account');
  }

  async chooseHelpWith(label: string): Promise<void> {
    await this.button(new RegExp(label)).tap();
    await this.button('Continue', true).tap();
  }
}

export class AccountScreen extends ScreenObject {
  async open(): Promise<void> {
    await this.link('Account').tap();
    await this.arrive(this.button('Log out'));
  }

  async logOut(): Promise<void> {
    await this.button('Log out').tap();
  }

  async deleteAccount(): Promise<void> {
    await this.button('Delete account').tap();
    await this.button('Delete', true).tap();
  }
}
