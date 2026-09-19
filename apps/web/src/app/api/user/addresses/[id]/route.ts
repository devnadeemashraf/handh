import { NextResponse } from 'next/server';

import { createDbClient, deleteAddress, updateAddress } from '@hh/db';
import { UpdateAddressSchema } from '@hh/domain';

import { requireUser } from '../../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: addressId } = await props.params;

    const json = await request.json();
    const parseResult = UpdateAddressSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.errors[0]?.message ?? 'Invalid address update parameters.'
        },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const updated = await updateAddress(db, user.id, addressId, parseResult.data);

    return NextResponse.json({ success: true, address: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update address.';
    const status = message.includes('Authentication') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: addressId } = await props.params;

    const db = getDatabase();
    await deleteAddress(db, user.id, addressId);

    return NextResponse.json({ success: true, message: 'Address removed.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete address.';
    const status = message.includes('Authentication') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
