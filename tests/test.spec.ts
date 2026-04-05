import { test, expect } from '@playwright/test';
import { sendMsgToTelegram, sendScreenshotToTelegram } from './utils/telegram-utils';
import { generateThaiID, generateRandomData, generateDatetimeTick } from './utils/data-utils';
import PatientsRaw from '../cypress/fixtures/Pat_info.json';
const Patients: any = PatientsRaw;
import CredentialDataRaw from '../cypress/fixtures/CredentialData.json';
const CredentialData: any = CredentialDataRaw;
import dotenv from 'dotenv';
dotenv.config();

const specVersion = '1.16';
const apiUrl = process.env.API_URL;
let headerName = '';

test.describe(`New_HN ${specVersion}`, () => {

    test.beforeEach(async ({ page, request }) => {
        // Visit login and set computer name
        await page.goto('/');
        
        await page.locator('.float-right').first().click();
        await page.fill('#mat-input-0', 'com1');
        await page.fill('input[placeholder="Enter your password"]', 'passo');
        await page.click('button:has-text("Save")');
        await page.waitForTimeout(2000);

        const Username = CredentialData.LoginData[0].Login1;
        const password = CredentialData.LoginData[0].Password1;

        await page.fill('input[placeholder="User Name"]', Username);
        await page.fill('input[placeholder="Password"]', password);
        await page.click('button:has-text("Login"), .btn:has-text("Login")');
        
        await page.waitForTimeout(8000);
        
        const bodyText = await page.innerText('body');
        if (bodyText.includes('Verbal Order')) {
            await page.locator('.far').first().click();
        }
        await page.waitForTimeout(2000);
        
        await page.locator('.ifbtn').click({ force: true });
        await page.waitForTimeout(2000);
        
        await page.locator('text=Registration').click({ force: true });
        await page.waitForTimeout(2000);
        
        await page.locator('text=Patient Registration').click({ force: true });
        await page.waitForTimeout(10000);
        
        await page.locator('text=New patient').click({ force: true });
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

    for (const patient of Patients) {
        test(`${patient.Sex.label} ${patient.Date.label} - PAT_NO ${patient.PAT_NO}`, async ({ page }) => {
            headerName = `${patient.Sex.label} ${patient.Date.label} - PAT_NO ${patient.PAT_NO}`;
            
            const { firstName, lastName, nameTest, lastNTest, phoneNumber } = generateRandomData();
            const IDcardNum = generateThaiID();

            await page.waitForTimeout(2000);
            
            // General Info
            const inputs = page.locator('div.col-lg-3 input.form-control');
            await inputs.nth(0).fill(firstName);
            await inputs.nth(1).fill(lastName);
            await inputs.nth(4).fill(nameTest);
            await inputs.nth(5).fill(lastNTest);

            await page.fill('input[placeholder="Date of Birth"]', patient.Date.date);
            await page.selectOption('select.form-control', patient.Sex.value);
            await page.locator('textarea.form-control').first().fill(patient.address.location);

            await page.fill('input[placeholder="ตำบล/ อำเภอ / จังหวัด / รหัสไปรษณีย์"]', patient.address.zipcode);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);

            await page.locator('input[type="tel"].form-control').first().fill(phoneNumber);
            await page.locator('input.mat-checkbox-input').nth(12).check({ force: true });

            // Address field
            await page.locator('b:has-text("ที่อยู่")').locator('..').locator('input').first().scrollIntoViewIfNeeded();
            await page.locator('b:has-text("ที่อยู่")').locator('..').locator('input').first().fill(patient.address.location);

            const addressTypeInput = page.locator('text=Address Type').locator('..').locator('..').locator('input');
            await addressTypeInput.fill('3');
            await addressTypeInput.press('Enter');

            await page.waitForTimeout(2000);
            await page.locator('button.btn-primary:has-text("Apply")').click();
            await page.waitForTimeout(2000);

            // Reference Tab
            await page.click('text=Reference');
            await page.waitForTimeout(2000);
            
            await page.locator('text=Card Type').locator('..').locator('mat-select, div[role="combobox"]').first().click();
            await page.click('mat-option:has-text("Identity")');
            
            await page.locator('text=Ref No Type').locator('..').locator('mat-select, div[role="combobox"], app-auto-complete-master-setup').first().click();
            await page.click('mat-option:has-text("เลขที่บัตรประชาชน")');

            await page.locator('text=Ref No.').locator('..').locator('input').first().fill(IDcardNum.toString());
            await page.waitForTimeout(2000);
            
            await page.locator('div.mat-tab-body-active button:has-text("Apply")').click();
            await page.waitForTimeout(2000);

            // Extra Tab
            await page.click('text=Extra');
            await page.waitForTimeout(2000);
            
            await page.locator('div.mat-tab-body-active app-auto-complete-master-setup').nth(0).click();
            await page.click('mat-option:has-text("ห้ามเปิดเผย")');
            
            await page.locator('div.mat-tab-body-active app-auto-complete-master-setup').nth(1).click();
            await page.click('mat-option:has-text("VIP Remark")');
            await page.waitForTimeout(2000);

            // Submit
            await page.click('button.btn-primary:has-text("Submit")');
            await page.waitForTimeout(5000);

            // Right Selection
            await page.locator('mat-select').first().click();
            await page.click('mat-option:has-text("UC")');
            await page.click('button:has-text("Update Patient Right")');
            await page.click('button:has-text("Update RightCode")');

            // Clinic and Doctor
            await page.locator('.col-6 app-auto-complete-master-setup').first().locator('#idhtml').click();
            await page.click('mat-option:has-text("ฉุกเฉิน")');

            await page.locator('.bg-valid #idhtml').click();
            await page.click('mat-option:has-text("ไม่ระบุแพทย์")');

            await page.click('button:has-text("Apply")');
            await page.waitForTimeout(2000);

            await page.click('text=Submit OPD Visit');
            await page.waitForTimeout(2000);
            await page.click('button:has-text("OK")');
        });
    }
});
