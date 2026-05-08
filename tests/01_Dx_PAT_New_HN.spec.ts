import { test, expect, Page } from "@playwright/test";
import { sendMsgToTelegram } from "./utils/telegram-utils";
import fs from "fs";
import path from "path";

test.use({
  viewport: { width: 1920, height: 1080 },
});

// --- Helper Functions ---

async function setupDebug(page: Page) {
  page.on("console", (msg) =>
    console.log(`[browser:${msg.type()}] ${msg.text()}`),
  );
  page.on("pageerror", (err) => console.log(`[pageerror] ${err.message}`));
}

function generateThaiID() {
  const digits = Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 10),
  );
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += digits[i] * (13 - i);
  digits.push((11 - (sum % 11)) % 10);
  return digits.join("");
}

function randomName(base: string) {
  return `${base}${Math.floor(Math.random() * 10000)}`;
}

async function waitForAppStable(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000); // เพิ่มเวลาให้นิ่งขึ้น
}

// --- Main Logic ---

async function login(page: Page) {
  await page.goto("http://43.229.78.113:8505/login", {
    waitUntil: "networkidle",
  });

  // Company Config
  await page.locator("i").first().click();
  await page.locator("#mat-input-0").fill("com1");
  await page
    .getByRole("textbox", { name: "Enter your password" })
    .fill("passo");
  await page.getByRole("button", { name: "Save" }).click();

  // Login Form
  await page.getByRole("textbox", { name: "User Name" }).fill("dtest");
  await page.getByRole("textbox", { name: "Password" }).fill("1");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).not.toHaveURL(/\/login$/i, { timeout: 60000 });
  console.log(">>> Login Successful");
  await page.waitForLoadState("networkidle");

  // จัดการ Modal ที่อาจโผล่มาขวาง
  try {
    const closeBtn = page
      .locator(".modal-dialog .close, .far.fa-times-circle, .far")
      .first();
    await closeBtn.waitFor({ state: "visible", timeout: 3000 });

    await closeBtn.click();
    console.log(">>> Closed Pop-up/Modal");
  } catch (e) {
    // TimeoutError จะตกลงมาที่นี่แปลว่าไม่มี Modal โผล่มาใน 3 วินาที 
    console.log(">>> No Pop-up/Modal appeared");
  }
}

async function openNewPatientForm(page: Page) {
  // ไปหน้า Registration
  await page.locator("span:nth-child(2) > a").click();
  await page.getByRole("button").first().click();
  await page.getByRole("button", { name: "Registration" }).click();
  await page.getByText("Patient Registration", { exact: true }).click();

  const newPatientButton = page.getByRole("button", { name: "New patient" });
  await expect(newPatientButton).toBeVisible({ timeout: 30000 });

  // ก่อนคลิก New Patient ต้องมั่นใจว่า Config โหลดเสร็จ (ดัก Error AllowManualHN)
  await page.waitForLoadState("networkidle");
  await newPatientButton.click();

  console.log(">>> Navigating to Registration Form...");
}

// --- Test Case ---

