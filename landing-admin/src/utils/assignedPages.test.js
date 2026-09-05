import { describe, expect, it } from 'vitest';
import {
  filterUnselectedPages,
  pageMatchesQuery,
  parsePageIdsInput,
  resolveSelectedPages,
} from './assignedPages';

const options = [
  { id: 'maria-garcia', name: 'María García' },
  { id: 'ana-lopez', name: 'Ana López' },
  { id: 'leftsidedev', name: 'LeftSideDev' },
];

describe('assignedPages', () => {
  it('parses comma, newline, and array page ids without duplicates', () => {
    expect(parsePageIdsInput('maria-garcia, ana-lopez\nleftsidedev, maria-garcia'))
      .toEqual(['maria-garcia', 'ana-lopez', 'leftsidedev']);
    expect(parsePageIdsInput([' ana-lopez ', '', 'ana-lopez'])).toEqual(['ana-lopez']);
  });

  it('filters unselected pages by name or id', () => {
    expect(pageMatchesQuery(options[0], 'maria')).toBe(true);
    expect(filterUnselectedPages(options, ['ana-lopez'], 'left').map((page) => page.id))
      .toEqual(['leftsidedev']);
  });

  it('keeps selected ids even if the page list no longer includes them', () => {
    expect(resolveSelectedPages(options, ['ana-lopez', 'missing-page'])).toEqual([
      { id: 'ana-lopez', name: 'Ana López' },
      { id: 'missing-page', name: 'missing-page' },
    ]);
  });
});
