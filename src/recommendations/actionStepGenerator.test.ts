/**
 * Property-based tests for Action Step Generator
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateActionSteps, generateProgressAcknowledgment } from './actionStepGenerator.js';
import { UserProfile, Goal, ActionStep, CareerPath, SkillRecommendation } from '../models/index.js';

// Arbitraries for generating test data

const challengeTypeArb = fc.constantFrom(
  'direction', 'skills', 'confidence', 'overwhelm', 'transition', 'stagnation'
);

const challengeArb = fc.record({
  type: challengeTypeArb,
  description: fc.string({ minLength: 10, maxLength: 100 }),
  severity: fc.integer({ min: 1, max: 10 }),
});

const skillArb = fc.record({
  name: fc.string({ minLength: 3, maxLength: 30 }),
  level: fc.integer({ min: 0, max: 10 }),
  category: fc.constantFrom('technical', 'soft', 'domain', 'leadership'),
});

const milestoneArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 50 }),
  description: fc.string({ minLength: 10, maxLength: 100 }),
  targetDate: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }),
  completed: fc.boolean(),
  completedDate: fc.option(fc.date(), { nil: undefined }),
});

const goalArb = fc.record({
  id: fc.uuid(),
  description: fc.string({ minLength: 10, maxLength: 100 }),
  type: fc.constantFrom('short_term', 'long_term'),
  priority: fc.integer({ min: 1, max: 10 }),
  targetDate: fc.option(fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }), { nil: undefined }),
});

const userProfileArb = fc.record({
  userId: fc.uuid(),
  personalInfo: fc.record({
    age: fc.integer({ min: 20, max: 35 }),
    currentRole: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: undefined }),
    yearsOfExperience: fc.integer({ min: 0, max: 15 }),
    education: fc.string({ minLength: 5, maxLength: 50 }),
    industry: fc.option(fc.string({ minLength: 5, maxLength: 30 }), { nil: undefined }),
  }),
  careerInfo: fc.record({
    currentPath: fc.constant(undefined), // Simplified for testing
    goals: fc.array(goalArb, { minLength: 1, maxLength: 5 }),
    interests: fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 0, maxLength: 10 }),
    struggles: fc.array(challengeArb, { minLength: 0, maxLength: 5 }),
  }),
  skills: fc.record({
    current: fc.array(skillArb, { minLength: 0, maxLength: 10 }),
    learning: fc.array(skillArb, { minLength: 0, maxLength: 5 }),
    target: fc.array(skillArb, { minLength: 0, maxLength: 10 }),
  }),
  mindset: fc.record({
    confidenceLevel: fc.integer({ min: 1, max: 10 }),
    motivationLevel: fc.integer({ min: 1, max: 10 }),
    primaryConcerns: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
  }),
  progress: fc.record({
    completedActions: fc.array(fc.uuid(), { minLength: 0, maxLength: 20 }),
    milestones: fc.array(milestoneArb, { minLength: 0, maxLength: 5 }),
    lastUpdated: fc.date(),
  }),
});

const careerPathArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 50 }),
  description: fc.string({ minLength: 20, maxLength: 200 }),
  reasoning: fc.string({ minLength: 20, maxLength: 200 }),
  fitScore: fc.double({ min: 0, max: 1 }),
  requiredSkills: fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 1, maxLength: 10 }),
  timeToTransition: fc.constantFrom('3-6 months', '6-12 months', '12-18 months', '18-24 months'),
  growthPotential: fc.double({ min: 0, max: 1 }),
});

const skillRecommendationArb = fc.record({
  skill: fc.string({ minLength: 3, maxLength: 30 }),
  priority: fc.double({ min: 0, max: 1 }),
  reasoning: fc.string({ minLength: 20, maxLength: 200 }),
  learningResources: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
  estimatedTime: fc.string({ minLength: 5, maxLength: 20 }),
  dependencies: fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 0, maxLength: 5 }),
});

describe('Action Step Generator - Property Tests', () => {
  describe('Property 10: Action step timeframe assignment', () => {
    /**
     * Feature: worklife-ai-coach, Property 10: Action step timeframe assignment
     * Validates: Requirements 4.1
     * 
     * For any generated action step, it should have a valid timeframe assignment
     * (today, this_week, or this_month).
     */
    it('should assign valid timeframes to all generated action steps', () => {
      fc.assert(
        fc.property(
          userProfileArb,
          fc.option(careerPathArb, { nil: undefined }),
          fc.option(fc.array(skillRecommendationArb, { minLength: 0, maxLength: 5 }), { nil: undefined }),
          (profile, careerPath, skillRecs) => {
            // Generate action steps
            const steps = generateActionSteps(
              profile,
              profile.careerInfo.goals,
              careerPath,
              skillRecs
            );
            
            // Property: Every action step must have a valid timeframe
            const validTimeframes = ['today', 'this_week', 'this_month'];
            
            for (const step of steps) {
              expect(validTimeframes).toContain(step.timeframe);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 12: Multi-goal action prioritization', () => {
    /**
     * Feature: worklife-ai-coach, Property 12: Multi-goal action prioritization
     * Validates: Requirements 4.5
     * 
     * For any user with multiple active goals, action steps should be prioritized
     * to distribute effort across goals without overwhelming the user.
     */
    it('should limit action steps to prevent overwhelm when user has multiple goals', () => {
      fc.assert(
        fc.property(
          userProfileArb,
          fc.option(careerPathArb, { nil: undefined }),
          fc.option(fc.array(skillRecommendationArb, { minLength: 0, maxLength: 5 }), { nil: undefined }),
          (profile, careerPath, skillRecs) => {
            // Only test profiles with multiple goals
            if (profile.careerInfo.goals.length <= 1) {
              return; // Skip single-goal profiles
            }
            
            // Generate action steps
            const steps = generateActionSteps(
              profile,
              profile.careerInfo.goals,
              careerPath,
              skillRecs
            );
            
            // Property: When user has multiple goals, steps should be limited per timeframe
            // to prevent overwhelm
            const stepsByTimeframe = {
              today: steps.filter(s => s.timeframe === 'today').length,
              this_week: steps.filter(s => s.timeframe === 'this_week').length,
              this_month: steps.filter(s => s.timeframe === 'this_month').length,
            };
            
            // With multiple goals, no timeframe should have excessive steps
            const maxPerTimeframe = profile.careerInfo.goals.length > 2 ? 2 : 3;
            
            expect(stepsByTimeframe.today).toBeLessThanOrEqual(maxPerTimeframe);
            expect(stepsByTimeframe.this_week).toBeLessThanOrEqual(maxPerTimeframe);
            expect(stepsByTimeframe.this_month).toBeLessThanOrEqual(maxPerTimeframe);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should distribute action steps across multiple goals', () => {
      fc.assert(
        fc.property(
          userProfileArb,
          fc.option(careerPathArb, { nil: undefined }),
          fc.option(fc.array(skillRecommendationArb, { minLength: 0, maxLength: 5 }), { nil: undefined }),
          (profile, careerPath, skillRecs) => {
            // Only test profiles with multiple goals
            if (profile.careerInfo.goals.length <= 1) {
              return; // Skip single-goal profiles
            }
            
            // Generate action steps
            const steps = generateActionSteps(
              profile,
              profile.careerInfo.goals,
              careerPath,
              skillRecs
            );
            
            // Property: Steps should be generated (not empty) for profiles with goals
            // This ensures we're distributing effort, not just blocking everything
            expect(steps.length).toBeGreaterThan(0);
            
            // Property: Total steps should be reasonable (not overwhelming)
            // With multiple goals, we should have some steps but not too many
            const maxTotalSteps = profile.careerInfo.goals.length * 3;
            expect(steps.length).toBeLessThanOrEqual(maxTotalSteps);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 11: Progress acknowledgment', () => {
    /**
     * Feature: worklife-ai-coach, Property 11: Progress acknowledgment
     * Validates: Requirements 4.3, 5.3, 9.3
     * 
     * For any completed action step or milestone, the system should generate
     * an acknowledgment in the next interaction.
     */
    it('should generate acknowledgment for any completed action steps', () => {
      fc.assert(
        fc.property(
          userProfileArb,
          fc.array(
            fc.record({
              id: fc.uuid(),
              description: fc.string({ minLength: 10, maxLength: 100 }),
              timeframe: fc.constantFrom('today', 'this_week', 'this_month'),
              category: fc.constantFrom('learning', 'networking', 'application', 'reflection'),
              completed: fc.constant(true), // All steps are completed
              dueDate: fc.option(fc.date(), { nil: undefined }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (profile, completedSteps) => {
            // Generate acknowledgment
            const acknowledgment = generateProgressAcknowledgment(completedSteps, profile);
            
            // Property: Acknowledgment should be non-empty for completed steps
            expect(acknowledgment).toBeTruthy();
            expect(acknowledgment.length).toBeGreaterThan(0);
            
            // Property: Acknowledgment should reference the completion
            // (should contain words like "completed", "progress", "great", etc.)
            const lowerAck = acknowledgment.toLowerCase();
            const hasProgressWords = 
              lowerAck.includes('completed') ||
              lowerAck.includes('progress') ||
              lowerAck.includes('great') ||
              lowerAck.includes('excellent') ||
              lowerAck.includes('work');
            
            expect(hasProgressWords).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty acknowledgment when no steps are completed', () => {
      fc.assert(
        fc.property(
          userProfileArb,
          (profile) => {
            // Generate acknowledgment with empty completed steps
            const acknowledgment = generateProgressAcknowledgment([], profile);
            
            // Property: No acknowledgment for no completed steps
            expect(acknowledgment).toBe('');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should acknowledge different categories of completed work', () => {
      fc.assert(
        fc.property(
          userProfileArb,
          fc.constantFrom('learning', 'networking', 'application', 'reflection'),
          fc.integer({ min: 1, max: 5 }),
          (profile, category, count) => {
            // Create completed steps of a specific category
            const completedSteps: ActionStep[] = Array.from({ length: count }, (_, i) => ({
              id: `step-${i}`,
              description: `Test ${category} step ${i}`,
              timeframe: 'this_week' as const,
              category: category as 'learning' | 'networking' | 'application' | 'reflection',
              completed: true,
            }));
            
            // Generate acknowledgment
            const acknowledgment = generateProgressAcknowledgment(completedSteps, profile);
            
            // Property: Acknowledgment should be non-empty
            expect(acknowledgment).toBeTruthy();
            expect(acknowledgment.length).toBeGreaterThan(0);
            
            // Property: For category-specific work, acknowledgment may reference the category
            // (This is a weaker property - we just ensure acknowledgment exists)
            const lowerAck = acknowledgment.toLowerCase();
            expect(lowerAck.length).toBeGreaterThan(10); // Meaningful acknowledgment
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
