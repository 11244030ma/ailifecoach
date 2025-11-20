/**
 * Property-based tests for ProfileAnalyzer
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ProfileAnalyzer } from './profileAnalyzer.js';
import { UserProfile, Challenge, Goal } from '../models/core.js';
import { CareerPath } from '../models/recommendations.js';

describe('ProfileAnalyzer', () => {
  const analyzer = new ProfileAnalyzer();

  describe('Property Tests', () => {
    // Feature: worklife-ai-coach, Property 2: Challenge categorization correctness
    // Validates: Requirements 1.2
    it('should categorize any user struggle description into one of the defined challenge types', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          (description) => {
            const challengeType = analyzer.categorizeChallenge(description);
            
            // The result must be one of the valid challenge types
            const validTypes: Challenge['type'][] = [
              'direction', 'skills', 'confidence', 'overwhelm', 'transition', 'stagnation'
            ];
            
            expect(validTypes).toContain(challengeType);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: worklife-ai-coach, Property 4: Incomplete profile detection
    // Validates: Requirements 1.5
    it('should identify missing required fields in any user profile', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.string(),
            personalInfo: fc.record({
              age: fc.integer({ min: 20, max: 35 }),
              currentRole: fc.option(fc.string(), { nil: undefined }),
              yearsOfExperience: fc.integer({ min: 0, max: 15 }),
              education: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
              industry: fc.option(fc.string(), { nil: undefined }),
            }),
            careerInfo: fc.record({
              currentPath: fc.constant(undefined),
              goals: fc.array(fc.record({
                id: fc.string(),
                description: fc.string(),
                type: fc.constantFrom('short_term' as const, 'long_term' as const),
                priority: fc.integer({ min: 1, max: 10 }),
                targetDate: fc.option(fc.date(), { nil: undefined }),
              })),
              interests: fc.array(fc.string()),
              struggles: fc.array(fc.record({
                type: fc.constantFrom(
                  'direction' as const, 
                  'skills' as const, 
                  'confidence' as const, 
                  'overwhelm' as const, 
                  'transition' as const, 
                  'stagnation' as const
                ),
                description: fc.string(),
                severity: fc.integer({ min: 1, max: 10 }),
              })),
            }),
            skills: fc.record({
              current: fc.array(fc.record({
                name: fc.string(),
                level: fc.integer({ min: 0, max: 10 }),
                category: fc.string(),
              })),
              learning: fc.array(fc.record({
                name: fc.string(),
                level: fc.integer({ min: 0, max: 10 }),
                category: fc.string(),
              })),
              target: fc.array(fc.record({
                name: fc.string(),
                level: fc.integer({ min: 0, max: 10 }),
                category: fc.string(),
              })),
            }),
            mindset: fc.record({
              confidenceLevel: fc.double({ min: 0, max: 1 }),
              motivationLevel: fc.double({ min: 0, max: 1 }),
              primaryConcerns: fc.array(fc.string()),
            }),
            progress: fc.record({
              completedActions: fc.array(fc.string()),
              milestones: fc.array(fc.record({
                id: fc.string(),
                title: fc.string(),
                description: fc.string(),
                targetDate: fc.date(),
                completed: fc.boolean(),
                completedDate: fc.option(fc.date(), { nil: undefined }),
              })),
              lastUpdated: fc.date(),
            }),
          }),
          (profile) => {
            const result = analyzer.checkProfileCompleteness(profile as UserProfile);
            
            // Check that missing fields are correctly identified
            const hasCurrentRole = !!profile.personalInfo.currentRole;
            const hasEducation = !!profile.personalInfo.education;
            const hasGoals = profile.careerInfo.goals.length > 0;
            const hasInterests = profile.careerInfo.interests.length > 0;
            const hasStruggles = profile.careerInfo.struggles.length > 0;
            
            // If any required field is missing, isComplete should be false
            if (!hasCurrentRole || !hasEducation || !hasGoals || !hasInterests || !hasStruggles) {
              expect(result.isComplete).toBe(false);
              expect(result.missingFields.length).toBeGreaterThan(0);
            }
            
            // Verify specific missing fields are reported
            if (!hasCurrentRole) {
              expect(result.missingFields).toContain('currentRole');
            }
            if (!hasEducation) {
              expect(result.missingFields).toContain('education');
            }
            if (!hasGoals) {
              expect(result.missingFields).toContain('goals');
            }
            if (!hasInterests) {
              expect(result.missingFields).toContain('interests');
            }
            if (!hasStruggles) {
              expect(result.missingFields).toContain('struggles');
            }
            
            // If all required fields are present, isComplete should be true
            if (hasCurrentRole && hasEducation && hasGoals && hasInterests && hasStruggles) {
              expect(result.isComplete).toBe(true);
              expect(result.missingFields.length).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    it('should analyze a complete profile', () => {
      const profile: UserProfile = {
        userId: 'user1',
        personalInfo: {
          age: 28,
          currentRole: 'Software Engineer',
          yearsOfExperience: 5,
          education: 'BS Computer Science',
          industry: 'Tech',
        },
        careerInfo: {
          goals: [
            {
              id: 'g1',
              description: 'Become a senior engineer',
              type: 'long_term',
              priority: 1,
            },
          ],
          interests: ['AI', 'Web Development'],
          struggles: [
            {
              type: 'direction',
              description: 'Unsure about career path',
              severity: 5,
            },
          ],
        },
        skills: {
          current: [
            { name: 'JavaScript', level: 8, category: 'Programming' },
            { name: 'Python', level: 6, category: 'Programming' },
          ],
          learning: [],
          target: [
            { name: 'Machine Learning', level: 7, category: 'AI' },
          ],
        },
        mindset: {
          confidenceLevel: 0.7,
          motivationLevel: 0.8,
          primaryConcerns: ['Career growth'],
        },
        progress: {
          completedActions: ['action1'],
          milestones: [],
          lastUpdated: new Date(),
        },
      };

      const analysis = analyzer.analyzeProfile(profile);
      
      expect(analysis.strengths).toContain('JavaScript');
      expect(analysis.confidenceLevel).toBe(0.7);
      expect(analysis.careerStage).toBe('mid');
      expect(analysis.primaryChallenges).toHaveLength(1);
    });

    it('should identify skill gaps', () => {
      const profile: UserProfile = {
        userId: 'user1',
        personalInfo: {
          age: 25,
          currentRole: 'Junior Developer',
          yearsOfExperience: 2,
          education: 'BS CS',
        },
        careerInfo: {
          goals: [],
          interests: [],
          struggles: [],
        },
        skills: {
          current: [
            { name: 'JavaScript', level: 5, category: 'Programming' },
          ],
          learning: [],
          target: [],
        },
        mindset: {
          confidenceLevel: 0.5,
          motivationLevel: 0.6,
          primaryConcerns: [],
        },
        progress: {
          completedActions: [],
          milestones: [],
          lastUpdated: new Date(),
        },
      };

      const careerPath: CareerPath = {
        id: 'path1',
        title: 'Full Stack Developer',
        description: 'Build web applications',
        reasoning: 'Good fit',
        fitScore: 0.8,
        requiredSkills: ['JavaScript', 'React', 'Node.js'],
        timeToTransition: '6 months',
        growthPotential: 0.9,
      };

      const gaps = analyzer.identifyGaps(profile, careerPath);
      
      expect(gaps.length).toBeGreaterThan(0);
      expect(gaps.some(g => g.skill === 'React')).toBe(true);
      expect(gaps.some(g => g.skill === 'Node.js')).toBe(true);
    });

    it('should assess readiness for a goal', () => {
      const profile: UserProfile = {
        userId: 'user1',
        personalInfo: {
          age: 30,
          currentRole: 'Developer',
          yearsOfExperience: 7,
          education: 'BS CS',
        },
        careerInfo: {
          goals: [],
          interests: [],
          struggles: [],
        },
        skills: {
          current: [
            { name: 'JavaScript', level: 8, category: 'Programming' },
          ],
          learning: [],
          target: [
            { name: 'React', level: 7, category: 'Frontend' },
          ],
        },
        mindset: {
          confidenceLevel: 0.8,
          motivationLevel: 0.9,
          primaryConcerns: [],
        },
        progress: {
          completedActions: [],
          milestones: [],
          lastUpdated: new Date(),
        },
      };

      const goal: Goal = {
        id: 'g1',
        description: 'Become a senior developer',
        type: 'long_term',
        priority: 1,
      };

      const readiness = analyzer.assessReadiness(profile, goal);
      
      expect(readiness.score).toBeGreaterThan(0);
      expect(readiness.score).toBeLessThanOrEqual(1);
      expect(readiness.factors).toHaveProperty('skillAlignment');
      expect(readiness.factors).toHaveProperty('experienceLevel');
      expect(readiness.factors).toHaveProperty('motivationLevel');
    });

    it('should track progress over time', () => {
      const profile: UserProfile = {
        userId: 'user1',
        personalInfo: {
          age: 27,
          currentRole: 'Developer',
          yearsOfExperience: 4,
          education: 'BS CS',
        },
        careerInfo: {
          goals: [],
          interests: [],
          struggles: [],
        },
        skills: {
          current: [
            { name: 'JavaScript', level: 8, category: 'Programming' },
          ],
          learning: [],
          target: [],
        },
        mindset: {
          confidenceLevel: 0.7,
          motivationLevel: 0.8,
          primaryConcerns: [],
        },
        progress: {
          completedActions: ['action1', 'action2'],
          milestones: [
            {
              id: 'm1',
              title: 'Complete course',
              description: 'Finish React course',
              targetDate: new Date('2024-01-01'),
              completed: true,
              completedDate: new Date('2024-01-15'),
            },
          ],
          lastUpdated: new Date(),
        },
      };

      const timeframe = {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
      };

      const progress = analyzer.trackProgress(profile, timeframe);
      
      expect(progress.userId).toBe('user1');
      expect(progress.completedActions).toBe(2);
      expect(progress.completedMilestones).toBe(1);
    });

    it('should categorize direction-related challenges', () => {
      expect(analyzer.categorizeChallenge('I feel lost in my career')).toBe('direction');
      expect(analyzer.categorizeChallenge('Unclear about my path')).toBe('direction');
      expect(analyzer.categorizeChallenge('Confused about what to do next')).toBe('direction');
    });

    it('should categorize skills-related challenges', () => {
      expect(analyzer.categorizeChallenge('I need to learn new skills')).toBe('skills');
      expect(analyzer.categorizeChallenge('Lacking technical knowledge')).toBe('skills');
    });

    it('should categorize confidence-related challenges', () => {
      expect(analyzer.categorizeChallenge('I have imposter syndrome')).toBe('confidence');
      expect(analyzer.categorizeChallenge('Not confident in my abilities')).toBe('confidence');
    });

    it('should categorize overwhelm-related challenges', () => {
      expect(analyzer.categorizeChallenge('Feeling overwhelmed with work')).toBe('overwhelm');
      expect(analyzer.categorizeChallenge('Too much stress')).toBe('overwhelm');
    });

    it('should categorize transition-related challenges', () => {
      expect(analyzer.categorizeChallenge('Want to change careers')).toBe('transition');
      expect(analyzer.categorizeChallenge('Switching to a different field')).toBe('transition');
    });

    it('should categorize stagnation-related challenges', () => {
      expect(analyzer.categorizeChallenge('Feeling stuck in my role')).toBe('stagnation');
      expect(analyzer.categorizeChallenge('Not growing anymore')).toBe('stagnation');
    });
  });
});
