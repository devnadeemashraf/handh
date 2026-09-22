import { describe, expect, it } from 'vitest';

import { createOAuthState, verifyOAuthState } from './index';

describe('OAuth State Signing & Verification', () => {
  const secret = 'super_secret_sso_state_signing_key_32_bytes_long';

  it('creates and verifies valid OAuth state', () => {
    const state = createOAuthState('google', secret, '/admin/orders');
    expect(state).toBeTruthy();
    expect(state.includes('.')).toBe(true);

    const verified = verifyOAuthState(state, secret);
    expect(verified).not.toBeNull();
    expect(verified?.provider).toBe('google');
    expect(verified?.returnTo).toBe('/admin/orders');
    expect(verified?.nonce).toBeDefined();
  });

  it('rejects state signed with different secret', () => {
    const state = createOAuthState('zoho', secret, '/admin/inventory');
    const verified = verifyOAuthState(state, 'wrong_secret_key_32_bytes_long!!');
    expect(verified).toBeNull();
  });

  it('rejects tampered state payload', () => {
    const state = createOAuthState('google', secret);
    const [payload, sig] = state.split('.');
    const tampered = `${payload}TAMPER.${sig}`;
    expect(verifyOAuthState(tampered, secret)).toBeNull();
  });

  it('rejects expired state', () => {
    // Generate expired state by monkeypatching Date.now
    const pastTime = Date.now() - 15 * 60 * 1000; // 15 mins ago
    const origNow = Date.now;
    Date.now = () => pastTime;
    const expiredState = createOAuthState('google', secret);
    Date.now = origNow;

    expect(verifyOAuthState(expiredState, secret)).toBeNull();
  });
});
