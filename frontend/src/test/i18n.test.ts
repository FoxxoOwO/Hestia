import { describe, expect, it } from 'vitest';
import cs from '../i18n/cs.json';
import en from '../i18n/en.json';

describe('i18n', () => {
  it('neobsahuje veřejně známý výchozí PIN trezoru', () => {
    expect(JSON.stringify(cs)).not.toContain('výchozí: 1234');
    expect(JSON.stringify(en)).not.toContain('default: 1234');
    expect(cs.documents.vault_modal_footer).toBeTruthy();
    expect(en.documents.vault_modal_footer).toBeTruthy();
  });

  it('má v obou jazycích stejné klíče', () => {
    const flatten = (obj: Record<string, unknown>, prefix = ''): string[] =>
      Object.entries(obj).flatMap(([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        return value && typeof value === 'object' && !Array.isArray(value)
          ? flatten(value as Record<string, unknown>, path)
          : [path];
      });

    const csKeys = flatten(cs as unknown as Record<string, unknown>).sort();
    const enKeys = flatten(en as unknown as Record<string, unknown>).sort();
    expect(csKeys).toEqual(enKeys);
  });
});
