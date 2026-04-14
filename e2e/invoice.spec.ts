import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // localStorage をクリアしてから各テストを実行
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test.describe('請求書作成ページの表示', () => {
  test('ページが正しく読み込まれる', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('請求書作成');
  });

  test('必須のフォーム要素が存在する', async ({ page }) => {
    await expect(page.locator('#customerInfo')).toBeVisible();
    await expect(page.locator('#issuerInfo')).toBeVisible();
    await expect(page.locator('#issueDate')).toBeVisible();
    await expect(page.locator('#dueDate')).toBeVisible();
    await expect(page.locator('#invoiceNumber')).toBeVisible();
    await expect(page.locator('#subject')).toBeVisible();
    await expect(page.locator('#paymentInfo')).toBeVisible();
  });

  test('初期明細行が1つ表示される', async ({ page }) => {
    await expect(page.locator('#item-0-description')).toBeVisible();
    await expect(page.locator('#item-0-quantity')).toBeVisible();
    await expect(page.locator('#item-0-unitPrice')).toBeVisible();
    await expect(page.locator('#item-0-taxRate')).toBeVisible();
  });
});

test.describe('フォーム入力', () => {
  test('請求先情報を入力できる', async ({ page }) => {
    const customerInfo = page.locator('#customerInfo');
    await customerInfo.fill('テスト株式会社\n東京都渋谷区1-2-3');
    await expect(customerInfo).toHaveValue('テスト株式会社\n東京都渋谷区1-2-3');
  });

  test('発行者情報を入力できる', async ({ page }) => {
    const issuerInfo = page.locator('#issuerInfo');
    await issuerInfo.fill('発行者株式会社\n大阪府大阪市4-5-6');
    await expect(issuerInfo).toHaveValue('発行者株式会社\n大阪府大阪市4-5-6');
  });

  test('件名を入力できる', async ({ page }) => {
    const subject = page.locator('#subject');
    await subject.fill('テスト請求');
    await expect(subject).toHaveValue('テスト請求');
  });

  test('請求書番号を変更できる', async ({ page }) => {
    const invoiceNumber = page.locator('#invoiceNumber');
    await invoiceNumber.fill('INV-2024-001');
    await expect(invoiceNumber).toHaveValue('INV-2024-001');
  });
});

test.describe('明細操作', () => {
  test('明細を追加できる', async ({ page }) => {
    const addButton = page.getByRole('button', { name: '明細追加' });
    await addButton.click();

    await expect(page.locator('#item-1-description')).toBeVisible();
    await expect(page.locator('#item-1-quantity')).toBeVisible();
    await expect(page.locator('#item-1-unitPrice')).toBeVisible();
  });

  test('明細の品目・数量・単価を入力できる', async ({ page }) => {
    await page.locator('#item-0-description').fill('コンサルティング');
    await page.locator('#item-0-quantity').fill('2');
    await page.locator('#item-0-unitPrice').fill('50000');

    await expect(page.locator('#item-0-description')).toHaveValue('コンサルティング');
    await expect(page.locator('#item-0-quantity')).toHaveValue('2');
    await expect(page.locator('#item-0-unitPrice')).toHaveValue('50000');
  });

  test('税率を8%に変更できる', async ({ page }) => {
    await page.locator('#item-0-taxRate').selectOption('8');
    await expect(page.locator('#item-0-taxRate')).toHaveValue('8');
  });

  test('明細を削除できる', async ({ page }) => {
    // 明細を追加して2行にする
    await page.getByRole('button', { name: '明細追加' }).click();
    await expect(page.locator('#item-1-description')).toBeVisible();

    // 2行目を削除
    const deleteButtons = page.getByRole('button', { name: '削除' });
    await deleteButtons.last().click();

    await expect(page.locator('#item-1-description')).not.toBeVisible();
  });

  test('明細が1行のときは削除ボタンが表示されない', async ({ page }) => {
    await expect(page.getByRole('button', { name: '削除' })).not.toBeVisible();
  });
});

test.describe('一通りの請求書作成フロー', () => {
  test('全項目を入力して請求書を作成できる', async ({ page }) => {
    // 請求先情報
    await page.locator('#customerInfo').fill('テスト株式会社\n東京都渋谷区1-2-3\n営業部\n山田太郎');

    // 発行者情報
    await page.locator('#issuerInfo').fill('発行者株式会社\n大阪府大阪市4-5-6\n06-1234-5678\n佐藤花子');

    // 日付
    await page.locator('#issueDate').fill('2024-04-01');
    await page.locator('#dueDate').fill('2024-04-30');

    // 請求書番号
    await page.locator('#invoiceNumber').fill('INV-2024-001');

    // 件名
    await page.locator('#subject').fill('4月分コンサルティング費用');

    // 明細1行目
    await page.locator('#item-0-description').fill('コンサルティング');
    await page.locator('#item-0-quantity').fill('10');
    await page.locator('#item-0-unitPrice').fill('50000');
    await page.locator('#item-0-taxRate').selectOption('10');

    // 明細2行目を追加
    await page.getByRole('button', { name: '明細追加' }).click();
    await page.locator('#item-1-description').fill('交通費');
    await page.locator('#item-1-quantity').fill('5');
    await page.locator('#item-1-unitPrice').fill('1000');
    await page.locator('#item-1-taxRate').selectOption('10');

    // 振込先
    await page.locator('#paymentInfo').fill('三菱UFJ銀行\n渋谷支店\n普通 1234567');

    // 入力値が保持されていることを確認
    await expect(page.locator('#subject')).toHaveValue('4月分コンサルティング費用');
    await expect(page.locator('#item-0-description')).toHaveValue('コンサルティング');
    await expect(page.locator('#item-1-description')).toHaveValue('交通費');
  });
});

test.describe('ローカルストレージの永続化', () => {
  test('入力データがlocalStorageに保存される', async ({ page }) => {
    await page.locator('#subject').fill('永続化テスト');
    // react-hook-form の watch が反映されるのを少し待つ
    await page.waitForTimeout(500);

    const saved = await page.evaluate(() => localStorage.getItem('invoice_form_data'));
    expect(saved).toBeTruthy();
    const data = JSON.parse(saved!);
    expect(data.subject).toBe('永続化テスト');
  });

  test('リロード後にデータが復元される', async ({ page }) => {
    await page.locator('#subject').fill('リロードテスト');
    await page.locator('#customerInfo').fill('復元テスト株式会社');
    await page.waitForTimeout(500);

    await page.reload();

    await expect(page.locator('#subject')).toHaveValue('リロードテスト');
    await expect(page.locator('#customerInfo')).toHaveValue('復元テスト株式会社');
  });
});
