// src/lib/cookies.ts

export const AUTH_COOKIE_NAME = 'adminToken';
export const DEFAULT_COOKIE_MAX_AGE = 30 * 60; // 30 minutes in seconds

/**
 * Set the authentication token cookie in the browser
 */
export function setAuthCookie(token: string, maxAgeSeconds = DEFAULT_COOKIE_MAX_AGE): void {
  if (typeof document === 'undefined') return;

  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';

  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(
    token
  )}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secureFlag}`;
}

/**
 * Read the authentication token cookie from document.cookie
 */
export function getAuthCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${AUTH_COOKIE_NAME}=`));

  if (!match) return null;
  return decodeURIComponent(match.split('=')[1] || '');
}

/**
 * Remove the authentication token cookie
 */
export function removeAuthCookie(): void {
  if (typeof document === 'undefined') return;

  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';

  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
}
