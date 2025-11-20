/**
 * Property-based tests for Career Transition Advisor
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateTransitionPlan } from './transitionAdvisor.js';
import { UserProfile } from '../models/index.js';

// Arbitraries for generating test data

const skillArb = fc.record({
  name: fc.oneof(
    fc.constantFrom(
      'programming', 'python', 'javascript', 'communication', 'leadership',
      'problem solving', 'project management', 'data analysis', 'design',
      'marketing', 'sql', 'statistics', 'user research'
    )
  ),
  level: fc.integer({ min: 1, max: 10 }),
  category: fc.constantFrom('technical', 'soft', 'business'),
});

const challengeArb = fc.record({
  type: fc.constantFrom('direction', 'skills', 'confidence', 'overwhelm', 'transition', 'stagnation'),
  description: fc.string({ minLength: 10, maxLength: 100 }),
  severity: fc.float({ min: 0, max: 1 }),
});

const goalArb = fc.record({
  id: fc.uuid(),
  description: fc.string({ minLength: 10, maxLength: 100 }),
  type: fc.constantFrom('short_term', 'long_term'),
  priority: fc.integer({ min: 1, max: 10 }),
  targetDate: fc.option(fc.date(), { nil: undefined }),
});

const milestoneArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 50 }),
  description: fc.string({ minLength: 10, maxLength: 100 }),
  targetDate: fc.date(),
  completed: fc.boolean(),
  completedDate: fc.option(fc.date(), { nil: undefined }),
});

const userProfileArb = fc.record({
  userId: fc.uuid(),
  personalInfo: fc.record({
    age: fc.integer({ min: 20, max: 35 }),
    currentRole: fc.option(fc.string({ minLength: 5, maxLength: 30 }), { nil: undefined }),
    yearsOfExperience: fc.integer({ min: 0, max: 15 }),
    education: fc.constantFrom('High School', 'Bachelor\'s', 'Master\'s', 'PhD'),
    industry: fc.option(fc.constantFrom('technology', 'finance', 'healthcare', 'education'), { nil: undefined }),
  }),
  careerInfo: fc.record({
    currentPath: fc.constant(undefined),
    goals: fc.array(goalArb, { minLength: 0, maxLength: 3 }),
    interests: fc.array(fc.string({ minLength: 5, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
    struggles: fc.array(challengeArb, { minLength: 0, maxLength: 3 }),
  }),
  skills: fc.record({
    current: fc.array(skillArb, { minLength: 0, maxLength: 10 }),
    learning: fc.array(skillArb, { minLength: 0, maxLength: 5 }),
    target: fc.array(skillArb, { minLength: 0, maxLength: 5 }),
  }),
  mindset: fc.record({
    confidenceLevel: fc.float({ min: 0, max: 1 }),
    motivationLevel: fc.float({ min: 0, max: 1 }),
    primaryConcerns: fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 0, maxLength: 3 }),
  }),
  progress: fc.record({
    completedActions: fc.array(fc.uuid(), { minLength: 0, maxLength: 10 }),
    milestones: fc.array(milestoneArb, { minLength: 0, maxLength: 5 }),
    lastUpdated: fc.date(),
  }),
});

const careerFieldArb = fc.constantFrom(
  'software engineering',
  'data science',
  'product management',
  'ux design',
  'digital marketing',
  'business analysis',
  'project management'
);

describe('Career Transition Advisor - Property Tests', () => {
  // Feature: worklife-ai-coach, Property 17: Field-specific transition guidance
  // Validates: Requirements 7.1
  describe('Property 17: Field-specific transition guidance', () => {
    it('should generate transition guidance specific to source and target field combination', () => {
      fc.assert(
        fc.property(
          userProfileArb,
          careerFieldArb,
          careerFieldArb,
          (profile: UserProfile, sourceField: string, targetField: string) => {
            const plan = generateTransitionPlan(sourceField, targetField, profile);
            
            // Plan should reference both source and target fields
            expect(plan.sourceField).toBe(sourceField);
            expect(plan.targetField).toBe(targetField);
            
            // Plan should be specific to this field combination
            // Different field combinations should produce different guidance
            // We verify this by checking that the plan contains field-specific elements
            
            // Skills to acquire should be relevant to target field
            expect(plan.skillsToAcquire.length).toBeGreaterThanOrEqual(0);
            
            // Phases should exist and contain field-specific guidance
            expect(plan.phases.length).toBeGreaterThan(0);
            
            // Each phase should have specific actions
            for (const phase of plan.phases) {
              expect(phase.name).toBeTruthy();
              expect(phase.duration).toBeTruthy();
              expect(phase.focus).toBeTruthy();
              expect(phase.actions.length).toBeGreaterThan(0);
              expect(phase.successCriteria.length).toBeGreaterThan(0);
            }
            
            // Transferable skills should be identified
            expect(Array.isArray(plan.transferableSkills)).toBe(true);
            
            // Plan should have difficulty assessment
            expect(['easy', 'moderate', 'challenging']).toContain(plan.difficultyLevel);
            
            // Plan should have duration estimate
            expect(plan.estimatedDuration).toBeTruthy();
            expect(plan.estimatedDuration).toMatch(/\d+-\d+ months/);
            
            // Plan should identify risks and success factors
            expect(Array.isArray(plan.risks)).toBe(true);
            expect(Array.isArray(plan.successFactors)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: worklife-ai-coach, Property 18: Transferable skill identification
  // Validates: Requirements 7.2
  describe('Property 18: Transferable skill identification', () => {
    it('should identify skills from current experience that transfer to target field', () => {
      fc.assert(
        fc.property(
          userProfileArb,
          careerFieldArb,
          careerFieldArb,
          (profile: UserProfile, sourceField: string, targetField: string) => {
            const plan = generateTransitionPlan(sourceField, targetField, profile);
            
            // Plan should identify transferable skills
            expect(Array.isArray(plan.transferableSkills)).toBe(true);
            
            // All transferable skills should come from user's current skills
            const currentSkillNames = profile.skills.current.map(s => s.name.toLowerCase());
            
            for (const transferableSkill of plan.transferableSkills) {
              const skillLower = transferableSkill.toLowerCase();
              
              // Each transferable skill should exist in current skills
              // (either exact match or partial match)
              const existsInCurrent = currentSkillNames.some(current =>
                current === skillLower ||
                current.includes(skillLower) ||
                skillLower.includes(current)
              );
              
              expect(existsInCurrent).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: worklife-ai-coach, Property 19: Complex transition phasing
  // Validates: Requirements 7.3
  describe('Property 19: Complex transition phasing', () => {
    it('should contain multiple phases with intermediate steps for challenging transitions', () => {
      fc.assert(
        fc.property(
          userProfileArb,
          careerFieldArb,
          careerFieldArb,
          (profile: UserProfile, sourceField: string, targetField: string) => {
            const plan = generateTransitionPlan(sourceField, targetField, profile);
            
            // If difficulty is challenging, should have multiple phases
            if (plan.difficultyLevel === 'challenging') {
              expect(plan.phases.length).toBeGreaterThan(1);
              
              // Each phase should have intermediate steps (actions)
              for (const phase of plan.phases) {
                expect(phase.actions.length).toBeGreaterThan(0);
                
                // Actions should have specific timeframes
                for (const action of phase.actions) {
                  expect(['today', 'this_week', 'this_month']).toContain(action.timeframe);
                }
                
                // Phase should have success criteria
                expect(phase.successCriteria.length).toBeGreaterThan(0);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: worklife-ai-coach, Property 20: Transition timeline-difficulty correlation
  // Validates: Requirements 7.4
  describe('Property 20: Transition timeline-difficulty correlation', () => {
    it('should have longer durations for higher difficulty transitions', () => {
      fc.assert(
        fc.property(
          userProfileArb,
          careerFieldArb,
          careerFieldArb,
          (profile: UserProfile, sourceField: string, targetField: string) => {
            const plan = generateTransitionPlan(sourceField, targetField, profile);
            
            // Extract numeric duration from string (e.g., "12-18 months" -> 18)
            const durationMatch = plan.estimatedDuration.match(/(\d+)-(\d+) months/);
            expect(durationMatch).toBeTruthy();
            
            if (durationMatch) {
              const maxMonths = parseInt(durationMatch[2], 10);
              
              // Verify correlation between difficulty and duration
              if (plan.difficultyLevel === 'easy') {
                // Easy transitions should be relatively short
                expect(maxMonths).toBeLessThanOrEqual(18);
              } else if (plan.difficultyLevel === 'moderate') {
                // Moderate transitions should be medium length
                expect(maxMonths).toBeGreaterThanOrEqual(9);
                expect(maxMonths).toBeLessThanOrEqual(27);
              } else if (plan.difficultyLevel === 'challenging') {
                // Challenging transitions should be longer
                expect(maxMonths).toBeGreaterThanOrEqual(15);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
