import { describe, expect, it } from 'vitest';

import { EmailService } from './email.service';

describe('EmailService', () => {
  it('dispatches emails via mock provider in test mode', async () => {
    const service = new EmailService({
      apiKey: 're_placeholder_test',
      fromAddress: 'H&H Concierge <concierge@handh.local>',
      forceMock: true
    });

    const result = await service.send({
      to: 'fatima@example.com',
      subject: 'Order Confirmed: #HH-1001',
      html: '<h1>Order Confirmed</h1>',
      text: 'Order Confirmed'
    });

    expect(result.success).toBe(true);
    expect(result.mock).toBe(true);
    expect(result.messageId).toMatch(/^mock_mail_/);

    expect(service.sentEmails).toHaveLength(1);
    const sent = service.sentEmails[0]!;
    expect(sent.to).toEqual(['fatima@example.com']);
    expect(sent.subject).toBe('Order Confirmed: #HH-1001');
    expect(sent.from).toBe('H&H Concierge <concierge@handh.local>');
  });

  it('supports multiple recipients and custom sender', async () => {
    const service = new EmailService({ forceMock: true });

    const result = await service.send({
      to: ['admin1@handh.local', 'admin2@handh.local'],
      from: 'System <no-reply@handh.local>',
      subject: 'Admin Alert',
      html: '<p>New order</p>',
      text: 'New order'
    });

    expect(result.success).toBe(true);
    expect(service.sentEmails[0]?.to).toEqual(['admin1@handh.local', 'admin2@handh.local']);
    expect(service.sentEmails[0]?.from).toBe('System <no-reply@handh.local>');
  });
});
