/**
 * Integration tests for the Coaching Engine
 * Tests the complete flow from user input to formatted response
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CoachingEngine } from './coachingEngine.js';
import { InMemoryDataStore } from './persistence/dataStore.js';
import { UserProfile, Goal, Challenge, Skill } from './models/core.js';

describe('CoachingEngine Integration', () => {
  let engine: CoachingEngine;
  let dataStore: InMemoryDataStore;
  let testUserId: string;

  beforeEach(() => {
    dataStore = new InMemoryDataStore();
    engine = new CoachingEngine(dataStore);
    testUserId = 'test-user-123';
  });

  describe('Basic Flow', () => {
    it('should process a career clarity request', async () => {
      // Create a test user profile
      const profile: UserProfile = createTestProfile(testUserId);
      await dataStore.saveUserProfile(profile);

      const request = {
        userId: testUserId,
        message: 'I\'m confused about what career path to take'
      };

      const response = await engine.processRequest(request);

      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
      expect(response.sessionId).toBeTruthy();
      expect(response.intent.type).toBe('career_clarity');
      expect(response.recommendations?.careerPaths).toBeDefined();
      expect(response.recommendations!.careerPaths!.length).toBeGreaterThan(0);
    });

    it('should process a skill guidance request', async () => {
      const profile: UserProfile = createTestProfile(testUserId);
      // Add a career path
      profile.careerInfo.currentPath = {
        id: 'path-1',
        title: 'Software Engineering',
        description: 'Build software',
        reasoning: 'Good fit',
        fitScore: 0.8,
        requiredSkills: ['programming', 'algorithms'],
        timeToTransition: '6 months',
        growthPotential: 0.9
      };
      await dataStore.saveUserProfile(profile);

      const request = {
        userId: testUserId,
        message: 'What skills should I learn?'
      };

      const response = await engine.processRequest(request);

      expect(response.intent.type).toBe('skill_guidance');
      expect(response.recommendations?.skills).toBeDefined();
    });

    it('should process an action planning request', async () => {
      const profile: UserProfile = createTestProfile(testUserId);
      profile.careerInfo.goals.push({
        id: 'goal-1',
        description: 'Become a software engineer',
        type: 'long_term',
        priority: 1
      });
      await dataStore.saveUserProfile(profile);

      const request = {
        userId: testUserId,
        message: 'What should I do today?'
      };

      const response = await engine.processRequest(request);

      expect(response.intent.type).toBe('action_planning');
      expect(response.recommendations?.actions).toBeDefined();
    });
  });

  describe('Intent Recognition and Routing', () => {
    it('should recognize career clarity intent', async () => {
      const profile = createTestProfile(testUserId);
      await dataStore.saveUserProfile(profile);

      const response = await engine.processRequest({
        userId: testUserId,
        message: 'I don\'t know what career direction to take'
      });

      expect(response.intent.type).toBe('career_clarity');
    });

    it('should recognize skill guidance intent', async () => {
      const profile = createTestProfile(testUserId);
      await dataStore.saveUserProfile(profile);

      const response = await engine.processRequest({
        userId: testUserId,
        message: 'What skills do I need to learn?'
      });

      expect(response.intent.type).toBe('skill_guidance');
    });

    it('should recognize transition guidance intent', async () => {
      const profile = createTestProfile(testUserId);
      await dataStore.saveUserProfile(profile);

      const response = await engine.processRequest({
        userId: testUserId,
        message: 'I want to transition from marketing to data science'
      });

      expect(response.intent.type).toBe('transition_guidance');
    });

    it('should recognize mindset support intent', async () => {
      const profile = createTestProfile(testUserId);
      await dataStore.saveUserProfile(profile);

      const response = await engine.processRequest({
        userId: testUserId,
        message: 'I feel anxious and overwhelmed about my career'
      });

      expect(response.intent.type).toBe('mindset_support');
    });
  });

  describe('Mindset-First Ordering', () => {
    it('should prioritize mindset support when emotional content is detected', async () => {
      const profile = createTestProfile(testUserId);
      await dataStore.saveUserProfile(profile);

      const response = await engine.processRequest({
        userId: testUserId,
        message: 'I\'m really stressed and don\'t know what to do'
      });

      // Response should contain mindset support language
      expect(response.content.toLowerCase()).toMatch(/stress|anxious|support|together/);
      // Should still provide actionable guidance
      expect(response.content.length).toBeGreaterThan(50);
    });

    it('should address emotional content before tactical advice', async () => {
      const profile = createTestProfile(testUserId);
      await dataStore.saveUserProfile(profile);

      const response = await engine.processRequest({
        userId: testUserId,
        message: 'I feel lost and confused about my career path'
      });

      // Check that mindset support appears early in response
      const firstHalf = response.content.substring(0, response.content.length / 2);
      expect(firstHalf.toLowerCase()).toMatch(/lost|confused|clarity|uncertain/);
    });
  });

  describe('Recommendation Generation', () => {
    it('should generate career paths with reasoning', async () => {
      const profile = createTestProfile(testUserId);
      profile.careerInfo.interests = ['technology', 'problem solving'];
      await dataStore.saveUserProfile(profile);

      const response = await engine.processRequest({
        userId: testUserId,
        message: 'What career paths are good for me?'
      });

      expect(response.recommendations?.careerPaths).toBeDefined();
      const paths = response.recommendations!.careerPaths!;
      expect(paths.length).toBeGreaterThan(0);
      
      // Each path should have reasoning
      paths.forEach(path => {
        expect(path.reasoning).toBeTruthy();
        expect(path.reasoning.length).toBeGreaterThan(10);
      });
    });

    it('should generate skills with prioritization', async () => {
      const profile = createTestProfile(testUserId);
      profile.careerInfo.currentPath = {
        id: 'path-1',
        title: 'Data Science',
        description: 'Analyze data',
        reasoning: 'Good fit',
        fitScore: 0.8,
        requiredSkills: ['python', 'statistics', 'machine learning'],
        timeToTransition: '12 months',
        growthPotential: 0.9
      };
      await dataStore.saveUserProfile(profile);

      const response = await engine.processRequest({
        userId: testUserId,
        message: 'What skills should I focus on?'
      });

      expect(response.recommendations?.skills).toBeDefined();
      const skills = response.recommendations!.skills!;
      
      if (skills.length > 1) {
        // Skills should be ordered by priority
        for (let i = 0; i < skills.length - 1; i++) {
          expect(skills[i].priority).toBeGreaterThanOrEqual(skills[i + 1].priority);
        }
      }
    });

    it('should generate action steps with timeframes', async () => {
      const profile = createTestProfile(testUserId);
      profile.careerInfo.goals.push({
        id: 'goal-1',
        description: 'Learn programming',
        type: 'short_term',
        priority: 1
      });
      await dataStore.saveUserProfile(profile);

      const response = await engine.processRequest({
        userId: testUserId,
        message: 'What are my next steps?'
      });

      expect(response.recommendations?.actions).toBeDefined();
      const actions = response.recommendations!.actions!;
      
      // Each action should have a valid timeframe
      actions.forEach(action => {
        expect(['today', 'this_week', 'this_month']).toContain(action.timeframe);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user profile gracefully', async () => {
      const response = await engine.processRequest({
        userId: 'non-existent-user',
        message: 'Help me with my career'
      });

      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
      expect(response.sessionId).toBeTruthy();
    });

    it('should handle incomplete profile gracefully', async () => {
      const profile: UserProfile = {
        userId: testUserId,
        personalInfo: {
          age: 25,
          yearsOfExperience: 2,
          education: 'Bachelor\'s'
        },
        careerInfo: {
          goals: [],
          interests: [],
          struggles: []
        },
        skills: {
          current: [],
          learning: [],
          target: []
        },
        mindset: {
          confidenceLevel: 0.5,
          motivationLevel: 0.5,
          primaryConcerns: []
        },
        progress: {
          completedActions: [],
          milestones: [],
          lastUpdated: new Date()
        }
      };
      await dataStore.saveUserProfile(profile);

      const response = await engine.processRequest({
        userId: testUserId,
        message: 'What should I do?'
      });

      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
    });

    it('should provide fallback response on system error', async () => {
      // Create an engine with a failing data store
      const failingStore = {
        getUserProfile: async () => { throw new Error('Database error'); },
        saveUserProfile: async () => {},
        saveConversation: async () => {},
        getConversationHistory: async () => [],
        trackActionCompletion: async () => {},
        getProgressHistory: async () => []
      };
      
      const failingEngine = new CoachingEngine(failingStore as any);

      const response = await failingEngine.processRequest({
        userId: testUserId,
        message: 'Help me'
      });

      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
      expect(response.content.toLowerCase()).toMatch(/technical|help|guidance/);
    });
  });

  describe('Session Management', () => {
    it('should create a new session for first request', async () => {
      const profile = createTestProfile(testUserId);
      await dataStore.saveUserProfile(profile);

      const response = await engine.processRequest({
        userId: testUserId,
        message: 'Hello'
      });

      expect(response.sessionId).toBeTruthy();
    });

    it('should continue existing session', async () => {
      const profile = createTestProfile(testUserId);
      await dataStore.saveUserProfile(profile);

      const response1 = await engine.processRequest({
        userId: testUserId,
        message: 'What career should I pursue?'
      });

      const response2 = await engine.processRequest({
        userId: testUserId,
        message: 'Tell me more about that',
        sessionId: response1.sessionId
      });

      expect(response2.sessionId).toBe(response1.sessionId);
    });

    it('should end session successfully', async () => {
      const profile = createTestProfile(testUserId);
      await dataStore.saveUserProfile(profile);

      const response = await engine.processRequest({
        userId: testUserId,
        message: 'Hello'
      });

      await expect(engine.endSession(response.sessionId)).resolves.not.toThrow();
    });
  });

  describe('Actionable Guidance', () => {
    it('should always include actionable elements in response', async () => {
      const profile = createTestProfile(testUserId);
      await dataStore.saveUserProfile(profile);

      const messages = [
        'Tell me about careers',
        'What skills do I need?',
        'I\'m feeling stuck',
        'Help me plan my future'
      ];

      for (const message of messages) {
        const response = await engine.processRequest({
          userId: testUserId,
          message
        });

        // Response should contain actionable indicators
        const hasActionable = 
          response.content.includes('?') || // Questions
          response.content.toLowerCase().includes('next') ||
          response.content.toLowerCase().includes('step') ||
          response.content.toLowerCase().includes('recommend') ||
          response.content.toLowerCase().includes('suggest') ||
          response.content.toLowerCase().includes('try') ||
          response.content.toLowerCase().includes('focus') ||
          response.recommendations !== undefined;

        expect(hasActionable).toBe(true);
      }
    });
  });

  describe('In-Role Growth', () => {
    it('should provide in-role growth guidance when requested', async () => {
      const profile = createTestProfile(testUserId);
      profile.personalInfo.currentRole = 'Software Engineer';
      await dataStore.saveUserProfile(profile);

      const response = await engine.processRequest({
        userId: testUserId,
        message: 'How can I grow in my current role?'
      });

      expect(response.recommendations?.inRoleGrowth).toBeDefined();
      expect(response.recommendations!.inRoleGrowth!.scope).toBe('current_role_only');
    });
  });
});

/**
 * Helper function to create a test user profile
 */
function createTestProfile(userId: string): UserProfile {
  return {
    userId,
    personalInfo: {
      age: 28,
      currentRole: 'Junior Developer',
      yearsOfExperience: 3,
      education: 'Bachelor\'s in Computer Science',
      industry: 'Technology'
    },
    careerInfo: {
      goals: [],
      interests: ['technology', 'problem solving'],
      struggles: [
        {
          type: 'direction',
          description: 'Unsure about career path',
          severity: 0.6
        }
      ]
    },
    skills: {
      current: [
        { name: 'JavaScript', level: 6, category: 'programming' },
        { name: 'React', level: 5, category: 'frontend' }
      ],
      learning: [],
      target: [
        { name: 'System Design', level: 7, category: 'architecture' }
      ]
    },
    mindset: {
      confidenceLevel: 0.6,
      motivationLevel: 0.7,
      primaryConcerns: ['career direction', 'skill development']
    },
    progress: {
      completedActions: [],
      milestones: [],
      lastUpdated: new Date()
    }
  };
}
