import React, { useState, useCallback } from 'react';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoiceHTMLPreview } from './components/InvoiceHTMLPreview';
import { InvoiceData } from './types';

const DOWNLOAD_BTN_BASE =
  'inline-flex items-center justify-center border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50';

function App() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(InvoiceForm.getInitialData());
  const [downloading, setDownloading] = useState(false);

  const latestData = invoiceData;

  const handleDownload = useCallback(async () => {
    setDownloading(true);

    // iOS Safari ではユーザージェスチャーが async 後に失効し a.click() が効かないため、
    // ジェスチャーが有効な間に先にウィンドウを開いておく
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const pdfWindow = isIOS ? window.open('about:blank', '_blank') : null;

    try {
      // @react-pdf/renderer をダウンロード時のみ遅延ロード
      const [{ pdf }, { InvoicePDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./components/InvoicePDF'),
      ]);
      const blob = await pdf(<InvoicePDF data={latestData} />).toBlob();
      const url = URL.createObjectURL(blob);

      if (pdfWindow) {
        // iOS: 事前に開いたウィンドウにPDFを表示（共有ボタンから保存可能）
        pdfWindow.location.href = url;
      } else {
        // PC / Android: download 属性付きリンクでダウンロード
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${latestData.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      // ダウンロード / 表示開始までの猶予を持たせてからURLを解放
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      pdfWindow?.close();
      throw e;
    } finally {
      setDownloading(false);
    }
  }, [latestData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[2000px] mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col xl:flex-row xl:space-x-8">
          <div className="xl:flex-1">
            <InvoiceForm onSubmit={setInvoiceData} />
            {/* ダウンロードボタン（クリック時にPDF生成） */}
            <div className="mt-6">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className={`${DOWNLOAD_BTN_BASE} w-full px-4 py-3`}
              >
                {downloading ? '準備中...' : 'PDFをダウンロード'}
              </button>
            </div>
          </div>

          <div className="hidden xl:block xl:w-[800px] sticky top-8 self-start h-[calc(100vh-6rem)]">
            <div className="bg-white rounded-lg shadow-lg p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">プレビュー</h2>
              </div>
              <div className="flex-1 border rounded-lg overflow-hidden">
                <InvoiceHTMLPreview data={latestData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