test("01 - New HN - Login and Create New Patient", async ({ page }) => {
  test.setTimeout(300000);
  await setupDebug(page);

  // *** แก้ไขการดัก API ให้ตรงกับ URL จริงที่ระบบเรียกใช้ ***
  await page.route("**/ProductRESTService.svc/AllowManualHN", async (route) => {
    // ตรวจสอบว่าเป็น POST method ตามที่หน้าเว็บเรียกจริงๆ
    if (route.request().method() === "POST") {
      console.log(`>>> Mocking Config: ${route.request().url()}`);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        // (เปลี่ยนเป็น true ถ้าต้องการเทสต์กรอก HN เอง)
        body: JSON.stringify({
          AllowManualHN: false,
          ErrorMessage: "",
          ResultStatus: true,
        }),
      });
    } else {
      await route.continue(); // ถ้าไม่ใช่ POST ปล่อยผ่านไป
    }
  });

  let capturedHN = "";
  let capturedVN = "";
  let patientName = "";

  // ดักจับ HN/VN จาก Response
  page.on("response", async (response) => {
    const url = response.url();
    try {
      if (
        url.includes("MobileUpdatePatientHeader") &&
        response.status() === 200
      ) {
        const body = await response.json();
        if (body.HN) capturedHN = body.HN;
      }
      if (url.includes("MobileUpdateOPDHeader") && response.status() === 200) {
        const body = await response.json();
        if (body.VN) capturedVN = body.VN;
      }
    } catch (e) {}
  });

  await login(page);
  await openNewPatientForm(page);

  // --------- General Information ---------

  // 1. สร้างตัวแปรสุ่มชื่อทั้งไทยและอังกฤษ
  const fNameThai = randomName("ทดสอบ");
  const lNameThai = randomName("นามสกุล");
  const fNameEng = randomName("testFirst");
  const lNameEng = randomName("testLast");

  patientName = `${fNameThai} ${lNameThai}`; // เก็บไว้ส่งเข้า Telegram

  // 2. กรอกชื่อ-นามสกุล ภาษาไทย
  await page.getByRole("textbox").nth(3).fill(fNameThai);
  await page.getByRole("textbox").nth(4).fill(lNameThai);

  // 3. กรอกชื่อ-นามสกุล ภาษาอังกฤษ (อ้างอิงจาก Codegen ของคุณ)
  await page
    .locator("div:nth-child(4) > div:nth-child(2) > .form-control")
    .fill(fNameEng);
  await page
    .locator("div:nth-child(4) > div:nth-child(3) > .form-control")
    .first()
    .fill(lNameEng);

  // --------- DOB & Gender ---------
  await page.getByRole("textbox", { name: "Date of Birth" }).fill("12042003");
  await page.getByRole("combobox").nth(1).selectOption("2");

  // --------- Address ---------
  await page.locator(".col-6 > .form-control").fill("123");
  const addr = page.getByRole("combobox", {
    name: "ตำบล/ อำเภอ / จังหวัด / รหัสไปรษณีย์",
  });
  await addr.fill("10210");

  await page.getByRole("button", { name: "Apply" }).nth(0).click();
  await page.waitForTimeout(10000);

  // --------- Reference ---------
  await page.getByText("Reference", { exact: true }).click();
  const refType = page.locator("app-select-enum").getByRole("combobox");
  await refType.click();
  await page.getByText("Identity", { exact: true }).click();

  const refInput = page
    .getByRole("tabpanel", { name: "Reference" })
    .locator('input[role="combobox"]#idhtml')
    .first();
  await refInput.click();
  await page.getByText("01 : เลขที่บัตรประชาชน", { exact: true }).click();
  await page.getByRole("textbox").nth(3).fill(generateThaiID());
  await page
    .getByLabel("Reference")
    .getByRole("button", { name: "Apply" })
    .click({ force: true });
  await page.waitForTimeout(10000);
  // --------- Extra ---------
  await page.getByText("Extra", { exact: true }).click();
  const extraCombo = page.locator('input[role="combobox"]#idhtml');
  await extraCombo.first().click();
  await page.getByText("01 : ห้ามเปิดเผย", { exact: true }).click();
  await extraCombo.nth(1).click();
  await page.getByText("9998 : VIP Remark.", { exact: true }).click();

  // --------- Submit Registration ---------

  // 1. กดปุ่ม Submit และรอให้ API เซฟข้อมูลเส้นหลักตอบกลับมา

  await page.getByRole("button", { name: "Submit", exact: true }).click();

  await page.waitForLoadState("networkidle"); // <- เพิ่มบรรทัดนี้
  await page.waitForTimeout(1000); // รอเพิ่มเผื่อ UI Update
  // await page.waitForTimeout(3000); // ถ้าจะใส่รอแอนิเมชันนิดหน่อยก็ได้ แต่มักจะไม่จำเป็นแล้ว
  // // --------- Right & Visit ---------
  // // เลือกสิทธิ์
  // const rightCombo = page.getByRole("combobox").first();
  // await rightCombo.click();
  // await rightCombo.press("ArrowDown");
  // await page.getByText("005 : ประกันชีวิตกลุ่ม", { exact: false }).click();
  // await page
  //   .getByText("001-SP-0000-000 : ส่วนลดเหมาจ่าย", { exact: false })
  //   .click();

  // --------- Right & Visit ---------

  // ตอนนี้หน้าจอเคลียร์แล้ว สามารถกดปุ่ม Update RightCode ได้อย่างปลอดภัยชัวร์ๆ 100%
  const updateRightBtn = page.getByRole("button", { name: "Update RightCode" });
  await updateRightBtn.waitFor({ state: "visible", timeout: 10000 });
  await updateRightBtn.click();

  // เลือกแผนก/แพทย์
  await page
    .locator(".col-6 > div > app-auto-complete-master-setup > div > #idhtml")
    .first()
    .click();
  await page
    .locator("span")
    .filter({ hasText: ": คลินิกห้อง ฉุกเฉิน" })
    .first()
    .click();
  await page.locator(".bg-valid > div > #idhtml").click();
  await page
    .locator("span")
    .filter({ hasText: ": ไม่ระบุแพทย์." })
    .first()
    .click();
  await page.waitForTimeout(10000);

  await page.getByText("Apply").click();
  await page.getByText("Submit OPD Visit").click();
  await page.waitForTimeout(3000);

  try {
    await page.getByRole("button", { name: "OK" }).click();
  } catch (e) {}

  // --------- Finalize ---------
  console.log(`>>> Success! HN: ${capturedHN}, VN: ${capturedVN}`);

  if (capturedHN || capturedVN) {
    const msg = `✅ [New Patient]\nName: ${patientName}\nHN: ${capturedHN || "N/A"}\nVN: ${capturedVN || "N/A"}`;
    await sendMsgToTelegram(msg);

    // Save to JSON
    const patNumPath = path.join(__dirname, "../cypress/fixtures/PAT_NUM.json");
    let data = { PAT_NUM: { PAT_1: {} } };
    if (fs.existsSync(patNumPath)) {
      data = JSON.parse(fs.readFileSync(patNumPath, "utf8"));
    }
    data.PAT_NUM["PAT_1"] = { HN1: capturedHN, VN1: capturedVN };
    fs.writeFileSync(patNumPath, JSON.stringify(data, null, 2));
  }
});
