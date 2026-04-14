import { test, expect } from '@playwright/test';

/**
 * フォームに請求書データを一通り入力するヘルパー
 */
async function fillInvoiceForm(page: import('@playwright/test').Page) {
  await page.locator('#customerInfo').fill('テスト株式会社\n東京都渋谷区1-2-3\n営業部\n山田太郎');
  await page.locator('#issuerInfo').fill('発行者株式会社\n大阪府大阪市4-5-6\n06-1234-5678\n佐藤花子');
  await page.locator('#issueDate').fill('2024-04-01');
  await page.locator('#dueDate').fill('2024-04-30');
  await page.locator('#invoiceNumber').fill('INV-2024-001');
  await page.locator('#subject').fill('4月分コンサルティング費用');

  await page.locator('#item-0-description').fill('コンサルティング');
  await page.locator('#item-0-quantity').fill('10');
  await page.locator('#item-0-unitPrice').fill('50000');
  await page.locator('#item-0-taxRate').selectOption('10');

  await page.getByRole('button', { name: '明細追加' }).click();
  await page.locator('#item-1-description').fill('交通費');
  await page.locator('#item-1-quantity').fill('5');
  await page.locator('#item-1-unitPrice').fill('1000');
  await page.locator('#item-1-taxRate').selectOption('10');

  await page.locator('#paymentInfo').fill('三菱UFJ銀行\n渋谷支店\n普通 1234567');
}

/**
 * PDFダウンロードボタンをクリックし、実際にファイルがダウンロードされることを検証する
 */
async function downloadPdfAndVerify(page: import('@playwright/test').Page) {
  const downloadButton = page.getByRole('button', { name: 'PDFをダウンロード' });
  await expect(downloadButton).toBeVisible({ timeout: 30000 });
  await expect(downloadButton).toBeEnabled({ timeout: 30000 });

  // ダウンロードイベントを待機してからクリック
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 30000 }),
    downloadButton.click(),
  ]);

  expect(download.suggestedFilename()).toMatch(/^invoice-.*\.pdf$/);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test.describe('PC: フルフロー（入力→プレビュー→PDFダウンロード）', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('フォーム入力後にプレビューパネルが表示される', async ({ page }) => {
    await fillInvoiceForm(page);

    // デスクトップではプレビューパネルが右側に常時表示
    const previewHeading = page.locator('h2', { hasText: 'プレビュー' });
    await expect(previewHeading).toBeVisible();
  });

  test('PDFをダウンロードできる', async ({ page }) => {
    await fillInvoiceForm(page);
    await downloadPdfAndVerify(page);
  });
});

test.describe('SP: フルフロー（入力→モバイルプレビュー→PDFダウンロード）', () => {
  test.use({ viewport: { width: 393, height: 851 } });

  test('モバイルプレビューボタンが表示される', async ({ page }) => {
    const previewButton = page.getByRole('button', { name: 'プレビュー' });
    await expect(previewButton).toBeVisible();
  });

  test('フォーム入力後にモバイルプレビューモーダルが開閉できる', async ({ page }) => {
    await fillInvoiceForm(page);

    await page.getByRole('button', { name: 'プレビュー' }).click();

    // モーダル内のプレビューヘッダが表示される
    const modalHeading = page.locator('.fixed h2', { hasText: 'プレビュー' });
    await expect(modalHeading).toBeVisible();

    // X ボタンでモーダルを閉じる
    await page.locator('.fixed .sticky button').click();
    await expect(modalHeading).not.toBeVisible();
  });

  test('モバイルからPDFをダウンロードできる', async ({ page }) => {
    await fillInvoiceForm(page);
    await downloadPdfAndVerify(page);
  });
});
