/**
 * Session management with timeout and state preservation
 */

import { Session, SessionContext } from '../models/core.js';
import { SessionTimeoutError } from './errorHandling.js';

export interface SessionConfig {
  timeoutMs: number;
  warningMs: number;
}

const DEFAULT_SESSION_CONFIG: SessionConfig = {
  timeoutMs: 30 * 60 * 1000, // 30 minutes
  warningMs: 25 * 60 * 1000, // 25 minutes (5 min warning)
};

/**
 * Manages session lifecycle with timeout and state preservation
 */
export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private sessionTimers: Map<string, NodeJS.Timeout> = new Map();
  private preservedStates: Map<string, SessionContext> = new Map();
  private config: SessionConfig;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
  }

  /**
   * Creates a new session
   */
  createSession(userId: string, sessionId: string): Session {
    const session: Session = {
      id: sessionId,
      userId,
      startTime: new Date(),
      lastActivity: new Date(),
      context: {
        conversationHistory: [],
        currentIntent: {
          type: 'profile_building',
          confidence: 1.0,
          entities: {},
        },
        activeTopics: [],
        pendingActions: [],
      },
    };

    this.sessions.set(sessionId, session);
    this.startSessionTimer(sessionId);

    return session;
  }

  /**
   * Gets an active session
   */
  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      // Check if state was preserved
      const preservedState = this.preservedStates.get(sessionId);
      if (preservedState) {
        return null; // Session timed out but state is preserved
      }
      return null;
    }

    return session;
  }

  /**
   * Updates session activity timestamp
   */
  updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new SessionTimeoutError(sessionId);
    }

    session.lastActivity = new Date();
    
    // Reset the timeout timer
    this.resetSessionTimer(sessionId);
  }

  /**
   * Checks if a session has timed out
   */
  isSessionTimedOut(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return true;
    }

    const now = Date.now();
    const lastActivity = session.lastActivity.getTime();
    const elapsed = now - lastActivity;

    return elapsed >= this.config.timeoutMs;
  }

  /**
   * Checks if a session is approaching timeout (warning threshold)
   */
  isSessionNearTimeout(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return false;
    }

    const now = Date.now();
    const lastActivity = session.lastActivity.getTime();
    const elapsed = now - lastActivity;

    return elapsed >= this.config.warningMs && elapsed < this.config.timeoutMs;
  }

  /**
   * Preserves session state before timeout
   */
  preserveSessionState(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      // Deep clone the context to preserve it
      const preservedContext = JSON.parse(JSON.stringify(session.context));
      
      // Restore Date objects in conversation history
      if (preservedContext.conversationHistory) {
        preservedContext.conversationHistory = preservedContext.conversationHistory.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }

      this.preservedStates.set(sessionId, preservedContext);
    }
  }

  /**
   * Restores a preserved session state
   */
  restoreSession(userId: string, oldSessionId: string, newSessionId: string): Session | null {
    const preservedState = this.preservedStates.get(oldSessionId);
    
    if (!preservedState) {
      return null;
    }

    // Create new session with preserved state
    const session: Session = {
      id: newSessionId,
      userId,
      startTime: new Date(),
      lastActivity: new Date(),
      context: preservedState,
    };

    this.sessions.set(newSessionId, session);
    this.startSessionTimer(newSessionId);
    
    // Clean up old preserved state
    this.preservedStates.delete(oldSessionId);

    return session;
  }

  /**
   * Ends a session and cleans up resources
   */
  endSession(sessionId: string): void {
    // Preserve state before ending
    this.preserveSessionState(sessionId);
    
    // Clear timer
    const timer = this.sessionTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.sessionTimers.delete(sessionId);
    }

    // Remove session
    this.sessions.delete(sessionId);
  }

  /**
   * Gets all active sessions for a user
   */
  getUserSessions(userId: string): Session[] {
    const userSessions: Session[] = [];
    
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        userSessions.push(session);
      }
    }

    return userSessions;
  }

  /**
   * Cleans up expired sessions
   */
  cleanupExpiredSessions(): number {
    let cleanedCount = 0;
    const now = Date.now();

    for (const [sessionId, session] of this.sessions.entries()) {
      const elapsed = now - session.lastActivity.getTime();
      
      if (elapsed >= this.config.timeoutMs) {
        this.endSession(sessionId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Gets session statistics
   */
  getStats(): {
    activeSessions: number;
    preservedStates: number;
    oldestSessionAge: number | null;
  } {
    const now = Date.now();
    let oldestAge: number | null = null;

    for (const session of this.sessions.values()) {
      const age = now - session.startTime.getTime();
      if (oldestAge === null || age > oldestAge) {
        oldestAge = age;
      }
    }

    return {
      activeSessions: this.sessions.size,
      preservedStates: this.preservedStates.size,
      oldestSessionAge: oldestAge,
    };
  }

  /**
   * Clears all sessions and preserved states (useful for testing)
   */
  clear(): void {
    // Clear all timers
    for (const timer of this.sessionTimers.values()) {
      clearTimeout(timer);
    }

    this.sessions.clear();
    this.sessionTimers.clear();
    this.preservedStates.clear();
  }

  // Private helper methods

  private startSessionTimer(sessionId: string): void {
    const timer = setTimeout(() => {
      this.handleSessionTimeout(sessionId);
    }, this.config.timeoutMs);

    this.sessionTimers.set(sessionId, timer);
  }

  private resetSessionTimer(sessionId: string): void {
    // Clear existing timer
    const existingTimer = this.sessionTimers.get(sessionId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Start new timer
    this.startSessionTimer(sessionId);
  }

  private handleSessionTimeout(sessionId: string): void {
    // Preserve state and end session
    this.endSession(sessionId);
  }
}
