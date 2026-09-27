import { describe, expect, it } from 'vitest';
import { extractCode } from '~/lib/extract';
import { emailFixtures } from './fixtures/emails';

describe('extractCode', () => {
  for (const fixture of emailFixtures) {
    it(fixture.name, () => {
      expect(extractCode(fixture.subject, fixture.body)).toBe(fixture.expect);
    });
  }
});
