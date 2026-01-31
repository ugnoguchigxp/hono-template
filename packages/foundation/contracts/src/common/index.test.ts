import { describe, it, expect } from 'vitest';
import { PaginationSchema, SortSchema, IdSchema, DateRangeSchema } from './index.js';

describe('Common Contracts', () => {
  describe('PaginationSchema', () => {
    it('should use default values', () => {
      const result = PaginationSchema.parse({});
      expect(result).toEqual({ page: 1, limit: 20 });
    });

    it('should validate positive integers', () => {
      expect(PaginationSchema.parse({ page: '2', limit: '50' })).toEqual({ page: 2, limit: 50 });
      expect(() => PaginationSchema.parse({ page: 0 })).toThrow();
      expect(() => PaginationSchema.parse({ limit: 101 })).toThrow();
    });
  });

  describe('SortSchema', () => {
    it('should validate direction', () => {
      expect(SortSchema.parse({ field: 'name', direction: 'desc' })).toEqual({ field: 'name', direction: 'desc' });
      expect(SortSchema.parse({ field: 'id' }).direction).toBe('asc');
      expect(() => SortSchema.parse({ field: 'name', direction: 'invalid' })).toThrow();
    });
  });

  describe('IdSchema', () => {
    it('should validate UUIDs', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(IdSchema.parse(validUuid)).toBe(validUuid);
      expect(() => IdSchema.parse('not-a-uuid')).toThrow();
    });
  });

  describe('DateRangeSchema', () => {
    it('should validate ISO datetimes', () => {
      const validDate = new Date().toISOString();
      expect(DateRangeSchema.parse({ from: validDate })).toEqual({ from: validDate });
      expect(() => DateRangeSchema.parse({ from: 'invalid-date' })).toThrow();
    });
  });
});
