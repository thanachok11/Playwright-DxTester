import { test, expect } from './utils/base-test';
import { LoginPage } from '../pages/login.page';
import { sendMsgToTelegram } from './utils/telegram-utils';
import patientDataRaw from '../cypress/fixtures/DX_DATA.json';
const patientData: any = patientDataRaw;
import PAT_NUM_RAW from '../cypress/fixtures/PAT_NUM.json';
const PAT_NUM: any = PAT_NUM_RAW;
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const specVersion = '1.16';
const apiUrl = process.env.API_URL;
let headerName = '';

test.describe(`OPD_NurseWorkench_VitalSign ${specVersion}`, () => {

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    const username = process.env.USERNAME2!;
    const password = process.env.PASSWORD!;

    await page.goto('/login');
    await loginPage.loginWithComRole('com1', 'passo', username, password);
    await page.waitForURL(/\/(main|dashboard)/, { timeout: 30000 });

    // Handle modal
    const bodyText = await page.innerText('body');
    if (bodyText.includes('Verbal Order')) {
      await page.locator('.far').first().click();
    }
    
    await expect(page.locator('text=Welcome')).toBeVisible();
    
    await page.locator('.ifbtn').click({ force: true });
    await page.locator('text=OPD').click({ force: true });
    await page.locator('text=Nurse Workbench').click({ force: true });
    await page.waitForTimeout(10000);

    const HNNum = PAT_NUM.PAT_NUM.PAT_1[`HN1`];
    await page.fill('input[placeholder="HN"]', HNNum);
    await page.click('.btn.btn-primary.btn-sm.minwidbtn.pointer.mr-1');
    await page.waitForTimeout(15000); // 20s in Cypress
  });

  test.afterEach(async ({}, testInfo) => {
    const status = testInfo.status === 'passed' ? 'Success' : 'Failed';
    const message = `Title : ${headerName} ${status} | Version : ${specVersion}`;
    await sendMsgToTelegram(message);
  });

  test('Nurse Workbench', async ({ page }) => {
    headerName = 'Nurse Workbench';
    await page.waitForTimeout(5000);
    
    // Using nth(1) as eq(1) in Cypress
    await page.locator('button.btn-primary').nth(1).click({ force: true });
    await page.waitForTimeout(5000);

    await page.click('text=Treatment (F3)');
    await page.waitForTimeout(5000);
    
    await page.fill('#Methods', 'DF01');
    await page.click('#Applybtnid');
    await page.waitForTimeout(2000);
    
    await page.locator('input[type="checkbox"]').nth(16).check({ force: true });
    await page.fill(':nth-child(6) > :nth-child(5) > .form-control', '2000');
    
    await page.locator('input[type="checkbox"]').nth(17).check({ force: true });
    await page.fill(':nth-child(4) > :nth-child(5) > .form-control', '5000');
    
    await page.click('text=Apply');
    await page.waitForTimeout(2000);
    await page.click('.col-md-3 > .btn-primary');
    
    // Fill textareas in app-opdnurserecord
    const textareas = page.locator('app-opdnurserecord textarea.form-control');
    const count = await textareas.count();
    for (let i = 0; i < count; i++) {
        await textareas.nth(i).fill(`test${i}`);
    }

    const radios = page.locator('app-opdnurserecord .mat-radio-outer-circle');
    const radioCount = await radios.count();
    for (let i = 0; i < radioCount; i++) {
        await radios.nth(i).click({ force: true });
    }

    await page.click('text=Nurse Submit');
  });

  test('Vital Sign', async ({ page }) => {
    headerName = 'Vital Sign';
    const { Weight, Height, Temp, BpHigh, BpLow, HeartFreq, RR, O2Sat, PainScore } = patientData.VitalSign;

    await page.click('text=Vital signs');
    await page.waitForTimeout(5000);
    
    await page.fill(':nth-child(2) > :nth-child(2) > .form-control', Weight);
    await page.fill(':nth-child(2) > :nth-child(5) > .form-control', Height);
    
    // Temp validation check (equivalent to wait/type/clear in Cypress)
    await page.fill(':nth-child(2) > :nth-child(8) > .form-control', '80');
    await expect(page.locator('label.col-form-label', { hasText: 'Temperature' })).toHaveCSS('color', 'rgb(255, 0, 0)');
    await page.fill(':nth-child(2) > :nth-child(8) > .form-control', Temp);

    await page.fill(':nth-child(2) > :nth-child(12) > .form-control', '180');
    await page.fill(':nth-child(13) > .form-control', '40');
    await page.waitForTimeout(2000);
    await expect(page.locator('span', { hasText: 'Diastolic' })).toHaveClass(/bgdanger-vital/);
    await page.fill(':nth-child(13) > .form-control', '80');

    await page.fill(':nth-child(3) > :nth-child(2) > .form-control', '10');
    await page.fill(':nth-child(3) > :nth-child(5) > .form-control', '1');
    await expect(page.locator('label', { hasText: 'RR.' })).toHaveCSS('color', 'rgb(255, 0, 0)');
    await page.fill(':nth-child(3) > :nth-child(5) > .form-control', '10');

    await page.fill(':nth-child(3) > :nth-child(8) > .form-control', '10');
    await page.fill('.panel-body > :nth-child(1) > :nth-child(3) > :nth-child(11) > .form-control', '8');
    await page.fill(':nth-child(4) > .col > .form-control', 'test test');

    const vitalSignPromise = page.waitForResponse(response => 
      response.url().includes('getOPDVitalSign') && response.request().method() === 'POST'
    );

    await page.click('button:has-text("Update")');
    
    const vitalSignResponse = await vitalSignPromise;
    const body = await vitalSignResponse.json();
    const vitalSign = body.ListOfOPDVitalSign[0];
    
    expect(vitalSign.BodyWeight).toBe(Weight);
    expect(vitalSign.Height).toBe(Height);
    expect(vitalSign.Temperature).toBe(Temp);
    expect(vitalSign.BpHigh).toBe(BpHigh);
    expect(vitalSign.BpLow).toBe(BpLow);
    expect(vitalSign.PR).toBe(HeartFreq);
    expect(vitalSign.RR).toBe(RR);
    expect(vitalSign.O2Sat).toBe(O2Sat);
    expect(vitalSign.PainScale).toBe(PainScore);
  });

  test('X-ray', async ({ page }) => {
    headerName = 'X-ray';
    await page.click('text=Investigate');
    await page.waitForTimeout(3000);
    await page.locator(':nth-child(2) > .ml-3').click();
    await page.waitForTimeout(3000);
    await page.locator('#XRAYColl > :nth-child(1)').click();
    await page.waitForTimeout(3000);
    await page.locator('app-dialog-group-request .mat-checkbox-layout > .mat-checkbox-inner-container').first().click();
    await page.waitForTimeout(2000);
    await page.click(':nth-child(4) > .col-12 > .btn-primary');
    await page.waitForTimeout(3000);
    await page.locator('#mat-checkbox-20 > .mat-checkbox-layout > .mat-checkbox-inner-container').click();
    await page.waitForTimeout(3000);
    await page.click('[style="float: right;"] > .btn-primary');
    await expect(page.locator('text=Warning')).not.toBeVisible();
  });

  test('Lab', async ({ page }) => {
    headerName = 'Lab';
    await page.click('text=Investigate');
    await page.waitForTimeout(3000);
    await page.locator(':nth-child(1) > .ml-3').click();
    await page.waitForTimeout(3000);
    await page.locator('#LABColl > :nth-child(1)').click();
    await page.waitForTimeout(3000);
    await page.locator('app-dialog-group-request .mat-checkbox-layout > .mat-checkbox-inner-container').first().click();
    await page.waitForTimeout(3000);
    await page.click(':nth-child(4) > .col-12 > .btn-primary');
    await page.waitForTimeout(3000);
    await page.locator('#mat-checkbox-20 > .mat-checkbox-layout > .mat-checkbox-inner-container').click();
    await page.waitForTimeout(3000);
    await page.click('[style="float: right;"] > .btn-primary');
    await expect(page.locator('text=Warning')).not.toBeVisible();
  });

  test('Facility Request', async ({ page }) => {
    headerName = 'Facility Request';
    await page.click('text=Investigate');
    await page.waitForTimeout(3000);
    await page.locator(':nth-child(3) > .ml-3').click();
    await page.waitForTimeout(3000);
    await page.locator('#FACiColl > :nth-child(2)').click();
    await page.waitForTimeout(3000);
    await page.click(':nth-child(4) > .col-12 > .btn-primary');
    await page.waitForTimeout(3000);
    await page.locator('#mat-checkbox-20 > .mat-checkbox-layout > .mat-checkbox-inner-container').click();
    
    const updatePromise = page.waitForResponse(response => 
        response.url().includes('UpdateGroupRequest') && response.request().method() === 'POST'
    );
    
    await page.click('[style="float: right;"] > .btn-primary');
    await updatePromise;
    await page.waitForTimeout(5000);
    await expect(page.locator('text=Warning')).not.toBeVisible();
  });

  test('Vaccine', async ({ page }) => {
    headerName = 'Vaccine';
    await page.click('text=Investigate');
    await page.waitForTimeout(3000);
    await page.locator(':nth-child(5) > .ml-3').click();
    await page.waitForTimeout(3000);
    await page.click('text=AFC01-102');
    await page.waitForTimeout(3000);
    await page.click(':nth-child(4) > .col-12 > .btn-primary');
    await page.waitForTimeout(3000);
    await page.locator('#mat-checkbox-20 > .mat-checkbox-layout > .mat-checkbox-inner-container').click();
    await page.waitForTimeout(3000);
    await page.click('[style="float: right;"] > .btn-primary');
    await expect(page.locator('text=Warning')).not.toBeVisible();
  });

  test('Appointment', async ({ page }) => {
    headerName = 'Appointment';
    const today = new Date();
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);
    const appointmentDate = nextDay.getDate().toString();

    await page.click('button:has-text("Appointment")');
    await page.waitForTimeout(5000);
    
    await page.locator('td.SelectDate.pointer', { hasText: appointmentDate }).click();
    await page.waitForTimeout(3000);
    
    await page.locator('.cal-hour-segment').nth(60).click({ force: true });
    await page.waitForTimeout(3000);
    
    await page.locator('.fas.fa-chevron-down.text-primary.icon.pointer').nth(0).click();
    await page.click('text=1001 : อายุรกรรมทั่วไป');
    
    await page.locator('.fas.fa-chevron-down.text-primary.icon.pointer').nth(6).click();
    await page.click('text=001 : ห้องตรวจ 1');
    
    await page.locator('.fas.fa-chevron-down.text-primary.icon.pointer').nth(7).click();
    await page.click('text=A100 : ติดตามผล');
    
    await page.click('text=Submit');
    await page.waitForTimeout(3000);
    await expect(page.locator('text=Warning')).not.toBeVisible();
  });

  test('Set Or', async ({ page }) => {
    headerName = 'Set Or';
    await page.waitForTimeout(10000);
    
    await page.locator('.col-xl-5 > :nth-child(12)').click({ force: true });
    await page.waitForTimeout(10000);
    await page.click('text=Request OR');
    
    await page.locator(':nth-child(6) > app-auto-complete-master-setup > div > #idhtml').press('ArrowDown');
    await page.locator(':nth-child(6) > app-auto-complete-master-setup > div > #idhtml').press('Enter');
    
    await page.locator(':nth-child(8) > app-auto-complete-master-setup > div > #idhtml').press('ArrowDown');
    await page.locator(':nth-child(8) > app-auto-complete-master-setup > div > #idhtml').press('Enter');

    await page.click('input[placeholder="Please fill in"]');
    const searchInput = page.locator('div.col-sm-5 input.form-control');
    await searchInput.fill('000');
    await page.locator('button.btn.btn-default').nth(0).click();
    
    await page.locator('tbody > :nth-child(1) > :nth-child(2) > .btn').click();
    await page.waitForTimeout(3000);
    
    // Fill datetime
    await page.locator('app-dialog-or-request32 dx-datetime > #idhtml').nth(0).fill('1');
    await page.fill('input[placeholder="Time From"]', '12');
    await page.fill('input[placeholder="Time To"]', '15');
    
    await page.locator('input.form-control.curve').nth(50).click({ force: true });
    await searchInput.fill('000');
    await page.locator('button.btn.btn-default').nth(0).click();
    await page.waitForTimeout(3000);
    
    await page.locator('button.btn.btn-default').nth(2).click();
    await page.waitForTimeout(3000);
    
    const textareas = page.locator('textarea.form-control.curve');
    await textareas.nth(3).fill('Test');
    await textareas.nth(4).fill('Test');

    const orPromise = page.waitForResponse(response => 
        response.url().includes('MobileUpdateDataOR') && response.request().method() === 'POST'
    );
    
    await page.locator('.col-xl-1 > :nth-child(1) > .col-md-12').click();
    await orPromise;
    await page.waitForTimeout(2000);
  });
});
