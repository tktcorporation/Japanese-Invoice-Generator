import React from 'react';
import { Text, View, StyleSheet, Font } from '@react-pdf/renderer';
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
  notes: {
    fontSize: 7,
    color: '#666',
  },
  customerFirstLine: {
    fontSize: 14,
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginBottom: 5,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 5,
  },
  totalAmountLabel: {
    fontSize: 12,
  },
  dueDate: {
    fontSize: 10,
    marginBottom: 20,
  },
});

interface Props {
  data: InvoiceData;
}

export const InvoiceContent: React.FC<Props> = ({ data }) => {
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
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>請求書</Text>
        <View style={styles.row}>
          <Text style={styles.small}>請求書番号: {data.invoiceNumber}</Text>
          <Text style={styles.small}>発行日: {data.issueDate}</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoColumn}>
          <Text style={styles.bold}>請求先:</Text>
          <Text style={styles.customerFirstLine}>{data.customerInfo.split('\n')[0]}</Text>
          <Text style={styles.small}>{data.customerInfo.split('\n').slice(1).join('\n')}</Text>
        </View>

        <View style={styles.infoColumn}>
          <Text style={styles.bold}>請求元:</Text>
          <Text style={styles.small}>{data.issuerInfo}</Text>
        </View>
      </View>

      <Text style={styles.totalAmountLabel}>下記のとおりご請求申し上げます。</Text>
      <Text style={styles.totalAmount}>ご請求金額　¥{totals.total.toLocaleString()}－</Text>
      <Text style={styles.dueDate}>お支払い期限　{data.dueDate}</Text>

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
            <View style={styles.col1}>
              <Text>{item.description}</Text>
              {item.notes && (
                <Text style={styles.notes}>{item.notes}</Text>
              )}
            </View>
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
    </View>
  );
}; 