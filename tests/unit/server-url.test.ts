import { describe, expect, it } from 'vitest';
import { normalizeServerUrl } from '../../src/settings/server-url';

describe('normalizeServerUrl', () => {
  it('removes a trailing slash and preserves an optional base path', () => {
    expect(normalizeServerUrl('https://api.example.com/v1/')).toBe('https://api.example.com/v1');
  });

  it('allows an empty value to clear the setting', () => {
    expect(normalizeServerUrl('  ')).toBe('');
  });

  it('rejects credentials in the URL', () => {
    expect(() => normalizeServerUrl('https://user:secret@api.example.com')).toThrow('Do not include');
  });

  it('rejects query strings and fragments', () => {
    expect(() => normalizeServerUrl('https://api.example.com?token=secret')).toThrow('query string');
    expect(() => normalizeServerUrl('https://api.example.com#settings')).toThrow('query string');
  });
});
