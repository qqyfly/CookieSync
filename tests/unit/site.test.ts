import { describe, expect, it } from 'vitest';
import { normalizeSiteUrl } from '../../src/sites/site';

describe('normalizeSiteUrl', () => {
  it('normalizes a hostname to an HTTPS origin', () => {
    expect(normalizeSiteUrl('example.com/path')).toBe('https://example.com');
  });

  it('preserves an explicit HTTP origin and port', () => {
    expect(normalizeSiteUrl('http://localhost:3000')).toBe('http://localhost:3000');
  });

  it('rejects unsupported protocols', () => {
    expect(() => normalizeSiteUrl('javascript:alert(1)')).toThrow('Only HTTP and HTTPS');
  });

  it('rejects credentials embedded in the URL', () => {
    expect(() => normalizeSiteUrl('https://user:secret@example.com')).toThrow('must not contain');
  });

  it('rejects an empty address', () => {
    expect(() => normalizeSiteUrl('  ')).toThrow('Enter a website address');
  });
});
