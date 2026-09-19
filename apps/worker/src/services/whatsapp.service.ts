export interface SendWhatsAppOptions {
  to: string;
  text: string;
}

export interface SendWhatsAppResult {
  success: boolean;
  messageId?: string | undefined;
  error?: string | undefined;
  mock?: boolean | undefined;
}

export interface SentWhatsAppRecord {
  id: string;
  to: string;
  text: string;
  sentAt: Date;
}

export interface WhatsAppAdapter {
  send(options: SendWhatsAppOptions): Promise<SendWhatsAppResult>;
}

export class MockWhatsAppAdapter implements WhatsAppAdapter {
  public readonly sentMessages: SentWhatsAppRecord[] = [];

  public async send(options: SendWhatsAppOptions): Promise<SendWhatsAppResult> {
    const mockId = `mock_wa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    this.sentMessages.push({
      id: mockId,
      to: options.to,
      text: options.text,
      sentAt: new Date()
    });

    console.log(
      JSON.stringify({
        level: 'info',
        message: '[MOCK WHATSAPP SENT]',
        id: mockId,
        to: options.to,
        preview: options.text.substring(0, 80) + '...'
      })
    );

    return {
      success: true,
      messageId: mockId,
      mock: true
    };
  }
}

export class WhatsAppService {
  private readonly adapter: WhatsAppAdapter;

  constructor(adapter?: WhatsAppAdapter) {
    this.adapter = adapter ?? new MockWhatsAppAdapter();
  }

  public getAdapter(): WhatsAppAdapter {
    return this.adapter;
  }

  /**
   * Dispatches a WhatsApp notification to a verified customer phone number.
   */
  public async send(options: SendWhatsAppOptions): Promise<SendWhatsAppResult> {
    if (!options.to || !options.text) {
      return {
        success: false,
        error: 'Recipient phone and message text are required.'
      };
    }

    try {
      return await this.adapter.send(options);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(
        JSON.stringify({
          level: 'error',
          message: 'WhatsApp delivery failed',
          to: options.to,
          error: errorMessage
        })
      );

      return {
        success: false,
        error: errorMessage
      };
    }
  }
}
