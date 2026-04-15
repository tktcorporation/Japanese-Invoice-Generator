import { test, expect } from '@playwright/test';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>;

/**
 * フォームに最低限のデータを入力するヘルパー
 */
async function fillMinimalForm(page: import('@playwright/test').Page) {
  await page.locator('#subject').fill('ダウンロードテスト');
  await page.locator('#item-0-description').fill('テスト品目');
  await page.locator('#item-0-quantity').fill('1');
  await page.locator('#item-0-unitPrice').fill('1000');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

// ---------------------------------------------------------------------------
// PC（Desktop Chrome）: download 属性付き <a> 経由でダウンロードされる
// ---------------------------------------------------------------------------
test.describe('PC: ダウンロード動作', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('window.open が呼ばれず download イベントで PDF を取得できる', async ({ page, context }) => {
    await fillMinimalForm(page);

    // window.open の呼び出しを記録
    await page.evaluate(() => {
      (window as any).__openCalls = [];
      const orig = window.open;
      window.open = function (...args: any[]) {
        (window as any).__openCalls.push(args);
        return orig.apply(this, args);
      };
    });

    const downloadButton = page.getByRole('button', { name: 'PDFをダウンロード' });
    await downloadButton.scrollIntoViewIfNeeded();

    // popup が開かないことも確認
    let popupOpened = false;
    context.on('page', () => { popupOpened = true; });

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 60000 }),
      downloadButton.click(),
    ]);

    // download イベントでファイルを取得
    expect(download.suggestedFilename()).toMatch(/^invoice-.*\.pdf$/);

    // 実際に有効な PDF であることを確認
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    const buffer = fs.readFileSync(filePath!);
    const pdf = await pdfParse(buffer);
    expect(pdf.text).toContain('テスト品目');

    // window.open は呼ばれていないこと
    const openCalls = await page.evaluate(() => (window as any).__openCalls);
    expect(openCalls).toHaveLength(0);
    expect(popupOpened).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// iOS Safari エミュレーション: window.open で新タブにPDFが表示される
// ---------------------------------------------------------------------------
test.describe('iOS: ダウンロード動作', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });

  test('window.open が呼ばれ blob URL が渡される', async ({ page, context }) => {
    await fillMinimalForm(page);

    // window.open をラップして blob URL の受け渡しをキャプチャ
    // Chromium では blob URL への location.href 代入がダウンロードをトリガーし
    // popup.url() が更新されないため、ラッパー経由で検証する
    await page.evaluate(() => {
      (window as any).__iOSDownload = { windowOpened: false, blobUrl: null };
      const origOpen = window.open.bind(window);
      window.open = function (...args: any[]) {
        (window as any).__iOSDownload.windowOpened = true;
        const realWin = origOpen(...args);
        if (!realWin) return realWin;
        // location.href 代入をキャプチャするラッパーを返す
        return {
          get location() {
            return {
              get href() { return realWin.location.href; },
              set href(val: string) {
                (window as any).__iOSDownload.blobUrl = val;
                realWin.location.href = val;
              },
            };
          },
          set location(val: any) {
            (window as any).__iOSDownload.blobUrl = typeof val === 'string' ? val : val?.href;
            realWin.location = val;
          },
          close() { realWin.close(); },
        };
      };
    });

    const downloadButton = page.getByRole('button', { name: 'PDFをダウンロード' });
    await downloadButton.scrollIntoViewIfNeeded();

    // popup を待ち受けてクリック
    const [popup] = await Promise.all([
      context.waitForEvent('page', { timeout: 60000 }),
      downloadButton.click(),
    ]);

    // 新しいタブが開かれたこと
    expect(popup).toBeTruthy();

    // PDF 生成が完了するまで待機（ボタンが元に戻る）
    await expect(page.getByRole('button', { name: 'PDFをダウンロード' }))
      .toBeEnabled({ timeout: 60000 });

    // window.open が呼ばれ、blob URL が渡されたことを確認
    const data = await page.evaluate(() => (window as any).__iOSDownload);
    expect(data.windowOpened).toBe(true);
    expect(data.blobUrl).toMatch(/^blob:/);
  });

  test('非 iOS 環境では window.open が呼ばれない（UA 判定の検証）', async ({ page }) => {
    // このテストは iOS UA が設定されているスコープ内だが、
    // navigator.userAgent を上書きして非 iOS をシミュレート
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        configurable: true,
      });
    });
    await fillMinimalForm(page);

    await page.evaluate(() => {
      (window as any).__openCalls = [];
      const orig = window.open.bind(window);
      window.open = function (...args: any[]) {
        (window as any).__openCalls.push(args);
        return orig.apply(this, args);
      };
    });

    const downloadButton = page.getByRole('button', { name: 'PDFをダウンロード' });
    await downloadButton.scrollIntoViewIfNeeded();

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 60000 }),
      downloadButton.click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^invoice-.*\.pdf$/);

    // window.open は呼ばれていないこと
    const openCalls = await page.evaluate(() => (window as any).__openCalls);
    expect(openCalls).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// ボタン状態: ダウンロード中の UI フィードバック
// ---------------------------------------------------------------------------
test.describe('ダウンロードボタンの状態管理', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('ダウンロード中にボタンテキストが「準備中...」に変わり disabled になる', async ({ page }) => {
    await fillMinimalForm(page);

    const downloadButton = page.getByRole('button', { name: 'PDFをダウンロード' });
    await downloadButton.scrollIntoViewIfNeeded();

    // クリック前: 有効で「PDFをダウンロード」
    await expect(downloadButton).toBeEnabled();
    await expect(downloadButton).toHaveText('PDFをダウンロード');

    // クリック → ダウンロード完了を並行で待つ
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
    await downloadButton.click();

    // クリック直後: 「準備中...」 に変わること
    const preparingButton = page.getByRole('button', { name: '準備中...' });
    await expect(preparingButton).toBeVisible({ timeout: 5000 });
    await expect(preparingButton).toBeDisabled();

    // ダウンロード完了を待つ
    await downloadPromise;

    // 完了後: 「PDFをダウンロード」に戻り有効になること
    await expect(downloadButton).toBeEnabled({ timeout: 10000 });
    await expect(downloadButton).toHaveText('PDFをダウンロード');
  });
});

// ---------------------------------------------------------------------------
// blob URL の寿命: ダウンロード直後に URL が無効化されない
// ---------------------------------------------------------------------------
test.describe('blob URL のライフサイクル', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('ダウンロード完了後もしばらく blob URL が有効である', async ({ page }) => {
    await fillMinimalForm(page);

    // revokeObjectURL の呼び出しを記録
    await page.evaluate(() => {
      (window as any).__revokeCalls = [] as { url: string; time: number }[];
      const orig = URL.revokeObjectURL.bind(URL);
      URL.revokeObjectURL = (url: string) => {
        (window as any).__revokeCalls.push({ url, time: Date.now() });
        orig(url);
      };
    });

    const downloadButton = page.getByRole('button', { name: 'PDFをダウンロード' });
    await downloadButton.scrollIntoViewIfNeeded();

    const clickTime = Date.now();

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 60000 }),
      downloadButton.click(),
    ]);

    // ダウンロードが完了したこと
    expect(download.suggestedFilename()).toMatch(/^invoice-.*\.pdf$/);

    // ダウンロード完了直後: revokeObjectURL がまだ呼ばれていないこと
    const revokeCalls = await page.evaluate(() => (window as any).__revokeCalls);
    expect(revokeCalls).toHaveLength(0);
  });
});
