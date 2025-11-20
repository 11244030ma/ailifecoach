/**
 * Property-based tests for data persistence
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { InMemoryDataStore } from './dataStore.js';
import { UserProfile, Goal, Challenge, Skill, Milestone } from '../models/core.js';
import { CareerPath } from '../models/recommendations.js';

describe('Data Persistence', () => {
  let dataStore: InMemoryDataStore;

  beforeEach(() => {
    dataStore = new InMemoryDataStore();
  });

  // Feature: worklife-ai-coach, Property 3: Profile data persistence
  // Validates: Requirements 1.3, 1.4, 2.5, 3.4
  it('should persist and retrieve profile updates correctly', async () => {
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

    const careerPathArb = fc.record({
      id: fc.uuid(),
      title: fc.string({ minLength: 1, maxLength: 100 }),
      description: fc.string({ minLength: 1, maxLength: 500 }),
      reasoning: fc.string({ minLength: 1, maxLength: 500 }),
      fitScore: fc.float({ min: 0, max: 1 }),
      requiredSkills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
      timeToTransition: fc.string({ minLength: 1, maxLength: 50 }),
      growthPotential: fc.float({ min: 0, max: 1 }),
    });

    const userProfileArb = fc.record({
      userId: fc.uuid(),
      personalInfo: fc.record({
        age: fc.integer({ min: 20, max: 35 }),
        currentRole: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), { nil: undefined }),
        yearsOfExperience: fc.integer({ min: 0, max: 15 }),
        education: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
        industry: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), { nil: undefined }),
      }),
      careerInfo: fc.record({
        currentPath: fc.option(careerPathArb, { nil: undefined }),
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

    await fc.assert(
      fc.asyncProperty(userProfileArb, async (originalProfile: UserProfile) => {
        // Save the profile
        await dataStore.saveUserProfile(originalProfile);

        // Retrieve the profile
        const retrievedProfile = await dataStore.getUserProfile(originalProfile.userId);

        // Property: For any user profile updates (goals, interests, career path selection, skill completion),
        // the changes should be persisted and retrievable in subsequent sessions
        expect(retrievedProfile).not.toBeNull();
        expect(retrievedProfile!.userId).toBe(originalProfile.userId);
        
        // Verify personal info persistence
        expect(retrievedProfile!.personalInfo.age).toBe(originalProfile.personalInfo.age);
        expect(retrievedProfile!.personalInfo.currentRole).toBe(originalProfile.personalInfo.currentRole);
        expect(retrievedProfile!.personalInfo.yearsOfExperience).toBe(originalProfile.personalInfo.yearsOfExperience);
        expect(retrievedProfile!.personalInfo.education).toBe(originalProfile.personalInfo.education);
        expect(retrievedProfile!.personalInfo.industry).toBe(originalProfile.personalInfo.industry);
        
        // Verify career info persistence (goals, interests, career path)
        expect(retrievedProfile!.careerInfo.goals).toHaveLength(originalProfile.careerInfo.goals.length);
        expect(retrievedProfile!.careerInfo.interests).toEqual(originalProfile.careerInfo.interests);
        expect(retrievedProfile!.careerInfo.struggles).toHaveLength(originalProfile.careerInfo.struggles.length);
        
        if (originalProfile.careerInfo.currentPath) {
          expect(retrievedProfile!.careerInfo.currentPath).toBeDefined();
          expect(retrievedProfile!.careerInfo.currentPath!.id).toBe(originalProfile.careerInfo.currentPath.id);
        }
        
        // Verify skills persistence (skill completion tracking)
        expect(retrievedProfile!.skills.current).toHaveLength(originalProfile.skills.current.length);
        expect(retrievedProfile!.skills.learning).toHaveLength(originalProfile.skills.learning.length);
        expect(retrievedProfile!.skills.target).toHaveLength(originalProfile.skills.target.length);
        
        // Verify progress persistence (completed actions)
        expect(retrievedProfile!.progress.completedActions).toEqual(originalProfile.progress.completedActions);
        expect(retrievedProfile!.progress.milestones).toHaveLength(originalProfile.progress.milestones.length);
      }),
      { numRuns: 100, timeout: 30000 }
    );
  }, 30000);
});
