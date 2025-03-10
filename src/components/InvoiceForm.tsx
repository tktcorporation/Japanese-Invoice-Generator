import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FileText, Plus, Trash2, Eye } from 'lucide-react';
import { InvoiceData, InvoiceItem } from '../types';
import { calculateSubtotal, calculateTotals } from '../utils/calculations';
import { InvoicePreview } from './InvoicePreview';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';

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

  useEffect(() => {
    onSubmit(invoiceData);
  }, [invoiceData, onSubmit]);

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
      <div className="space-y-8 bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" />
            請求書作成
          </h1>
          <button
            type="button"
            onClick={() => setShowMobilePreview(true)}
            className="xl:hidden inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Eye className="w-4 h-4 mr-2" />
            プレビュー
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">請求書番号</Label>
              <Input
                id="invoiceNumber"
                type="text"
                value={invoiceData.invoiceNumber}
                onChange={e => setInvoiceData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueDate">発行日</Label>
              <Input
                id="issueDate"
                type="date"
                value={invoiceData.issueDate}
                onChange={e => setInvoiceData(prev => ({ ...prev, issueDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">支払期限</Label>
              <Input
                id="dueDate"
                type="date"
                value={invoiceData.dueDate}
                onChange={e => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="issuerInfo">発行者情報</Label>
              <Textarea
                id="issuerInfo"
                value={invoiceData.issuerInfo}
                onChange={e => setInvoiceData(prev => ({ ...prev, issuerInfo: e.target.value }))}
                rows={4}
                placeholder="会社名&#13;&#10;住所&#13;&#10;電話番号&#13;&#10;担当者名"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerInfo">請求先情報</Label>
              <Textarea
                id="customerInfo"
                value={invoiceData.customerInfo}
                onChange={e => setInvoiceData(prev => ({ ...prev, customerInfo: e.target.value }))}
                rows={4}
                placeholder="会社名&#13;&#10;住所&#13;&#10;部署名&#13;&#10;担当者名"
              />
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">明細</h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              明細追加
            </button>
          </div>

          {invoiceData.items.map((item, index) => (
            <div key={index} className="border rounded-lg p-6 space-y-6 bg-gray-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <Label htmlFor={`item-${index}-description`}>品目</Label>
                  <Input
                    id={`item-${index}-description`}
                    type="text"
                    value={item.description}
                    onChange={e => updateItem(index, 'description', e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`item-${index}-quantity`}>数量</Label>
                  <Input
                    id={`item-${index}-quantity`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => updateItem(index, 'quantity', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`item-${index}-unitPrice`}>単価</Label>
                  <Input
                    id={`item-${index}-unitPrice`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={item.unitPrice}
                    onChange={e => updateItem(index, 'unitPrice', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`item-${index}-taxRate`}>税率</Label>
                  <select
                    id={`item-${index}-taxRate`}
                    value={item.taxRate}
                    onChange={e => updateItem(index, 'taxRate', parseInt(e.target.value) as 8 | 10)}
                    className="mt-2 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value={10}>10%</option>
                    <option value={8}>8%</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`item-${index}-subtotal`}>小計</Label>
                  <Input
                    id={`item-${index}-subtotal`}
                    type="text"
                    value={`¥${calculateSubtotal(item).toLocaleString()}`}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor={`item-${index}-notes`}>備考</Label>
                  <Input
                    id={`item-${index}-notes`}
                    type="text"
                    value={item.notes || ''}
                    onChange={e => updateItem(index, 'notes', e.target.value)}
                  />
                </div>
              </div>

              {invoiceData.items.length > 1 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-destructive bg-destructive/10 hover:bg-destructive/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    削除
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="paymentInfo">支払い情報</Label>
            <Textarea
              id="paymentInfo"
              value={invoiceData.paymentInfo}
              onChange={e => setInvoiceData(prev => ({ ...prev, paymentInfo: e.target.value }))}
              rows={3}
              placeholder="振込先口座情報など"
            />
          </div>
        </div>

        <Separator className="my-8" />

        <div className="space-y-4">
          <dl className="space-y-4">
            {Object.entries(totals.subtotalsByTaxRate).map(([rate, subtotal]) => (
              <div key={rate} className="flex justify-between text-sm">
                <dt className="text-muted-foreground">小計（{rate}%対象）</dt>
                <dd className="font-medium">¥{subtotal.toLocaleString()}</dd>
              </div>
            ))}
            {Object.entries(totals.taxesByRate).map(([rate, tax]) => (
              <div key={rate} className="flex justify-between text-sm">
                <dt className="text-muted-foreground">消費税（{rate}%）</dt>
                <dd className="font-medium">¥{tax.toLocaleString()}</dd>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between text-lg font-medium">
              <dt>合計金額（税込）</dt>
              <dd>¥{totals.total.toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      </div>

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