import { notFound } from 'next/navigation';

import { getOrderInvoiceData, getSharedDbClient } from '@hh/db';

import PackingSlipViewer from './PackingSlipViewer';

export const dynamic = 'force-dynamic';

interface PackingSlipPageProps {
  params: Promise<{ id: string }>;
}

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export default async function AdminOrderPackingSlipPage({ params }: PackingSlipPageProps) {
  const { id } = await params;
  const db = getDatabase();

  const invoiceData = await getOrderInvoiceData(db, id);
  if (!invoiceData) {
    notFound();
  }

  return <PackingSlipViewer invoiceData={invoiceData} orderId={id} />;
}
