import { notFound } from 'next/navigation';
import React from 'react';
import { OrderConfirmationView } from '@/components/checkout/OrderConfirmationView';

import { findOrderById, findOrderByOrderNumber, getSharedDbClient } from '@hh/db';

import { getAdminSession } from '../../../../lib/admin-auth';
import { getCurrentUser } from '../../../../lib/auth';
import { verifyOrderReceiptToken } from '../../../../lib/receipt-token';

interface ConfirmationPageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ token?: string }>;
}

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export default async function OrderConfirmationPage({
  params,
  searchParams
}: ConfirmationPageProps) {
  const { orderId } = await params;
  const { token } = await searchParams;

  if (!orderId) {
    notFound();
    return null;
  }

  const db = getDatabase();
  // Support both UUID orderId and reference orderNumber (e.g. HH-2026-XXXXX)
  let order = await findOrderById(db, orderId);
  if (!order) {
    order = await findOrderByOrderNumber(db, orderId);
  }

  if (!order) {
    notFound();
    return null;
  }

  // Authorization & PII Protection Check (E-COM-143)
  const currentUser = await getCurrentUser();
  const isOwner = Boolean(currentUser && order.userId && currentUser.id === order.userId);
  const adminSession = !isOwner ? await getAdminSession() : null;
  const isAdmin = Boolean(adminSession);
  const isTokenValid = Boolean(
    token && verifyOrderReceiptToken(token, order.id, order.orderNumber)
  );

  if (!isOwner && !isAdmin && !isTokenValid) {
    notFound();
    return null;
  }

  const isGuest = !order.userId;

  return <OrderConfirmationView order={order} token={token} isGuest={isGuest} />;
}
