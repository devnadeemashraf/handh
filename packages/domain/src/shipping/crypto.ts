/**
 * Performs a constant-time comparison of two strings to prevent timing attack vulnerabilities (E-COM-071).
 * Safe across all runtime environments (Node.js, Edge, Browser, Webpack) without node: scheme imports.
 * Returns false immediately if either string is empty, null, or undefined.
 */
export function verifySecretTimingSafe(
  provided: string | undefined | null,
  expected: string | undefined | null
): boolean {
  if (!provided || !expected) {
    return false;
  }

  if (provided.length !== expected.length) {
    return false;
  }

  // Constant-time bitwise character code XOR accumulation without early returns
  let mismatch = 0;
  for (let i = 0; i < provided.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }

  return mismatch === 0;
}
