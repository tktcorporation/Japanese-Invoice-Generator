import React, { useState, useEffect, useRef } from 'react';
import { usePDF, PDFDownloadLink } from '@react-pdf/renderer';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePDF } from './components/InvoicePDF';
import { InvoiceData } from './types';

const DEBOUNCE_MS = 500;

const DOWNLOAD_BTN_BASE =
  'inline-flex items-center justify-center border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50';

function PdfPreview({ url, loading }: { url: string | null; loading: boolean }) {
  return (
    <div className="flex-1 border rounded-lg overflow-hidden relative">
      {loading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
          <p className="text-gray-500 text-sm">プレビュー更新中...</p>
        </div>
      )}
      {url ? (
        <iframe
          src={url}
          title="請求書プレビュー"
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400 text-sm">プレビューを生成中...</p>
        </div>
      )}
    </div>
  );
}

function App() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [debouncedData, setDebouncedData] = useState<InvoiceData>(InvoiceForm.getInitialData());
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const latestData = invoiceData || InvoiceForm.getInitialData();

  useEffect(() => {
    if (!invoiceData) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedData(invoiceData);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [invoiceData]);

  // プレビュー用 PDF（デバウンスされたデータ）
  const [previewInstance, updatePreview] = usePDF({
    document: <InvoicePDF data={debouncedData} />,
  });

  useEffect(() => {
    updatePreview(<InvoicePDF data={debouncedData} />);
  }, [debouncedData, updatePreview]);

  // ダウンロード: 単一の PDFDownloadLink（常に最新データ）
  const pdfDocument = <InvoicePDF data={latestData} />;
  const pdfFileName = `invoice-${latestData.invoiceNumber}.pdf`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[2000px] mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col xl:flex-row xl:space-x-8">
          <div className="xl:flex-1">
            <InvoiceForm
              onSubmit={setInvoiceData}
              previewUrl={previewInstance.url}
              previewLoading={previewInstance.loading}
            />
            {/* ダウンロードボタン（単一の PDFDownloadLink を1箇所のみマウント） */}
            <div className="mt-6">
              <PDFDownloadLink document={pdfDocument} fileName={pdfFileName}>
                {/* @ts-ignore */}
                {({ loading }) => (
                  <button
                    disabled={loading}
                    className={`${DOWNLOAD_BTN_BASE} w-full px-4 py-3`}
                  >
                    {loading ? '準備中...' : 'PDFをダウンロード'}
                  </button>
                )}
              </PDFDownloadLink>
            </div>
          </div>

          <div className="hidden xl:block xl:w-[800px] sticky top-8 self-start h-[calc(100vh-6rem)]">
            <div className="bg-white rounded-lg shadow-lg p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">プレビュー</h2>
              </div>
              <PdfPreview url={previewInstance.url} loading={previewInstance.loading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
