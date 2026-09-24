import { describe, expect, it, vi } from 'vitest';

import {
  MetaWhatsAppCloudAdapter,
  MockWhatsAppAdapter,
  normalizeWhatsAppRecipientPhone,
  WhatsAppService
} from './whatsapp.service';

describe('normalizeWhatsAppRecipientPhone', () => {
  it('normalizes 10-digit Indian mobile number with 91 country code', () => {
    expect(normalizeWhatsAppRecipientPhone('9876543210')).toBe('919876543210');
  });

  it('normalizes E.164 +91 mobile number by stripping plus and spaces', () => {
    expect(normalizeWhatsAppRecipientPhone('+919876543210')).toBe('919876543210');
    expect(normalizeWhatsAppRecipientPhone('+91 98765 43210')).toBe('919876543210');
    expect(normalizeWhatsAppRecipientPhone('+91-98765-43210')).toBe('919876543210');
  });

  it('normalizes 11-digit mobile number with leading zero', () => {
    expect(normalizeWhatsAppRecipientPhone('09876543210')).toBe('919876543210');
  });

  it('preserves international numbers with country codes', () => {
    expect(normalizeWhatsAppRecipientPhone('+1 415 555 2671')).toBe('14155552671');
    expect(normalizeWhatsAppRecipientPhone('+44 7911 123456')).toBe('447911123456');
  });
});

describe('MetaWhatsAppCloudAdapter', () => {
  const dummyConfig = {
    phoneNumberId: '109876543210',
    accessToken: 'EAAB_test_access_token_12345',
    apiVersion: 'v21.0',
    apiUrl: 'https://graph.facebook.com'
  };

  it('throws an error if instantiated without required credentials', () => {
    expect(() => new MetaWhatsAppCloudAdapter({ phoneNumberId: '', accessToken: '' })).toThrow(
      /requires phoneNumberId and accessToken/
    );
  });

  it('dispatches approved HSM template message payload via Meta Graph API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        messaging_product: 'whatsapp',
        contacts: [{ input: '919876543210', wa_id: '919876543210' }],
        messages: [{ id: 'wamid.HBgLMDk4NzY1NDMyMTAVAgARGBI1QTM4' }]
      })
    });

    const adapter = new MetaWhatsAppCloudAdapter({
      ...dummyConfig,
      fetchFn: mockFetch as unknown as typeof fetch
    });

    const result = await adapter.send({
      to: '+91 98765 43210',
      text: 'Order confirmed fallback text',
      template: {
        name: 'order_confirmation',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'Fatima Begum' },
              { type: 'text', text: 'HH-2026-0001' },
              { type: 'text', text: '₹14,999.00' },
              { type: 'text', text: '2' }
            ]
          }
        ]
      }
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('wamid.HBgLMDk4NzY1NDMyMTAVAgARGBI1QTM4');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [callUrl, callInit] = mockFetch.mock.calls[0]!;
    expect(callUrl).toBe('https://graph.facebook.com/v21.0/109876543210/messages');
    expect(callInit.headers).toEqual({
      Authorization: 'Bearer EAAB_test_access_token_12345',
      'Content-Type': 'application/json'
    });

    const sentBody = JSON.parse(callInit.body);
    expect(sentBody).toEqual({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: '919876543210',
      type: 'template',
      template: {
        name: 'order_confirmation',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'Fatima Begum' },
              { type: 'text', text: 'HH-2026-0001' },
              { type: 'text', text: '₹14,999.00' },
              { type: 'text', text: '2' }
            ]
          }
        ]
      }
    });
  });

  it('dispatches freeform text message when template is omitted', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        messaging_product: 'whatsapp',
        messages: [{ id: 'wamid.HBgL_TEXT_123' }]
      })
    });

    const adapter = new MetaWhatsAppCloudAdapter({
      ...dummyConfig,
      fetchFn: mockFetch as unknown as typeof fetch
    });

    const result = await adapter.send({
      to: '+919876543210',
      text: 'Direct concierge message'
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('wamid.HBgL_TEXT_123');

    const [, callInit] = mockFetch.mock.calls[0]!;
    const sentBody = JSON.parse(callInit.body);
    expect(sentBody.type).toBe('text');
    expect(sentBody.text).toEqual({
      preview_url: false,
      body: 'Direct concierge message'
    });
  });

  it('handles Meta Cloud API error response gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({
        error: {
          message: 'Template order_confirmation does not exist in en',
          type: 'OAuthException',
          code: 100,
          fbtrace_id: 'AbCdEf123456'
        }
      })
    });

    const adapter = new MetaWhatsAppCloudAdapter({
      ...dummyConfig,
      fetchFn: mockFetch as unknown as typeof fetch
    });

    const result = await adapter.send({
      to: '+919876543210',
      text: 'Order confirmed',
      template: {
        name: 'order_confirmation',
        language: { code: 'en' }
      }
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Template order_confirmation does not exist in en');
  });
});

describe('MockWhatsAppAdapter', () => {
  it('stores sent messages and limits ring buffer size', async () => {
    const adapter = new MockWhatsAppAdapter();

    const result = await adapter.send({
      to: '+919876543210',
      text: 'Test notification',
      template: {
        name: 'order_confirmation',
        language: { code: 'en' }
      }
    });

    expect(result.success).toBe(true);
    expect(result.mock).toBe(true);
    expect(result.messageId).toMatch(/^mock_wa_/);

    expect(adapter.sentMessages).toHaveLength(1);
    expect(adapter.sentMessages[0]?.template?.name).toBe('order_confirmation');
  });
});

describe('WhatsAppService', () => {
  it('sends whatsapp message via injected adapter', async () => {
    const adapter = new MockWhatsAppAdapter();
    const service = new WhatsAppService(adapter);

    const result = await service.send({
      to: '+919876543210',
      text: '*H&H Concierge* Your order has shipped!'
    });

    expect(result.success).toBe(true);
    expect(result.mock).toBe(true);
    expect(result.messageId).toMatch(/^mock_wa_/);

    expect(adapter.sentMessages).toHaveLength(1);
    expect(adapter.sentMessages[0]?.to).toBe('+919876543210');
    expect(adapter.sentMessages[0]?.text).toContain('Your order has shipped!');
  });

  it('rejects sending when missing recipient phone or text/template', async () => {
    const service = new WhatsAppService();

    const result = await service.send({
      to: '',
      text: 'Hello'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Recipient phone and message text or template are required');
  });
});
