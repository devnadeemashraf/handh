import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  addToWishlist,
  anonymizeUser,
  createAddress,
  createDbClient,
  createFamilyMember,
  createOTP,
  createSession,
  createUser,
  executeRetentionPurge,
  exportUserData,
  findUserById,
  listAddresses,
  listFamilyMembers,
  listWishlistItems,
  outboxEvents,
  purgeExpiredOtps,
  purgeProcessedOutboxPayloads,
  userSessions
} from './index';
import { orders, otpCodes, products, type ShippingAddress, stores } from './schema';

describe('DPDP Act 2023 Statutory Compliance & Retention Purge', () => {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  const db = createDbClient(databaseUrl);

  let storeId: string;

  beforeAll(async () => {
    const storeRows = await db.select().from(stores).where(eq(stores.slug, 'hh')).limit(1);
    if (!storeRows[0]) throw new Error('Store hh not found');
    storeId = storeRows[0].id;
  });

  describe('Customer Data Export (DPDP Act §12 Data Portability)', () => {
    it('exports all personal data in structured JSON format', async () => {
      const phone = `+9198${Date.now().toString().slice(-8)}`;
      const user = await createUser(db, 'hh', {
        phone,
        name: 'Fatima Zahra',
        email: `fatima_${Date.now()}@example.com`,
        whatsappOptIn: true
      });

      await createAddress(db, user.id, {
        label: 'Home',
        recipientName: 'Fatima Zahra',
        phone,
        line1: 'Banjara Hills, Road 12',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500034',
        country: 'IN',
        isDefault: true
      });

      await createFamilyMember(db, user.id, {
        name: 'Maryam',
        relationship: 'Daughter',
        preferences: { sizes: { abaya: 'S' } }
      });

      const prods = await db.select({ id: products.id }).from(products).limit(1);
      if (prods[0]) {
        await addToWishlist(db, user.id, prods[0].id);
      }

      const exportData = await exportUserData(db, user.id);

      expect(exportData.exportVersion).toBe('1.0');
      expect(exportData.dataFiduciary.name).toContain('H&H');
      expect(exportData.notice).toContain('Digital Personal Data Protection Act, 2023');
      expect(exportData.user.id).toBe(user.id);
      expect(exportData.user.phone).toBe(phone);
      expect(exportData.user.name).toBe('Fatima Zahra');
      expect(exportData.addresses.length).toBeGreaterThanOrEqual(1);
      expect(exportData.addresses[0]?.line1).toBe('Banjara Hills, Road 12');
      expect(exportData.familyMembers.length).toBeGreaterThanOrEqual(1);
      expect(exportData.familyMembers[0]?.name).toBe('Maryam');
      expect(exportData.wishlist.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Customer Account Erasure & Statutory Invoice Retention (DPDP Act §12 & CGST Act §36)', () => {
    it('redacts customer PII while preserving financial orders and tax records', async () => {
      const phone = `+9197${Date.now().toString().slice(-8)}`;
      const user = await createUser(db, 'hh', {
        phone,
        name: 'Ayesha Khan',
        email: `ayesha_${Date.now()}@example.com`,
        whatsappOptIn: true
      });

      // 1. Add addresses, family, wishlist, sessions
      await createAddress(db, user.id, {
        label: 'Work',
        recipientName: 'Ayesha Khan',
        phone,
        line1: 'Hitec City, Cyber Towers',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500081',
        country: 'IN',
        isDefault: false
      });

      await createFamilyMember(db, user.id, {
        name: 'Sister Zara',
        relationship: 'Sister',
        preferences: { style: { preferredColors: ['Black'] } }
      });

      const prods = await db.select({ id: products.id }).from(products).limit(1);
      if (prods[0]) {
        await addToWishlist(db, user.id, prods[0].id);
      }

      await createSession(
        db,
        user.id,
        `test_token_hash_${Date.now()}`,
        new Date(Date.now() + 86400000)
      );

      // 2. Create an order with financial breakdown and GST
      const shippingAddress: ShippingAddress = {
        line1: 'Flat 402, Cyber Heights',
        line2: 'Plot 15',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500081',
        country: 'IN'
      };

      const [order] = await db
        .insert(orders)
        .values({
          orderNumber: `HH-DPDP-${Date.now()}`,
          storeId,
          userId: user.id,
          status: 'paid',
          paymentStatus: 'captured',
          fulfillmentStatus: 'unfulfilled',
          customerName: 'Ayesha Khan',
          customerEmail: 'ayesha@example.com',
          customerPhone: phone,
          shippingAddress,
          subtotalMinor: 200000,
          shippingMinor: 0,
          discountMinor: 0,
          totalMinor: 200000,
          currency: 'INR'
        })
        .returning();

      expect(order).toBeDefined();
      expect(order!.id).toBeDefined();

      // 3. Execute anonymization routine
      const result = await anonymizeUser(db, user.id);

      expect(result.userId).toBe(user.id);
      expect(result.anonymizedAt).toBeDefined();
      expect(result.redactedRecords.addressesCount).toBeGreaterThanOrEqual(1);
      expect(result.redactedRecords.familyMembersCount).toBeGreaterThanOrEqual(1);
      expect(result.redactedRecords.wishlistItemsCount).toBeGreaterThanOrEqual(1);
      expect(result.redactedRecords.sessionsRevokedCount).toBeGreaterThanOrEqual(1);
      expect(result.redactedRecords.ordersAnonymizedCount).toBeGreaterThanOrEqual(1);

      // 4. Verify user record is scrubbed
      const anonymizedUser = await findUserById(db, user.id);
      expect(anonymizedUser).not.toBeNull();
      expect(anonymizedUser?.name).toBe('Anonymized Customer');
      expect(anonymizedUser?.email).toBeNull();
      expect(anonymizedUser?.emailVerified).toBe(false);
      expect(anonymizedUser?.phoneVerified).toBe(false);
      expect(anonymizedUser?.whatsappOptIn).toBe(false);
      expect(anonymizedUser?.avatarUrl).toBeNull();
      expect(anonymizedUser?.deletedAt).not.toBeNull();
      expect(anonymizedUser?.anonymizedAt).not.toBeNull();
      expect(anonymizedUser?.phone).toMatch(/^\+9100/);

      // 5. Verify PII collections are purged
      const addressesAfter = await listAddresses(db, user.id);
      expect(addressesAfter.length).toBe(0);

      const familyAfter = await listFamilyMembers(db, user.id);
      expect(familyAfter.length).toBe(0);

      const wishlistAfter = await listWishlistItems(db, user.id);
      expect(wishlistAfter.length).toBe(0);

      const sessionsAfter = await db
        .select()
        .from(userSessions)
        .where(eq(userSessions.userId, user.id));
      expect(sessionsAfter.length).toBe(0);

      // 6. Verify order financial lines & GST are preserved, while customer PII is scrubbed
      const orderRows = await db.select().from(orders).where(eq(orders.id, order!.id)).limit(1);
      const scrubbedOrder = orderRows[0];
      expect(scrubbedOrder).toBeDefined();
      expect(scrubbedOrder?.customerName).toBe('Anonymized Customer');
      expect(scrubbedOrder?.customerEmail).toContain('@anonymized.invalid');
      expect(scrubbedOrder?.customerPhone).toBe('+910000000000');
      expect(scrubbedOrder?.shippingAddress.line1).toBe('Redacted (DPDP Act §12)');
      expect(scrubbedOrder?.shippingAddress.line2).toBeUndefined();
      // Crucial: State and city are preserved for CGST/SGST/IGST tax audit jurisdiction
      expect(scrubbedOrder?.shippingAddress.state).toBe('Telangana');
      expect(scrubbedOrder?.shippingAddress.postalCode).toBe('500081');
      // Financial amounts preserved
      expect(scrubbedOrder?.totalMinor).toBe(200000);
      expect(scrubbedOrder?.subtotalMinor).toBe(200000);

      // 7. Verify subsequent anonymization attempt is rejected
      await expect(anonymizeUser(db, user.id)).rejects.toThrow(/already been anonymized/);
    });
  });

  describe('Statutory Retention Purge (DPDP Act §8(7))', () => {
    it('purges expired OTPs older than 24 hours while keeping valid OTPs', async () => {
      const expiredPhone = `+9195${Date.now().toString().slice(-8)}`;
      const activePhone = `+9194${Date.now().toString().slice(-8)}`;

      // Insert an expired OTP older than 24 hours
      const oldExpiry = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      await db.insert(otpCodes).values({
        phone: expiredPhone,
        code: '111111',
        purpose: 'login',
        expiresAt: oldExpiry,
        createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000)
      });

      // Insert an active fresh OTP
      await createOTP(db, activePhone, '222222', 'login');

      // Purge with 24-hour retention window
      const purgedCount = await purgeExpiredOtps(db, 24);
      expect(purgedCount).toBeGreaterThanOrEqual(1);

      // Verify expired OTP is gone
      const expiredRows = await db.select().from(otpCodes).where(eq(otpCodes.phone, expiredPhone));
      expect(expiredRows.length).toBe(0);

      // Verify active OTP still exists
      const activeRows = await db.select().from(otpCodes).where(eq(otpCodes.phone, activePhone));
      expect(activeRows.length).toBe(1);
    });

    it('anonymizes outbox event payloads older than 30 days while keeping fresh events', async () => {
      const oldDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000); // 35 days ago
      const recentDate = new Date();

      // Insert old published event with sensitive PII payload
      const [oldEvent] = await db
        .insert(outboxEvents)
        .values({
          eventName: 'order.confirmation',
          aggregateType: 'order',
          aggregateId: `ORD-OLD-${Date.now()}`,
          payload: { customerEmail: 'sensitive@example.com', recipientPhone: '+919876543210' },
          status: 'published',
          createdAt: oldDate,
          processedAt: oldDate
        })
        .returning();

      // Insert fresh published event
      const [freshEvent] = await db
        .insert(outboxEvents)
        .values({
          eventName: 'order.confirmation',
          aggregateType: 'order',
          aggregateId: `ORD-NEW-${Date.now()}`,
          payload: { customerEmail: 'fresh@example.com' },
          status: 'published',
          createdAt: recentDate,
          processedAt: recentDate
        })
        .returning();

      expect(oldEvent).toBeDefined();
      expect(freshEvent).toBeDefined();

      // Purge payloads with 30-day retention
      const redactedCount = await purgeProcessedOutboxPayloads(db, 30);
      expect(redactedCount).toBeGreaterThanOrEqual(1);

      // Verify old event payload is redacted
      const oldRows = await db.select().from(outboxEvents).where(eq(outboxEvents.id, oldEvent!.id));
      const oldPayload = oldRows[0]?.payload as Record<string, unknown>;
      expect(oldPayload['redacted']).toBe(true);
      expect(oldPayload['reason']).toBe('DPDP_RETENTION_EXPIRY');
      expect(oldPayload['customerEmail']).toBeUndefined();

      // Verify fresh event payload is intact
      const freshRows = await db
        .select()
        .from(outboxEvents)
        .where(eq(outboxEvents.id, freshEvent!.id));
      const freshPayload = freshRows[0]?.payload as Record<string, unknown>;
      expect(freshPayload['customerEmail']).toBe('fresh@example.com');
      expect(freshPayload['redacted']).toBeUndefined();
    });

    it('executes combined retention purge through retention service', async () => {
      const result = await executeRetentionPurge(db, {
        otpRetentionHours: 24,
        outboxRetentionDays: 30
      });

      expect(result.executedAt).toBeDefined();
      expect(typeof result.purgedOtpsCount).toBe('number');
      expect(typeof result.anonymizedOutboxEventsCount).toBe('number');
    });
  });
});
