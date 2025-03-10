import React from 'react';
import { X } from 'lucide-react';
import { InvoiceData } from '../types';
import { calculateSubtotal, calculateTotals } from '../utils/calculations';

interface Props {
  data: InvoiceData;
  onClose: () => void;
}

export const InvoicePreview: React.FC<Props> = ({ data, onClose }) => {
  const totals = calculateTotals(data.items);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">プレビュー</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">請求書</h1>
            <div className="flex justify-between text-sm">
              <p>請求書番号: {data.invoiceNumber}</p>
              <p>発行日: {data.issueDate}</p>
            </div>
            <p className="text-sm text-right">支払期限: {data.dueDate}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">請求元</h3>
              <div className="whitespace-pre-line">{data.issuerInfo}</div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">請求先</h3>
              <div className="whitespace-pre-line">{data.customerInfo}</div>
            </div>
          </div>

          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2">品目</th>
                <th className="text-right py-2">数量</th>
                <th className="text-right py-2">単価</th>
                <th className="text-right py-2">税率</th>
                <th className="text-right py-2">小計</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-2">
                    <div>{item.description}</div>
                    {item.notes && (
                      <div className="text-sm text-gray-500">{item.notes}</div>
                    )}
                  </td>
                  <td className="text-right py-2">{item.quantity}</td>
                  <td className="text-right py-2">¥{item.unitPrice.toLocaleString()}</td>
                  <td className="text-right py-2">{item.taxRate}%</td>
                  <td className="text-right py-2">¥{calculateSubtotal(item).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t pt-4 space-y-2">
            {Object.entries(totals.subtotalsByTaxRate).map(([rate, subtotal]) => (
              <div key={rate} className="flex justify-between">
                <span>小計（{rate}%対象）</span>
                <span>¥{subtotal.toLocaleString()}</span>
              </div>
            ))}
            {Object.entries(totals.taxesByRate).map(([rate, tax]) => (
              <div key={rate} className="flex justify-between">
                <span>消費税（{rate}%）</span>
                <span>¥{tax.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>合計金額（税込）</span>
              <span>¥{totals.total.toLocaleString()}</span>
            </div>
          </div>

          {data.paymentInfo && (
            <div className="mt-8 pt-4 border-t">
              <h3 className="text-lg font-semibold mb-2">お支払い情報</h3>
              <div className="whitespace-pre-line">{data.paymentInfo}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};