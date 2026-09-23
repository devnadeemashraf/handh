import { and, desc, eq } from 'drizzle-orm';

import { NotFoundError } from '@hh/domain';

import type {
  UpdateProfileInput,
  User,
  UserAnonymizationResult,
  UserDataExport,
  UserRole
} from '@hh/domain';

import {
  familyMembers,
  orders,
  outboxEvents,
  type ShippingAddress,
  stores,
  userAddresses,
  type UserRecord,
  users,
  userSessions,
  wishlistItems
} from '../schema';

import type { DatabaseClient } from '../index';

export function toDomainUser(record: UserRecord): User {
  return {
    id: record.id,
    storeId: record.storeId,
    phone: record.phone,
    phoneVerified: record.phoneVerified,
    email: record.email,
    emailVerified: record.emailVerified,
    name: record.name,
    avatarUrl: record.avatarUrl,
    role: record.role as UserRole,
    whatsappOptIn: record.whatsappOptIn,
    lastLoginAt: record.lastLoginAt ? record.lastLoginAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    deletedAt: record.deletedAt ? record.deletedAt.toISOString() : null,
    anonymizedAt: record.anonymizedAt ? record.anonymizedAt.toISOString() : null
  };
}

async function getStoreIdBySlug(db: DatabaseClient, storeSlug: string): Promise<string> {
  const storeRows = await db
    .select({ id: stores.id })
    .from(stores)
    .where(eq(stores.slug, storeSlug))
    .limit(1);

  const store = storeRows[0];
  if (!store) {
    throw new NotFoundError('Store', storeSlug);
  }

  return store.id;
}

export async function findUserById(db: DatabaseClient, userId: string): Promise<User | null> {
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const record = rows[0];
  return record ? toDomainUser(record) : null;
}

export async function findUserByPhone(
  db: DatabaseClient,
  storeSlug: string,
  phone: string
): Promise<User | null> {
  const storeId = await getStoreIdBySlug(db, storeSlug);
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.storeId, storeId), eq(users.phone, phone)))
    .limit(1);

  const record = rows[0];
  return record ? toDomainUser(record) : null;
}

export async function findUserByEmail(
  db: DatabaseClient,
  storeSlug: string,
  email: string
): Promise<User | null> {
  const storeId = await getStoreIdBySlug(db, storeSlug);
  const normalizedEmail = email.trim().toLowerCase();
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.storeId, storeId), eq(users.email, normalizedEmail)))
    .limit(1);

  const record = rows[0];
  return record ? toDomainUser(record) : null;
}

export async function createUser(
  db: DatabaseClient,
  storeSlug: string,
  input: {
    phone: string;
    name?: string | undefined;
    email?: string | undefined;
    role?: UserRole | undefined;
    whatsappOptIn?: boolean | undefined;
    phoneVerified?: boolean | undefined;
  }
): Promise<User> {
  const storeId = await getStoreIdBySlug(db, storeSlug);
  const [created] = await db
    .insert(users)
    .values({
      storeId,
      phone: input.phone,
      phoneVerified: input.phoneVerified ?? false,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email.trim().toLowerCase() } : {}),
      ...(input.role !== undefined ? { role: input.role } : { role: 'customer' }),
      ...(input.whatsappOptIn !== undefined ? { whatsappOptIn: input.whatsappOptIn } : {})
    })
    .returning();

  if (!created) {
    throw new Error('Failed to create user record.');
  }

  return toDomainUser(created);
}

export async function updateUserProfile(
  db: DatabaseClient,
  userId: string,
  input: UpdateProfileInput
): Promise<User> {
  const updateValues: Partial<UserRecord> = {
    updatedAt: new Date()
  };

  if (input.name !== undefined) updateValues.name = input.name;
  if (input.email !== undefined) updateValues.email = input.email.trim().toLowerCase();
  if (input.whatsappOptIn !== undefined) updateValues.whatsappOptIn = input.whatsappOptIn;

  const [updated] = await db
    .update(users)
    .set(updateValues)
    .where(eq(users.id, userId))
    .returning();

  if (!updated) {
    throw new NotFoundError('User', userId);
  }

  return toDomainUser(updated);
}

export async function updateUserLastLogin(db: DatabaseClient, userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      lastLoginAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));
}

export async function listUsers(db: DatabaseClient, storeSlug: string): Promise<User[]> {
  const storeId = await getStoreIdBySlug(db, storeSlug);
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.storeId, storeId))
    .orderBy(desc(users.createdAt));

  return rows.map(toDomainUser);
}

export async function updateUserRole(
  db: DatabaseClient,
  userId: string,
  role: UserRole
): Promise<User> {
  const [updated] = await db
    .update(users)
    .set({
      role,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId))
    .returning();

  if (!updated) {
    throw new NotFoundError('User', userId);
  }

  return toDomainUser(updated);
}

/**
 * Anonymizes a customer account and redacts all personal data pursuant to DPDP Act 2023 §12(3).
 * Atomically scrubs user identity, revokes active sessions, purges saved addresses, family records,
 * and wishlist entries, and redacts customer PII from order records while preserving financial
 * and tax invoice lines for statutory 8-year compliance under CGST Act 2017 §36.
 */
