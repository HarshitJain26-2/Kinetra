import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { colors, spacing, borderRadius } from '../src/theme';

describe('Design System & Theme Tokens Test', () => {
  it('defines core luxury dark palette tokens correctly', () => {
    assert.equal(colors.background, '#050607');
    assert.equal(colors.backgroundOnyx, '#0A0A0B');
    assert.equal(colors.surface, '#111315');
    assert.equal(colors.card, '#17191B');
    assert.equal(colors.gold, '#D9B83F');
    assert.equal(colors.goldBright, '#F0C83E');
    assert.equal(colors.crimson, '#E63946');
    assert.equal(colors.primaryText, '#F4F1EA');
  });

  it('follows 8px spatial grid guidelines', () => {
    assert.equal(spacing.xs, 4);
    assert.equal(spacing.sm, 8);
    assert.equal(spacing.md, 16);
    assert.equal(spacing.lg, 24);
    assert.equal(spacing.xl, 32);
    assert.equal(spacing.xxl, 48);
  });

  it('defines technical corner radius tokens', () => {
    assert.equal(borderRadius.sm, 4);
    assert.equal(borderRadius.lg, 8);
    assert.equal(borderRadius.full, 9999);
  });
});
