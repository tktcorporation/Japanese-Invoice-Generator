import React from 'react';
import { InvoiceData } from '../types';
import { calculateSubtotal, calculateTotals } from '../utils/calculations';

interface Props {
  data: InvoiceData;
}

const PAGE_STYLE: React.CSSProperties = {
  fontFamily: 'NotoSansJP, "Noto Sans JP", sans-serif',
  padding: '50px',
  fontSize: '10px',
  lineHeight: 1.4,
  color: '#000',
  backgroundColor: '#fff',
  width: '595px',
  minHeight: '842px',
  boxSizing: 'border-box',
};

export const InvoiceHTMLPreview: React.FC<Props> = ({ data }) => {
  const totals = calculateTotals(data.items);

  const itemsWithPadding = [...data.items];
  if (itemsWithPadding.length < 5) {
    const emptyRows = 5 - itemsWithPadding.length;
    for (let i = 0; i < emptyRows; i++) {
      itemsWithPadding.push({
        description: '',
        quantity: 0,
        unitPrice: 0,
        taxRate: 10,
        notes: '',
      });
    }
  }

  const customerFirstLine = data.customerInfo.split('\n')[0];
  const customerRest = data.customerInfo.split('\n').slice(1).join('\n');

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        display: 'flex',
        justifyContent: 'center',
        background: '#f3f4f6',
        padding: '16px',
      }}
    >
      <div
        style={{
          transformOrigin: 'top center',
          flexShrink: 0,
        }}
      >
        <div style={PAGE_STYLE}>
          {/* Header */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '22px', textAlign: 'center', marginBottom: '10px' }}>
              請求書
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '5px',
                fontSize: '10px',
              }}
            >
              <span>請求書番号: {data.invoiceNumber}</span>
              <span>発行日: {data.issueDate}</span>
            </div>
          </div>

          {/* Customer / Issuer info */}
          <div style={{ display: 'flex', marginBottom: '20px' }}>
            <div style={{ flex: 1, paddingRight: '10px' }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                  marginBottom: '5px',
                }}
              >
                {customerFirstLine}
              </div>
              <div style={{ fontSize: '10px', whiteSpace: 'pre-wrap' }}>{customerRest}</div>
            </div>
            <div style={{ flex: 1, paddingRight: '10px' }}>
              <div style={{ fontSize: '10px', whiteSpace: 'pre-wrap' }}>{data.issuerInfo}</div>
            </div>
          </div>

          {/* Subject */}
          {data.subject ? (
            <div style={{ fontWeight: 'bold', marginTop: '20px' }}>件名: {data.subject}</div>
          ) : null}

          {/* Total amount */}
          <div style={{ fontSize: '10px', marginTop: '5px' }}>
            下記のとおりご請求申し上げます。
          </div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              borderBottom: '1px solid #000',
              paddingBottom: '2px',
              marginTop: '10px',
              marginBottom: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              width: '70%',
            }}
          >
            <span>ご請求金額</span>
            <span>¥ {totals.total.toLocaleString()} -</span>
          </div>
          <div style={{ fontSize: '10px', marginBottom: '20px' }}>
            お支払い期限: {data.dueDate}
          </div>

          {/* Table */}
          <div style={{ marginBottom: '20px' }}>
            {/* Table header */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid #000',
                paddingBottom: '5px',
                marginBottom: '5px',
              }}
            >
              <div style={{ width: '35%' }}>品目</div>
              <div style={{ width: '15%', textAlign: 'right' }}>数量</div>
              <div style={{ width: '17%', textAlign: 'right' }}>単価</div>
              <div style={{ width: '15%', textAlign: 'right' }}>税率</div>
              <div style={{ width: '18%', textAlign: 'right' }}>小計</div>
            </div>

            {/* Table rows */}
            {itemsWithPadding.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  paddingTop: '6px',
                  paddingBottom: '6px',
                  borderBottom: '1px solid #eee',
                  minHeight: '25px',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ width: '35%' }}>
                  <div>{item.description}</div>
                  {item.notes ? (
                    <div style={{ fontSize: '8px', color: '#666' }}>{item.notes}</div>
                  ) : null}
                </div>
                <div style={{ width: '15%', textAlign: 'right' }}>
                  {Number(item.quantity) || ''}
                </div>
                <div style={{ width: '17%', textAlign: 'right' }}>
                  {Number(item.unitPrice)
                    ? `¥${Number(item.unitPrice).toLocaleString()}`
                    : ''}
                </div>
                <div style={{ width: '15%', textAlign: 'right' }}>
                  {Number(item.quantity) ? `${Number(item.taxRate)}%` : ''}
                </div>
                <div style={{ width: '18%', textAlign: 'right' }}>
                  {Number(item.quantity)
                    ? `¥${calculateSubtotal(item).toLocaleString()}`
                    : ''}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ marginTop: '20px' }}>
            {Object.entries(totals.subtotalsByTaxRate).map(([rate, subtotal]) => (
              <div
                key={rate}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '5px',
                  fontSize: '10px',
                }}
              >
                <span>小計:</span>
                <span>¥{subtotal.toLocaleString()}</span>
              </div>
            ))}
            {Object.entries(totals.taxesByRate).map(([rate, tax]) => (
              <div
                key={rate}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '5px',
                  fontSize: '10px',
                }}
              >
                <span>消費税（{rate}%）:</span>
                <span>¥{tax.toLocaleString()}</span>
              </div>
            ))}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 'bold',
              }}
            >
              <span>合計:</span>
              <span>¥{totals.total.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment info */}
          <div
            style={{
              marginTop: '50px',
              paddingTop: '10px',
              borderTop: '1px solid #000',
            }}
          >
            <div style={{ fontWeight: 'bold' }}>お振込先:</div>
            <div style={{ fontSize: '10px', whiteSpace: 'pre-wrap' }}>{data.paymentInfo}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
