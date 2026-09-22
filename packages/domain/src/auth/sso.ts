export type SSOProviderType = 'google' | 'zoho';

export interface OAuthStatePayload {
  provider: SSOProviderType;
  nonce: string;
  returnTo?: string | undefined;
  createdAt: number;
}

export interface SSOProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Checks if an email address belongs to the specified domain.
 * Example: isEmailInDomain('admin@handh.in', 'handh.in') === true
 */
export function isEmailInDomain(email: string, domain: string): boolean {
  if (!email || !domain) return false;
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedDomain = domain.trim().toLowerCase().replace(/^@/, '');
  const emailParts = normalizedEmail.split('@');
  if (emailParts.length !== 2) return false;
  const emailDomain = emailParts[1];
  if (!emailDomain) return false;
  return emailDomain === normalizedDomain || emailDomain.endsWith(`.${normalizedDomain}`);
}

/**
 * Verifies if an email is authorized for admin access based on allowed corporate domains
 * or explicit email whitelists.
 */
export function isEmailAuthorizedForAdmin(
  email: string,
  allowedDomains: readonly string[] = [],
  allowedEmails: readonly string[] = []
): boolean {
  if (!email) return false;
  const normalizedEmail = email.trim().toLowerCase();

  // Check explicit email whitelist
  const isExplicitlyAllowed = allowedEmails.some(
    (allowed) => allowed.trim().toLowerCase() === normalizedEmail
  );
  if (isExplicitlyAllowed) return true;

  // Check allowed corporate domains
  return allowedDomains.some((domain) => isEmailInDomain(normalizedEmail, domain));
}
