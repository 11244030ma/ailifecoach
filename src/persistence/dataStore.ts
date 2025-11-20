/**
 * Data persistence layer for WorkLife AI Coach
 */

import { UserProfile, Message, ActionStep } from '../models/core.js';
import { withRetry, validateDataIntegrity, DatabaseUnavailableError } from '../utils/errorHandling.js';
import { ValidationError, validateUserProfile } from '../utils/validation.js';

export interface ProgressEntry {
  userId: string;
  actionId: string;
  completedAt: Date;
  milestone?: string;
}

/**
 * DataStore interface defining methods for saving/retrieving profiles,
 * conversations, and progress tracking
 */
export interface DataStore {
  // Profile operations
  saveUserProfile(profile: UserProfile): Promise<void>;
  getUserProfile(userId: string): Promise<UserProfile | null>;
  
  // Conversation operations
  saveConversation(sessionId: string, messages: Message[]): Promise<void>;
  getConversationHistory(userId: string, limit?: number): Promise<Message[]>;
  
  // Progress tracking operations
  trackActionCompletion(userId: string, actionId: string): Promise<void>;
  getProgressHistory(userId: string): Promise<ProgressEntry[]>;
}

/**
 * In-memory implementation of DataStore for development
 * Can be replaced with database implementation later
 */
export class InMemoryDataStore implements DataStore {
  private profiles: Map<string, UserProfile> = new Map();
  private conversations: Map<string, Message[]> = new Map();
  private sessionToUser: Map<string, string> = new Map();
  private progressHistory: Map<string, ProgressEntry[]> = new Map();

  async saveUserProfile(profile: UserProfile): Promise<void> {
    return withRetry(async () => {
      // Validate profile data
      const validationErrors = validateUserProfile(profile);
      if (validationErrors.length > 0) {
        throw validationErrors[0]; // Throw first validation error
      }

      // Validate data integrity
      validateDataIntegrity(profile);

      // Deep clone to avoid reference issues
      const cloned = JSON.parse(JSON.stringify(profile));
      // Restore Date objects
      cloned.progress.lastUpdated = new Date(cloned.progress.lastUpdated);
      if (cloned.progress.milestones) {
        cloned.progress.milestones = cloned.progress.milestones.map((m: any) => ({
          ...m,
          targetDate: new Date(m.targetDate),
          completedDate: m.completedDate ? new Date(m.completedDate) : undefined
        }));
      }
      this.profiles.set(profile.userId, cloned);
    });
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return withRetry(async () => {
      // Validate userId
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        throw new ValidationError('User ID must be a non-empty string', 'userId', userId);
      }

      const profile = this.profiles.get(userId);
      if (!profile) {
        return null;
      }

      // Validate data integrity before returning
      try {
        validateDataIntegrity(profile);
      } catch (error) {
        // If data is corrupted, return null and log error
        console.error(`Data integrity error for user ${userId}:`, error);
        return null;
      }

      // Deep clone to avoid reference issues
      const cloned = JSON.parse(JSON.stringify(profile));
      // Restore Date objects
      cloned.progress.lastUpdated = new Date(cloned.progress.lastUpdated);
      if (cloned.progress.milestones) {
        cloned.progress.milestones = cloned.progress.milestones.map((m: any) => ({
          ...m,
          targetDate: new Date(m.targetDate),
          completedDate: m.completedDate ? new Date(m.completedDate) : undefined
        }));
      }
      return cloned;
    });
  }

  async saveConversation(sessionId: string, messages: Message[]): Promise<void> {
    return withRetry(async () => {
      // Validate inputs
      if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
        throw new ValidationError('Session ID must be a non-empty string', 'sessionId', sessionId);
      }

      if (!Array.isArray(messages)) {
        throw new ValidationError('Messages must be an array', 'messages', messages);
      }

      // Deep clone messages and restore Date objects
      const cloned = JSON.parse(JSON.stringify(messages));
      const restored = cloned.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }));
      this.conversations.set(sessionId, restored);
    });
  }

  async getConversationHistory(userId: string, limit?: number): Promise<Message[]> {
    return withRetry(async () => {
      // Validate userId
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        throw new ValidationError('User ID must be a non-empty string', 'userId', userId);
      }

      // Find all sessions for this user
      const userMessages: Message[] = [];
      
      for (const [sessionId, messages] of this.conversations.entries()) {
        const sessionUserId = this.sessionToUser.get(sessionId);
        if (sessionUserId === userId) {
          userMessages.push(...messages);
        }
      }
      
      // Sort by timestamp
      userMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      // Apply limit if specified
      if (limit !== undefined && limit > 0) {
        return userMessages.slice(-limit);
      }
      
      return userMessages;
    });
  }

  async trackActionCompletion(userId: string, actionId: string): Promise<void> {
    return withRetry(async () => {
      // Validate inputs
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        throw new ValidationError('User ID must be a non-empty string', 'userId', userId);
      }

      if (!actionId || typeof actionId !== 'string' || actionId.trim() === '') {
        throw new ValidationError('Action ID must be a non-empty string', 'actionId', actionId);
      }

      const entry: ProgressEntry = {
        userId,
        actionId,
        completedAt: new Date(),
      };
      
      const history = this.progressHistory.get(userId) || [];
      history.push(entry);
      this.progressHistory.set(userId, history);
      
      // Also update the user profile's completed actions
      const profile = await this.getUserProfile(userId);
      if (profile) {
        if (!profile.progress.completedActions.includes(actionId)) {
          profile.progress.completedActions.push(actionId);
          profile.progress.lastUpdated = new Date();
          await this.saveUserProfile(profile);
        }
      }
    });
  }

  async getProgressHistory(userId: string): Promise<ProgressEntry[]> {
    return withRetry(async () => {
      // Validate userId
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        throw new ValidationError('User ID must be a non-empty string', 'userId', userId);
      }

      return this.progressHistory.get(userId) || [];
    });
  }

  /**
   * Helper method to associate a session with a user
   * This is needed for conversation history retrieval
   */
  associateSessionWithUser(sessionId: string, userId: string): void {
    this.sessionToUser.set(sessionId, userId);
  }

  /**
   * Helper method to clear all data (useful for testing)
   */
  clear(): void {
    this.profiles.clear();
    this.conversations.clear();
    this.sessionToUser.clear();
    this.progressHistory.clear();
  }
}
