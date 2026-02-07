import {
  isHandleReserved,
  isHandleValidFormat,
  normalizeHandle,
  sanitizeHandleInput,
} from '../handlePolicy';

describe('handlePolicy', () => {
  it('normalizes handles to lowercase alphanumeric underscore', () => {
    expect(normalizeHandle('Al.Ex-User!')).toBe('alexuser');
  });

  it('validates handle format', () => {
    expect(isHandleValidFormat('alex_01')).toBe(true);
    expect(isHandleValidFormat('ALEx')).toBe(false);
    expect(isHandleValidFormat('ab')).toBe(false);
  });

  it('rejects reserved handles and prefixes', () => {
    expect(isHandleReserved('admin')).toBe(true);
    expect(isHandleReserved('support_team')).toBe(true);
    expect(isHandleReserved('alex')).toBe(false);
  });

  it('sanitizes handle input and reports unsupported characters', () => {
    expect(sanitizeHandleInput('Alex!_01')).toEqual({
      handle: 'alex_01',
      removedUnsupported: true,
    });
  });
});
