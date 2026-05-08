import { test, expect } from './utils/base-test';
import { sendMsgToTelegram, sendScreenshotToTelegram } from './utils/telegram-utils';
import { generateDatetimeTick } from './utils/data-utils';
import PAT_NUM_RAW from '../cypress/fixtures/PAT_NUM.json';
const PAT_NUM: any = PAT_NUM_RAW;
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const specVersion = '1.15';
const apiUrl = process.env.API_URL;
let headerName = '';
let AN = '';

test.describe('Open An', () => {

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
    await page.click('text=Admission');
    await page.waitForTimeout(2000);
    await page.click('text=New Admit');
    await page.waitForTimeout(5000);
    
    const HNNum = PAT_NUM.PAT_NUM.PAT_1.HN1;
    await page.fill(':nth-child(3) > .col-sm-9 > .form-control', HNNum);
    await page.click('.mr-2');
    await page.waitForTimeout(3000);
    await page.click(`text=${HNNum}`);
  });

  test.afterEach(async ({ page }, testInfo) => {
    const status = testInfo.status === 'passed' ? 'Success' : 'Failed';
    const message = testInfo.status === 'passed' 
      ? `${headerName} Success | AN : ${AN} | Version: ${specVersion}`
      : `${headerName} Failed | Version: ${specVersion}`;
    
    const filename = `test_${generateDatetimeTick()}.png`;
    const screenshotPath = `test-results/screenshots/${filename}`;
    await page.screenshot({ path: screenshotPath });
    await sendScreenshotToTelegram(screenshotPath, filename, message);
  });

  test('Open An', async ({ page }) => {
    headerName = "Open An";

    await page.waitForTimeout(5000);
    await page.locator('text=Admit Room No.').locator('..').locator('..').locator('input#idhtml').click();
    
    // Recursive function to find usable ward
    async function findUsableWard(index = 0) {
      await page.waitForTimeout(2000);
      const btns = page.locator('.col-3.dx-border-group button.btn.btn-primary.btn-xs');
      const count = await btns.count();
      
      if (index >= count) {
        console.log('No usable ward found!');
        return;
      }
      
      await btns.nth(index).click({ force: true });
      await page.waitForTimeout(900);
      
      const borderText = await page.locator('.dx-border-group-blue').innerText();
      if (borderText.includes('Select')) {
        await page.locator('.dx-border-group-blue button.btn.btn-primary.btn-xs').first().click({ force: true });
      } else {
        await findUsableWard(index + 1);
      }
    }

    await findUsableWard(0);

    // Fill auto-complete inputs
    const fillNext = async (label) => {
      const container = page.locator(`text=${label}`).locator('..').locator('..').locator('.col-7.flex-grow-1');
      const input = container.locator('input');
      await input.press('ArrowDown');
      await page.waitForTimeout(200);
      await input.press('Enter');
    };

    await fillNext('Admit Code:');
    await fillNext('Master Doctor:');
    await fillNext('Re-Admit Code:');
    await fillNext('Admit Doctor:');
    await fillNext('Payor:');
    await fillNext('Agency Code:');
    await fillNext('Company:');
    await fillNext('Visitor Allow:');

    await page.waitForTimeout(3000);

    // Datetime pickers
    await page.locator('.col-xl-8 > .row > :nth-child(19) > .col-7 > dx-datetime > .far').click();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    await page.locator('.col-xl-8 > .row > :nth-child(20) > .col-7 > dx-datetime > .far').click();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    // Intercepts
    const patientRightPromise = page.waitForResponse(response => response.url().includes('MobileGetPatientRight'));
    const updateIPDPromise = page.waitForResponse(response => response.url().includes('UpdateMobileIPDMaster'));
    const hospitalSysPromise = page.waitForResponse(response => response.url().includes('MobileGetHospitalSysAdmission'));
    const bannerPromise = page.waitForResponse(response => response.url().includes('MobileEnquireHISBanner'));

    await page.locator('text=Update Right').scrollIntoViewIfNeeded();
    await page.click('text=Update Right');
    await patientRightPromise;

    await page.locator('div.btn-group').locator('button:has-text("Select")').click();
    await page.click('text=Update RightCode');
    
    await page.locator('div.text-lg-right').locator('text=Submit').click();

    await updateIPDPromise;
    await hospitalSysPromise;
    const bannerResponse = await bannerPromise;
    const body = await bannerResponse.json();
    AN = body.AN;

    // Update PAT_NUM.json
    const patNumPath = path.join(__dirname, '../cypress/fixtures/PAT_NUM.json');
    const data = JSON.parse(fs.readFileSync(patNumPath, 'utf8'));
    const patNum = data.PAT_NUM || {};
    
    patNum['PAT_1'] = {
      ...patNum['PAT_1'],
      [`AN1`]: AN
    };
    
    fs.writeFileSync(patNumPath, JSON.stringify({ PAT_NUM: patNum }, null, 2));
  });
});
