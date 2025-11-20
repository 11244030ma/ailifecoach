/**
 * Property-based tests for Growth Plan Builder
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { buildGrowthPlan, adaptGrowthPlan, validateGrowthPlanTimeline, getLinkedObjective, validateActionObjectiveLinkage } from './growthPlanBuilder.js';
import { UserProfile, CareerPath, GrowthPlan, Goal, Challenge, Skill, Milestone } from '../models/index.js';

// Arbitraries for generating test data

const skillArb = fc.record({
  name: fc.constantFrom('JavaScript', 'Python', 'Leadership', 'Communication', 'Design'),
  level: fc.integer({ min: 0, max: 10 }),
  category: fc.constantFrom('technical', 'soft', 'business'),
});

const goalArb = fc.record({
  id: fc.uuid(),
  description: fc.string({ minLength: 10, maxLength: 100 }),
  type: fc.constantFrom('short_term', 'long_term') as fc.Arbitrary<'short_term' | 'long_term'>,
  priority: fc.integer({ min: 1, max: 10 }),
  targetDate: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }),
});

const challengeArb = fc.record({
  type: fc.constantFrom('direction', 'skills', 'confidence', 'overwhelm', 'transition', 'stagnation') as fc.Arbitrary<'direction' | 'skills' | 'confidence' | 'overwhelm' | 'transition' | 'stagnation'>,
  description: fc.string({ minLength: 10, maxLength: 100 }),
  severity: fc.integer({ min: 1, max: 10 }),
});

const milestoneArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 50 }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
  targetDate: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }),
  completed: fc.boolean(),
  completedDate: fc.option(fc.date(), { nil: undefined }),
});

const userProfileArb = fc.record({
  userId: fc.uuid(),
  personalInfo: fc.record({
    age: fc.integer({ min: 20, max: 35 }),
    currentRole: fc.option(fc.string({ minLength: 5, maxLength: 30 }), { nil: undefined }),
    yearsOfExperience: fc.integer({ min: 0, max: 15 }),
    education: fc.string({ minLength: 5, maxLength: 50 }),
    industry: fc.option(fc.string({ minLength: 5, maxLength: 30 }), { nil: undefined }),
  }),
  careerInfo: fc.record({
    currentPath: fc.constant(undefined),
    goals: fc.array(goalArb, { minLength: 1, maxLength: 3 }),
    interests: fc.array(fc.string({ minLength: 5, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
    struggles: fc.array(challengeArb, { minLength: 0, maxLength: 3 }),
  }),
  skills: fc.record({
    current: fc.array(skillArb, { minLength: 0, maxLength: 5 }),
    learning: fc.array(skillArb, { minLength: 0, maxLength: 3 }),
    target: fc.array(skillArb, { minLength: 0, maxLength: 5 }),
  }),
  mindset: fc.record({
    confidenceLevel: fc.integer({ min: 1, max: 10 }),
    motivationLevel: fc.integer({ min: 1, max: 10 }),
    primaryConcerns: fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 0, maxLength: 3 }),
  }),
  progress: fc.record({
    completedActions: fc.array(fc.uuid(), { minLength: 0, maxLength: 10 }),
    milestones: fc.array(milestoneArb, { minLength: 0, maxLength: 5 }),
    lastUpdated: fc.date(),
  }),
});

const careerPathArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 10, maxLength: 50 }),
  description: fc.string({ minLength: 20, maxLength: 200 }),
  reasoning: fc.string({ minLength: 20, maxLength: 200 }),
  fitScore: fc.double({ min: 0, max: 1 }),
  requiredSkills: fc.array(fc.string({ minLength: 5, maxLength: 20 }), { minLength: 1, maxLength: 8 }),
  timeToTransition: fc.constantFrom('3-6 months', '6-12 months', '12-18 months', '18-24 months'),
  growthPotential: fc.double({ min: 0, max: 1 }),
});

describe('Growth Plan Builder - Property Tests', () => {
  // Feature: worklife-ai-coach, Property 14: Growth plan milestone timeframe
  // Validates: Requirements 6.1
  it('Property 14: all milestones in generated growth plans should have target dates between 3 and 12 months from creation', () => {
    fc.assert(
      fc.property(userProfileArb, careerPathArb, (profile, careerPath) => {
        const plan = buildGrowthPlan(profile, careerPath);
        
        const createdAt = plan.createdAt;
        
        // Check each milestone
        for (const milestone of plan.milestones) {
          const monthsDiff = (milestone.targetDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
          
          // Each milestone should be between 3 and 12 months from creation
          expect(monthsDiff).toBeGreaterThanOrEqual(3);
          expect(monthsDiff).toBeLessThanOrEqual(12);
        }
        
        // Also verify using the validation function
        expect(validateGrowthPlanTimeline(plan)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: worklife-ai-coach, Property 15: Action-to-objective linkage
  // Validates: Requirements 6.2
  it('Property 15: all action steps in a growth plan should be traceable to at least one career path objective', () => {
    fc.assert(
      fc.property(userProfileArb, careerPathArb, (profile, careerPath) => {
        const plan = buildGrowthPlan(profile, careerPath);
        
        // Check that each action in each phase is linked to an objective
        for (const phase of plan.phases) {
          for (const action of phase.actions) {
            const linkedObjective = getLinkedObjective(action, plan);
            
            // Each action should be linked to at least one objective
            expect(linkedObjective).toBeDefined();
            expect(linkedObjective).not.toBe('');
            
            // The linked objective should be one of the objectives in the plan
            // It must be from the same phase that contains the action
            const allPhaseObjectives = plan.phases.flatMap(p => p.objectives);
            expect(allPhaseObjectives).toContain(linkedObjective);
          }
        }
        
        // Also verify using the validation function
        expect(validateActionObjectiveLinkage(plan)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: worklife-ai-coach, Property 16: Growth plan adaptation
  // Validates: Requirements 6.3, 6.4, 6.5
  it('Property 16: when user circumstances change or progress is made, the adapted plan should reflect the new state while maintaining realistic timelines', () => {
    fc.assert(
      fc.property(
        userProfileArb,
        careerPathArb,
        fc.array(fc.uuid(), { minLength: 0, maxLength: 5 }), // completed action IDs
        fc.array(milestoneArb, { minLength: 0, maxLength: 3 }), // completed milestones
        (profile, careerPath, completedActionIds, completedMilestones) => {
          // Create initial plan
          const initialPlan = buildGrowthPlan(profile, careerPath);
          
          // Simulate progress: update profile with completed actions and milestones
          const updatedProfile: UserProfile = {
            ...profile,
            progress: {
              ...profile.progress,
              completedActions: [...profile.progress.completedActions, ...completedActionIds],
              milestones: [
                ...profile.progress.milestones,
                ...completedMilestones.map(m => ({ ...m, completed: true, completedDate: new Date() })),
              ],
              lastUpdated: new Date(),
            },
          };
          
          // Adapt the plan based on new circumstances
          const adaptedPlan = adaptGrowthPlan(initialPlan, updatedProfile);
          
          // Verify that the adapted plan reflects progress
          // 1. Completed milestones should be marked as complete
          for (const milestone of adaptedPlan.milestones) {
            const wasCompleted = completedMilestones.some(m => m.id === milestone.id);
            if (wasCompleted) {
              expect(milestone.completed).toBe(true);
              expect(milestone.completedDate).toBeDefined();
            }
          }
          
          // 2. Completed actions should be marked as complete in phases
          for (const phase of adaptedPlan.phases) {
            for (const action of phase.actions) {
              const wasCompleted = completedActionIds.includes(action.id);
              if (wasCompleted) {
                expect(action.completed).toBe(true);
              }
            }
          }
          
          // 3. The adapted plan should maintain realistic timelines (3-12 months)
          expect(validateGrowthPlanTimeline(adaptedPlan)).toBe(true);
          
          // 4. The adapted plan should have an updated lastUpdated timestamp
          expect(adaptedPlan.lastUpdated.getTime()).toBeGreaterThanOrEqual(initialPlan.lastUpdated.getTime());
          
          // 5. All actions should still be linked to objectives
          expect(validateActionObjectiveLinkage(adaptedPlan)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
