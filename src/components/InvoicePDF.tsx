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
    fontSize: 10,
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
    marginBottom: 20,
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
    paddingVertical: 3,
  },
  col1: { width: '40%' },
  col2: { width: '15%', textAlign: 'right' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right' },
  totals: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 5,
  },
  bold: {
    fontWeight: 'bold',
  },
});

interface Props {
  data: InvoiceData;
}

const InvoicePDFContent: React.FC<Props> = ({ data }) => {
  const totals = calculateTotals(data.items);

  return (
    <div className="p-6 space-y-6 min-w-[800px]">
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
  );
};

const InvoicePDF: React.FC<Props> & { Preview: typeof InvoicePDFContent } = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>請求書</Text>
          <View style={styles.row}>
            <Text>請求書番号: {data.invoiceNumber}</Text>
            <Text>発行日: {data.issueDate}</Text>
          </View>
          <Text>支払期限: {data.dueDate}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.bold}>請求元:</Text>
          <Text>{data.issuerInfo}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.bold}>請求先:</Text>
          <Text>{data.customerInfo}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>品目</Text>
            <Text style={styles.col2}>数量</Text>
            <Text style={styles.col3}>単価</Text>
            <Text style={styles.col4}>税率</Text>
            <Text style={styles.col5}>小計</Text>
          </View>

          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>{item.description}</Text>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>¥{item.unitPrice.toLocaleString()}</Text>
              <Text style={styles.col4}>{item.taxRate}%</Text>
              <Text style={styles.col5}>¥{calculateSubtotal(item).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          {Object.entries(totals.subtotalsByTaxRate).map(([rate, subtotal]) => (
            <View key={rate} style={styles.row}>
              <Text>小計（{rate}%対象）:</Text>
              <Text>¥{subtotal.toLocaleString()}</Text>
            </View>
          ))}
          {Object.entries(totals.taxesByRate).map(([rate, tax]) => (
            <View key={rate} style={styles.row}>
              <Text>消費税（{rate}%）:</Text>
              <Text>¥{tax.toLocaleString()}</Text>
            </View>
          ))}
          <View style={[styles.row, styles.bold]}>
            <Text>合計金額（税込）:</Text>
            <Text>¥{totals.total.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.bold}>お支払い情報:</Text>
          <Text>{data.paymentInfo}</Text>
        </View>
      </Page>
    </Document>
  );
};

InvoicePDF.Preview = InvoicePDFContent;

export { InvoicePDF };