export async function anonymizeUser(
  db: DatabaseClient,
  userId: string
): Promise<UserAnonymizationResult> {
  return await db.transaction(async (tx) => {
    const userRows = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userRows[0];
    if (!user) {
      throw new NotFoundError('User', userId);
    }
    if (user.deletedAt) {
      throw new Error(`User with ID '${userId}' has already been anonymized/deleted.`);
    }

    const now = new Date();
    // Unique non-routable dummy phone number to satisfy unique constraint (storeId, phone)
    const anonymizedPhone = `+9100${userId.replace(/-/g, '').slice(0, 10)}`;

    // 1. Delete saved addresses (direct customer PII)
    const deletedAddresses = await tx
      .delete(userAddresses)
      .where(eq(userAddresses.userId, userId))
      .returning({ id: userAddresses.id });

    // 2. Delete family members & preferences (direct customer PII)
    const deletedFamily = await tx
      .delete(familyMembers)
      .where(eq(familyMembers.userId, userId))
      .returning({ id: familyMembers.id });

    // 3. Delete wishlist items
    const deletedWishlist = await tx
      .delete(wishlistItems)
      .where(eq(wishlistItems.userId, userId))
      .returning({ id: wishlistItems.id });

    // 4. Revoke/delete all active user sessions (immediate logout)
    const deletedSessions = await tx
      .delete(userSessions)
      .where(eq(userSessions.userId, userId))
      .returning({ id: userSessions.id });

    // 5. Redact customer PII on orders while preserving statutory tax invoice lines (CGST Act §36)
    // Keep financial breakdown, taxes, items intact.
    // Scrub direct PII: customerName, customerEmail, customerPhone.
    // For shippingAddress: preserve city, state, postalCode, country (for GST jurisdiction verification), redact line1, line2.
    const userOrders = await tx
      .select({ id: orders.id, shippingAddress: orders.shippingAddress })
      .from(orders)
      .where(eq(orders.userId, userId));

    for (const order of userOrders) {
      const redactedShipping: ShippingAddress = {
        line1: 'Redacted (DPDP Act §12)',
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country
      };

      await tx
        .update(orders)
        .set({
          customerName: 'Anonymized Customer',
          customerEmail: `deleted_${userId.slice(0, 8)}@anonymized.invalid`,
          customerPhone: '+910000000000',
          shippingAddress: redactedShipping
        })
        .where(eq(orders.id, order.id));
    }

    // 6. Update user record to anonymized state
    await tx
      .update(users)
      .set({
        phone: anonymizedPhone,
        phoneVerified: false,
        email: null,
        emailVerified: false,
        name: 'Anonymized Customer',
        avatarUrl: null,
        whatsappOptIn: false,
        deletedAt: now,
        anonymizedAt: now,
        updatedAt: now
      })
      .where(eq(users.id, userId));

    // 7. Insert audit event into transactional outbox
    await tx.insert(outboxEvents).values({
      eventName: 'user.anonymized',
      aggregateType: 'user',
      aggregateId: userId,
      payload: {
        userId,
        anonymizedAt: now.toISOString(),
        retentionReason: 'DPDP_ACT_2023_RIGHT_TO_ERASURE',
        statutoryRetention: 'CGST_ACT_2017_SECTION_36'
      }
    });

    return {
      userId,
      anonymizedAt: now.toISOString(),
      redactedRecords: {
        addressesCount: deletedAddresses.length,
        familyMembersCount: deletedFamily.length,
        wishlistItemsCount: deletedWishlist.length,
        sessionsRevokedCount: deletedSessions.length,
        ordersAnonymizedCount: userOrders.length
      }
    };
  });
}

/**
 * Exports all customer personal data in machine-readable JSON format pursuant to DPDP Act 2023 §12.
 */
export async function exportUserData(db: DatabaseClient, userId: string): Promise<UserDataExport> {
  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userRows[0];
  if (!user) {
    throw new NotFoundError('User', userId);
  }

  const addresses = await db
    .select()
    .from(userAddresses)
    .where(eq(userAddresses.userId, userId))
    .orderBy(desc(userAddresses.createdAt));

  const family = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.userId, userId))
    .orderBy(desc(familyMembers.createdAt));

  const wishlist = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId))
    .orderBy(desc(wishlistItems.addedAt));

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  const now = new Date();

  return {
    exportVersion: '1.0',
    exportedAt: now.toISOString(),
    dataFiduciary: {
      name: 'H&H Luxury Modest Wear Private Limited',
      cin: 'U18109TG2026PTC198765',
      registeredAddress: 'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033, India',
      grievanceEmail: 'grievance@handh.local'
    },
    notice:
      'Personal data provided in structured JSON format pursuant to Section 12 of the Digital Personal Data Protection Act, 2023 (DPDP Act).',
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      whatsappOptIn: user.whatsappOptIn,
      createdAt: user.createdAt.toISOString()
    },
    addresses: addresses.map((a) => ({
      id: a.id,
      label: a.label,
      recipientName: a.recipientName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      state: a.state,
      postalCode: a.postalCode,
      country: a.country,
      isDefault: a.isDefault,
      createdAt: a.createdAt.toISOString()
    })),
    familyMembers: family.map((f) => ({
      id: f.id,
      name: f.name,
      relationship: f.relationship,
      preferences: f.preferences as Record<string, unknown>
    })),
    wishlist: wishlist.map((w) => ({
      id: w.id,
      productId: w.productId,
      variantId: w.variantId,
      addedAt: w.addedAt.toISOString()
    })),
    orders: userOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      fulfillmentStatus: o.fulfillmentStatus,
      totalAmountMinor: o.totalMinor,
      currency: o.currency,
      createdAt: o.createdAt.toISOString()
    }))
  };
}
