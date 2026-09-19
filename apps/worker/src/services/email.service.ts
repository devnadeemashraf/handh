import { Resend } from 'resend';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string | undefined;
  replyTo?: string | undefined;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string | undefined;
  error?: string | undefined;
  mock?: boolean | undefined;
}

export interface SentEmailRecord extends SendEmailOptions {
  id: string;
  sentAt: Date;
}

export class EmailService {
  private readonly resend: Resend | null = null;
  private readonly fromAddress: string;
  private readonly isMock: boolean;
  public readonly sentEmails: SentEmailRecord[] = [];

  constructor(
    options: {
      apiKey?: string | undefined;
      fromAddress?: string | undefined;
      forceMock?: boolean | undefined;
    } = {}
  ) {
    const apiKey = options.apiKey ?? process.env['RESEND_API_KEY'] ?? '';
    this.fromAddress =
      options.fromAddress ??
      process.env['EMAIL_FROM'] ??
      'H&H Luxury Concierge <concierge@handh.local>';

    // Use mock mode if explicitly requested, in test environment, or if using a placeholder key
    this.isMock =
      options.forceMock === true ||
      process.env['NODE_ENV'] === 'test' ||
      !apiKey ||
      apiKey.includes('placeholder');

    if (!this.isMock) {
      this.resend = new Resend(apiKey);
    }
  }

  /**
   * Sends an email via Resend (or in-memory mock when in development/test/placeholder mode).
   */
  public async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const from = options.from ?? this.fromAddress;
    const to = Array.isArray(options.to) ? options.to : [options.to];

    if (this.isMock || !this.resend) {
      const mockId = `mock_mail_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      this.sentEmails.push({
        ...options,
        to,
        from,
        id: mockId,
        sentAt: new Date()
      });

      console.log(
        JSON.stringify({
          level: 'info',
          message: '[MOCK EMAIL SENT]',
          id: mockId,
          to,
          subject: options.subject
        })
      );

      return {
        success: true,
        messageId: mockId,
        mock: true
      };
    }

    try {
      const sendPayload = {
        from,
        to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        ...(options.replyTo ? { replyTo: options.replyTo } : {})
      };
      const result = await this.resend.emails.send(sendPayload);

      if (result.error) {
        console.error(
          JSON.stringify({
            level: 'error',
            message: 'Resend API returned an error',
            error: result.error.message,
            name: result.error.name
          })
        );

        return {
          success: false,
          error: result.error.message
        };
      }

      return {
        success: true,
        messageId: result.data?.id
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(
        JSON.stringify({
          level: 'error',
          message: 'Failed to send email via Resend',
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
