import { describe, expect, it } from 'vitest';
import { content } from '../src/v2/data';
import { validateContent } from '../src/v2/core/content';

describe('contenu V2', () => {
  it('est cohérent', () => {
    expect(validateContent(content)).toEqual([]);
  });
  it('chaque famille a une carte à chaque ère', () => {
    for (const [f, eras] of Object.entries(content.familyCards)) eras.forEach((ids, e) => expect(ids.length, `${f} ère ${e}`).toBeGreaterThan(0));
  });
});
