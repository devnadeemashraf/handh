import { notFound } from 'next/navigation';

import { createDbClient, getOrderInvoiceData } from '@hh/db';

import InvoiceViewer from './InvoiceViewer';

export const dynamic = 'force-dynamic';

interface InvoicePageProps {
  params: Promise<{ id: string }>;
}

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export default async function AdminOrderInvoicePage({ params }: InvoicePageProps) {
  const { id } = await params;
  const db = getDatabase();

  const invoiceData = await getOrderInvoiceData(db, id);
  if (!invoiceData) {
    notFound();
  }

  return <InvoiceViewer initialInvoiceData={invoiceData} orderId={id} />;
}
