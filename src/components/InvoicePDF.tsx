import React from 'react';
import { Document, Page, PDFViewer } from '@react-pdf/renderer';
import { InvoiceData } from '../types';
import { InvoiceContent } from './InvoiceContent';

interface Props {
  data: InvoiceData;
}

interface PreviewProps extends Props {
  className?: string;
}

const InvoicePDFPreview: React.FC<PreviewProps> = ({ data, className }) => {
  return (
    <PDFViewer 
      className={className} 
      showToolbar={false}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
      }}
    >
      <Document>
        <Page size="A4">
          <InvoiceContent data={data} />
        </Page>
      </Document>
    </PDFViewer>
  );
};

type InvoicePDFComponent = React.FC<Props> & {
  Preview: React.FC<PreviewProps>;
};

const InvoicePDF: InvoicePDFComponent = ({ data }) => {
  return (
    <Document>
      <Page size="A4">
        <InvoiceContent data={data} />
      </Page>
    </Document>
  );
};

InvoicePDF.Preview = InvoicePDFPreview;

export { InvoicePDF };