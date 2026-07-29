import { describe, expect, it } from 'vitest';
import { normalizeMrNumber, patientHandoverWriteSchema } from './schemas.js';

describe('normalizeMrNumber', () => {
  it('normalizes spacing and case', () => {
    expect(normalizeMrNumber(' mr-123 /ab ')).toBe('MR123AB');
  });
});

describe('patientHandoverWriteSchema', () => {
  it('requires patient name and MR number', () => {
    const result = patientHandoverWriteSchema.safeParse({
      patientName: '',
      mrNumberDisplay: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts minimal valid payload', () => {
    const result = patientHandoverWriteSchema.safeParse({
      patientName: 'Synthetic Patient A',
      mrNumberDisplay: 'SYN-001',
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown properties', () => {
    const result = patientHandoverWriteSchema.safeParse({
      patientName: 'Synthetic Patient A',
      mrNumberDisplay: 'SYN-001',
      unexpected: true,
    });
    expect(result.success).toBe(false);
  });
});
