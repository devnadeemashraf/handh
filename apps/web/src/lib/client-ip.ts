/**
 * Safely extracts client IP address from incoming requests behind reverse proxies (Caddy, Cloudflare, Nginx).
 * Protects against X-Forwarded-For header spoofing (E-COM-152).
 */
export function getClientIp(request: Request | Headers): string {
  const headers = request instanceof Headers ? request : request.headers;

  // 1. Caddy / Trusted reverse proxy real IP (highest priority, cannot be spoofed by client when configured)
  const realIp = headers.get('x-real-ip');
  if (realIp?.trim()) {
    return realIp.trim();
  }

  // 2. Cloudflare connecting IP
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp?.trim()) {
    return cfIp.trim();
  }

  // 3. X-Forwarded-For: inspect rightmost trusted proxy entry to avoid spoofing leftmost client headers
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor?.trim()) {
    const parts = xForwardedFor
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      // In reverse proxy topology, the reverse proxy appends the remote address to the right
      // The rightmost entry represents the peer connected directly to our trusted proxy
      const rightmost = parts[parts.length - 1];
      if (rightmost) return rightmost;
    }
  }

  return '127.0.0.1';
}
