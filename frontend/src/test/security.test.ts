import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  api,
  clearVaultToken,
  resolveDocumentFileUrl,
  setVaultToken,
} from '../services/api';

describe('resolveDocumentFileUrl', () => {
  it('přijímá pouze relativní cesty v rámci uploads', () => {
    expect(resolveDocumentFileUrl('documents/2026/01/faktura.pdf')).toBe('/uploads/documents/2026/01/faktura.pdf');
    expect(resolveDocumentFileUrl('/uploads/documents/a.pdf')).toBe('/uploads/documents/a.pdf');
    expect(resolveDocumentFileUrl('manual_entry')).toBeNull();
    expect(resolveDocumentFileUrl(null)).toBeNull();
  });

  it('odmítá externí, data: a javascript: URL (ochrana proti injekci odkazu)', () => {
    expect(resolveDocumentFileUrl('https://evil.example/track')).toBeNull();
    expect(resolveDocumentFileUrl('data:text/html;base64,PHNjcmlwdD4=')).toBeNull();
    expect(resolveDocumentFileUrl('javascript:alert(1)')).toBeNull();
  });
});

describe('apiFetch – cookie autentifikace', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearVaultToken();
    document.cookie = 'hestia_csrf=; max-age=0';
    document.cookie = 'hestia_csrf=csrf-token-123';
  });

  it('posílá cookies a CSRF hlavičku při API volání', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    } as Response);

    await api.getRecipes();

    const [url, init] = vi.mocked(window.fetch).mock.calls[0];
    expect(url).toContain('/api/v1/recipes');
    expect(init?.credentials).toBe('include');
    expect((init?.headers as Record<string, string>)['X-CSRF-Token']).toBe('csrf-token-123');
  });

  it('posílá X-Vault-Token, pokud byl trezor odemčen', async () => {
    setVaultToken('short-lived-vault-token');
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    } as Response);

    await api.getRecipes();

    const [, init] = vi.mocked(window.fetch).mock.calls[0];
    expect((init?.headers as Record<string, string>)['X-Vault-Token']).toBe('short-lived-vault-token');
  });
});
