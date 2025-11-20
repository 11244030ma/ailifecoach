/**
 * Tests for session management with timeout and state preservation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SessionManager } from './sessionManager.js';
import { SessionTimeoutError } from './errorHandling.js';

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    vi.useFakeTimers();
    sessionManager = new SessionManager({ timeoutMs: 1000, warningMs: 800 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionManager.clear();
  });

  describe('createSession', () => {
    it('should create a new session', () => {
      const session = sessionManager.createSession('user123', 'session1');
      
      expect(session.id).toBe('session1');
      expect(session.userId).toBe('user123');
      expect(session.context.conversationHistory).toEqual([]);
    });

    it('should initialize session with default context', () => {
      const session = sessionManager.createSession('user123', 'session1');
      
      expect(session.context.currentIntent.type).toBe('profile_building');
      expect(session.context.activeTopics).toEqual([]);
      expect(session.context.pendingActions).toEqual([]);
    });
  });

  describe('getSession', () => {
    it('should retrieve an existing session', () => {
      sessionManager.createSession('user123', 'session1');
      
      const session = sessionManager.getSession('session1');
      
      expect(session).not.toBeNull();
      expect(session?.id).toBe('session1');
    });

    it('should return null for non-existent session', () => {
      const session = sessionManager.getSession('nonexistent');
      
      expect(session).toBeNull();
    });
  });

  describe('updateActivity', () => {
    it('should update last activity timestamp', () => {
      const session = sessionManager.createSession('user123', 'session1');
      const originalActivity = session.lastActivity;
      
      vi.advanceTimersByTime(100);
      sessionManager.updateActivity('session1');
      
      const updatedSession = sessionManager.getSession('session1');
      expect(updatedSession?.lastActivity.getTime()).toBeGreaterThan(originalActivity.getTime());
    });

    it('should throw error for non-existent session', () => {
      expect(() => sessionManager.updateActivity('nonexistent')).toThrow(SessionTimeoutError);
    });

    it('should reset timeout timer', () => {
      sessionManager.createSession('user123', 'session1');
      
      // Advance time close to timeout
      vi.advanceTimersByTime(900);
      
      // Update activity (should reset timer)
      sessionManager.updateActivity('session1');
      
      // Advance time again (should not timeout yet)
      vi.advanceTimersByTime(900);
      
      const session = sessionManager.getSession('session1');
      expect(session).not.toBeNull();
    });
  });

  describe('isSessionTimedOut', () => {
    it('should return false for active session', () => {
      sessionManager.createSession('user123', 'session1');
      
      const timedOut = sessionManager.isSessionTimedOut('session1');
      
      expect(timedOut).toBe(false);
    });

    it('should return true after timeout period', () => {
      sessionManager.createSession('user123', 'session1');
      
      vi.advanceTimersByTime(1100);
      
      const timedOut = sessionManager.isSessionTimedOut('session1');
      
      expect(timedOut).toBe(true);
    });

    it('should return true for non-existent session', () => {
      const timedOut = sessionManager.isSessionTimedOut('nonexistent');
      
      expect(timedOut).toBe(true);
    });
  });

  describe('isSessionNearTimeout', () => {
    it('should return false for fresh session', () => {
      sessionManager.createSession('user123', 'session1');
      
      const nearTimeout = sessionManager.isSessionNearTimeout('session1');
      
      expect(nearTimeout).toBe(false);
    });

    it('should return true when approaching timeout', () => {
      sessionManager.createSession('user123', 'session1');
      
      vi.advanceTimersByTime(850);
      
      const nearTimeout = sessionManager.isSessionNearTimeout('session1');
      
      expect(nearTimeout).toBe(true);
    });

    it('should return false after timeout', () => {
      sessionManager.createSession('user123', 'session1');
      
      vi.advanceTimersByTime(1100);
      
      const nearTimeout = sessionManager.isSessionNearTimeout('session1');
      
      expect(nearTimeout).toBe(false);
    });
  });

  describe('preserveSessionState', () => {
    it('should preserve session context', () => {
      const session = sessionManager.createSession('user123', 'session1');
      session.context.activeTopics = ['career', 'skills'];
      
      sessionManager.preserveSessionState('session1');
      sessionManager.endSession('session1');
      
      const restored = sessionManager.restoreSession('user123', 'session1', 'session2');
      
      expect(restored?.context.activeTopics).toEqual(['career', 'skills']);
    });
  });

  describe('restoreSession', () => {
    it('should restore preserved session state', () => {
      const session = sessionManager.createSession('user123', 'session1');
      session.context.conversationHistory.push({
        id: 'msg1',
        sender: 'user',
        content: 'Hello',
        timestamp: new Date(),
      });
      
      sessionManager.preserveSessionState('session1');
      sessionManager.endSession('session1');
      
      const restored = sessionManager.restoreSession('user123', 'session1', 'session2');
      
      expect(restored).not.toBeNull();
      expect(restored?.id).toBe('session2');
      expect(restored?.context.conversationHistory).toHaveLength(1);
    });

    it('should return null if no preserved state exists', () => {
      const restored = sessionManager.restoreSession('user123', 'nonexistent', 'session2');
      
      expect(restored).toBeNull();
    });

    it('should clean up old preserved state after restoration', () => {
      sessionManager.createSession('user123', 'session1');
      sessionManager.preserveSessionState('session1');
      sessionManager.endSession('session1');
      
      sessionManager.restoreSession('user123', 'session1', 'session2');
      
      // Try to restore again - should fail
      const secondRestore = sessionManager.restoreSession('user123', 'session1', 'session3');
      expect(secondRestore).toBeNull();
    });
  });

  describe('endSession', () => {
    it('should remove session from active sessions', () => {
      sessionManager.createSession('user123', 'session1');
      
      sessionManager.endSession('session1');
      
      const session = sessionManager.getSession('session1');
      expect(session).toBeNull();
    });

    it('should preserve state before ending', () => {
      const session = sessionManager.createSession('user123', 'session1');
      session.context.activeTopics = ['test'];
      
      sessionManager.endSession('session1');
      
      const restored = sessionManager.restoreSession('user123', 'session1', 'session2');
      expect(restored?.context.activeTopics).toEqual(['test']);
    });
  });

  describe('getUserSessions', () => {
    it('should return all sessions for a user', () => {
      sessionManager.createSession('user123', 'session1');
      sessionManager.createSession('user123', 'session2');
      sessionManager.createSession('user456', 'session3');
      
      const userSessions = sessionManager.getUserSessions('user123');
      
      expect(userSessions).toHaveLength(2);
      expect(userSessions.every(s => s.userId === 'user123')).toBe(true);
    });

    it('should return empty array for user with no sessions', () => {
      const userSessions = sessionManager.getUserSessions('nonexistent');
      
      expect(userSessions).toEqual([]);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should remove expired sessions', () => {
      // Create session manager without automatic timeout for this test
      const manualSessionManager = new SessionManager({ timeoutMs: 10000, warningMs: 8000 });
      manualSessionManager.createSession('user123', 'session1');
      manualSessionManager.createSession('user123', 'session2');
      
      // Manually advance time past timeout but don't run timers
      vi.setSystemTime(Date.now() + 11000);
      
      const cleaned = manualSessionManager.cleanupExpiredSessions();
      
      expect(cleaned).toBe(2);
      expect(manualSessionManager.getSession('session1')).toBeNull();
      expect(manualSessionManager.getSession('session2')).toBeNull();
      
      manualSessionManager.clear();
    });

    it('should not remove active sessions', () => {
      sessionManager.createSession('user123', 'session1');
      
      vi.advanceTimersByTime(500);
      
      const cleaned = sessionManager.cleanupExpiredSessions();
      
      expect(cleaned).toBe(0);
      expect(sessionManager.getSession('session1')).not.toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      sessionManager.createSession('user123', 'session1');
      sessionManager.createSession('user456', 'session2');
      
      const session1 = sessionManager.getSession('session1');
      if (session1) {
        session1.context.activeTopics = ['test'];
      }
      sessionManager.preserveSessionState('session1');
      
      const stats = sessionManager.getStats();
      
      expect(stats.activeSessions).toBe(2);
      expect(stats.preservedStates).toBe(1);
      expect(stats.oldestSessionAge).toBeGreaterThanOrEqual(0);
    });

    it('should return null for oldest session age when no sessions', () => {
      const stats = sessionManager.getStats();
      
      expect(stats.activeSessions).toBe(0);
      expect(stats.oldestSessionAge).toBeNull();
    });
  });

  describe('automatic timeout', () => {
    it('should automatically end session after timeout', () => {
      sessionManager.createSession('user123', 'session1');
      
      vi.advanceTimersByTime(1100);
      
      const session = sessionManager.getSession('session1');
      expect(session).toBeNull();
    });

    it('should preserve state on automatic timeout', () => {
      const session = sessionManager.createSession('user123', 'session1');
      session.context.activeTopics = ['auto-timeout-test'];
      
      vi.advanceTimersByTime(1100);
      
      const restored = sessionManager.restoreSession('user123', 'session1', 'session2');
      expect(restored?.context.activeTopics).toEqual(['auto-timeout-test']);
    });
  });
});
