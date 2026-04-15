import React from 'react';
import { Document, Page } from '@react-pdf/renderer';
import { InvoiceData } from '../types';
import { InvoiceContent } from './InvoiceContent';

interface Props {
  data: InvoiceData;
}

export const InvoicePDF: React.FC<Props> = ({ data }) => {
  return (
    <Document>
      <Page size="A4">
        <InvoiceContent data={data} />
      </Page>
    </Document>
  );
};
