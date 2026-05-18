import { test, expect, Page } from "@playwright/test";
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const specVersion = '1.16';
const apiUrl = process.env.API_URL;

// --- Helper Functions ---

async function setupDebug(page: Page) {
  page.on("console", (msg) =>
    console.log(`[browser:${msg.type()}] ${msg.text()}`)
  );
  page.on("pageerror", (err) => console.log(`[pageerror] ${err.message}`));
}

async function login(page: Page) {
  // 1. ไปที่หน้า Login
  await page.goto("http://43.229.78.113:8505/login", {
    waitUntil: "networkidle",
  });

  // 2. Company Config
  await page.locator("i").first().click();
  await page.locator("#mat-input-0").fill("com1");
  await page
    .getByRole("textbox", { name: "Enter your password" })
    .fill("passo");
  await page.getByRole("button", { name: "Save" }).click();

  // 3. Login Form
  await page.getByRole("textbox", { name: "User Name" }).fill("dtest");
  await page.getByRole("textbox", { name: "Password" }).fill("1");
  await page.getByRole("button", { name: "Login" }).click();

  // 4. รอให้เปลี่ยนหน้าสำเร็จ
  await expect(page).not.toHaveURL(/\/login$/i, { timeout: 60000 });
  console.log(">>> Login Successful");
  await page.waitForLoadState("networkidle");

  // 5. จัดการ Modal ที่อาจโผล่มาขวาง
  try {
    const closeBtn = page
      .locator(".modal-dialog .close, .far.fa-times-circle, .far")
      .first();
    await closeBtn.waitFor({ state: "visible", timeout: 3000 });

    await closeBtn.click();
    console.log(">>> Closed Pop-up/Modal");
  } catch (e) {
    console.log(">>> No Pop-up/Modal appeared");
  }
}

// --- Main Test ---

test('Select specific patient in NurseWorkbench', async ({ page }) => {
  // 1. ตั้งค่า Debug และทำการ Login ด้วยฟังก์ชันที่เราเตรียมไว้
  await setupDebug(page);
  await login(page);
  // 2. เข้าสู่เมนู OPD -> NurseWorkbench
  await page.locator('.d-flex > div').first().click();
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: 'OPD' }).click();
  await page.getByText('NurseWorkbench').click();
  
  // 3. กดปุ่ม Search เพื่อดึงรายชื่อคนไข้
  await page.getByRole('button', { name: 'Search', exact: true }).click();

  await page.waitForLoadState("networkidle"); 

  // 4. กำหนด HN หรือ VN ที่ต้องการค้นหา และคลิกเลือกคนไข้
  const patData = require('../cypress/fixtures/PAT_NUM.json');
  const patientKeys = Object.keys(patData.PAT_NUM || {});
  
  for (const patKey of patientKeys) {
    const targetHN = patData.PAT_NUM[patKey].HN1;
    console.log(`>>> Processing ACK and Send To Diag for patient: ${patKey} with HN: ${targetHN}`);
    
    // หากล่อง (.mat-expansion-panel-body) ที่มีข้อความตรงกับ HN 
    const patientCard = page.locator('.mat-expansion-panel-body').filter({ hasText: targetHN });
    
    // รอจนปุ่ม Ack. ปรากฏ และคลิกเลือกคนไข้
    const ackBtn = patientCard.getByRole('button', { name: '  Ack.' }).first();
    await ackBtn.waitFor({ state: 'visible', timeout: 10000 });
    await ackBtn.click();
    await page.waitForTimeout(2000);
    
    const sendBtn = page.getByRole('button', { name: '  Send To Diag' }).first();
    await sendBtn.waitFor({ state: 'visible', timeout: 10000 });
    await sendBtn.click();
    
    console.log(`>>> Clicked ACK and Send To Diag for HN: ${targetHN}`);
    await page.waitForTimeout(3000);
  }

  await page.waitForTimeout(2000);
  await page.locator('.d-flex > div').first().click();
  await page.getByRole('button', { name: 'Doctor', exact: true }).click();
  await page.getByText('DoctorWorkbench').click();
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.waitForTimeout(2000);

  // กด Check in สำหรับคนไข้แต่ละคน
  for (const patKey of patientKeys) {
    const targetVN = patData.PAT_NUM[patKey].VN1;
    console.log(`>>> Checking in patient: ${patKey} with VN: ${targetVN}`);
    
    // ค้นหากล่องหรือแถวที่มี VN หรือ HN และกด Check in
    const patientRow = page.locator('tr, .mat-row, .patient-row, div').filter({ hasText: targetVN }).first();
    const checkInBtn = patientRow.getByRole('button', { name: '  Check in' }).first();
    
    if (await checkInBtn.isVisible()) {
      await checkInBtn.click();
      console.log(`>>> Checked in VN: ${targetVN} successfully.`);
    } else {
      console.log(`>>> Check-in button not found inside specific container for VN: ${targetVN}, trying general check in`);
      const generalCheckIn = page.getByRole('button', { name: '  Check in' }).first();
      await generalCheckIn.click();
    }
    await page.waitForTimeout(2000);
  }
});