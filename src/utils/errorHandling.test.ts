/**
 * Tests for error handling utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  WorkLifeError,
  DataIntegrityError,
  SessionTimeoutError,
  MissingFieldError,
  DatabaseUnavailableError,
  withRetry,
  withErrorHandling,
  validateDataIntegrity,
  getFallbackResponse,
} from './errorHandling.js';

describe('WorkLifeError', () => {
  it('should create error with correct properties', () => {
    const error = new WorkLifeError('Test error', 'TEST_CODE', true, { key: 'value' });
    
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.recoverable).toBe(true);
    expect(error.context).toEqual({ key: 'value' });
  });
});

describe('DataIntegrityError', () => {
  it('should create non-recoverable error', () => {
    const error = new DataIntegrityError('Data corrupted');
    
    expect(error.recoverable).toBe(false);
    expect(error.code).toBe('DATA_INTEGRITY_ERROR');
  });
});

describe('SessionTimeoutError', () => {
  it('should create recoverable error with session ID', () => {
    const error = new SessionTimeoutError('session123');
    
    expect(error.recoverable).toBe(true);
    expect(error.context?.sessionId).toBe('session123');
  });
});

describe('withRetry', () => {
  it('should succeed on first attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    
    const result = await withRetry(operation);
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on transient failure', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Transient error'))
      .mockResolvedValue('success');
    
    const result = await withRetry(operation, { delayMs: 10 });
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should not retry non-recoverable errors', async () => {
    const error = new DataIntegrityError('Data corrupted');
    const operation = vi.fn().mockRejectedValue(error);
    
    await expect(withRetry(operation)).rejects.toThrow(DataIntegrityError);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should throw after max attempts', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Persistent error'));
    
    await expect(withRetry(operation, { maxAttempts: 3, delayMs: 10 })).rejects.toThrow('Persistent error');
    expect(operation).toHaveBeenCalledTimes(3);
  });
});

describe('withErrorHandling', () => {
  it('should return success result', async () => {
    const operation = vi.fn().mockResolvedValue('data');
    
    const result = await withErrorHandling(operation, 'Test operation');
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('data');
    }
  });

  it('should return error result for WorkLifeError', async () => {
    const error = new WorkLifeError('Test error', 'TEST_CODE', true);
    const operation = vi.fn().mockRejectedValue(error);
    
    const result = await withErrorHandling(operation, 'Test operation');
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Test error');
      expect(result.recoverable).toBe(true);
    }
  });

  it('should return error result for unknown error', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Unknown error'));
    
    const result = await withErrorHandling(operation, 'Test operation');
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Test operation');
      expect(result.error).toContain('Unknown error');
      expect(result.recoverable).toBe(true);
    }
  });
});

describe('validateDataIntegrity', () => {
  it('should pass for valid profile', () => {
    const profile = {
      userId: 'user123',
      personalInfo: { age: 28 },
      careerInfo: {
        goals: [],
        interests: [],
        struggles: [],
      },
      skills: {},
      mindset: {},
      progress: {
        lastUpdated: new Date(),
      },
    };
    
    expect(() => validateDataIntegrity(profile)).not.toThrow();
  });

  it('should throw for null profile', () => {
    expect(() => validateDataIntegrity(null)).toThrow(DataIntegrityError);
  });

  it('should throw for missing required field', () => {
    const profile = {
      userId: 'user123',
      personalInfo: {},
      careerInfo: {},
      skills: {},
      mindset: {},
      // missing progress
    };
    
    expect(() => validateDataIntegrity(profile)).toThrow(DataIntegrityError);
  });

  it('should throw for invalid userId type', () => {
    const profile = {
      userId: 123,
      personalInfo: {},
      careerInfo: {},
      skills: {},
      mindset: {},
      progress: {},
    };
    
    expect(() => validateDataIntegrity(profile)).toThrow(DataIntegrityError);
  });

  it('should throw for invalid array field', () => {
    const profile = {
      userId: 'user123',
      personalInfo: {},
      careerInfo: {
        goals: 'not an array',
        interests: [],
        struggles: [],
      },
      skills: {},
      mindset: {},
      progress: {
        lastUpdated: new Date(),
      },
    };
    
    expect(() => validateDataIntegrity(profile)).toThrow(DataIntegrityError);
  });
});

describe('getFallbackResponse', () => {
  it('should return specific fallback for known context', () => {
    const response = getFallbackResponse('career_path');
    
    expect(response).toContain('career paths');
    expect(response.length).toBeGreaterThan(0);
  });

  it('should return default fallback for unknown context', () => {
    const response = getFallbackResponse('unknown_context');
    
    expect(response).toContain('technical difficulties');
    expect(response.length).toBeGreaterThan(0);
  });

  it('should return different messages for different contexts', () => {
    const careerResponse = getFallbackResponse('career_path');
    const skillResponse = getFallbackResponse('skill_recommendation');
    
    expect(careerResponse).not.toBe(skillResponse);
  });
});
