import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from './route';

const mockCreateGrievanceTicket = vi.fn();
const mockFindGrievanceTicketByReference = vi.fn();

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn(() => ({})),
  createGrievanceTicket: (...args: unknown[]) => mockCreateGrievanceTicket(...args),
  findGrievanceTicketByReference: (...args: unknown[]) =>
    mockFindGrievanceTicketByReference(...args)
}));

const mockRateLimit = vi.fn();
vi.mock('@/lib/rate-limit', () => ({
  grievanceSubmitRateLimiter: {
    limit: (...args: unknown[]) => mockRateLimit(...args)
  }
}));

describe('Grievance API Route (/api/grievance)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ success: true, reset: 0 });
  });

  describe('POST /api/grievance', () => {
    const validPayload = {
      fullName: 'Farhan Akhtar',
      email: 'farhan@example.com',
      phoneNumber: '9876543210',
      orderNumber: 'HH-2026-1001',
      category: 'shipping_delay',
      description: 'The tracking status has remained unchanged for 7 business days.'
    };

    it('returns 429 when rate limited', async () => {
      mockRateLimit.mockResolvedValue({
        success: false,
        reset: Date.now() + 60000
      });

      const req = new Request('http://localhost:3000/api/grievance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload)
      });

      const res = await POST(req);
      expect(res.status).toBe(429);
      const json = await res.json();
      expect(json.error).toBe('TOO_MANY_REQUESTS');
      expect(res.headers.get('Retry-After')).toBeDefined();
    });

    it('returns 400 on invalid or malformed JSON', async () => {
      const req = new Request('http://localhost:3000/api/grievance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json'
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('INVALID_PAYLOAD');
    });

    it('returns 400 when validation fails for phone or email', async () => {
      const req = new Request('http://localhost:3000/api/grievance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validPayload,
          email: 'not-valid',
          phoneNumber: '123'
        })
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('VALIDATION_ERROR');
      expect(json.details.email).toBeDefined();
      expect(json.details.phoneNumber).toBeDefined();
    });

    it('creates grievance ticket and returns 201 with ticket reference and 48-hour SLA notice', async () => {
      const now = new Date('2026-09-23T12:00:00Z');
      const ackDue = new Date(now.getTime() + 48 * 3600 * 1000);
      const resDue = new Date(now.getTime() + 30 * 86400 * 1000);

      mockCreateGrievanceTicket.mockResolvedValueOnce({
        id: 'mock-uuid-1',
        ticketReference: 'GRV-20260923-ABC123',
        fullName: validPayload.fullName,
        email: validPayload.email,
        phoneNumber: '+919876543210',
        orderNumber: validPayload.orderNumber,
        category: validPayload.category,
        description: validPayload.description,
        status: 'received',
        acknowledgementDueAt: ackDue,
        resolutionDueAt: resDue,
        createdAt: now
      });

      const req = new Request('http://localhost:3000/api/grievance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload)
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.ticketReference).toBe('GRV-20260923-ABC123');
      expect(json.status).toBe('received');
      expect(json.acknowledgementDueAt).toBe(ackDue.toISOString());
      expect(json.resolutionDueAt).toBe(resDue.toISOString());
      expect(json.message).toContain('48 hours');
    });
  });

  describe('GET /api/grievance', () => {
    it('returns 400 when reference or email is missing', async () => {
      const req = new Request('http://localhost:3000/api/grievance?reference=GRV-123');
      const res = await GET(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('MISSING_PARAMETERS');
    });

    it('returns 404 when ticket not found or email does not match', async () => {
      mockFindGrievanceTicketByReference.mockResolvedValueOnce(null);

      const req = new Request(
        'http://localhost:3000/api/grievance?reference=GRV-404&email=test@example.com'
      );
      const res = await GET(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe('NOT_FOUND');
    });

    it('returns ticket status when found and verified', async () => {
      const now = new Date('2026-09-23T12:00:00Z');
      mockFindGrievanceTicketByReference.mockResolvedValueOnce({
        id: 'mock-uuid-2',
        ticketReference: 'GRV-20260923-XYZ789',
        email: 'customer@example.com',
        category: 'shipping_delay',
        status: 'acknowledged',
        acknowledgementDueAt: now,
        resolutionDueAt: now,
        acknowledgedAt: now,
        resolvedAt: null,
        createdAt: now
      });

      const req = new Request(
        'http://localhost:3000/api/grievance?reference=GRV-20260923-XYZ789&email=customer@example.com'
      );
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ticketReference).toBe('GRV-20260923-XYZ789');
      expect(json.status).toBe('acknowledged');
      expect(json.acknowledgedAt).toBeDefined();
    });
  });
});
