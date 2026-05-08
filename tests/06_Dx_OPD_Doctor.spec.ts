import { test, expect } from '@playwright/test';
import { sendMsgToTelegram, sendScreenshotToTelegram } from './utils/telegram-utils';
import { generateDatetimeTick } from './utils/data-utils';
import dotenv from 'dotenv';
import { LoginPage } from '../pages/login.page';
dotenv.config();

const specVersion = '1.15';
const apiUrl = process.env.API_URL;
let headerName = '';

test.describe(`Doctor Workbench ${specVersion}`, () => {
    
    let HNNum = '';

    test.beforeEach(async ({ page, request }) => {
        
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
        await page.locator('text=Doctor').click({ force: true });
        await page.locator('text=Doctor Workbench').click({ force: true });
        await page.waitForTimeout(30000);
        
        await page.fill('input[placeholder="HN"]', HNNum);
        await page.waitForTimeout(4000);
        await page.click('.col-3 > .btn-primary');
        await page.waitForTimeout(10000);
    });

    test.afterEach(async ({ page }, testInfo) => {
        const status = testInfo.status === 'passed' ? 'Success' : 'Failed';
        const message = `${headerName} ${status} | Version: ${specVersion}`;
        
        const filename = `test_${generateDatetimeTick()}.png`;
        const screenshotPath = `test-results/screenshots/${filename}`;
        await page.screenshot({ path: screenshotPath });
        await sendScreenshotToTelegram(screenshotPath, filename, message);
    });

    test('Doctor Past Visit', async ({ page }) => {
        headerName = 'Doctor Past Visit';
        await page.click('text=Check in');
        await page.waitForTimeout(5000);
        await page.click('text=Past Visit');
        await page.waitForTimeout(3000);
        await page.locator('tbody.ng-star-inserted > .Modepc > :nth-child(3)').first().click();
        await page.waitForTimeout(2000);
        await page.click('text=ReOrder');
    });

    test('Doctor Record', async ({ page }) => {
        headerName = "Doctor Record";
        const textareas = page.locator('textarea[role="1"]');
        const count = await textareas.count();
        for (let i = 0; i < count; i++) {
            await textareas.nth(i).fill('Test');
        }

        const radiosNo = page.locator('input[type="radio"][value="No"]');
        const countNo = await radiosNo.count();
        for (let i = 0; i < countNo; i++) {
            await radiosNo.nth(i).click({ force: true });
        }

        const radiosWNL = page.locator('input[type="radio"][value="WNL"]');
        const countWNL = await radiosWNL.count();
        for (let i = 0; i < countWNL; i++) {
            await radiosWNL.nth(i).click({ force: true });
        }

        await page.click('text=Submit');
    });

    test('Post Diagnosis', async ({ page }) => {
        headerName = 'Post Diagnosis';
        await page.waitForTimeout(2000);
        await page.click('text=Diagnosis');
        await page.waitForTimeout(3000);
        
        const autoCompletes = page.locator('.stextbox.mat-autocomplete-trigger');
        await autoCompletes.nth(12).fill('E569');
        await page.waitForTimeout(2000);
        await page.click('text=E569 : Vitamin deficiency, unspecified');
        
        await page.fill('textarea[placeholder="Diagnosis Remarks"]', 'Test Remarks');
        
        await autoCompletes.nth(13).fill('Y906');
        await page.waitForTimeout(2000);
        await page.click('text=Y906 : Blood alcohol level of 120-199mg/100ml');
        
        await autoCompletes.nth(14).fill('9999');
        await page.waitForTimeout(2000);
        await page.click('text=9999 : Other_Other miscellaneous procedures');
        
        await page.click('.Change-display > .btn-primary');
        await page.waitForTimeout(4000);
        await page.click('text=Submit');
    });

    test('Doctor Xray', async ({ page }) => {
        headerName = 'Doctor Xray';
        await page.waitForTimeout(2000);
        await page.click('text=Investigations');
        await page.waitForTimeout(5000);
        await page.click('text=X-Ray');
        await page.waitForTimeout(4000);
        await page.click('text=XX : Xray General');
        await page.waitForTimeout(2000);
        
        const row = page.locator('tr', { hasText: 'XR0002 : FOOT LT. AP.' });
        await row.locator('.mat-checkbox-inner-container').click();
        await page.waitForTimeout(2000);
        
        await page.click('.col-12 > .btn-primary');
        await page.waitForTimeout(1000);
        await page.click('span[style="float: right;"] > .btn-primary');
        await expect(page.locator('text=Warning')).not.toBeVisible();
    });

    test('Doctor Lab', async ({ page }) => {
        headerName = 'Doctor Lab';
        await page.click('text=Investigate');
        await page.waitForTimeout(3000);
        await page.locator(':nth-child(1) > .ml-3').click();
        await page.waitForTimeout(3000);
        await page.locator('#LABColl > :nth-child(1)').click();
        await page.waitForTimeout(3000);
        
        // Use generic checkbox if ID is dynamic
        await page.locator('.mat-checkbox-layout > .mat-checkbox-inner-container').first().click(); 
        await page.waitForTimeout(3000);
        await page.click(':nth-child(4) > .col-12 > .btn-primary');
        await page.waitForTimeout(3000);
        await page.locator('.mat-checkbox-layout > .mat-checkbox-inner-container').first().click();
        await page.waitForTimeout(3000);
        await page.click('[style="float: right;"] > .btn-primary');
        await expect(page.locator('text=Warning')).not.toBeVisible();
    });

    test('Doctor Appointment', async ({ page }) => {
        headerName = 'Doctor Appointment';
        const today = new Date();
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() + 1);
        const appointmentDate = nextDay.getDate().toString();

        await page.click('button:has-text("Appointment")');
        await page.waitForTimeout(3000);
        await page.locator('td.SelectDate.pointer', { hasText: appointmentDate }).click();
        await page.waitForTimeout(3000);
        await page.locator('.cal-hour-segment').nth(62).click();
        await page.waitForTimeout(3000);
        
        await page.locator('.fas.fa-chevron-down.text-primary.icon.pointer').nth(0).click();
        await page.click('text=1001 : อายุรกรรมทั่วไป');
        await page.locator('.fas.fa-chevron-down.text-primary.icon.pointer').nth(6).click();
        await page.click('text=001 : ห้องตรวจ 1');
        await page.locator('.fas.fa-chevron-down.text-primary.icon.pointer').nth(7).click();
        await page.click('text=A100 : ติดตามผล');
        await page.click('text=Submit');
    });

    test('Doctor_Medicine', async ({ page }) => {
        headerName = 'Doctor_Medicine';
        await page.click('text=Medication/ Medical supply');
        await page.waitForTimeout(6000);
        await page.fill('#MedicineSearch', 'MLIMETC01');
        await page.waitForTimeout(5000);
        await page.click('text=MLIMETC01 : MetoCLOpramide');
        await page.waitForTimeout(5000);
        await page.fill('#Qty', '1');
        await page.waitForTimeout(4000);
        await page.click('.col-12.pr-1 > .btn-primary');
        await page.waitForTimeout(5000);
        
        const row = page.locator('tr', { hasText: 'MetoCLOpramide' });
        await row.locator('.mat-checkbox-inner-container').click();
        await page.click('.col-lg-6.pl-1 > .pr-1 > .btn-info');
        await page.waitForTimeout(5000);
    });

    test('Check Xray', async ({ page }) => {
        headerName = 'Check Xray';
        await page.waitForTimeout(3000);
        await page.click('text=Xray');
        await page.waitForTimeout(4000);
        await page.locator('.footable > tbody > :nth-child(1) > :nth-child(7)').click();
        await page.waitForTimeout(2000);
        await expect(page.locator('text=X-ray Result detail')).toBeVisible();
    });

    test('Check Lab', async ({ page }) => {
        headerName = 'Check Lab';
        await page.waitForTimeout(3000);
        await page.click('text=Lab');
        await page.waitForTimeout(4000);
        await page.locator('.footable > tbody > :nth-child(1) > :nth-child(8)').click();
    });
});
