import { describe, it, expect } from 'vitest';
import { isPrintAllowed, getUpdatedProgress } from '../../src/domain/print-lock-validator';

describe('print-lock-validator', () => {
  it('allows print when progress < target and status is active', () => {
    expect(isPrintAllowed(5, 10, 'active')).toBe(true);
  });

  it('allows print when status is in-progress', () => {
    expect(isPrintAllowed(5, 10, 'in-progress')).toBe(true);
  });

  it('blocks print when progress >= target', () => {
    expect(isPrintAllowed(10, 10, 'active')).toBe(false);
  });

  it('blocks print when status is not active or in-progress', () => {
    expect(isPrintAllowed(5, 10, 'done')).toBe(false);
    expect(isPrintAllowed(5, 10, 'pending')).toBe(false);
  });

  it('updates progress correctly', () => {
    expect(getUpdatedProgress(5, 3, 10)).toBe(8);
  });

  it('clamps progress to target — cannot exceed quota', () => {
    expect(getUpdatedProgress(8, 5, 10)).toBe(10);
  });
});
