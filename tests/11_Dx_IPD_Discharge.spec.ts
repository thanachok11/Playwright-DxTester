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

test.describe('IPD WARD Discharge', () => {

    test.beforeEach(async ({ page }) => {
        
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
        
        // Wait for specific API if needed, or just timeout
        await page.waitForTimeout(10000);

        const ANNum = PAT_NUM.PAT_NUM.PAT_1.AN1;
        await page.locator('app-auto-complete-master-setup').nth(2).locator('input').press('Backspace');
        await page.fill('input[placeholder="AN"]', ANNum);
        await page.waitForTimeout(5000);
        await page.click('text=Search');
        await page.locator(`text=${ANNum}`).click();
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

    test('Discharge', async ({ page }) => {
        headerName = 'Discharge';
        
        const doctorPromise = page.waitForResponse(response => 
            response.url().includes('EnquireHNIPDDoctor') && response.request().method() === 'POST'
        );
        
        await page.waitForTimeout(5000);
        await page.locator('div.col-xl-9').locator('button:has-text("Discharge")').click();
        await doctorPromise;

        const dischargeInput = page.locator('label:has-text("DischargeCode")').locator('..').locator('app-auto-complete-master-setup input').first();
        await dischargeInput.fill('01');
        await page.waitForTimeout(3000);
        await dischargeInput.press('ArrowDown');
        await dischargeInput.press('Enter');

        await page.click('.col-md-10 > b > h3 > .btn');
    });
});
