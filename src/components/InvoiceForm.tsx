import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FileText, Plus, Trash2, Eye, X } from 'lucide-react';
import { InvoiceData, InvoiceItem } from '../types';
import { calculateSubtotal, calculateTotals } from '../utils/calculations';
import { InvoicePDF } from './InvoicePDF';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { useForm, useFieldArray } from 'react-hook-form';

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
  subject: '',
  items: [{ ...initialItem }],
  paymentInfo: ''
};

// ローカルストレージのキー
const STORAGE_KEY = 'invoice_form_data';

// ローカルストレージから保存されたデータを取得
const getSavedData = (): InvoiceData | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Error loading saved data:', error);
    return null;
  }
};

interface InvoiceFormProps {
  onSubmit: (data: InvoiceData) => void;
  defaultValues?: InvoiceData;
}

interface InvoiceFormComponent extends React.FC<InvoiceFormProps> {
  getInitialData: () => InvoiceData;
}

const InvoiceFormBase: React.FC<InvoiceFormProps> = ({ onSubmit, defaultValues }) => {
  const { register, control, watch, formState: { errors } } = useForm<InvoiceData>({
    defaultValues: defaultValues || initialInvoiceData
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const [showMobilePreview, setShowMobilePreview] = useState(false);
  
  // フォームの値をリアルタイムで監視
  const formData = watch();
  
  // 値が変更されたらコールバックを呼び出す
  useEffect(() => {
    onSubmit(formData);
  }, [formData, onSubmit]);

  const totals = calculateTotals(fields);

  return (
    <>
      <form className="space-y-8">
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
                  {...register('invoiceNumber')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issueDate">発行日</Label>
                <Input
                  id="issueDate"
                  type="date"
                  {...register('issueDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">支払期限</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...register('dueDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="flex items-center gap-1">
                  件名
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  type="text"
                  {...register('subject', { required: '件名は必須項目です' })}
                  placeholder="件名を入力してください"
                  className={errors.subject ? 'border-red-500' : ''}
                />
                {errors.subject && (
                  <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="issuerInfo">発行者情報</Label>
                <Textarea
                  id="issuerInfo"
                  {...register('issuerInfo')}
                  rows={4}
                  placeholder="会社名&#13;&#10;住所&#13;&#10;電話番号&#13;&#10;担当者名"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerInfo">請求先情報</Label>
                <Textarea
                  id="customerInfo"
                  {...register('customerInfo')}
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
                onClick={() => append({ description: '', quantity: 0, unitPrice: 0, taxRate: 10, notes: '' })}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                明細追加
              </button>
            </div>

            {fields.map((field: InvoiceItem & { id: string }, index: number) => (
              <div key={field.id} className="border rounded-lg p-6 space-y-6 bg-gray-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <Label htmlFor={`item-${index}-description`}>品目</Label>
                    <Input
                      id={`item-${index}-description`}
                      type="text"
                      {...register(`items.${index}.description`)}
                      className="mt-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`item-${index}-quantity`}>数量</Label>
                    <Input
                      id={`item-${index}-quantity`}
                      type="number"
                      min="1"
                      {...register(`items.${index}.quantity`)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`item-${index}-unitPrice`}>単価</Label>
                    <Input
                      id={`item-${index}-unitPrice`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      {...register(`items.${index}.unitPrice`)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`item-${index}-taxRate`}>税率</Label>
                    <select
                      id={`item-${index}-taxRate`}
                      {...register(`items.${index}.taxRate`)}
                      className="mt-2 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value={10}>10%</option>
                      <option value={8}>8%</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`item-${index}-subtotal`}>小計</Label>
                    <div className="mt-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-right text-gray-700">
                      ¥{calculateSubtotal(field).toLocaleString()}
                    </div>
                  </div>
                </div>
                {fields.length > 1 && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => remove(index)}
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
              <Label htmlFor="paymentInfo">お振込先</Label>
              <Textarea
                id="paymentInfo"
                {...register('paymentInfo')}
                rows={3}
                placeholder="銀行名：&#13;&#10;支店名：&#13;&#10;口座番号："
              />
            </div>
          </div>
        </div>
      </form>

      {/* モバイルプレビュー用のモーダル */}
      {showMobilePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">プレビュー</h2>
              <button
                onClick={() => setShowMobilePreview(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <InvoicePDF.Preview data={formData} className="w-full h-full" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const InvoiceForm = InvoiceFormBase as InvoiceFormComponent;
InvoiceForm.getInitialData = () => initialInvoiceData;