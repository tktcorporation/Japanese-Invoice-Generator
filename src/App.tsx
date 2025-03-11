import React, { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePDF } from './components/InvoicePDF';
import { InvoiceData } from './types';

function App() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const currentData = invoiceData || InvoiceForm.getInitialData();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[2000px] mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col xl:flex-row xl:space-x-8">
          <div className="xl:flex-1">
            <InvoiceForm onSubmit={setInvoiceData} />
          </div>
          
          <div className="hidden xl:block xl:w-[800px] sticky top-8 self-start h-[calc(100vh-6rem)]">
            <div className="bg-white rounded-lg shadow-lg p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">プレビュー</h2>
                <PDFDownloadLink
                  document={<InvoicePDF data={currentData} />}
                  fileName={`invoice-${currentData.invoiceNumber}.pdf`}
                >
                  {/* @ts-ignore */}
                  {({ loading }) => (
                    <button
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {loading ? '準備中...' : 'PDFをダウンロード'}
                    </button>
                  )}
                </PDFDownloadLink>
              </div>
              <div className="flex-1 border rounded-lg overflow-hidden">
                <InvoicePDF.Preview data={currentData} className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
