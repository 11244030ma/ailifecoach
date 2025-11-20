/**
 * Property-based tests for career path recommendation engine
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateCareerPaths, identifyTradeOffs } from './careerPathEngine.js';
import { UserProfile, Goal, Challenge, Skill, Milestone } from '../models/index.js';

// Generators for profile components
const goalArb = fc.record({
    id: fc.uuid(),
    description: fc.string({ minLength: 1, maxLength: 200 }),
    type: fc.constantFrom('short_term' as const, 'long_term' as const),
    priority: fc.integer({ min: 1, max: 10 }),
    targetDate: fc.option(fc.date(), { nil: undefined }),
  });

  const challengeArb = fc.record({
    type: fc.constantFrom(
      'direction' as const,
      'skills' as const,
      'confidence' as const,
      'overwhelm' as const,
      'transition' as const,
      'stagnation' as const
    ),
    description: fc.string({ minLength: 1, maxLength: 200 }),
    severity: fc.integer({ min: 1, max: 10 }),
  });

  const skillArb = fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    level: fc.integer({ min: 1, max: 10 }),
    category: fc.string({ minLength: 1, maxLength: 50 }),
  });

  const milestoneArb = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 1, maxLength: 200 }),
    targetDate: fc.date(),
    completed: fc.boolean(),
    completedDate: fc.option(fc.date(), { nil: undefined }),
  });

const userProfileArb = fc.record({
  userId: fc.uuid(),
  personalInfo: fc.record({
    age: fc.integer({ min: 20, max: 35 }),
    currentRole: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
    yearsOfExperience: fc.integer({ min: 0, max: 15 }),
    education: fc.string({ minLength: 1, maxLength: 200 }),
    industry: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  }),
  careerInfo: fc.record({
    currentPath: fc.constant(undefined), // Not needed for generation
    goals: fc.array(goalArb, { minLength: 0, maxLength: 5 }),
    interests: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
    struggles: fc.array(challengeArb, { minLength: 0, maxLength: 5 }),
  }),
  skills: fc.record({
    current: fc.array(skillArb, { minLength: 0, maxLength: 10 }),
    learning: fc.array(skillArb, { minLength: 0, maxLength: 10 }),
    target: fc.array(skillArb, { minLength: 0, maxLength: 10 }),
  }),
  mindset: fc.record({
    confidenceLevel: fc.float({ min: 0, max: 1 }),
    motivationLevel: fc.float({ min: 0, max: 1 }),
    primaryConcerns: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 0, maxLength: 5 }),
  }),
  progress: fc.record({
    completedActions: fc.array(fc.uuid(), { minLength: 0, maxLength: 20 }),
    milestones: fc.array(milestoneArb, { minLength: 0, maxLength: 10 }),
    lastUpdated: fc.date(),
  }),
});

describe('Career Path Recommendation Engine', () => {
  // Feature: worklife-ai-coach, Property 5: Career path generation guarantee
  // Validates: Requirements 2.1
  it('should generate at least one career path for any valid user profile', () => {
    fc.assert(
      fc.property(userProfileArb, (profile: UserProfile) => {
        const paths = generateCareerPaths(profile);

        // Property: For any valid user profile, the system should generate 
        // at least one career path recommendation
        expect(paths).toBeDefined();
        expect(paths.length).toBeGreaterThanOrEqual(1);
        
        // Verify each path has required fields
        paths.forEach(path => {
          expect(path.id).toBeDefined();
          expect(path.title).toBeDefined();
          expect(path.description).toBeDefined();
          expect(path.reasoning).toBeDefined();
          expect(path.fitScore).toBeGreaterThanOrEqual(0);
          expect(path.fitScore).toBeLessThanOrEqual(1);
          expect(path.requiredSkills).toBeDefined();
          expect(Array.isArray(path.requiredSkills)).toBe(true);
          expect(path.timeToTransition).toBeDefined();
          expect(path.growthPotential).toBeGreaterThanOrEqual(0);
          expect(path.growthPotential).toBeLessThanOrEqual(1);
        });
      }),
      { numRuns: 100 }
    );
  });

  // Feature: worklife-ai-coach, Property 6: Recommendation reasoning presence
  // Validates: Requirements 2.2, 3.2
  it('should include reasoning explanation for every career path recommendation', () => {
    fc.assert(
      fc.property(userProfileArb, (profile: UserProfile) => {
        const paths = generateCareerPaths(profile);

        // Property: For any recommendation (career path, skill, action step),
        // the system should include an explanation of why this recommendation 
        // is appropriate for the user's profile
        expect(paths.length).toBeGreaterThan(0);
        
        paths.forEach(path => {
          // Verify reasoning field exists and is non-empty
          expect(path.reasoning).toBeDefined();
          expect(typeof path.reasoning).toBe('string');
          expect(path.reasoning.length).toBeGreaterThan(0);
          
          // Verify reasoning is substantive (not just whitespace)
          expect(path.reasoning.trim().length).toBeGreaterThan(10);
          
          // Verify reasoning ends with proper punctuation
          expect(path.reasoning.trim()).toMatch(/[.!?]$/);
        });
      }),
      { numRuns: 100 }
    );
  });

  // Feature: worklife-ai-coach, Property 7: Multiple path trade-off inclusion
  // Validates: Requirements 2.3
  it('should include trade-offs when multiple career paths are viable', () => {
    fc.assert(
      fc.property(userProfileArb, (profile: UserProfile) => {
        const paths = generateCareerPaths(profile);

        // Property: For any user profile that matches multiple career paths,
        // the system should provide trade-offs and considerations for each path option
        if (paths.length > 1) {
          const pathsWithTradeOffs = identifyTradeOffs(paths);
          
          expect(pathsWithTradeOffs.length).toBe(paths.length);
          
          pathsWithTradeOffs.forEach(path => {
            // Verify reasoning contains trade-off information
            expect(path.reasoning).toBeDefined();
            expect(path.reasoning.length).toBeGreaterThan(0);
            
            // When multiple paths exist, reasoning should contain comparative information
            // Check for trade-off indicators in the reasoning
            const hasTradeOffInfo = 
              path.reasoning.includes('Trade-offs:') ||
              path.reasoning.includes('compared to') ||
              path.reasoning.includes('Best overall fit') ||
              path.reasoning.includes('Fastest path') ||
              path.reasoning.includes('Highest') ||
              path.reasoning.includes('Lower') ||
              path.reasoning.includes('Longer');
            
            expect(hasTradeOffInfo).toBe(true);
          });
        }
      }),
      { numRuns: 100 }
    );
  });
});
