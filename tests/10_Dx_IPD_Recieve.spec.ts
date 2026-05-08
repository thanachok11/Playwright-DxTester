import { test, expect } from './utils/base-test';
import { sendMsgToTelegram, sendScreenshotToTelegram } from './utils/telegram-utils';
import { generateDatetimeTick } from './utils/data-utils';
import PAT_NUM_RAW from '../cypress/fixtures/PAT_NUM.json';
const PAT_NUM: any = PAT_NUM_RAW;
import dotenv from 'dotenv';
dotenv.config();

const specVersion = '1.15';
const apiUrl = process.env.API_URL;
let headerName = '';

test.describe('IPD Receieve', () => {

    test.beforeEach(async ({ page }) => {
        
        await page.waitForLoadState('networkidle');
        
        const bodyText = await page.innerText('body');
        if (bodyText.includes('Verbal Order')) {
            await page.locator('.far').first().click();
        }
        
        await expect(page.locator('text=Welcome')).toBeVisible();
        await page.locator('.ifbtn').click({ force: true });
        await page.waitForTimeout(2000);
    });

    test.afterEach(async ({ page }, testInfo) => {
        const status = testInfo.status === 'passed' ? 'Success' : 'Failed';
        const message = `${headerName} ${status} | Version: ${specVersion}`;
        
        const filename = `test_${generateDatetimeTick()}.png`;
        const screenshotPath = `test-results/screenshots/${filename}`;
        await page.screenshot({ path: screenshotPath });
        await sendScreenshotToTelegram(screenshotPath, filename, message);
    });

    test('IPD Checkout: Cash', async ({ page }) => {
        headerName = "IPD Checkout: Cash";
        
        await page.waitForTimeout(3000);
        await page.locator('text=Cashier').scrollIntoViewIfNeeded();
        await page.click('text=Cashier');
        await page.waitForTimeout(2000);
        await page.click('text=IPD Cashier');
        await page.waitForTimeout(4000);
        
        await page.selectOption('#Select1', 'ทุกกรณี');

        const ANNum = PAT_NUM.PAT_NUM.PAT_1.AN1;
        await page.locator('app-auto-complete-master-setup').nth(2).locator('input').press('Backspace');
        await page.fill('input[placeholder="AN"]', ANNum);
        await page.waitForTimeout(5000);
        await page.click('text=Search');
        await page.locator(`text=${ANNum}`).click();
        await page.waitForTimeout(4000);
        
        await page.waitForTimeout(10000);
        await page.click('.flex-grow-1 > :nth-child(3)');
        await page.waitForTimeout(6000);
        
        const secondAutoComplete = page.locator('app-auto-complete-master-setup').nth(1).locator('input');
        await secondAutoComplete.press('ArrowDown');
        await secondAutoComplete.press('Enter');
        await page.waitForTimeout(3000);
        
        await page.click('#button3');
        await page.waitForTimeout(3000);
        
        await page.selectOption('#Select5', 'รับชำระด้วยเงินสด');
        await page.click('#button5');
        await page.waitForTimeout(3000);
        
        await page.click('text=ALL');
        await page.click('.mat-dialog-actions > .mat-primary');
        
        await expect(page.locator('text=Finance Allow Discharge')).toBeVisible();
        await page.click('.mat-dialog-actions > .mat-primary');
    });
});
