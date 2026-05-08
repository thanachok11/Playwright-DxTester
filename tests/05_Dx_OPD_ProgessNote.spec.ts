import { test, expect } from './utils/base-test';
import { sendMsgToTelegram, sendScreenshotToTelegram } from './utils/telegram-utils';
import { generateDatetimeTick } from './utils/data-utils';
import dotenv from 'dotenv';
dotenv.config();

const specVersion = '1.15';
const apiUrl = process.env.API_URL;
let headerName = '';

test.describe('Dx_OPD_PROGRESSNOTE', () => {
    
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

        await page.locator('.ifbtn').click();
        await page.locator('text=OPD').click();
        await page.locator('text=Nurse Workbench').click();
        await page.waitForTimeout(15000);
        
        await page.fill('input[placeholder="HN"]', HNNum);
        await page.waitForTimeout(4000);
        await page.click('.btn.btn-primary.btn-sm.minwidbtn.pointer.mr-1');
        await page.waitForTimeout(10000); // reduced from 20s
        
        await page.click('a.change-hight-button[href="#tab-ProgressNote"]');
    });

    test.afterEach(async ({ page }, testInfo) => {
        const status = testInfo.status === 'passed' ? 'Success' : 'Failed';
        const message = `${headerName} ${status} | Version: ${specVersion}`;
        
        const filename = `test_${generateDatetimeTick()}.png`;
        const screenshotPath = `test-results/screenshots/${filename}`;
        await page.screenshot({ path: screenshotPath });
        await sendScreenshotToTelegram(screenshotPath, filename, message);
    });

    test('Diabletic', async ({ page }) => {
        headerName = 'Diabletic';
        await page.waitForTimeout(5000);
        await page.click('text=Load');
        await page.waitForTimeout(6000);
        await page.click('td:has-text("ผู้ป่วยเบาหวาน")');
        await page.waitForTimeout(5000);
        
        const models = [
            'ผู้ป่วยไม่เกิดภาวะ Hyperglycem',
            'ผู้ป่วยไม่เกิดภาวะ Hypoglycemi',
            'ผู้ป่วยสามารถประเมินอาการภาวะ ',
            'ผู้ป่วยสามารถดูแลตนเองเบื้องตน',
            'ผู้ป่วยไม่เกิดภาวะ Hyperglycem',
            'ผู้ป่วยสามารถควบคุมระดับน้ำตาล',
            'FBS.........',
            'DTX….......',
            'HbAIC…....',
            'Record vital sign ระดับน้ำตาล',
            'ระดับน้ำตาลในเลือดสูง ให้ยาตาม',
            'Fu DTX ซ้ำทุกๆ15-30นาที',
            'รายงานแพทย์และส่งเข้าพบแพทย์',
            'ให้คำแนะนำเกี่ยวกับอาหาร การออ',
            'แนะนำวิธีสังเกตอาการผิดปกติเช่'
        ];

        for (const model of models) {
            await expect(page.locator(`input[ng-reflect-model="${model}"]`)).toBeVisible();
        }
    });

    test('Febrile', async ({ page }) => {
        headerName = 'Febrile';
        await page.waitForTimeout(5000);
        await page.click('text=Load');
        await page.waitForTimeout(6000);
        await page.click('td:has-text("Risk to Febrile Convulsion")');
        await page.waitForTimeout(5000);
        
        const expectedValues = [
            'ไม่เกิดภาวะชักจากไข้สูง',
            'ผู้ป่วยสุขสบายตัวมากขึ้น'
        ];

        for (const value of expectedValues) {
            await expect(page.locator(`input[ng-reflect-model="${value}"]`)).toHaveValue(value);
        }
    });

    test('Submit', async ({ page }) => {
        headerName = 'Submit';
        await page.click('text=Load');
        await page.waitForTimeout(6000);
        await page.click('td:has-text("Risk to Febrile Convulsion")');
        await page.waitForTimeout(3000);
        await page.click('text=Save');
        await expect(page.locator('text=Success')).toBeVisible();
    });

    test('Delete', async ({ page }) => {
        headerName = 'Delete';
        await page.click('text=Load');
        await page.waitForTimeout(6000);
        await page.click('td:has-text("Risk to Febrile Convulsion")');
        await page.waitForTimeout(2000);
        await page.click('text=Save');
        await expect(page.locator('text=Success')).toBeVisible();
        await page.waitForTimeout(2000);
        await page.click('text=Delete');
    });

    test('Send to Diag', async ({ page }) => {
        headerName = 'Send to Diag';
        await page.locator('text=Nurse Record').click();
        await page.locator('text=Send To Diag').click();
    });
});
