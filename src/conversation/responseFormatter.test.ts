/**
 * Tests for ResponseFormatter
 * Validates response generation and formatting
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ResponseFormatter, ResponseContext } from './responseFormatter.js';
import { CareerPath, SkillRecommendation, GrowthPlan, TransitionPlan } from '../models/recommendations.js';
import { ActionStep, UserProfile } from '../models/core.js';

describe('ResponseFormatter', () => {
  const formatter = new ResponseFormatter();

  describe('Property 21: Actionable guidance presence', () => {
    /**
     * Feature: worklife-ai-coach, Property 21: Actionable guidance presence
     * For any system response, it should contain at least one actionable element
     * Validates: Requirements 8.5
     */
    it('should ensure all responses contain actionable elements', () => {
      fc.assert(
        fc.property(
          fc.record({
            message: fc.string({ minLength: 10, maxLength: 200 }),
            hasCareerPaths: fc.boolean(),
            hasSkills: fc.boolean(),
            hasActions: fc.boolean(),
            hasGrowthPlan: fc.boolean(),
            hasTransitionPlan: fc.boolean(),
            intent: fc.constantFrom(
              'profile_building',
              'career_clarity',
              'skill_guidance',
              'action_planning',
              'mindset_support',
              'growth_planning',
              'transition_guidance',
              'progress_check'
            ),
            isReturningUser: fc.boolean()
          }),
          (testCase) => {
            const context: ResponseContext = {
              intent: testCase.intent,
              isReturningUser: testCase.isReturningUser
            };

            const recommendations: any = {};

            if (testCase.hasCareerPaths) {
              recommendations.careerPaths = [{
                id: 'path1',
                title: 'Software Engineer',
                description: 'Build software',
                reasoning: 'Good fit for your skills',
                fitScore: 0.8,
                requiredSkills: ['JavaScript'],
                timeToTransition: '3 months',
                growthPotential: 0.9
              }];
            }

            if (testCase.hasSkills) {
              recommendations.skills = [{
                skill: 'TypeScript',
                priority: 1,
                reasoning: 'Essential for modern development',
                learningResources: [],
                estimatedTime: '2 months',
                dependencies: []
              }];
            }

            if (testCase.hasActions) {
              recommendations.actions = [{
                id: 'action1',
                description: 'Complete online course',
                timeframe: 'this_week' as const,
                category: 'learning' as const,
                completed: false
              }];
            }

            if (testCase.hasGrowthPlan) {
              recommendations.growthPlan = {
                id: 'plan1',
                userId: 'user1',
                careerPath: {
                  id: 'path1',
                  title: 'Data Scientist',
                  description: 'Analyze data',
                  reasoning: 'Matches your analytical skills',
                  fitScore: 0.85,
                  requiredSkills: ['Python', 'Statistics'],
                  timeToTransition: '6 months',
                  growthPotential: 0.9
                },
                timeline: '6 months',
                phases: [{
                  name: 'Foundation',
                  duration: '2 months',
                  objectives: ['Learn Python'],
                  skills: ['Python'],
                  actions: [{
                    id: 'a1',
                    description: 'Complete Python basics',
                    timeframe: 'this_month' as const,
                    category: 'learning' as const,
                    completed: false
                  }]
                }],
                milestones: [{
                  id: 'm1',
                  title: 'Complete Python course',
                  description: 'Finish online course',
                  targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                  completed: false
                }],
                createdAt: new Date(),
                lastUpdated: new Date()
              };
            }

            if (testCase.hasTransitionPlan) {
              recommendations.transitionPlan = {
                sourceField: 'Marketing',
                targetField: 'Product Management',
                transferableSkills: ['Communication', 'Analysis'],
                skillsToAcquire: [{
                  skill: 'Product Strategy',
                  priority: 1,
                  reasoning: 'Core PM skill',
                  learningResources: [],
                  estimatedTime: '3 months',
                  dependencies: []
                }],
                phases: [{
                  name: 'Preparation',
                  duration: '3 months',
                  focus: 'Build product knowledge',
                  actions: [{
                    id: 'a1',
                    description: 'Read product management books',
                    timeframe: 'this_month' as const,
                    category: 'learning' as const,
                    completed: false
                  }],
                  successCriteria: ['Complete 3 PM courses']
                }],
                estimatedDuration: '9 months',
                difficultyLevel: 'moderate' as const,
                risks: ['Limited PM experience'],
                successFactors: ['Strong communication skills']
              };
            }

            const response = formatter.formatGeneralResponse(
              testCase.message,
              Object.keys(recommendations).length > 0 ? recommendations : undefined,
              context
            );

            // Property: Every response must have an actionable element
            expect(response.hasActionableElement).toBe(true);

            // Verify the content actually contains actionable indicators
            const content = response.content.toLowerCase();
            const hasActionableIndicator = 
              content.includes('?') || // Question
              content.includes('recommend') ||
              content.includes('suggest') ||
              content.includes('try') ||
              content.includes('start') ||
              content.includes('consider') ||
              content.includes('next step') ||
              content.includes('action') ||
              content.includes('focus on') ||
              content.includes('shall we') ||
              content.includes('ready') ||
              content.includes('would you like');

            expect(hasActionableIndicator).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Career Path Formatting', () => {
    it('should format single career path with reasoning', () => {
      const path: CareerPath = {
        id: 'path1',
        title: 'Software Engineer',
        description: 'Build software applications',
        reasoning: 'Your programming background and problem-solving skills make this a natural fit.',
        fitScore: 0.85,
        requiredSkills: ['JavaScript', 'React'],
        timeToTransition: '3 months',
        growthPotential: 0.9
      };

      const context: ResponseContext = {
        intent: 'career_clarity',
        isReturningUser: false
      };

      const response = formatter.formatCareerPathRecommendation([path], context);

      expect(response.content).toContain('Software Engineer');
      expect(response.content).toContain(path.reasoning);
      expect(response.hasActionableElement).toBe(true);
      expect(response.recommendations?.careerPaths).toHaveLength(1);
    });

    it('should format multiple career paths with trade-offs', () => {
      const paths: CareerPath[] = [
        {
          id: 'path1',
          title: 'Software Engineer',
          description: 'Build software',
          reasoning: 'Strong technical fit',
          fitScore: 0.85,
          requiredSkills: ['JavaScript'],
          timeToTransition: '3 months',
          growthPotential: 0.9
        },
        {
          id: 'path2',
          title: 'Product Manager',
          description: 'Manage products',
          reasoning: 'Good leadership potential',
          fitScore: 0.75,
          requiredSkills: ['Strategy'],
          timeToTransition: '6 months',
          growthPotential: 0.85
        }
      ];

      const context: ResponseContext = {
        intent: 'career_clarity',
        isReturningUser: false
      };

      const response = formatter.formatCareerPathRecommendation(paths, context);

      expect(response.content).toContain('Software Engineer');
      expect(response.content).toContain('Product Manager');
      expect(response.content).toContain('85%'); // fit score
      expect(response.content).toContain('75%'); // fit score
      expect(response.hasActionableElement).toBe(true);
    });
  });

  describe('Skill Recommendation Formatting', () => {
    it('should format skill recommendations with reasoning', () => {
      const skills: SkillRecommendation[] = [
        {
          skill: 'TypeScript',
          priority: 1,
          reasoning: 'Essential for modern web development and will increase your marketability.',
          learningResources: [],
          estimatedTime: '2 months',
          dependencies: ['JavaScript']
        }
      ];

      const context: ResponseContext = {
        intent: 'skill_guidance',
        isReturningUser: false
      };

      const response = formatter.formatSkillRecommendation(skills, context);

      expect(response.content).toContain('TypeScript');
      expect(response.content).toContain(skills[0].reasoning);
      expect(response.content).toContain('2 months');
      expect(response.hasActionableElement).toBe(true);
    });

    it('should prioritize skills correctly', () => {
      const skills: SkillRecommendation[] = [
        {
          skill: 'Python',
          priority: 1,
          reasoning: 'Highest impact skill',
          learningResources: [],
          estimatedTime: '3 months',
          dependencies: []
        },
        {
          skill: 'SQL',
          priority: 2,
          reasoning: 'Important for data work',
          learningResources: [],
          estimatedTime: '1 month',
          dependencies: []
        },
        {
          skill: 'Machine Learning',
          priority: 3,
          reasoning: 'Advanced skill',
          learningResources: [],
          estimatedTime: '6 months',
          dependencies: ['Python']
        }
      ];

      const context: ResponseContext = {
        intent: 'skill_guidance',
        isReturningUser: false
      };

      const response = formatter.formatSkillRecommendation(skills, context);

      // Should mention Python first as highest priority
      const pythonIndex = response.content.indexOf('Python');
      const sqlIndex = response.content.indexOf('SQL');
      
      expect(pythonIndex).toBeGreaterThan(-1);
      expect(pythonIndex).toBeLessThan(sqlIndex);
      expect(response.hasActionableElement).toBe(true);
    });
  });

  describe('Action Step Formatting', () => {
    it('should format action steps by timeframe', () => {
      const actions: ActionStep[] = [
        {
          id: 'a1',
          description: 'Update LinkedIn profile',
          timeframe: 'today',
          category: 'networking',
          completed: false
        },
        {
          id: 'a2',
          description: 'Complete online course module',
          timeframe: 'this_week',
          category: 'learning',
          completed: false
        },
        {
          id: 'a3',
          description: 'Apply to 5 jobs',
          timeframe: 'this_month',
          category: 'application',
          completed: false
        }
      ];

      const context: ResponseContext = {
        intent: 'action_planning',
        isReturningUser: false
      };

      const response = formatter.formatActionSteps(actions, context);

      expect(response.content).toContain('Today');
      expect(response.content).toContain('This Week');
      expect(response.content).toContain('This Month');
      expect(response.content).toContain('Update LinkedIn profile');
      expect(response.content).toContain('Complete online course module');
      expect(response.content).toContain('Apply to 5 jobs');
      expect(response.hasActionableElement).toBe(true);
    });
  });

  describe('Growth Plan Formatting', () => {
    it('should format growth plan with milestones and phases', () => {
      const plan: GrowthPlan = {
        id: 'plan1',
        userId: 'user1',
        careerPath: {
          id: 'path1',
          title: 'Senior Developer',
          description: 'Lead development teams',
          reasoning: 'Natural progression',
          fitScore: 0.9,
          requiredSkills: ['Leadership', 'Architecture'],
          timeToTransition: '12 months',
          growthPotential: 0.95
        },
        timeline: '12 months',
        phases: [
          {
            name: 'Technical Depth',
            duration: '4 months',
            objectives: ['Master system design', 'Learn architecture patterns'],
            skills: ['System Design', 'Architecture'],
            actions: [
              {
                id: 'a1',
                description: 'Complete system design course',
                timeframe: 'this_month',
                category: 'learning',
                completed: false
              }
            ]
          }
        ],
        milestones: [
          {
            id: 'm1',
            title: 'Complete architecture certification',
            description: 'Get certified in system architecture',
            targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 4 months
            completed: false
          }
        ],
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      const context: ResponseContext = {
        intent: 'growth_planning',
        isReturningUser: false
      };

      const response = formatter.formatGrowthPlan(plan, context);

      expect(response.content).toContain('Senior Developer');
      expect(response.content).toContain('Technical Depth');
      expect(response.content).toContain('Complete architecture certification');
      expect(response.hasActionableElement).toBe(true);
    });
  });

  describe('Transition Plan Formatting', () => {
    it('should format transition plan with transferable skills', () => {
      const plan: TransitionPlan = {
        sourceField: 'Teaching',
        targetField: 'Instructional Design',
        transferableSkills: ['Communication', 'Curriculum Development', 'Presentation'],
        skillsToAcquire: [
          {
            skill: 'E-Learning Tools',
            priority: 1,
            reasoning: 'Essential for creating digital learning content',
            learningResources: [],
            estimatedTime: '2 months',
            dependencies: []
          }
        ],
        phases: [
          {
            name: 'Skill Building',
            duration: '3 months',
            focus: 'Learn e-learning authoring tools',
            actions: [
              {
                id: 'a1',
                description: 'Complete Articulate Storyline course',
                timeframe: 'this_month',
                category: 'learning',
                completed: false
              }
            ],
            successCriteria: ['Create 3 sample e-learning modules']
          }
        ],
        estimatedDuration: '6 months',
        difficultyLevel: 'moderate',
        risks: ['Limited technical experience'],
        successFactors: ['Strong teaching background']
      };

      const context: ResponseContext = {
        intent: 'transition_guidance',
        isReturningUser: false
      };

      const response = formatter.formatTransitionPlan(plan, context);

      expect(response.content).toContain('Teaching');
      expect(response.content).toContain('Instructional Design');
      expect(response.content).toContain('Communication');
      expect(response.content).toContain('E-Learning Tools');
      expect(response.content).toContain('6 months');
      expect(response.content).toContain('moderate');
      expect(response.hasActionableElement).toBe(true);
    });
  });

  describe('Progress Acknowledgment', () => {
    it('should acknowledge single completed action', () => {
      const actions: ActionStep[] = [
        {
          id: 'a1',
          description: 'Update resume',
          timeframe: 'today',
          category: 'application',
          completed: true
        }
      ];

      const context: ResponseContext = {
        intent: 'progress_check',
        isReturningUser: true
      };

      const acknowledgment = formatter.formatProgressAcknowledgment(actions, context);

      expect(acknowledgment).toContain('Great work');
      expect(acknowledgment).toContain('Update resume');
    });

    it('should acknowledge multiple completed actions', () => {
      const actions: ActionStep[] = [
        {
          id: 'a1',
          description: 'Update resume',
          timeframe: 'today',
          category: 'application',
          completed: true
        },
        {
          id: 'a2',
          description: 'Apply to jobs',
          timeframe: 'this_week',
          category: 'application',
          completed: true
        }
      ];

      const context: ResponseContext = {
        intent: 'progress_check',
        isReturningUser: true
      };

      const acknowledgment = formatter.formatProgressAcknowledgment(actions, context);

      expect(acknowledgment).toContain('progress');
      expect(acknowledgment).toContain('2');
    });
  });
});
