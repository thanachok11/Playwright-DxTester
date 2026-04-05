import { test, expect } from '@playwright/test';
import { sendMsgToTelegram } from './utils/telegram-utils';
import patientDataRaw from '../cypress/fixtures/DX_DATA.json';
const patientData: any = patientDataRaw;
import PAT_NUM_RAW from '../cypress/fixtures/PAT_NUM.json';
const PAT_NUM: any = PAT_NUM_RAW;
import dotenv from 'dotenv';
import { LoginPage } from '../pages/login.page';
dotenv.config();

const specVersion = '1.15';
const { Medicine } = patientData;
const [Paracetamol, Amoxycillin, Betadine] = Medicine;
let headerName = '';

test.describe(`OPD_MEDICINE ${specVersion}`, () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        
        if (page.url().includes('/login')) {
            const loginPage = new LoginPage(page);
            await loginPage.loginWithComRole('com1', 'passo', process.env.USERNAME2!, process.env.PASSWORD!);
        }
        
        await page.waitForLoadState('networkidle');
        
        await expect(page.locator('text=Welcome')).toBeVisible();
        await page.locator('.ifbtn').click({ force: true });
        await page.locator('text=OPD').click({ force: true });
        await page.locator('text=Nurse Workbench').click({ force: true });
        await page.waitForTimeout(20000);

        const HNNum = PAT_NUM.PAT_NUM.PAT_1.HN1;
        await page.fill('input[placeholder="HN"]', HNNum);
        await page.click('.btn.btn-primary.btn-sm.minwidbtn.pointer.mr-1');
        await page.waitForTimeout(10000);

        await page.click('text=Order Medicine');
    });

    test.afterEach(async ({}, testInfo) => {
        const status = testInfo.status === 'passed' ? 'Success' : 'Failed';
        const message = `Title : ${headerName} ${status} | Version : ${specVersion}`;
        await sendMsgToTelegram(message);
    });

    test('Prescription_Failed_QtyInvalid', async ({ page }) => {
        headerName = 'Prescription_Failed_QtyInvalid';
        await page.fill('#MedicineSearch', Paracetamol.Paracetamol.Type);
        await page.press('#MedicineSearch', 'Enter');
        
        await page.waitForTimeout(5000);
        await page.locator('.mat-option').first().waitFor();
        await page.click(`text=${Paracetamol.Paracetamol.StockCode}`);
        await page.waitForTimeout(5000);
        
        await page.locator('#Qty').clear();
        await page.waitForTimeout(4000);
        await page.click('button:has-text("Apply")');
        await page.waitForTimeout(5000);
        await expect(page.locator('text=กรุณาใส่จำนวนยา')).toBeVisible();
    });

    test('Prescription_Success', async ({ page }) => {
        headerName = 'Prescription_Success';
        await page.fill('#MedicineSearch', Paracetamol.Paracetamol.Type);
        await page.press('#MedicineSearch', 'Enter');
        
        await page.locator('.mat-option').first().waitFor();
        await page.click(`text=${Paracetamol.Paracetamol.StockCode}`);
        await page.waitForTimeout(7000);

        const dialog = page.locator('mat-dialog-container');
        await dialog.locator('input[placeholder="DayDose"]').first().fill('2');
        await page.waitForTimeout(4000);
        
        await page.click('button:has-text("Apply")');
        
        const row = page.locator('tr', { hasText: Paracetamol.Paracetamol.StockCode });
        await row.locator('.mat-checkbox-inner-container').click();

        await page.click('button:has-text("Submit")');
        await page.waitForTimeout(5000);
    });

    test('Medicine_Duplicated', async ({ page }) => {
        headerName = 'Medicine_Duplicated';
        await page.fill('#MedicineSearch', Paracetamol.Paracetamol.Type);
        await page.press('#MedicineSearch', 'Enter');
        await page.waitForTimeout(5000);
        await page.click(`text=${Paracetamol.Paracetamol.StockCode}`);
        await page.waitForTimeout(3000);
        
        await page.fill('input[placeholder="DayDose"]', '1');
        await page.waitForTimeout(4000);
        await page.click('.col-12.pr-1 > .btn-primary');
        await page.waitForTimeout(5000);
        
        await page.fill('#MedicineSearch', Paracetamol.Paracetamol.Type);
        await page.waitForTimeout(5000);
        await page.click(`text=${Paracetamol.Paracetamol.StockCode}`);
        await page.waitForTimeout(3000);
        
        await expect(page.locator('text=รายการยาที่สั่ง ซ้ำ กับยาที่ที่มีในรายการ')).toBeVisible();
        await page.click('[style="float: right"] > a > .fas');
    });

    test('Allergy_Reason_Invalid', async ({ page }) => {
        headerName = 'Allergy_Reason_Invalid';
        await page.fill('#MedicineSearch', Betadine.Betadine.Type);
        await page.waitForTimeout(5000);
        await page.click(`text=${Betadine.Betadine.StockCode}`);
        await page.waitForTimeout(5000);
        
        await expect(page.locator('text=คนไข้แพ้ยาBetadine')).toBeVisible();
        await page.click('div.ng-star-inserted > app-auto-complete-master-setup > div > .fa-chevron-down');
        await page.waitForTimeout(4000);
        await page.click('text=ALG01 : Off ยาที่ผู้ป่วยแพ้แล้ว');
        await page.waitForTimeout(2000);
        await page.click('.mat-dialog-actions > .mat-primary');
        await page.waitForTimeout(2000);
        
        await page.locator(':nth-child(6) > .pr-1 > app-auto-complete-master-setup > div > #idhtml').clear();
        await page.waitForTimeout(3000);
        await page.click('.col-12.pr-1 > .btn-primary');
        await page.waitForTimeout(5000);
        await expect(page.locator('text=กรุณาใส่เหตุผลการสั่งยา')).toBeVisible();
    });

    test('Fluid_Invalid', async ({ page }) => {
        headerName = 'Fluid_Invalid';
        await page.fill('#MedicineSearch', Paracetamol.Paracetamol.Type);
        await page.waitForTimeout(5000);
        await page.click(`text=${Paracetamol.Paracetamol.StockCode}`);
        await page.waitForTimeout(5000);
        
        await page.click(':nth-child(1) > .col-lg-7 > .stextbox');
        await page.fill(':nth-child(1) > .col-lg-7 > .stextbox', 'Cisplatin');
        await page.waitForTimeout(3000);
        await page.click('text=Cisplatin 50 mg/50 ml inj');
        
        await page.click('.col-12.pr-1 > .btn-primary');
        await page.waitForTimeout(7000);
        await expect(page.locator('text=กรุณากรอก Dose Qty ของ IV Fluids')).toBeVisible();
    });

    test('Previous Order', async ({ page }) => {
        headerName = 'Previous Order';
        await page.waitForTimeout(2000);
        await page.click('text=Previous Order');
        await page.waitForTimeout(5000);
        
        await page.locator('tr.ng-star-inserted > :nth-child(2) > .pb-1 > b').first().click();
        await page.waitForTimeout(5000);
        await page.locator(':nth-child(11) > .panel > .panel-body > .ibox-content > .table > tbody.ng-star-inserted > tr > :nth-child(2) > .pb-1').first().click();
        await page.waitForTimeout(3000);
        
        await page.click('.col-lg-6.pr-1 > .col-12 > .btn-primary');
        await page.waitForTimeout(5000);
        
        await page.click('div.ng-star-inserted > app-auto-complete-master-setup > div > .fa-chevron-down');
        await page.waitForTimeout(4000);
        await page.click('text=ALG01 : Off ยาที่ผู้ป่วยแพ้แล้ว');
        await page.waitForTimeout(2000);
        
        await page.click('.mat-dialog-actions > .mat-primary');
        await page.waitForTimeout(3000);
        
        await page.locator('.mat-checkbox-inner-container').nth(17).click();
        await page.click('.col-lg-6.pl-1 > .pr-1 > .btn-info');
        await page.waitForTimeout(5000);
    });
});
