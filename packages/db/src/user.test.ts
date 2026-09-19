import { describe, expect, it } from 'vitest';

import { createDbClient } from './index';
import {
  addToWishlist,
  cleanExpiredSessions,
  countRecentOTPs,
  createAddress,
  createFamilyMember,
  createOTP,
  createSession,
  createUser,
  deleteAddress,
  deleteFamilyMember,
  findAddressById,
  findSessionByTokenHash,
  findUserById,
  findUserByPhone,
  findValidOTP,
  incrementOTPAttempts,
  isInWishlist,
  listAddresses,
  listFamilyMembers,
  listUsers,
  listWishlistItems,
  markOTPVerified,
  removeFromWishlist,
  revokeSession,
  updateAddress,
  updateFamilyMember,
  updateUserProfile,
  updateUserRole
} from './repositories';
import { products } from './schema';

describe('User Platform Repository Integration', () => {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  const db = createDbClient(databaseUrl);
  const testPhone = `+9198${Date.now().toString().slice(-8)}`;

  let createdUserId: string;

  it('creates and finds a user by phone and id', async () => {
    const user = await createUser(db, 'hh', {
      phone: testPhone,
      name: 'Test Customer',
      role: 'customer',
      whatsappOptIn: true
    });

    expect(user.id).toBeDefined();
    expect(user.phone).toBe(testPhone);
    expect(user.role).toBe('customer');
    expect(user.whatsappOptIn).toBe(true);

    createdUserId = user.id;

    const foundById = await findUserById(db, createdUserId);
    expect(foundById).not.toBeNull();
    expect(foundById?.name).toBe('Test Customer');

    const foundByPhone = await findUserByPhone(db, 'hh', testPhone);
    expect(foundByPhone).not.toBeNull();
    expect(foundByPhone?.id).toBe(createdUserId);

    const allUsers = await listUsers(db, 'hh');
    expect(allUsers.length).toBeGreaterThanOrEqual(1);
  });

  it('updates user profile and updates user role', async () => {
    const updated = await updateUserProfile(db, createdUserId, {
      name: 'Updated Name',
      email: 'updated@example.com',
      whatsappOptIn: false
    });

    expect(updated.name).toBe('Updated Name');
    expect(updated.email).toBe('updated@example.com');
    expect(updated.whatsappOptIn).toBe(false);

    const promoted = await updateUserRole(db, createdUserId, 'admin');
    expect(promoted.role).toBe('admin');
  });

  it('manages OTP creation, validation, attempts, and verification', async () => {
    const phone = testPhone;
    const otp = await createOTP(db, phone, '456789', 'login');
    expect(otp.id).toBeDefined();
    expect(otp.code).toBe('456789');

    const valid = await findValidOTP(db, phone, 'login');
    expect(valid).not.toBeNull();
    expect(valid?.code).toBe('456789');

    await incrementOTPAttempts(db, otp.id);
    const afterAttempt = await findValidOTP(db, phone, 'login');
    expect(afterAttempt?.attempts).toBe(1);

    await markOTPVerified(db, otp.id);
    const afterVerified = await findValidOTP(db, phone, 'login');
    expect(afterVerified).toBeNull(); // consumed

    const recentCount = await countRecentOTPs(db, phone, 60000);
    expect(recentCount).toBeGreaterThanOrEqual(1);
  });

  it('manages user sessions with expiration and revocation', async () => {
    const tokenHash = `hash_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    const session = await createSession(
      db,
      createdUserId,
      tokenHash,
      expiresAt,
      '127.0.0.1',
      'Vitest/Agent'
    );
    expect(session.id).toBeDefined();

    const lookup = await findSessionByTokenHash(db, tokenHash);
    expect(lookup).not.toBeNull();
    expect(lookup?.user.id).toBe(createdUserId);
    expect(lookup?.session.ipAddress).toBe('127.0.0.1');

    await revokeSession(db, session.id);
    const afterRevoke = await findSessionByTokenHash(db, tokenHash);
    expect(afterRevoke).toBeNull();

    // Test cleaning expired sessions
    const expiredCount = await cleanExpiredSessions(db);
    expect(typeof expiredCount).toBe('number');
  });

  it('manages user addresses and enforces single default address', async () => {
    const addr1 = await createAddress(db, createdUserId, {
      label: 'Home',
      recipientName: 'Test Recipient',
      phone: testPhone,
      line1: '123 Main Street',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500001',
      country: 'IN',
      isDefault: true
    });

    expect(addr1.isDefault).toBe(true);

    const addr2 = await createAddress(db, createdUserId, {
      label: 'Work',
      recipientName: 'Test Recipient Work',
      phone: testPhone,
      line1: 'Tech Park Tower B',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500081',
      country: 'IN',
      isDefault: true // should unset addr1
    });

    expect(addr2.isDefault).toBe(true);

    const updatedAddr1 = await findAddressById(db, createdUserId, addr1.id);
    expect(updatedAddr1?.isDefault).toBe(false);

    // Update addr1 to default
    await updateAddress(db, createdUserId, addr1.id, { isDefault: true });
    const addr1AfterUpdate = await findAddressById(db, createdUserId, addr1.id);
    expect(addr1AfterUpdate?.isDefault).toBe(true);

    const addresses = await listAddresses(db, createdUserId);
    expect(addresses.length).toBeGreaterThanOrEqual(2);

    await deleteAddress(db, createdUserId, addr1.id);
    const afterDelete = await findAddressById(db, createdUserId, addr1.id);
    expect(afterDelete).toBeNull();
  });

  it('manages family members and structured style/size preferences', async () => {
    const member = await createFamilyMember(db, createdUserId, {
      name: 'Daughter Zoya',
      relationship: 'Daughter',
      preferences: {
        sizes: { abaya: 'XS', hijab: 'Chiffon' },
        style: { preferredColors: ['Dusty Rose'], modestyLevel: 'full_coverage' }
      }
    });

    expect(member.name).toBe('Daughter Zoya');
    expect(member.preferences.sizes?.abaya).toBe('XS');

    const updated = await updateFamilyMember(db, createdUserId, member.id, {
      preferences: {
        sizes: { abaya: 'S', hijab: 'Silk 70x180' }
      }
    });

    expect(updated.preferences.sizes?.abaya).toBe('S');

    const list = await listFamilyMembers(db, createdUserId);
    expect(list.length).toBeGreaterThanOrEqual(1);

    await deleteFamilyMember(db, createdUserId, member.id);
  });

  it('manages wishlist items and item presence checks', async () => {
    const prods = await db.select({ id: products.id }).from(products).limit(1);
    if (prods.length > 0 && prods[0]) {
      const prodId = prods[0].id;
      const item = await addToWishlist(db, createdUserId, prodId);
      expect(item.productId).toBe(prodId);

      const inWishlist = await isInWishlist(db, createdUserId, prodId);
      expect(inWishlist).toBe(true);

      const list = await listWishlistItems(db, createdUserId);
      expect(list.length).toBeGreaterThanOrEqual(1);

      await removeFromWishlist(db, createdUserId, prodId);
      const afterRemove = await isInWishlist(db, createdUserId, prodId);
      expect(afterRemove).toBe(false);
    }
  });
});
