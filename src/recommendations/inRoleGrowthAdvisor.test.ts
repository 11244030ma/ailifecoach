/**
 * Property-based tests for In-Role Growth Advisor
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { analyzeInRoleGrowth } from './inRoleGrowthAdvisor.js';
import { UserProfile, Challenge, Skill, Goal, Milestone } from '../models/core.js';

// Arbitraries for generating test data
const skillArb = fc.record({
  name: fc.constantFrom('Python', 'JavaScript', 'Testing', 'Communication', 'Leadership', 'SQL', 'Analytics'),
  level: fc.integer({ min: 1, max: 10 }),
  category: fc.constantFrom('technical', 'soft', 'business'),
});

const challengeArb = fc.record({
  type: fc.constantFrom('direction', 'skills', 'confidence', 'overwhelm', 'transition', 'stagnation'),
  description: fc.string({ minLength: 10, maxLength: 100 }),
  severity: fc.double({ min: 0, max: 1 }),
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
    currentRole: fc.option(
      fc.constantFrom('Software Engineer', 'Product Manager', 'Designer', 'Data Analyst', 'Marketing Manager'),
      { nil: undefined }
    ),
    yearsOfExperience: fc.integer({ min: 0, max: 15 }),
    education: fc.constantFrom('High School', 'Bachelor\'s', 'Master\'s', 'PhD'),
    industry: fc.option(
      fc.constantFrom('Technology', 'Finance', 'Healthcare', 'Education', 'Retail'),
      { nil: undefined }
    ),
  }),
  careerInfo: fc.record({
    currentPath: fc.constant(undefined),
    goals: fc.array(goalArb, { minLength: 0, maxLength: 5 }),
    interests: fc.array(fc.constantFrom('AI', 'Design', 'Leadership', 'Data Science', 'Product'), { minLength: 0, maxLength: 5 }),
    struggles: fc.array(challengeArb, { minLength: 0, maxLength: 5 }),
  }),
  skills: fc.record({
    current: fc.array(skillArb, { minLength: 0, maxLength: 10 }),
    learning: fc.array(skillArb, { minLength: 0, maxLength: 5 }),
    target: fc.array(skillArb, { minLength: 0, maxLength: 10 }),
  }),
  mindset: fc.record({
    confidenceLevel: fc.double({ min: 0, max: 1 }),
    motivationLevel: fc.double({ min: 0, max: 1 }),
    primaryConcerns: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
  }),
  progress: fc.record({
    completedActions: fc.array(fc.uuid(), { minLength: 0, maxLength: 20 }),
    milestones: fc.array(milestoneArb, { minLength: 0, maxLength: 10 }),
    lastUpdated: fc.date(),
  }),
});

describe('In-Role Growth Advisor - Property Tests', () => {
  // Feature: worklife-ai-coach, Property 25: In-role growth scope
  // Validates: Requirements 10.1
  it('Property 25: should always return scope as current_role_only for any user profile', () => {
    fc.assert(
      fc.property(userProfileArb, (profile) => {
        const analysis = analyzeInRoleGrowth(profile);
        
        // The scope should always be 'current_role_only' for in-role growth analysis
        expect(analysis.scope).toBe('current_role_only');
      }),
      { numRuns: 100 }
    );
  });

  // Feature: worklife-ai-coach, Property 26: In-role opportunity identification
  // Validates: Requirements 10.2
  it('Property 26: should identify specific opportunities for increased responsibility or visibility', () => {
    fc.assert(
      fc.property(userProfileArb, (profile) => {
        const analysis = analyzeInRoleGrowth(profile);
        
        // Should always return some opportunities
        expect(analysis.opportunities.length).toBeGreaterThan(0);
        
        // All opportunities should have required fields
        for (const opportunity of analysis.opportunities) {
          expect(opportunity.type).toBeDefined();
          expect(['responsibility', 'visibility', 'skill_development', 'leadership']).toContain(opportunity.type);
          expect(opportunity.description).toBeDefined();
          expect(opportunity.description.length).toBeGreaterThan(0);
          expect(typeof opportunity.actionable).toBe('boolean');
          expect(['high', 'medium', 'low']).toContain(opportunity.estimatedImpact);
        }
        
        // Should include at least one responsibility or visibility opportunity
        const hasResponsibilityOrVisibility = analysis.opportunities.some(
          opp => opp.type === 'responsibility' || opp.type === 'visibility'
        );
        expect(hasResponsibilityOrVisibility).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: worklife-ai-coach, Property 27: Employer-relevant skill recommendations
  // Validates: Requirements 10.3
  it('Property 27: should recommend skills that align with current role requirements', () => {
    fc.assert(
      fc.property(userProfileArb, (profile) => {
        const analysis = analyzeInRoleGrowth(profile);
        
        // All skill recommendations should have required fields
        for (const skillRec of analysis.skillRecommendations) {
          expect(skillRec.skill).toBeDefined();
          expect(skillRec.skill.length).toBeGreaterThan(0);
          expect(typeof skillRec.priority).toBe('number');
          expect(skillRec.priority).toBeGreaterThanOrEqual(0);
          expect(skillRec.priority).toBeLessThanOrEqual(1);
          expect(skillRec.reasoning).toBeDefined();
          expect(skillRec.reasoning.length).toBeGreaterThan(0);
          expect(Array.isArray(skillRec.learningResources)).toBe(true);
          expect(skillRec.estimatedTime).toBeDefined();
          expect(Array.isArray(skillRec.dependencies)).toBe(true);
        }
        
        // If the user has a current role AND there are skill recommendations,
        // reasoning should reference the role or employer value
        if (profile.personalInfo.currentRole && analysis.skillRecommendations.length > 0) {
          for (const skillRec of analysis.skillRecommendations) {
            const reasoningLower = skillRec.reasoning.toLowerCase();
            const hasRoleRelevance = 
              reasoningLower.includes('role') ||
              reasoningLower.includes('employer') ||
              reasoningLower.includes('current') ||
              reasoningLower.includes('valued') ||
              reasoningLower.includes('organization') ||
              reasoningLower.includes('career advancement') ||
              reasoningLower.includes('professional');
            expect(hasRoleRelevance).toBe(true);
          }
        }
        
        // Skills should be sorted by priority (highest first)
        for (let i = 0; i < analysis.skillRecommendations.length - 1; i++) {
          expect(analysis.skillRecommendations[i].priority).toBeGreaterThanOrEqual(
            analysis.skillRecommendations[i + 1].priority
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  // Feature: worklife-ai-coach, Property 28: Stagnation honest assessment
  // Validates: Requirements 10.4
  it('Property 28: should provide honest assessment when user faces stagnation', () => {
    fc.assert(
      fc.property(userProfileArb, (profile) => {
        const analysis = analyzeInRoleGrowth(profile);
        
        // If stagnation assessment exists, it should have all required fields
        if (analysis.stagnationAssessment) {
          expect(typeof analysis.stagnationAssessment.isStagnant).toBe('boolean');
          expect(analysis.stagnationAssessment.isStagnant).toBe(true); // Should only exist if stagnant
          expect(['high', 'medium', 'low']).toContain(analysis.stagnationAssessment.severity);
          expect(Array.isArray(analysis.stagnationAssessment.reasons)).toBe(true);
          expect(analysis.stagnationAssessment.reasons.length).toBeGreaterThan(0);
          expect(analysis.stagnationAssessment.honestAssessment).toBeDefined();
          expect(analysis.stagnationAssessment.honestAssessment.length).toBeGreaterThan(0);
          expect(Array.isArray(analysis.stagnationAssessment.growthLimitations)).toBe(true);
          
          // Honest assessment should contain honest language
          const assessmentLower = analysis.stagnationAssessment.honestAssessment.toLowerCase();
          const hasHonestLanguage = 
            assessmentLower.includes('limitation') ||
            assessmentLower.includes('limited') ||
            assessmentLower.includes('stagnation') ||
            assessmentLower.includes('challenge') ||
            assessmentLower.includes('opportunity') ||
            assessmentLower.includes('growth');
          expect(hasHonestLanguage).toBe(true);
        }
        
        // If user has stagnation challenge, should have stagnation assessment
        const hasStagnationChallenge = profile.careerInfo.struggles.some(c => c.type === 'stagnation');
        if (hasStagnationChallenge) {
          expect(analysis.stagnationAssessment).not.toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });

  // Feature: worklife-ai-coach, Property 29: Alternative path presentation
  // Validates: Requirements 10.5
  it('Property 29: should present alternative paths when current role growth is limited', () => {
    fc.assert(
      fc.property(userProfileArb, (profile) => {
        const analysis = analyzeInRoleGrowth(profile);
        
        // If stagnation is detected, alternative paths should be provided
        if (analysis.stagnationAssessment?.isStagnant) {
          expect(Array.isArray(analysis.alternativePaths)).toBe(true);
          expect(analysis.alternativePaths.length).toBeGreaterThan(0);
          
          // Each alternative path should have required fields
          for (const path of analysis.alternativePaths) {
            expect(path.id).toBeDefined();
            expect(path.title).toBeDefined();
            expect(path.title.length).toBeGreaterThan(0);
            expect(path.description).toBeDefined();
            expect(path.description.length).toBeGreaterThan(0);
            expect(path.reasoning).toBeDefined();
            expect(path.reasoning.length).toBeGreaterThan(0);
            expect(typeof path.fitScore).toBe('number');
            expect(path.fitScore).toBeGreaterThanOrEqual(0);
            expect(path.fitScore).toBeLessThanOrEqual(1);
            expect(Array.isArray(path.requiredSkills)).toBe(true);
            expect(path.timeToTransition).toBeDefined();
            expect(typeof path.growthPotential).toBe('number');
            
            // Alternative paths should include internal transfers or external opportunities
            const titleLower = path.title.toLowerCase();
            const descriptionLower = path.description.toLowerCase();
            const hasAlternativeIndicator = 
              titleLower.includes('transfer') ||
              titleLower.includes('different') ||
              titleLower.includes('transition') ||
              titleLower.includes('leadership') ||
              descriptionLower.includes('internal') ||
              descriptionLower.includes('external') ||
              descriptionLower.includes('different') ||
              descriptionLower.includes('new') ||
              descriptionLower.includes('other');
            expect(hasAlternativeIndicator).toBe(true);
          }
        }
        
        // If no stagnation, alternative paths should be empty
        if (!analysis.stagnationAssessment?.isStagnant) {
          expect(analysis.alternativePaths.length).toBe(0);
        }
      }),
      { numRuns: 100 }
    );
  });
});
