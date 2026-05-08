import { test as base } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const test = base.extend({});

export { expect } from '@playwright/test';
