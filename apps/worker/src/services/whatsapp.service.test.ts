import { describe, expect, it } from 'vitest';

import { MockWhatsAppAdapter, WhatsAppService } from './whatsapp.service';

describe('WhatsAppService', () => {
  it('sends whatsapp message via adapter', async () => {
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

  it('rejects sending when missing recipient phone or text', async () => {
    const service = new WhatsAppService();

    const result = await service.send({
      to: '',
      text: 'Hello'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Recipient phone and message text are required');
  });
});
