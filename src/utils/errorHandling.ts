/**
 * Error handling and recovery utilities for WorkLife AI Coach
 */

export class WorkLifeError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'WorkLifeError';
  }
}

export class DataIntegrityError extends WorkLifeError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'DATA_INTEGRITY_ERROR', false, context);
    this.name = 'DataIntegrityError';
  }
}

export class SessionTimeoutError extends WorkLifeError {
  constructor(sessionId: string) {
    super(`Session ${sessionId} has timed out`, 'SESSION_TIMEOUT', true, { sessionId });
    this.name = 'SessionTimeoutError';
  }
}

export class MissingFieldError extends WorkLifeError {
  constructor(fields: string[]) {
    super(`Missing required fields: ${fields.join(', ')}`, 'MISSING_FIELDS', true, { fields });
    this.name = 'MissingFieldError';
  }
}

export class DatabaseUnavailableError extends WorkLifeError {
  constructor(operation: string) {
    super(`Database unavailable for operation: ${operation}`, 'DATABASE_UNAVAILABLE', true, { operation });
    this.name = 'DatabaseUnavailableError';
  }
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 100,
  backoffMultiplier: 2,
  maxDelayMs: 5000,
};

/**
 * Executes an async operation with retry logic for transient failures
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | undefined;
  let delay = finalConfig.delayMs;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry non-recoverable errors
      if (error instanceof WorkLifeError && !error.recoverable) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === finalConfig.maxAttempts) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      await sleep(delay);
      delay = Math.min(delay * finalConfig.backoffMultiplier, finalConfig.maxDelayMs);
    }
  }

  throw lastError;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wraps an operation with error handling and user-friendly error messages
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<{ success: true; data: T } | { success: false; error: string; recoverable: boolean }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    if (error instanceof WorkLifeError) {
      return {
        success: false,
        error: error.message,
        recoverable: error.recoverable,
      };
    }

    // Handle unknown errors
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      success: false,
      error: `${context}: ${errorMessage}`,
      recoverable: true,
    };
  }
}

/**
 * Validates data integrity for a user profile
 */
export function validateDataIntegrity(profile: any): void {
  // Check for null or undefined
  if (!profile) {
    throw new DataIntegrityError('Profile is null or undefined');
  }

  // Check for required top-level fields
  const requiredFields = ['userId', 'personalInfo', 'careerInfo', 'skills', 'mindset', 'progress'];
  for (const field of requiredFields) {
    if (!(field in profile)) {
      throw new DataIntegrityError(`Profile missing required field: ${field}`, { field });
    }
  }

  // Check for data type consistency
  if (typeof profile.userId !== 'string') {
    throw new DataIntegrityError('Profile userId must be a string', { userId: profile.userId });
  }

  // Check nested object integrity
  if (typeof profile.personalInfo !== 'object' || profile.personalInfo === null) {
    throw new DataIntegrityError('Profile personalInfo must be an object');
  }

  if (typeof profile.careerInfo !== 'object' || profile.careerInfo === null) {
    throw new DataIntegrityError('Profile careerInfo must be an object');
  }

  // Check array fields
  if (!Array.isArray(profile.careerInfo.goals)) {
    throw new DataIntegrityError('Profile careerInfo.goals must be an array');
  }

  if (!Array.isArray(profile.careerInfo.interests)) {
    throw new DataIntegrityError('Profile careerInfo.interests must be an array');
  }

  if (!Array.isArray(profile.careerInfo.struggles)) {
    throw new DataIntegrityError('Profile careerInfo.struggles must be an array');
  }

  // Check progress field
  if (!profile.progress.lastUpdated) {
    throw new DataIntegrityError('Profile progress.lastUpdated is required');
  }

  // Validate date fields
  if (profile.progress.lastUpdated && !(profile.progress.lastUpdated instanceof Date)) {
    throw new DataIntegrityError('Profile progress.lastUpdated must be a Date object');
  }
}

/**
 * Graceful degradation handler - provides fallback functionality
 */
export function getFallbackResponse(context: string): string {
  const fallbacks: Record<string, string> = {
    'career_path': 'I\'m having trouble generating specific career paths right now. Let\'s focus on understanding your current situation better. Can you tell me more about your goals and interests?',
    'skill_recommendation': 'I\'m experiencing some difficulty with skill recommendations at the moment. In the meantime, could you share what skills you\'re currently working on or interested in learning?',
    'action_steps': 'I\'m having trouble creating specific action steps right now. Let\'s start with a simple question: What\'s one thing you could do today to move closer to your goals?',
    'profile_analysis': 'I\'m having some technical difficulties analyzing your profile. Let\'s continue our conversation - tell me what\'s on your mind about your career.',
    'default': 'I\'m experiencing some technical difficulties, but I\'m still here to help. Let\'s continue our conversation - what would you like to discuss about your career?',
  };

  return fallbacks[context] || fallbacks['default'];
}
