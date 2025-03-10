import React, { useState } from 'react';
import { format } from 'date-fns';
import { FileText, Plus, Trash2, Eye } from 'lucide-react';
import { InvoiceData, InvoiceItem } from '../types';
import { calculateSubtotal, calculateTotals } from '../utils/calculations';
import { InvoicePreview } from './InvoicePreview';

const initialItem: InvoiceItem = {
  description: '',
  quantity: 1,
  unitPrice: 0,
  taxRate: 10,
  notes: ''
};

const initialInvoiceData: InvoiceData = {
  invoiceNumber: format(new Date(), 'yyyyMMdd-001'),
  issueDate: format(new Date(), 'yyyy-MM-dd'),
  dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  issuerInfo: '',
  customerInfo: '',
  items: [{ ...initialItem }],
  paymentInfo: ''
};

interface Props {
  onSubmit: (data: InvoiceData) => void;
}

const InvoiceForm: React.FC<Props> & { getInitialData: () => InvoiceData } = ({ onSubmit }) => {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(initialInvoiceData);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(invoiceData);
  };

  const addItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { ...initialItem }]
    }));
  };

  const removeItem = (index: number) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item;
        
        if (field === 'unitPrice') {
          const numValue = value === '' ? 0 : Math.max(0, parseInt(value) || 0);
          return { ...item, [field]: numValue };
        }
        
        if (field === 'quantity') {
          const numValue = Math.max(1, parseInt(value) || 1);
          return { ...item, [field]: numValue };
        }
        
        return { ...item, [field]: value };
      })
    }));
  };

  const totals = calculateTotals(invoiceData.items);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" />
            請求書作成
          </h1>
          <button
            type="button"
            onClick={() => setShowMobilePreview(true)}
            className="xl:hidden inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Eye className="w-4 h-4 mr-1" />
            プレビュー
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">請求書番号</label>
            <input
              type="text"
              value={invoiceData.invoiceNumber}
              onChange={e => setInvoiceData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">発行日</label>
            <input
              type="date"
              value={invoiceData.issueDate}
              onChange={e => setInvoiceData(prev => ({ ...prev, issueDate: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">支払期限</label>
            <input
              type="date"
              value={invoiceData.dueDate}
              onChange={e => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">発行者情報</label>
            <textarea
              value={invoiceData.issuerInfo}
              onChange={e => setInvoiceData(prev => ({ ...prev, issuerInfo: e.target.value }))}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="会社名&#13;&#10;住所&#13;&#10;電話番号&#13;&#10;担当者名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">請求先情報</label>
            <textarea
              value={invoiceData.customerInfo}
              onChange={e => setInvoiceData(prev => ({ ...prev, customerInfo: e.target.value }))}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="会社名&#13;&#10;住所&#13;&#10;部署名&#13;&#10;担当者名"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">明細</h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="w-4 h-4 mr-1" />
              明細追加
            </button>
          </div>

          {invoiceData.items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">品目</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={e => updateItem(index, 'description', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">数量</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => updateItem(index, 'quantity', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">単価</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={item.unitPrice}
                    onChange={e => updateItem(index, 'unitPrice', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">税率</label>
                  <select
                    value={item.taxRate}
                    onChange={e => updateItem(index, 'taxRate', parseInt(e.target.value) as 8 | 10)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value={10}>10%</option>
                    <option value={8}>8%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">小計</label>
                  <input
                    type="text"
                    value={`¥${calculateSubtotal(item).toLocaleString()}`}
                    readOnly
                    className="mt-1 block w-full rounded-md bg-gray-50 border-gray-300 shadow-sm sm:text-sm"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">備考</label>
                  <input
                    type="text"
                    value={item.notes || ''}
                    onChange={e => updateItem(index, 'notes', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              {invoiceData.items.length > 1 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    削除
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">支払い情報</label>
            <textarea
              value={invoiceData.paymentInfo}
              onChange={e => setInvoiceData(prev => ({ ...prev, paymentInfo: e.target.value }))}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="振込先口座情報など"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <dl className="space-y-2">
            {Object.entries(totals.subtotalsByTaxRate).map(([rate, subtotal]) => (
              <div key={rate} className="flex justify-between text-sm">
                <dt>小計（{rate}%対象）</dt>
                <dd>¥{subtotal.toLocaleString()}</dd>
              </div>
            ))}
            {Object.entries(totals.taxesByRate).map(([rate, tax]) => (
              <div key={rate} className="flex justify-between text-sm">
                <dt>消費税（{rate}%）</dt>
                <dd>¥{tax.toLocaleString()}</dd>
              </div>
            ))}
            <div className="flex justify-between font-medium text-lg pt-2 border-t">
              <dt>合計金額（税込）</dt>
              <dd>¥{totals.total.toLocaleString()}</dd>
            </div>
          </dl>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            PDFを生成
          </button>
        </div>
      </form>

      {showMobilePreview && (
        <InvoicePreview
          data={invoiceData}
          onClose={() => setShowMobilePreview(false)}
        />
      )}
    </>
  );
};

InvoiceForm.getInitialData = () => initialInvoiceData;

export { InvoiceForm };