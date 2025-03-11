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
  // Spacing styles
  mt0: { marginTop: 0 },
  mt1: { marginTop: 5 },
  mt2: { marginTop: 10 },
  mt3: { marginTop: 20 },
  mt4: { marginTop: 30 },
  mt5: { marginTop: 40 },
  mt6: { marginTop: 50 },
  mb0: { marginBottom: 0 },
  mb1: { marginBottom: 5 },
  mb2: { marginBottom: 10 },
  mb3: { marginBottom: 20 },
  my1: { marginVertical: 5 },
  my2: { marginVertical: 10 },
  my3: { marginVertical: 20 },
  
  // Base styles
  page: {
    fontFamily: 'NotoSansJP',
    padding: 50,
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoContainer: {
    flexDirection: 'row',
  },
  infoColumn: {
    flex: 1,
    paddingRight: 10,
  },
  table: {},
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 25,
  },
  col70: { width: '70%' },
  col1: { width: '35%' },
  col2: { width: '15%', textAlign: 'right' },
  col3: { width: '17%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '18%', textAlign: 'right' },
  totals: {},
  bold: {
    fontWeight: 'bold',
  },
  small: {
    fontSize: 10,
  },
  notes: {
    fontSize: 8,
    color: '#666',
  },
  customerFirstLine: {
    fontSize: 14,
    fontWeight: 'bold',
    textDecoration: 'underline',
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 2,
    // alignSelf: 'flex-start',
  },
  totalAmountLabel: {
    fontSize: 10,
  },
  dueDate: {
    fontSize: 10,
  },
  paymentInfo: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#000',
  }
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
      <View style={[styles.header, styles.mb3]}>
        <Text style={[styles.title, styles.mb2]}>請求書</Text>
        <View style={[styles.row, styles.mb1]}>
          <Text style={styles.small}>請求書番号: {data.invoiceNumber}</Text>
          <Text style={styles.small}>発行日: {data.issueDate}</Text>
        </View>
      </View>

      {/* 請求先 */}
      <View style={[styles.infoContainer, styles.mb3]}>
        <View style={styles.infoColumn}>
          <Text style={[styles.customerFirstLine, styles.mb1]}>{data.customerInfo.split('\n')[0]}</Text>
          <Text style={styles.small}>{data.customerInfo.split('\n').slice(1).join('\n')}</Text>
        </View>

        {/* 請求元 */}
        <View style={styles.infoColumn}>
          <Text style={styles.small}>{data.issuerInfo}</Text>
        </View>
      </View>

      {data.subject && (
        <Text style={[styles.bold, styles.mt3]}>件名: {data.subject}</Text>
      )}

      <Text style={[styles.totalAmountLabel, styles.mt1]}>下記のとおりご請求申し上げます。</Text>
      <View style={[styles.totalAmount, styles.my2, styles.row, styles.col70 ]}>
        <Text>ご請求金額</Text>
        <Text>¥ {totals.total.toLocaleString()} -</Text>
      </View>
      <Text style={[styles.dueDate, styles.mb3]}>お支払い期限: {data.dueDate}</Text>

      <View style={[styles.table, styles.mb3]}>
        <View style={[styles.tableHeader, styles.mb1]}>
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

      <View style={[styles.totals, styles.mt3]}>
        {Object.entries(totals.subtotalsByTaxRate).map(([rate, subtotal]) => (
          <View key={rate} style={[styles.row, styles.mb1]}>
            <Text style={styles.small}>小計:</Text>
            <Text style={styles.small}>¥{subtotal.toLocaleString()}</Text>
          </View>
        ))}
        {Object.entries(totals.taxesByRate).map(([rate, tax]) => (
          <View key={rate} style={[styles.row, styles.mb1]}>
            <Text style={styles.small}>消費税（{rate}%）:</Text>
            <Text style={styles.small}>¥{tax.toLocaleString()}</Text>
          </View>
        ))}
        <View style={[styles.row, styles.bold]}>
          <Text>合計:</Text>
          <Text>¥{totals.total.toLocaleString()}</Text>
        </View>
      </View>

      <View style={[styles.paymentInfo, styles.mt6]}>
        <Text style={styles.bold}>お振込先:</Text>
        <Text style={styles.small}>{data.paymentInfo}</Text>
      </View>
    </View>
  );
}; 