import { describe, expect, it } from 'vitest';

import { POST as requestOTP } from './otp/request/route';
import { POST as verifyOTP } from './otp/verify/route';

describe('Auth API Routes Integration', () => {
  const testPhone = `+9198${Date.now().toString().slice(-8)}`;

  it('handles OTP request and returns devCode in non-production', async () => {
    const req = new Request('http://localhost:3000/api/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone })
    });

    const res = await requestOTP(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.devCode).toBeDefined();
    expect(/^\d{6}$/.test(body.devCode)).toBe(true);
  });

  it('rejects invalid mobile numbers with 400', async () => {
    const req = new Request('http://localhost:3000/api/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '12345' })
    });

    const res = await requestOTP(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
  });

  it('rejects incorrect OTP verification with 400', async () => {
    const req = new Request('http://localhost:3000/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: testPhone,
        code: '000000',
        purpose: 'login'
      })
    });

    const res = await verifyOTP(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Incorrect verification code');
  });

  it('verifies valid OTP, creates user, and sets session cookie', async () => {
    // 1. Request new OTP
    const reqOtp = new Request('http://localhost:3000/api/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone })
    });
    const otpRes = await requestOTP(reqOtp);
    const otpBody = await otpRes.json();
    const validCode = otpBody.devCode;

    // 2. Verify OTP
    const verifyReq = new Request('http://localhost:3000/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: testPhone,
        code: validCode,
        purpose: 'login',
        whatsappOptIn: true
      })
    });

    const res = await verifyOTP(verifyReq);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user).toBeDefined();
    expect(body.user.phone).toBe(testPhone);
    expect(body.user.whatsappOptIn).toBe(true);

    const cookieHeader = res.headers.get('set-cookie');
    expect(cookieHeader).toContain('hh_session');
  });
});
