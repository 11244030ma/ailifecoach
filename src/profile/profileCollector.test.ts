/**
 * Property-based tests for profile data collection
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { collectProfileData, hasRequiredFields, ProfileInput } from './profileCollector.js';

describe('Profile Data Collection', () => {
  // Feature: worklife-ai-coach, Property 1: Profile data collection completeness
  // Validates: Requirements 1.1
  it('should collect all required fields from user input', () => {
    // Generator for valid profile input
    const profileInputArb = fc.record({
      userId: fc.uuid(),
      age: fc.integer({ min: 20, max: 35 }),
      currentRole: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
      yearsOfExperience: fc.integer({ min: 0, max: 15 }),
      education: fc.string({ minLength: 1, maxLength: 200 }),
      industry: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
    });

    fc.assert(
      fc.property(profileInputArb, (input: ProfileInput) => {
        const profile = collectProfileData(input);

        // Property: For any first coaching session input with background information,
        // the resulting user profile should contain all required fields
        expect(profile.userId).toBe(input.userId);
        expect(profile.personalInfo.age).toBe(input.age);
        expect(profile.personalInfo.yearsOfExperience).toBe(input.yearsOfExperience);
        expect(profile.personalInfo.education).toBe(input.education);
        expect(profile.personalInfo.currentRole).toBe(input.currentRole);
        expect(profile.personalInfo.industry).toBe(input.industry);
        
        // Verify all required fields are present
        expect(hasRequiredFields(profile)).toBe(true);
        
        // Verify profile structure is initialized
        expect(profile.careerInfo).toBeDefined();
        expect(profile.skills).toBeDefined();
        expect(profile.mindset).toBeDefined();
        expect(profile.progress).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });
});
