import { describe, expect, it } from 'vitest';
import { extractCode } from '~/lib/extract';
import { extractVerificationLink } from '~/lib/extract-link';
import { linkFixtures } from './fixtures/emails';

describe('extractVerificationLink', () => {
  for (const fixture of linkFixtures) {
    it(fixture.name, () => {
      const link = extractVerificationLink(fixture.subject, fixture.body, fixture.html);
      expect(link?.url ?? null).toBe(fixture.url);
      if (fixture.code !== undefined) {
        expect(extractCode(fixture.subject, fixture.body)).toBe(fixture.code);
      }
    });
  }
});