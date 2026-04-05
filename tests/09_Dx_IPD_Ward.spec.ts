import { test, expect } from '@playwright/test';
import { sendMsgToTelegram, sendScreenshotToTelegram } from './utils/telegram-utils';
import { generateDatetimeTick } from './utils/data-utils';
import PAT_NUM_RAW from '../cypress/fixtures/PAT_NUM.json';
const PAT_NUM: any = PAT_NUM_RAW;
import dotenv from 'dotenv';
import { LoginPage } from '../pages/login.page';
dotenv.config();

const specVersion = '1.15';
const apiUrl = process.env.API_URL;
let headerName = '';

test.describe('IPD WARD', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
        
        if (page.url().includes('/login')) {
            const loginPage = new LoginPage(page);
            const user = (process.env.USERNAME2 || 'dtest');
            await loginPage.loginWithComRole('com1', 'passo', user, process.env.PASSWORD || '1');
        }
        
        await page.waitForLoadState('networkidle');
    
    const bodyText = await page.innerText('body');
    if (bodyText.includes('Verbal Order')) {
      await page.locator('.far').first().click();
    }
    
    await expect(page.locator('text=Welcome')).toBeVisible();
    await page.locator('.ifbtn').click({ force: true });
    await page.waitForTimeout(2000);
    await page.click('text=IPD');
    await page.waitForTimeout(3000);
    await page.click('text=IPD Ward');
    await page.waitForTimeout(2000);
    
    const HNNum = PAT_NUM.PAT_NUM.PAT_1.HN1;
    await page.locator('app-auto-complete-master-setup').nth(2).locator('input').press('Backspace');
    await page.fill('input[placeholder="HN"]', HNNum);
    await page.waitForTimeout(5000);
    await page.click('text=Search');
    await page.click(`text=${HNNum}`);
    await page.waitForTimeout(8000);
  });

  test.afterEach(async ({ page }, testInfo) => {
    const status = testInfo.status === 'passed' ? 'Success' : 'Failed';
    const message = `${headerName} ${status} | Version: ${specVersion}`;
    
    const filename = `test_${generateDatetimeTick()}.png`;
    const screenshotPath = `test-results/screenshots/${filename}`;
    await page.screenshot({ path: screenshotPath });
    await sendScreenshotToTelegram(screenshotPath, filename, message);
  });

  test('IPD Progress Note', async ({ page }) => {
    headerName = 'IPD Progress Note';
    await page.waitForTimeout(2000);

    const noteLabels = ['Subjective', 'Objective', 'Assessment', 'Plan', 'NON OR PROCEDURE / Special Investigation'];
    for (const label of noteLabels) {
        const container = page.locator('.form-group', { hasText: label });
        await container.locator('textarea').first().fill('Test');
    }

    await page.click('button:has-text("Save")');
  });

  test('IPD Xray', async ({ page }) => {
    headerName = "IPD Xray";
    await page.waitForTimeout(2000);
    await page.locator('.col-xl-5 > :nth-child(5)').click();
    await page.waitForTimeout(5000);
    
    await page.locator('.srcbarmaintable > .col-md-12 > .form-control').first().press('ArrowDown');
    await page.locator('.srcbarmaintable > .col-md-12 > .form-control').first().press('Enter');
    await page.waitForTimeout(5000);
    
    await page.locator('app-dialog-order-xray select').first().selectOption({ index: 0 });
    await page.waitForTimeout(1000);

    await page.locator('#MedthodLab').first().click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(1000);
    await page.locator('div.list_xray mat-checkbox').first().click();
    await page.click('button.btn-info:has-text("Apply")');
    
    await page.locator('.form-group.row.d-flex.justify-content-end button').first().click();
    
    if (await page.locator('text=Duplicate').isVisible()) {
        await page.click('text=Yes');
    }
    
    await page.locator('app-dialog-order-xray button.btn-primary:has-text("Submit"), app-dialog-order-xray .btn-primary').last().click();
    await page.waitForTimeout(5000);
  });

  test('IPD Lab', async ({ page }) => {
    headerName = "IPD Lab";
    await page.waitForTimeout(2000);
    await page.locator('.col-xl-5 > :nth-child(4)').click();
    await page.waitForTimeout(5000);
    
    await page.locator('div.panel-body.srcbarmaintable select').first().selectOption({ index: 0 });
    await page.waitForTimeout(1000);
    
    await page.locator('#MedthodLab').first().click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(2000);
    await page.locator('div.change-height mat-checkbox').first().click();
    await page.click('.row > .btn-info');
    await page.waitForTimeout(2000);

    await page.locator('app-dialog-order-labbloodfuture button.btn-primary').click();
    await page.waitForTimeout(5000);
  });

  test('Set OR IPD', async ({ page }) => {
    headerName = 'Set Or IPD';
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    await page.click('.fa-solid.fa-bars');
    await page.click('text=OR Request');
    
    await page.locator(':nth-child(8) > dx-datetime > .far').click();
    // Assuming automation of date selection or just picking 'next day'
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    
    await page.fill(':nth-child(9) > app-input-time > .stextbox', '15');
    await page.fill(':nth-child(10) > app-input-time > .stextbox', '16');
    
    const wardInput = page.locator(':nth-child(6) > app-auto-complete-master-setup > div > #idhtml');
    await wardInput.click();
    await wardInput.press('ArrowDown');
    await wardInput.press('Enter');

    const doctorInput = page.locator(':nth-child(11) > app-auto-complete-master-setup > div > #idhtml');
    await doctorInput.click();
    await doctorInput.press('ArrowDown');
    await doctorInput.press('Enter');

    await page.click('.col-xl-5 > .row > :nth-child(13) > .form-control');
    await page.click('button.btn.btn-default:has-text("Search")');
    await page.waitForTimeout(5000);
    await page.click('button.btn.btn-default:has-text("0001")');
    await page.waitForTimeout(5000);

    await page.fill('.col-xl-5 > .row > :nth-child(15) > .form-control', 'Test');
    await page.click('.col-xl-5 > .row > :nth-child(20) > .form-control');
    await page.fill('.col-sm-5 > .form-control', 'A011');
    await page.click('button.btn.btn-default:has-text("Search")');
    await page.click('button.btn.btn-default:has-text("A011")');
    await page.waitForTimeout(5000);
    
    await page.fill('.col-xl-6 > .row > :nth-child(28) > .form-control', '180');
    await page.fill(':nth-child(30) > .form-control', '80');
    await page.fill('.col-xl-6 > .row > :nth-child(34) > .form-control', '37');
    await page.fill('.col-xl-6 > .row > :nth-child(36) > .form-control', '80');
    await page.fill(':nth-child(39) > .form-control', '80');
    await page.fill(':nth-child(41) > .form-control', '120');
    await page.fill(':nth-child(42) > .form-control', '140');

    await page.click('.col-xl-1 > :nth-child(1) > .col-md-12');
    await page.waitForTimeout(5000);
  });

  test('IPD Medicine : One Day', async ({ page }) => {
    headerName = 'IPD Medicine : One day';
    await page.waitForTimeout(5000);
    await page.locator('.col-xl-5').locator('button:has-text("Med")').first().click();
    await page.waitForTimeout(5000);
    
    await page.fill('#Medicine', 'Paracetamol');
    await page.waitForTimeout(3000);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);

    await page.fill('#Qty', '2');
    await page.waitForTimeout(4000);
    await page.locator('.row > [align="right"] > .ng-star-inserted').scrollIntoViewIfNeeded();
    await page.click('.row > [align="right"] > .ng-star-inserted');
    await page.waitForTimeout(5000);

    await page.locator('thead > tr > th > mat-checkbox').nth(2).click();
    await page.locator('.btn.btn-info.mr-1').last().click();
    await page.waitForTimeout(5000);
  });

  test('IPD : Medicine : Continued', async ({ page }) => {
    headerName = 'IPD Medicine : Continued';
    await page.waitForTimeout(5000);
    await page.click('text=Order Continue');
    await page.waitForTimeout(7000);
    
    await page.fill('#Medicine', 'IBUPROFEN');
    await page.waitForTimeout(3000);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(7000);

    await page.fill('#Qty', '2');
    await page.waitForTimeout(7000);
    await page.locator('.row > [align="right"] > .ng-star-inserted').scrollIntoViewIfNeeded();
    await page.click('.row > [align="right"] > .ng-star-inserted');
    await page.waitForTimeout(5000);

    await page.locator('thead > tr > th > mat-checkbox').nth(2).click();
    await page.locator('.btn.btn-info.mr-1').last().click();
    await page.waitForTimeout(5000);
  });

  test('Entry Vital Sign', async ({ page }) => {
    headerName = "Entry Vital Sign";
    await page.waitForTimeout(5000);
    await page.click('text=Vital signs');
    await page.waitForTimeout(5000);
    
    await page.fill('app-view-vitalverprong input.form-control', '37'); // needs better selector
    await page.fill('.change-mr-temp > .form-control', '80');
    await page.fill(':nth-child(2) > :nth-child(7) > .form-control', '120');
    await page.fill(':nth-child(2) > :nth-child(8) > .form-control', '80');
    
    await page.click('[name="raAlert"]');
    await page.click('[name="raTherapy"]');
    await page.click('[name="raRespiratory"]');
    
    await page.click('.flex4date > dx-datetime > .far');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    
    await page.click('app-view-vitalverprong button:has-text("Save"), app-view-vitalverprong .btn-primary');
    await page.waitForTimeout(5000);
  });

  test('Fill Pre-Admission Form', async ({ page }) => {
    headerName = 'Fill Pre-Admission Form';
    await page.waitForTimeout(5000);
    await page.click('text=Pre-Admission');
    
    const inputs = page.locator('.form-group .form-control');
    await inputs.nth(0).fill('test');
    await inputs.nth(1).fill('test');
    
    await page.click('button.btn.btn-md.btn-success.mr-2');
    await page.waitForTimeout(5000);
  });
});
