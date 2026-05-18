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

test("DX_OPD_Diagnosis", async ({ page }) => {
  // 🌟 จุดแก้ไขสำคัญ: ต้องเปิด Debug และ Login ก่อนเริ่มทำขั้นตอนถัดไป
  await setupDebug(page);
  await login(page);

   await page.waitForTimeout(5000);
  await page.locator('.d-flex > div').first().click();
  await page.getByRole('button', { name: 'Doctor', exact: true }).click();
  await page.getByText('DoctorWorkbench').click();
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.waitForTimeout(2000);
  

  // 1. กำหนด HN หรือ VN ที่ต้องการค้นหา และคลิกเลือกคนไข้
  const patData = require('../cypress/fixtures/PAT_NUM.json');
  const patKey = process.env.PAT_KEY || 'PAT_1';
  
  // 2. ใช้ VN จาก json มาคลิกต่อ
  const targetVN = patData.PAT_NUM[patKey]?.VN1 || patData.PAT_NUM.PAT_1.VN1;
  
  // รอให้ตัวเลข VN แสดงขึ้นมาก่อนค่อยกด ป้องกันการกดตอนหน้าเว็บยังโหลดไม่เสร็จ
  const vnElement = page.getByText(targetVN).first();
  await vnElement.waitFor({ state: 'visible', timeout: 10000 });
  await vnElement.click();
  console.log(`>>> Clicked on patient with VN: ${targetVN}`);
  
  // เผื่อเวลาให้หน้าจอหลักโหลดเซ็ตตัวสักครู่
  await page.waitForTimeout(2000); 
  
  // ==========================================
  // STEP 1: บันทึกการวินิจฉัยโรค (Diagnosis)
  // ==========================================
  await page.getByRole('button', { name: 'Diagnosis ' }).click();
  
  const icdInput = page.locator('#htmlicd').first();
  await icdInput.click();
  await icdInput.pressSequentially('001', { delay: 100 });
  
  // เผื่อเวลานิดหน่อยให้ Dropdown ขยับตัววาดบนจอ (Optional)
  await page.waitForTimeout(500);

  // รอให้ตัวเลือกโรคโผล่ขึ้นมา (เพิ่มเวลารอเป็น 10 วินาที เผื่อวันไหนเน็ตช้า)
  const icdOption = page.locator('span').filter({ hasText: 'A001 : Cholera due to Vibrio' }).first();
  await icdOption.waitFor({ state: 'visible', timeout: 10000 });
  await icdOption.click();

  // ==========================================
  // STEP 2: บันทึกหัตถการ (Procedure)
  // ==========================================
  const procedureInput = page.getByRole('combobox', { name: 'Procedure1' });
  await procedureInput.click();
  
  // 💥 แก้ตรงนี้เช่นกัน: พิมพ์แบบมีหน่วงเวลาทีละตัวอักษร
  await procedureInput.pressSequentially('001', { delay: 100 });
  
  await page.waitForTimeout(500);

  // รอให้ตัวเลือกหัตถการโผล่ขึ้นมาก่อน แล้วค่อยคลิก
  const procedureOption = page.locator('span').filter({ hasText: ': 0019' }).first();
  await procedureOption.waitFor({ state: 'visible', timeout: 10000 });
  await procedureOption.click();

  // 1️⃣ [ชุดแรก] กด Apply และ Submit ของฝั่งบันทึกโรค/หัตถการ
  // แนะนำระบุ .first() เผื่อหน้าเว็บมีปุ่ม Apply/Submit ซ้ำจุดอื่น จะได้ไม่ชน Strict Mode
  await page.getByRole('button', { name: 'Apply' }).first().click();
  await page.getByRole('button', { name: 'Submit', exact: true }).first().click();

  // ==========================================
  // STEP 3: บันทึกสั่งยา (Medicine)
  // ==========================================
  await page.locator('.btn.btn-success.btn-sm.ml-1.exportformtoemrpc').click();
  await page.getByRole('menuitem', { name: ' Medicine' }).click();
  await page.locator('.fa.fa-search.sicon').click();
  await page.getByRole('textbox', { name: 'Medicine Name' }).click();
  await page.getByRole('textbox', { name: 'Medicine Name' }).fill('para');
  await page.getByRole('button', { name: 'Search' }).click();
  
  // รอให้ยาที่จะเลือกปรากฏขึ้นมา แล้วค่อยคลิก
  const medBtn = page.getByRole('button', { name: '   PIPARAC300WG' });
  await medBtn.waitFor({ state: 'visible', timeout: 5000 });
  await medBtn.click();
  
  await page.getByRole('button', { name: 'Submit', exact: true }).first().click();

  // ==========================================
  // STEP 4: กด Apply, ตรวจสอบ Pop-up และ Submit ท้ายสุด
  // ==========================================
  // 2️⃣ [ชุดที่สอง] รอจนกว่าปุ่ม Apply ด้านล่างสุดจะพร้อมทำงาน แล้วคลิก (ใช้ .last() เพื่อให้มั่นใจว่าเป็นปุ่มล่างสุดของฟอร์มใหญ่)
  const applyBtn = page.getByRole('button', { name: 'Apply' }).last();
  await applyBtn.waitFor({ state: 'visible', timeout: 10000 });
  await applyBtn.click();

  // ตรวจสอบเด้ง Pop-up ยืนยัน 'Yes' ถ้ามีก็กด ถ้าไม่มีก็ข้ามแบบปลอดภัย
  try {
    const yesBtn = page.getByRole('button', { name: 'Yes' });
    await yesBtn.waitFor({ state: 'visible', timeout: 3000 });
    await yesBtn.click();
    console.log(">>> Clicked 'Yes' confirmation dialog.");
  } catch (e) {
    console.log(">>> No 'Yes' confirmation dialog appeared, skipped.");
  }

  // กด Submit ปิดท้าย Flow ฟอร์มใหญ่
  const submitBtn = page.getByRole('button', { name: 'Submit', exact: true }).last();
  await submitBtn.waitFor({ state: 'visible', timeout: 5000 });
  await submitBtn.click();

  // คลิกปุ่มส่งหน้างาน (ปุ่มที่ไม่มี Text / มีแต่ไอคอน) เป็นอันเสร็จสิ้น
  const finalBtn = page.getByRole('button').filter({ hasText: /^$/ }).first();
  await finalBtn.waitFor({ state: 'visible', timeout: 15000 });
  await finalBtn.click();
  console.log(">>> All Steps and Submits completed successfully!");
});