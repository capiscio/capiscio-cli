import { describe, it, expect } from 'vitest';
import { ValidateCommand } from '../commands/validate';

describe('ValidateCommand Utilities', () => {
  describe('getStrictness', () => {
    it('should return strict for strict option', () => {
      const result = (ValidateCommand as any).getStrictness({ strict: true });
      expect(result).toBe('strict');
    });

    it('should return strict for registryReady option', () => {
      const result = (ValidateCommand as any).getStrictness({ registryReady: true });
      expect(result).toBe('strict');
    });

    it('should return conservative for conservative option', () => {
      const result = (ValidateCommand as any).getStrictness({ conservative: true });
      expect(result).toBe('conservative');
    });

    it('should return progressive by default', () => {
      const result = (ValidateCommand as any).getStrictness({});
      expect(result).toBe('progressive');
    });

    it('should prioritize strict over conservative', () => {
      const result = (ValidateCommand as any).getStrictness({ 
        strict: true, 
        conservative: true 
      });
      expect(result).toBe('strict');
    });

    it('should prioritize registryReady (strict) over conservative', () => {
      const result = (ValidateCommand as any).getStrictness({ 
        registryReady: true, 
        conservative: true 
      });
      expect(result).toBe('strict');
    });

    it('should handle undefined options gracefully', () => {
      // The function expects CLIOptions but we can test edge case
      const result = (ValidateCommand as any).getStrictness({ undefined: true } as any);
      expect(result).toBe('progressive');
    });

    it('should handle multiple options', () => {
      const result = (ValidateCommand as any).getStrictness({
        strict: true,
        conservative: true,
        registryReady: true,
        verbose: true,
        json: true
      });
      expect(result).toBe('strict');
    });
  });
});