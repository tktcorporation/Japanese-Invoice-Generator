import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { InvoiceData } from '../types';
import { calculateSubtotal, calculateTotals } from '../utils/calculations';

// Register Japanese font
Font.register({
  family: 'NotoSansJP',
  src: 'https://fonts.gstatic.com/ea/notosansjp/v5/NotoSansJP-Regular.otf'
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansJP',
    padding: 40,
    fontSize: 9,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  section: {
    marginBottom: 10,
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  infoColumn: {
    flex: 1,
    paddingRight: 10,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 25,
  },
  col1: { width: '40%' },
  col2: { width: '15%', textAlign: 'right' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right' },
  totals: {
    marginTop: 20,
  },
  bold: {
    fontWeight: 'bold',
  },
  small: {
    fontSize: 8,
  },
});

interface Props {
  data: InvoiceData;
}

const InvoicePDFContent: React.FC<Props> = ({ data }) => {
  const totals = calculateTotals(data.items);

  // A4サイズの比率を維持する（幅:高さ = 1:√2 ≈ 1:1.414）
  const aspectRatio = 1.414;
  
  // 品目が少ない場合に空の行を追加
  const itemsWithPadding = [...data.items];
  if (itemsWithPadding.length < 5) {
    const emptyRows = 5 - itemsWithPadding.length;
    for (let i = 0; i < emptyRows; i++) {
      itemsWithPadding.push({
        description: '',
        quantity: 0,
        unitPrice: 0,
        taxRate: 10,
        notes: ''
      });
    }
  }

  return (
    <div className="w-full" style={{ aspectRatio: `1/${aspectRatio}` }}>
      <div className="h-full overflow-auto p-10 space-y-6 bg-white text-sm">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-4">請求書</h1>
          <div className="flex justify-between text-xs">
            <p>請求書番号: {data.invoiceNumber}</p>
            <p>発行日: {data.issueDate}</p>
          </div>
          <p className="text-xs text-right">支払期限: {data.dueDate}</p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="text-sm font-semibold mb-1">請求元:</h3>
            <div className="whitespace-pre-line break-words text-xs">{data.issuerInfo}</div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-1">請求先:</h3>
            <div className="whitespace-pre-line break-words text-xs">{data.customerInfo}</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 pr-2 w-[40%]">品目</th>
                  <th className="text-right py-2 px-2">数量</th>
                  <th className="text-right py-2 px-2">単価</th>
                  <th className="text-right py-2 px-2">税率</th>
                  <th className="text-right py-2 pl-2">小計</th>
                </tr>
              </thead>
              <tbody>
                {itemsWithPadding.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-2 pr-2 break-words">
                      <div className="min-h-[1.5rem]">{item.description}</div>
                      {item.notes && (
                        <div className="text-xs text-gray-500">{item.notes}</div>
                      )}
                    </td>
                    <td className="text-right py-2 px-2">{item.quantity || ''}</td>
                    <td className="text-right py-2 px-2">{item.unitPrice ? `¥${item.unitPrice.toLocaleString()}` : ''}</td>
                    <td className="text-right py-2 px-2">{item.quantity ? `${item.taxRate}%` : ''}</td>
                    <td className="text-right py-2 pl-2">{item.quantity ? `¥${calculateSubtotal(item).toLocaleString()}` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-4 space-y-2 mt-auto text-xs">
          {Object.entries(totals.subtotalsByTaxRate).map(([rate, subtotal]) => (
            <div key={rate} className="flex justify-between">
              <span>小計（{rate}%対象）:</span>
              <span>¥{subtotal.toLocaleString()}</span>
            </div>
          ))}
          {Object.entries(totals.taxesByRate).map(([rate, tax]) => (
            <div key={rate} className="flex justify-between">
              <span>消費税（{rate}%）:</span>
              <span>¥{tax.toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-sm pt-2 border-t border-gray-800">
            <span>合計金額（税込）:</span>
            <span>¥{totals.total.toLocaleString()}</span>
          </div>
        </div>

        {data.paymentInfo && (
          <div className="mt-8 pt-4 border-t border-gray-800">
            <h3 className="text-sm font-semibold mb-2">お支払い情報</h3>
            <div className="whitespace-pre-line break-words text-xs">{data.paymentInfo}</div>
          </div>
        )}
      </div>
    </div>
  );
};

const InvoicePDF: React.FC<Props> & { Preview: typeof InvoicePDFContent } = ({ data }) => {
  const totals = calculateTotals(data.items);
  
  // 品目が少ない場合に空の行を追加
  const itemsWithPadding = [...data.items];
  if (itemsWithPadding.length < 5) {
    const emptyRows = 5 - itemsWithPadding.length;
    for (let i = 0; i < emptyRows; i++) {
      itemsWithPadding.push({
        description: '',
        quantity: 0,
        unitPrice: 0,
        taxRate: 10,
        notes: ''
      });
    }
  }
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>請求書</Text>
          <View style={styles.row}>
            <Text style={styles.small}>請求書番号: {data.invoiceNumber}</Text>
            <Text style={styles.small}>発行日: {data.issueDate}</Text>
          </View>
          <Text style={styles.small}>支払期限: {data.dueDate}</Text>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoColumn}>
            <Text style={styles.bold}>請求元:</Text>
            <Text style={styles.small}>{data.issuerInfo}</Text>
          </View>

          <View style={styles.infoColumn}>
            <Text style={styles.bold}>請求先:</Text>
            <Text style={styles.small}>{data.customerInfo}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>品目</Text>
            <Text style={styles.col2}>数量</Text>
            <Text style={styles.col3}>単価</Text>
            <Text style={styles.col4}>税率</Text>
            <Text style={styles.col5}>小計</Text>
          </View>

          {itemsWithPadding.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>{item.description}</Text>
              <Text style={styles.col2}>{item.quantity || ''}</Text>
              <Text style={styles.col3}>{item.unitPrice ? `¥${item.unitPrice.toLocaleString()}` : ''}</Text>
              <Text style={styles.col4}>{item.quantity ? `${item.taxRate}%` : ''}</Text>
              <Text style={styles.col5}>{item.quantity ? `¥${calculateSubtotal(item).toLocaleString()}` : ''}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          {Object.entries(totals.subtotalsByTaxRate).map(([rate, subtotal]) => (
            <View key={rate} style={styles.row}>
              <Text style={styles.small}>小計（{rate}%対象）:</Text>
              <Text style={styles.small}>¥{subtotal.toLocaleString()}</Text>
            </View>
          ))}
          {Object.entries(totals.taxesByRate).map(([rate, tax]) => (
            <View key={rate} style={styles.row}>
              <Text style={styles.small}>消費税（{rate}%）:</Text>
              <Text style={styles.small}>¥{tax.toLocaleString()}</Text>
            </View>
          ))}
          <View style={[styles.row, styles.bold]}>
            <Text>合計金額（税込）:</Text>
            <Text>¥{totals.total.toLocaleString()}</Text>
          </View>
        </View>

        {data.paymentInfo && (
          <View style={{ marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#000' }}>
            <Text style={styles.bold}>お支払い情報:</Text>
            <Text style={styles.small}>{data.paymentInfo}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};

InvoicePDF.Preview = InvoicePDFContent;

export { InvoicePDF };