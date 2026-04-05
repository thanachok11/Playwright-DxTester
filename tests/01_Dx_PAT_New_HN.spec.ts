import { test, expect } from '@playwright/test';
import { generateThaiID, generateRandomData, generateDatetimeTick } from './utils/data-utils';
import { sendMsgToTelegram, sendScreenshotToTelegram } from './utils/telegram-utils';
import PatientsRaw from '../cypress/fixtures/Pat_info.json';
const Patients: any = PatientsRaw;
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const specVersion = '1.16';
const apiUrl = process.env.API_URL;

test.describe(`New_HN ${specVersion}`, () => {
  
  test.beforeEach(async ({ page }) => {
    // Check API status
    try {
        const response = await page.request.get(`${apiUrl}VerServer`, { timeout: 150000 });
        expect(response.ok()).toBeTruthy();
    } catch (e: any) {
        console.error('API VerServer check failed:', e);
    }

    // Navigate to the app (will use storageState automatically)
    await page.goto('/');
    
    // Ensure we are on the main page/dashboard
    await page.waitForLoadState('networkidle');
    
    // Handle persistent UI elements
    const registrationBtn = page.locator('text=Registration');
    if (await registrationBtn.isVisible()) {
        await registrationBtn.click();
    }
    
    await page.locator('text=Patient Registration').click();
    await page.waitForTimeout(5000);
    await page.locator('text=New patient').click();
    await page.waitForTimeout(5000);
  });

  // Handle failures
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const filename = `test_${generateDatetimeTick()}.png`;
      const screenshotPath = `test-results/screenshots/${filename}`;
      await page.screenshot({ path: screenshotPath });
      await sendScreenshotToTelegram(screenshotPath, filename, `Test failed: ${testInfo.error.message}`);
    }
  });

  Patients.forEach((patient) => {
    test(`${patient.Sex.label} ${patient.Date.label} - PAT_NO ${patient.PAT_NO}`, async ({ page }) => {
      
      const headerName = `${patient.Sex.label} ${patient.Date.label} - PAT_NO ${patient.PAT_NO}`;
      const { firstName, lastName, nameTest, lastNTest, phoneNumber } = generateRandomData();
      const IDcardNum = generateThaiID();

      // Intercepting network requests
      const enHnPromise = page.waitForRequest(request => 
        request.url().includes('MobileEnquireHNLog') && request.method() === 'POST'
      );
      const hisBannerPromise = page.waitForResponse(response => 
        response.url().includes('MobileEnquireHISBanner') && response.request().method() === 'POST'
      );

      // Filling registration form
      await page.waitForTimeout(2000);
      const inputs = page.locator('div.col-lg-3 input.form-control.form-control-sm.curve');
      
      await inputs.nth(0).fill(firstName);
      await inputs.nth(1).fill(lastName);
      await inputs.nth(4).fill(nameTest);
      await inputs.nth(5).fill(lastNTest);

      await page.fill('input[placeholder="Date of Birth"]', patient.Date.date);
      await page.selectOption('select.form-control.form-control-sm.curve', { label: patient.Sex.label });

      await page.locator('textarea.form-control.curve').first().fill(patient.address.location);
      
      const zipInput = page.locator('input[placeholder="ตำบล/ อำเภอ / จังหวัด / รหัสไปรษณีย์"]').first();
      await zipInput.fill(patient.address.zipcode);
      await page.waitForTimeout(2000);
      await zipInput.press('Enter');

      await page.locator('input[type="tel"].form-control').first().fill(phoneNumber);
      
      // Checkbox for address copy
      await page.locator('input.mat-checkbox-input[type="checkbox"]').nth(12).click({ force: true });
      await inputs.nth(2).fill(patient.address.location);

      // Address Type
      const addressTypeContainer = page.locator('text=Address Type').locator('..').locator('..');
      await addressTypeContainer.locator('input').fill('3');
      await addressTypeContainer.locator('input').press('Enter');

      await page.waitForTimeout(2000);
      await page.click('button.btn.btn-md.btn-primary.mr-2');
      await page.waitForTimeout(2000);

      // Tab logic
      await page.locator('div.mat-tab-label.mat-ripple.ng-star-inserted').nth(9).click();

      const cardTypeContainer = page.locator('text=Card Type').locator('..').locator('..');
      await cardTypeContainer.locator('input').click({ force: true });
      await page.locator('text=Identity').click({ force: true });

      await inputs.nth(1).fill(IDcardNum);
      await page.waitForTimeout(2000);
      await page.locator('button.btn.btn-sm.btn-primary.mr-2').first().click();
      await page.waitForTimeout(2000);
      
      await expect(page.locator('text=IDCARD Incorrect')).not.toBeVisible();

      // Clinical rights tab
      await page.locator('div.mat-tab-label.mat-ripple').nth(1).click({ force: true });
      await page.waitForTimeout(2000);
      
      const autoCompleteInputs = page.locator('input.stextbox.mat-autocomplete-trigger');
      await autoCompleteInputs.nth(0).click({ force: true });
      await page.locator('text=000').click({ force: true });
      await page.waitForTimeout(2000);
      
      await page.click('button.btn.btn-md.btn-primary.mr-2');
      await page.waitForTimeout(2000);
      await page.locator('div.mat-tab-label.mat-ripple').nth(0).click();
      await page.waitForTimeout(2000);

      // Chronic disease
      await page.locator('text=โรคประจำตัว').click();
      await page.waitForTimeout(2000);
      
      const icdInput = page.locator('div.col-8 b:has-text("ICD")').locator('..').locator('..').locator('input');
      await icdInput.click();
      await icdInput.fill('023');
      await page.waitForTimeout(2000);
      await page.locator('text=C023 : Anterior two-thirds of tongue').click();
      await page.waitForTimeout(1000);

      const cm9Input = page.locator('span.text-label:has-text("CM9")').locator('..').locator('..').locator('input');
      await cm9Input.click();
      await cm9Input.fill('0602');
      await page.waitForTimeout(1000);
      await page.locator('text=0602').click();
      
      await page.selectOption('select.form-control.form-control-sm.curve', { index: 1 });
      await page.waitForTimeout(1000);
      await page.click('text=Apply');

      // Submit form
      await page.locator('.btn.btn-sm.btn-primary:has-text("Submit")').click({ force: true });
      await page.waitForTimeout(3000);

      // Allergy
      await page.locator('.fas.fa-2x.fa-bars.pointer').click({ force: true });
      await page.waitForTimeout(2000);
      await page.locator('span.dropdown-item:has-text("Allergy")').click();
      await page.waitForTimeout(3000);
      
      await page.fill('.stextbox', 'Betadine');
      await page.waitForTimeout(2000);
      await page.locator('.mat-option-text').click({ force: true });
      await page.waitForTimeout(3000);
      
      await page.locator('.col-lg-6.bc_primary .btn_bg').first().click({ force: true });
      await page.waitForTimeout(3000);
      await page.locator('.row .btn:has-text("Close"), .row .btn:has-text("ยกเลิก")').click(); // Custom guess for close btn
      await page.locator('a > .far').click({ force: true });
      await page.waitForTimeout(3000);

      // OPD Visit
      await page.locator('text=ข้อมูลผู้ป่วย').click({ force: true });
      await page.waitForTimeout(2000);
      
      await autoCompleteInputs.nth(2).click({ force: true });
      await page.locator('text=OPD1 : OPD 1').click({ force: true });
      await page.waitForTimeout(2000);
      
      await autoCompleteInputs.nth(4).click({ force: true });
      await page.locator('text=000 : ไม่ระบุแพทย์').click({ force: true });
      await page.waitForTimeout(2000);
      
      await autoCompleteInputs.nth(8).click();
      await page.locator('text=10.2:ชำระเงินเองคนไทย').click({ force: true });
      await page.waitForTimeout(2000);

      await page.locator('button.btn.btn-sm.btn-primary.mr-2').nth(2).click();
      await page.waitForTimeout(5000);

      await page.locator('text=Submit OPD Visit').click({ force: true });

      // Wait for network results
      const enHnRequest = await enHnPromise;
      const hisBannerResponse = await hisBannerPromise;
      
      const hnLogPayload = enHnRequest.postDataJSON();
      const bannerResponsePayload = await hisBannerResponse.json();
      const bannerRequestPayload = JSON.parse(enHnRequest.postData()); // Using the wait request logic

      const HN = bannerRequestPayload.param.HN;
      const VN = bannerRequestPayload.param.VN;

      // Update PAT_NUM.json (Equivalent to cy.readFile/writeFile)
      const patNumPath = path.join(__dirname, '../cypress/fixtures/PAT_NUM.json');
      let data: any = {};
      if (fs.existsSync(patNumPath)) {
        data = JSON.parse(fs.readFileSync(patNumPath, 'utf8'));
      }
      
      const patNum = data.PAT_NUM || {};
      patNum[`PAT_${patient.PAT_NO}`] = {
        PAT_NO: patient.PAT_NO,
        [`HN${patient.PAT_NO}`]: HN,
        [`VN${patient.PAT_NO}`]: VN
      };
      
      fs.writeFileSync(patNumPath, JSON.stringify({ PAT_NUM: patNum }, null, 2));

      // Notifications
      const message = `Title : ${headerName}| New HN: ${HN} | New VN: ${VN} | Version : ${specVersion}`;
      await sendMsgToTelegram(message);
    });
  });
});
