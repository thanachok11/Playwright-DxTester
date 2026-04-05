import { test, expect } from '@playwright/test';
import { sendMsgToTelegram, sendScreenshotToTelegram } from './utils/telegram-utils';
import { generateDatetimeTick } from './utils/data-utils';
import dotenv from 'dotenv';
import { LoginPage } from '../pages/login.page';
dotenv.config();

const specVersion = '1.15';
const apiUrl = process.env.API_URL;
let headerName = '';

test.describe(`OPD_CheckOut ${specVersion}`, () => {
    
    let HNNum = '';

    test.beforeEach(async ({ page, request }) => {
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
        
        // Get HN via API
        const response = await request.post(`${apiUrl}EnquireHotKeysConfig`, {
            data: {
                param: {
                    ContextKey: "ReU",
                    EntryByUserCode: "CYPRESS",
                    ModuleAppID: "TEST_OPENHN_1",
                }
            }
        });
        const body = await response.json();
        HNNum = body.ListOfData[0].ActionName;

        await page.locator('.ifbtn').click({ force: true });
        await page.locator('text=OPD').click({ force: true });
        await page.locator('text=Nurse Workbench').click({ force: true });
        await page.waitForTimeout(30000);
        
        await page.fill('input[placeholder="HN"]', HNNum);
        await page.waitForTimeout(4000);
        await page.click('.btn.btn-primary.btn-sm.minwidbtn.pointer.mr-1');
        await page.waitForTimeout(15000);
    });

    test.afterEach(async ({ page }, testInfo) => {
        const status = testInfo.status === 'passed' ? 'Success' : 'Failed';
        const message = `${headerName} ${status} | Version: ${specVersion}`;
        
        const filename = `test_${generateDatetimeTick()}.png`;
        const screenshotPath = `test-results/screenshots/${filename}`;
        await page.screenshot({ path: screenshotPath });
        await sendScreenshotToTelegram(screenshotPath, filename, message);
    });

    test('Check Out', async ({ page }) => {
        headerName = "Check Out";
        
        await page.waitForTimeout(2000);
        await page.click('button:has-text("Out")');
        await page.waitForTimeout(3000);
        
        await page.click('input[placeholder="Discharge"]');
        await page.waitForTimeout(2000);
        await page.click('.mat-option:has-text("102 : ไปการเงิน")');
        await page.waitForTimeout(2000);
        
        await page.click('.col-lg-12 > .btn');
        await page.waitForTimeout(5000);
        
        await page.click('.ifbtn');
        await page.waitForTimeout(3000);
        
        await page.locator('text=Cashier').scrollIntoViewIfNeeded();
        await page.click('text=Cashier');
        await page.waitForTimeout(2000);
        await page.click('text=OPD Cashier');
        await page.waitForTimeout(20000);
        
        await page.fill('input[placeholder="HN"]', HNNum);
        await page.waitForTimeout(4000);
        await page.click('button:has-text("Search")');
        await page.waitForTimeout(3000);
        
        await page.locator('tr.ng-star-inserted > :nth-child(2)').first().click();
        await page.waitForTimeout(3000);
        
        await page.click('text=Receive');
        await page.waitForTimeout(10000);
        
        await page.click('#button3');
        await page.waitForTimeout(3000);
        
        await page.locator(':nth-child(8) > :nth-child(2) > app-auto-complete-master-setup > div > #idhtml').click();
        await page.waitForTimeout(2000);
        await page.click('text=เงินสด');
        await page.waitForTimeout(2000);
        
        await page.click('#button5');
        await page.click('.row > .col-7 > app-auto-complete-master-setup > div > .fa-chevron-down');
        await page.waitForTimeout(1000);
        await page.click('text=ALL : ใบสรุปรายการค่ารักษาพยาบาล');
        await page.waitForTimeout(1000);
        await page.click('text=Yes');
        await page.waitForTimeout(5000);
    });
});
