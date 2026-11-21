export const API_BASE = '/api/v1';
const VAULT_TOKEN_KEY = 'hestia_vault_token';

/**
 * Token pro trezor je vydáván serverem po úspěšném zadání PINu.
 * Uchováváme ho pouze v sessionStorage (žije jen po dobu karty prohlížeče)
 * a posíláme jako hlavičku – nikdy jako query parametr.
 */
export const setVaultToken = (token: string): void => {
  sessionStorage.setItem(VAULT_TOKEN_KEY, token);
};

export const clearVaultToken = (): void => {
  sessionStorage.removeItem(VAULT_TOKEN_KEY);
};

export const hasVaultToken = (): boolean => {
  return Boolean(sessionStorage.getItem(VAULT_TOKEN_KEY));
};

/** Pouze relativní cesty v rámci uploadů – brání externím/data: URL ze serveru. */
export const resolveDocumentFileUrl = (filePath?: string | null): string | null => {
  if (!filePath || filePath === 'manual_entry') return null;
  const trimmed = filePath.trim();
  if (!trimmed || /^(https?:|data:|javascript:)/i.test(trimmed)) return null;
  const clean = trimmed.replace(/^\/+/, '');
  if (clean.startsWith('uploads/')) return `/${clean}`;
  return `/uploads/${clean}`;
};

const withVaultToken = (headers: Record<string, string>): Record<string, string> => {
  const vaultToken = sessionStorage.getItem(VAULT_TOKEN_KEY);
  if (vaultToken) headers['X-Vault-Token'] = vaultToken;
  return headers;
};

/** CSRF token je v ne-httpOnly cookie (double-submit pattern). */
const getCsrfToken = (): string | null => {
  const match = document.cookie.match(/(?:^|;\s*)hestia_csrf=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
};

export const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const csrf = getCsrfToken();
  if (csrf) headers['X-CSRF-Token'] = csrf;
  return withVaultToken(headers);
};

export const getAuthOnlyHeaders = () => {
  const headers: Record<string, string> = {};
  const csrf = getCsrfToken();
  if (csrf) headers['X-CSRF-Token'] = csrf;
  return withVaultToken(headers);
};

/**
 * Společný wrapper pro všechna API volání:
 * - cookies se posílají automaticky (httpOnly access token),
 * - při 401 se jednou zkusí obnovit access token přes refresh cookie,
 * - přihlašovací/refresh volání jsou vyňata, aby nedošlo ke smyčce.
 */
export const apiFetch = async (url: string, init?: RequestInit): Promise<Response> => {
  const doFetch = () => window.fetch(url, { ...init, credentials: 'include' });
  const first = await doFetch();
  if (first.status === 401 && !url.includes('/auth/') && !url.includes('/vault/verify')) {
    const refresh = await window.fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refresh.ok) return doFetch();
  }
  return first;
};
