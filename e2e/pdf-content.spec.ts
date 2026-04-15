import { test, expect } from '@playwright/test';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>;

/**
 * フォームに固定データを入力するヘルパー
 */
async function fillInvoiceForm(page: import('@playwright/test').Page) {
  await page.locator('#customerInfo').fill('テスト株式会社\n東京都渋谷区1-2-3');
  await page.locator('#issuerInfo').fill('発行者株式会社\n大阪府大阪市4-5-6');
  await page.locator('#issueDate').fill('2024-04-01');
  await page.locator('#dueDate').fill('2024-04-30');
  await page.locator('#invoiceNumber').fill('INV-2024-001');
  await page.locator('#subject').fill('4月分コンサルティング費用');

  await page.locator('#item-0-description').fill('コンサルティング');
  await page.locator('#item-0-quantity').fill('10');
  await page.locator('#item-0-unitPrice').fill('50000');
  await page.locator('#item-0-taxRate').selectOption('10');

  await page.getByRole('button', { name: '明細追加' }).click();
  await page.locator('#item-1-description').waitFor({ state: 'visible' });
  await page.locator('#item-1-description').fill('交通費');
  await page.locator('#item-1-quantity').fill('5');
  await page.locator('#item-1-unitPrice').fill('1000');
  await page.locator('#item-1-taxRate').selectOption('10');

  await page.locator('#paymentInfo').fill('三菱UFJ銀行\n渋谷支店\n普通 1234567');
}

/**
 * PDFをダウンロードしてテキストを抽出する
 */
async function downloadPdfAndExtractText(page: import('@playwright/test').Page): Promise<string> {
  // PDFDownloadLink が最新データで PDF を再生成するのを待つ
  await page.waitForTimeout(5000);
  const downloadButton = page.getByRole('button', { name: 'PDFをダウンロード' });
  await expect(downloadButton).toBeEnabled({ timeout: 60000 });

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }),
    downloadButton.click(),
  ]);

  const filePath = await download.path();
  expect(filePath).toBeTruthy();

  const buffer = fs.readFileSync(filePath!);
  const pdf = await pdfParse(buffer);
  return pdf.text;
}

test.use({ viewport: { width: 1440, height: 900 } });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test.describe('PDF内容の検証', () => {
  test('請求書タイトル・番号・日付が正しく出力される', async ({ page }) => {
    await fillInvoiceForm(page);
    const text = await downloadPdfAndExtractText(page);

    expect(text).toContain('請求書');
    expect(text).toContain('INV-2024-001');
    expect(text).toContain('2024-04-01');
  });

  test('請求先・発行者情報が正しく出力される', async ({ page }) => {
    await fillInvoiceForm(page);
    const text = await downloadPdfAndExtractText(page);

    expect(text).toContain('テスト株式会社');
    expect(text).toContain('発行者株式会社');
  });

  test('件名が正しく出力される', async ({ page }) => {
    await fillInvoiceForm(page);
    const text = await downloadPdfAndExtractText(page);

    expect(text).toContain('4月分コンサルティング費用');
  });

  test('明細の品目・数量・単価・小計が正しく出力される', async ({ page }) => {
    await fillInvoiceForm(page);
    const text = await downloadPdfAndExtractText(page);

    // 明細1: コンサルティング 10 × ¥50,000 = ¥500,000
    expect(text).toContain('コンサルティング');
    expect(text).toMatch(/500,000/);

    // 明細2: 交通費 5 × ¥1,000 = ¥5,000
    expect(text).toContain('交通費');
    expect(text).toMatch(/5,000/);
  });

  test('消費税計算と合計金額が正しく出力される', async ({ page }) => {
    await fillInvoiceForm(page);
    const text = await downloadPdfAndExtractText(page);

    // 小計: 505,000 消費税(10%): 50,500 合計: 555,500
    expect(text).toMatch(/505,000/);
    expect(text).toMatch(/50,500/);
    expect(text).toMatch(/555,500/);
  });

  test('支払期限が正しく出力される', async ({ page }) => {
    await fillInvoiceForm(page);
    const text = await downloadPdfAndExtractText(page);

    expect(text).toContain('2024-04-30');
  });

  test('振込先情報が正しく出力される', async ({ page }) => {
    await fillInvoiceForm(page);
    const text = await downloadPdfAndExtractText(page);

    expect(text).toContain('三菱UFJ銀行');
  });

  test('8%と10%の混合税率で消費税が正しく計算される', async ({ page }) => {
    await page.locator('#subject').fill('混合税率テスト');

    // 明細1: 10%品目
    await page.locator('#item-0-description').fill('標準税率品目');
    await page.locator('#item-0-quantity').fill('1');
    await page.locator('#item-0-unitPrice').fill('10000');
    await page.locator('#item-0-taxRate').selectOption('10');

    // 明細2: 8%品目
    await page.getByRole('button', { name: '明細追加' }).click();
    await page.locator('#item-1-description').waitFor({ state: 'visible' });
    await page.locator('#item-1-description').fill('軽減税率品目');
    await page.locator('#item-1-quantity').fill('1');
    await page.locator('#item-1-unitPrice').fill('10000');
    await page.locator('#item-1-taxRate').selectOption('8');

    const text = await downloadPdfAndExtractText(page);

    // 10%対象: 10,000 → 税 1,000
    // 8%対象:  10,000 → 税 800
    // 合計: 20,000 + 1,000 + 800 = 21,800
    expect(text).toContain('標準税率品目');
    expect(text).toContain('軽減税率品目');
    expect(text).toMatch(/1,000/);   // 10%消費税
    expect(text).toMatch(/800/);     // 8%消費税
    expect(text).toMatch(/21,800/);  // 合計
  });
});
