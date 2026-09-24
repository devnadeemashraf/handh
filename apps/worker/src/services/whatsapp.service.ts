import type { WhatsAppTemplatePayload } from '@hh/domain';

export interface SendWhatsAppOptions {
  to: string;
  text: string;
  template?: WhatsAppTemplatePayload | undefined;
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
  template?: WhatsAppTemplatePayload | undefined;
  sentAt: Date;
}

export interface WhatsAppAdapter {
  send(options: SendWhatsAppOptions): Promise<SendWhatsAppResult>;
}

/**
 * Normalizes recipient phone number to E.164 digits format (without '+') as required by Meta Cloud API.
 * For 10-digit Indian numbers, prepends '91'.
 */
export function normalizeWhatsAppRecipientPhone(phone: string): string {
  const digits = phone.trim().replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  return digits;
}

export interface MetaWhatsAppCloudConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId?: string | undefined;
  apiVersion?: string | undefined;
  apiUrl?: string | undefined;
  fetchFn?: typeof fetch | undefined;
}

/**
 * Live Meta WhatsApp Cloud API adapter.
 * Uses official Graph API endpoint with approved HSM templates or session messages.
 */
export class MetaWhatsAppCloudAdapter implements WhatsAppAdapter {
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly apiVersion: string;
  private readonly apiUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(config: MetaWhatsAppCloudConfig) {
    if (!config.phoneNumberId || !config.accessToken) {
      throw new Error('MetaWhatsAppCloudAdapter requires phoneNumberId and accessToken.');
    }
    this.phoneNumberId = config.phoneNumberId;
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || 'v21.0';
    this.apiUrl = (config.apiUrl || 'https://graph.facebook.com').replace(/\/+$/, '');
    this.fetchFn = config.fetchFn || globalThis.fetch;
  }

  public async send(options: SendWhatsAppOptions): Promise<SendWhatsAppResult> {
    const recipient = normalizeWhatsAppRecipientPhone(options.to);
    if (!recipient) {
      return { success: false, error: 'Invalid recipient phone number.' };
    }

    const url = `${this.apiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;

    // Construct body: If approved HSM template is provided, use template message type
    const requestBody = options.template
      ? {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipient,
          type: 'template',
          template: options.template
        }
      : {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipient,
          type: 'text',
          text: {
            preview_url: false,
            body: options.text
          }
        };

    const res = await this.fetchFn(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok) {
      const errorObj = data['error'] as Record<string, unknown> | undefined;
      const errorMsg =
        (errorObj?.['message'] as string | undefined) || `HTTP ${res.status}: ${res.statusText}`;
      return {
        success: false,
        error: errorMsg
      };
    }

    const messages = data['messages'] as Array<{ id: string }> | undefined;
    const messageId = messages?.[0]?.id;

    return {
      success: true,
      messageId
    };
  }
}

export class MockWhatsAppAdapter implements WhatsAppAdapter {
  public readonly sentMessages: SentWhatsAppRecord[] = [];
  private readonly maxHistory = 100;

  public async send(options: SendWhatsAppOptions): Promise<SendWhatsAppResult> {
    const mockId = `mock_wa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (this.sentMessages.length >= this.maxHistory) {
      this.sentMessages.shift();
    }

    this.sentMessages.push({
      id: mockId,
      to: options.to,
      text: options.text,
      template: options.template,
      sentAt: new Date()
    });

    console.log(
      JSON.stringify({
        level: 'info',
        message: '[MOCK WHATSAPP SENT]',
        id: mockId,
        to: options.to,
        template: options.template?.name,
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

export interface WhatsAppServiceOptions {
  forceMock?: boolean | undefined;
  adapter?: WhatsAppAdapter | undefined;
  phoneNumberId?: string | undefined;
  accessToken?: string | undefined;
  businessAccountId?: string | undefined;
  apiVersion?: string | undefined;
  apiUrl?: string | undefined;
  fetchFn?: typeof fetch | undefined;
}

export class WhatsAppService {
  private readonly adapter: WhatsAppAdapter;
  private readonly isMock: boolean;

  constructor(options: WhatsAppServiceOptions | WhatsAppAdapter = {}) {
    if ('send' in options) {
      this.adapter = options;
      this.isMock = options instanceof MockWhatsAppAdapter;
    } else {
      const isTest = process.env['NODE_ENV'] === 'test';
      const forceMock = options.forceMock === true || isTest;
      const hasLiveCreds =
        Boolean(options.phoneNumberId) &&
        Boolean(options.accessToken) &&
        !options.accessToken?.includes('placeholder');

      if (options.adapter) {
        this.adapter = options.adapter;
        this.isMock = false;
      } else if (!forceMock && hasLiveCreds) {
        this.adapter = new MetaWhatsAppCloudAdapter({
          phoneNumberId: options.phoneNumberId!,
          accessToken: options.accessToken!,
          businessAccountId: options.businessAccountId,
          apiVersion: options.apiVersion,
          apiUrl: options.apiUrl,
          fetchFn: options.fetchFn
        });
        this.isMock = false;
      } else {
        this.adapter = new MockWhatsAppAdapter();
        this.isMock = true;
      }
    }
  }

  public getAdapter(): WhatsAppAdapter {
    return this.adapter;
  }

  public isMockMode(): boolean {
    return this.isMock;
  }

  /**
   * Dispatches a WhatsApp notification to a verified customer phone number.
   */
  public async send(options: SendWhatsAppOptions): Promise<SendWhatsAppResult> {
    if (!options.to || (!options.text && !options.template)) {
      return {
        success: false,
        error: 'Recipient phone and message text or template are required.'
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
