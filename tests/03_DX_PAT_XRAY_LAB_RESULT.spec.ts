import { test, expect } from './utils/base-test';
import { sendMsgToTelegram } from './utils/telegram-utils';
import PAT_NUM_RAW from '../cypress/fixtures/PAT_NUM.json';
const PAT_NUM: any = PAT_NUM_RAW;
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const specVersion = '1.15';
const apiUrl = process.env.API_URL;
let headerName = '';

test.describe("LAB_XRAY_RESULT", () => {

    test.beforeEach(async ({ page }) => {
        
        await page.waitForLoadState('networkidle');
        
        await expect(page.locator('text=Welcome')).toBeVisible();
        await page.locator('.ifbtn').click({ force: true });
        await page.waitForTimeout(1000);
        await page.locator('text=Facility').click({ force: true });
        await page.waitForTimeout(1000);
    });

    test.afterEach(async ({}, testInfo) => {
        const status = testInfo.status === 'passed' ? 'Success' : 'Failed';
        const message = `Title : ${headerName} ${status} | Version : ${specVersion}`;
        await sendMsgToTelegram(message);
    });

    test('Lab Result', async ({ page }) => {
        headerName = 'Lab Result';
        await page.click('text=/LAB General/i');
        await page.waitForTimeout(10000);
        
        await page.locator('.fa-solid.fa-magnifying-glass').first().click();
        await page.waitForTimeout(1000);
        
        const HNNum = PAT_NUM.PAT_NUM.PAT_1.HN1;
        await page.locator('input[placeholder="HN"]').nth(2).clear();
        await page.locator('input[placeholder="HN"]').nth(2).fill(HNNum);
        
        await page.locator('.fa.fa-eye').click({ force: true });
        await page.waitForTimeout(500);
        
        await page.locator('.fal.fa-check-circle').click({ force: true });
        await page.click('text=Search');
        await page.waitForTimeout(500);

        await page.locator(':nth-child(2) > tr.ng-star-inserted > :nth-child(9)').click({ force: true });
        await page.waitForTimeout(2000);
        
        await page.click('text=Specimen Request');
        await page.waitForTimeout(2000);
        await page.click('text=Confirm Receive Specimen');
        await page.waitForTimeout(3000);
        await page.click('text=OK');
        await page.waitForTimeout(3000);
        
        await page.locator('#mat-tab-label-0-2').click({ force: true });
        await page.waitForTimeout(2000);
        
        await page.locator('.w-d > :nth-child(2) > .form-control').first().fill('test');
        await page.click('text=Confirm Result');
        await page.waitForTimeout(3000);
        await page.click('text=Approve Result');
        
        await expect(page.locator('text=Error')).not.toBeVisible();
    });

    test('X-ray Result', async ({ page }) => {
        headerName = 'X-ray';
        await page.click('text=X-Ray General');
        await page.waitForTimeout(10000);

        await page.locator('.fa-solid.fa-magnifying-glass').first().click();
        await page.waitForTimeout(1000);
        
        const HNNum = PAT_NUM.PAT_NUM.PAT_1.HN1;
        await page.locator('input[placeholder="HN"]').nth(2).clear();
        await page.locator('input[placeholder="HN"]').nth(2).fill(HNNum);
        
        await page.locator('.fa.fa-eye').click({ force: true });
        await page.waitForTimeout(500);
        
        await page.locator('.fal.fa-check-circle').click({ force: true });
        await page.click('.d-flex > .btn-primary'); // Search
        await page.waitForTimeout(5000);
        
        await page.locator('tbody > :nth-child(1) > :nth-child(4)').click({ force: true });
        await page.waitForTimeout(3000);
        
        await page.locator('.Change-md-list-btn > .Change-md-btn-group > :nth-child(2)').click({ force: true });
        await page.waitForTimeout(2000);
        
        await page.locator('tr > :nth-child(9) > .ng-star-inserted').click({ force: true });
        await page.waitForTimeout(2000);
        
        await page.click('text=Yes');
        await page.waitForTimeout(2000);
        
        await expect(page.locator('text=Error')).not.toBeVisible();
    });
});
