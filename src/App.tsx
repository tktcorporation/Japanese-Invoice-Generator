import React, { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePDF } from './components/InvoicePDF';
import { InvoiceData } from './types';

function App() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[2000px] mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col xl:flex-row xl:space-x-8">
          <div className="xl:flex-1">
            <InvoiceForm onSubmit={setInvoiceData} />
          </div>
          
          <div className="hidden xl:block xl:w-[800px] sticky top-8 self-start">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-xl font-bold mb-6">プレビュー</h2>
              <div className="border rounded-lg">
                <InvoicePDF.Preview data={invoiceData || InvoiceForm.getInitialData()} />
              </div>
            </div>
          </div>
        </div>

        {invoiceData && (
          <div className="fixed bottom-8 right-8">
            <PDFDownloadLink
              document={<InvoicePDF data={invoiceData} />}
              fileName={`invoice-${invoiceData.invoiceNumber}.pdf`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {({ loading }) => (loading ? '準備中...' : 'PDFをダウンロード')}
            </PDFDownloadLink>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;