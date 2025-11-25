/**
 * Main Coaching Engine
 * Integrates all components into a unified coaching flow with error handling
 * and graceful degradation
 */

import { ConversationManager, Response } from './conversation/conversationManager.js';
import { ResponseFormatter, ResponseContext } from './conversation/responseFormatter.js';
import { recognizeIntent, shouldPrioritizeMindset } from './intent/intentRecognizer.js';
import { ProfileAnalyzer } from './profile/profileAnalyzer.js';
import { DataStore } from './persistence/dataStore.js';
import { 
  UserProfile, 
  Intent, 
  Goal,
  ActionStep,
  Session 
} from './models/core.js';
import {
  CareerPath,
  SkillRecommendation,
  GrowthPlan,
  TransitionPlan
} from './models/recommendations.js';
import {
  generateCareerPaths,
  identifyTradeOffs
} from './recommendations/careerPathEngine.js';
import {
  recommendSkills,
  getHighestImpactSkill
} from './recommendations/skillRecommender.js';
import {
  generateActionSteps,
  generateProgressAcknowledgment
} from './recommendations/actionStepGenerator.js';
import {
  buildGrowthPlan,
  adaptGrowthPlan
} from './recommendations/growthPlanBuilder.js';
import {
  generateTransitionPlan
} from './recommendations/transitionAdvisor.js';
import {
  analyzeInRoleGrowth,
  InRoleGrowthAnalysis
} from './recommendations/inRoleGrowthAdvisor.js';

/**
 * Coaching request with user message and context
 */
export interface CoachingRequest {
  userId: string;
  message: string;
  sessionId?: string;
}

/**
 * Coaching response with recommendations and formatted content
 */
export interface CoachingResponse {
  content: string;
  sessionId: string;
  timestamp: Date;
  intent: Intent;
  recommendations?: {
    careerPaths?: CareerPath[];
    skills?: SkillRecommendation[];
    actions?: ActionStep[];
    growthPlan?: GrowthPlan;
    transitionPlan?: TransitionPlan;
    inRoleGrowth?: InRoleGrowthAnalysis;
  };
}

/**
 * Main Coaching Engine that integrates all components
 */
export class CoachingEngine {
  private conversationManager: ConversationManager;
  private profileAnalyzer: ProfileAnalyzer;
  private responseFormatter: ResponseFormatter;
  private dataStore: DataStore;

  constructor(dataStore: DataStore) {
    this.dataStore = dataStore;
    this.conversationManager = new ConversationManager(dataStore);
    this.profileAnalyzer = new ProfileAnalyzer();
    this.responseFormatter = new ResponseFormatter();
  }

  /**
   * Process a coaching request and generate a response
   * Handles intent recognition, routing, and recommendation generation
   */
  async processRequest(request: CoachingRequest): Promise<CoachingResponse> {
    try {
      // Start or continue session
      let session: Session;
      if (request.sessionId) {
        const existingSession = this.conversationManager.getSessionContext(request.sessionId);
        if (!existingSession) {
          session = this.conversationManager.startSession(request.userId);
        } else {
          session = {
            id: request.sessionId,
            userId: request.userId,
            startTime: new Date(),
            lastActivity: new Date(),
            context: existingSession
          };
        }
      } else {
        session = this.conversationManager.startSession(request.userId);
      }

      // Recognize intent
      const intent = recognizeIntent(request.message);

      // Get user profile
      const userProfile = await this.getUserProfileSafely(request.userId);

      // Route to appropriate handler based on intent
      const recommendations = await this.routeRequest(intent, request.message, userProfile);

      // Format response
      const formattedResponse = await this.formatResponse(
        intent,
        recommendations,
        userProfile,
        session
      );

      // Continue session with formatted response
      await this.conversationManager.continueSession(session.id, request.message);

      return {
        content: formattedResponse.content,
        sessionId: session.id,
        timestamp: new Date(),
        intent,
        recommendations: formattedResponse.recommendations
      };
    } catch (error) {
      // Graceful degradation on error
      return this.handleError(error, request);
    }
  }

  /**
   * Route request to appropriate recommendation systems based on intent
   */
  private async routeRequest(
    intent: Intent,
    message: string,
    userProfile: UserProfile | null
  ): Promise<{
    careerPaths?: CareerPath[];
    skills?: SkillRecommendation[];
    actions?: ActionStep[];
    growthPlan?: GrowthPlan;
    transitionPlan?: TransitionPlan;
    inRoleGrowth?: InRoleGrowthAnalysis;
  }> {
    const recommendations: any = {};

    try {
      switch (intent.type) {
        case 'career_clarity':
          recommendations.careerPaths = await this.generateCareerPathRecommendations(userProfile);
          break;

        case 'skill_guidance':
          recommendations.skills = await this.generateSkillRecommendations(userProfile);
          break;

        case 'action_planning':
          recommendations.actions = await this.generateActionStepRecommendations(userProfile);
          break;

        case 'growth_planning':
          recommendations.growthPlan = await this.generateGrowthPlanRecommendation(userProfile);
          break;

        case 'transition_guidance':
          recommendations.transitionPlan = await this.generateTransitionGuidance(intent, userProfile);
          break;

        case 'progress_check':
          recommendations.actions = await this.handleProgressCheck(userProfile);
          break;

        case 'mindset_support':
          // Mindset support doesn't generate specific recommendations
          // but may include actions for reflection
          recommendations.actions = await this.generateMindsetActions(userProfile);
          break;

        case 'profile_building':
          // Profile building may suggest next steps
          recommendations.actions = await this.generateProfileBuildingActions(userProfile);
          break;

        default:
          // Default: provide general guidance
          recommendations.actions = await this.generateActionStepRecommendations(userProfile);
          break;
      }

      // Check if user wants in-role growth specifically
      if (message.toLowerCase().includes('current role') || 
          message.toLowerCase().includes('current job') ||
          message.toLowerCase().includes('where i am')) {
        recommendations.inRoleGrowth = await this.generateInRoleGrowthGuidance(userProfile);
      }

    } catch (error) {
      console.error('Error routing request:', error);
      // Continue with partial recommendations
    }

    return recommendations;
  }

  /**
   * Generate career path recommendations with error handling
   */
  private async generateCareerPathRecommendations(
    userProfile: UserProfile | null
  ): Promise<CareerPath[]> {
    try {
      if (!userProfile) {
        return [];
      }

      const paths = generateCareerPaths(userProfile);
      
      // Add trade-offs if multiple paths
      if (paths.length > 1) {
        return identifyTradeOffs(paths);
      }

      return paths;
    } catch (error) {
      console.error('Error generating career paths:', error);
      return [];
    }
  }

  /**
   * Generate skill recommendations with error handling
   */
  private async generateSkillRecommendations(
    userProfile: UserProfile | null
  ): Promise<SkillRecommendation[]> {
    try {
      if (!userProfile) {
        return [];
      }

      // If no career path is set, generate one first
      if (!userProfile.careerInfo.currentPath) {
        const paths = await this.generateCareerPathRecommendations(userProfile);
        if (paths.length > 0) {
          // Use the top career path for skill recommendations
          return recommendSkills(userProfile, paths[0]);
        }
        return [];
      }

      return recommendSkills(userProfile, userProfile.careerInfo.currentPath);
    } catch (error) {
      console.error('Error generating skill recommendations:', error);
      return [];
    }
  }

  /**
   * Generate action step recommendations with error handling
   */
  private async generateActionStepRecommendations(
    userProfile: UserProfile | null
  ): Promise<ActionStep[]> {
    try {
      if (!userProfile) {
        return [];
      }

      const goals = userProfile.careerInfo.goals;
      if (goals.length === 0) {
        return [];
      }

      const careerPath = userProfile.careerInfo.currentPath;
      const skillRecommendations = careerPath 
        ? await this.generateSkillRecommendations(userProfile)
        : undefined;

      return generateActionSteps(userProfile, goals, careerPath, skillRecommendations);
    } catch (error) {
      console.error('Error generating action steps:', error);
      return [];
    }
  }

  /**
   * Generate growth plan recommendation with error handling
   */
  private async generateGrowthPlanRecommendation(
    userProfile: UserProfile | null
  ): Promise<GrowthPlan | undefined> {
    try {
      if (!userProfile) {
        return undefined;
      }

      // If no career path is set, generate one first
      let careerPath = userProfile.careerInfo.currentPath;
      if (!careerPath) {
        const paths = await this.generateCareerPathRecommendations(userProfile);
        if (paths.length > 0) {
          careerPath = paths[0];
        } else {
          return undefined;
        }
      }

      // Check if user has an existing growth plan
      const existingPlan = await this.getExistingGrowthPlan(userProfile);
      
      if (existingPlan) {
        // Adapt existing plan
        return adaptGrowthPlan(existingPlan, userProfile);
      }

      // Build new growth plan
      return buildGrowthPlan(userProfile, careerPath);
    } catch (error) {
      console.error('Error generating growth plan:', error);
      return undefined;
    }
  }

  /**
   * Generate transition guidance with error handling
   */
  private async generateTransitionGuidance(
    intent: Intent,
    userProfile: UserProfile | null
  ): Promise<TransitionPlan | undefined> {
    try {
      if (!userProfile) {
        return undefined;
      }

      // Extract source and target fields from intent entities
      const careerFields = intent.entities.careerFields as string[] | undefined;
      
      let sourceField = userProfile.personalInfo.industry || 'current field';
      let targetField = careerFields && careerFields.length > 0 
        ? careerFields[0] 
        : 'target field';

      // If multiple fields mentioned, assume first is source, second is target
      if (careerFields && careerFields.length >= 2) {
        sourceField = careerFields[0];
        targetField = careerFields[1];
      }

      return generateTransitionPlan(sourceField, targetField, userProfile);
    } catch (error) {
      console.error('Error generating transition guidance:', error);
      return undefined;
    }
  }

  /**
   * Generate in-role growth guidance with error handling
   */
  private async generateInRoleGrowthGuidance(
    userProfile: UserProfile | null
  ): Promise<InRoleGrowthAnalysis | undefined> {
    try {
      if (!userProfile) {
        return undefined;
      }

      return analyzeInRoleGrowth(userProfile);
    } catch (error) {
      console.error('Error generating in-role growth guidance:', error);
      return undefined;
    }
  }

  /**
   * Handle progress check intent
   */
  private async handleProgressCheck(
    userProfile: UserProfile | null
  ): Promise<ActionStep[]> {
    try {
      if (!userProfile) {
        return [];
      }

      // Generate acknowledgment for completed actions
      const completedActions = userProfile.progress.completedActions
        .map(id => ({
          id,
          description: 'Completed action',
          timeframe: 'today' as const,
          category: 'learning' as const,
          completed: true
        }));

      // Generate next action steps
      return this.generateActionStepRecommendations(userProfile);
    } catch (error) {
      console.error('Error handling progress check:', error);
      return [];
    }
  }

  /**
   * Generate mindset-focused actions
   */
  private async generateMindsetActions(
    userProfile: UserProfile | null
  ): Promise<ActionStep[]> {
    try {
      const actions: ActionStep[] = [];

      // Generate reflection-focused actions
      actions.push({
        id: `mindset-${Date.now()}-1`,
        description: 'Write down three things you\'ve accomplished recently, no matter how small',
        timeframe: 'today',
        category: 'reflection',
        completed: false
      });

      actions.push({
        id: `mindset-${Date.now()}-2`,
        description: 'Identify one challenge you\'re facing and reframe it as a learning opportunity',
        timeframe: 'this_week',
        category: 'reflection',
        completed: false
      });

      return actions;
    } catch (error) {
      console.error('Error generating mindset actions:', error);
      return [];
    }
  }

  /**
   * Generate profile building actions
   */
  private async generateProfileBuildingActions(
    userProfile: UserProfile | null
  ): Promise<ActionStep[]> {
    try {
      if (!userProfile) {
        return [];
      }

      // Check profile completeness
      const completeness = this.profileAnalyzer.checkProfileCompleteness(userProfile);
      
      if (!completeness.isComplete) {
        const actions: ActionStep[] = [];
        
        if (completeness.missingFields.includes('goals')) {
          actions.push({
            id: `profile-${Date.now()}-1`,
            description: 'Define your short-term and long-term career goals',
            timeframe: 'today',
            category: 'reflection',
            completed: false
          });
        }

        if (completeness.missingFields.includes('interests')) {
          actions.push({
            id: `profile-${Date.now()}-2`,
            description: 'List your professional interests and what energizes you at work',
            timeframe: 'today',
            category: 'reflection',
            completed: false
          });
        }

        return actions;
      }

      // Profile is complete, suggest next steps
      return this.generateActionStepRecommendations(userProfile);
    } catch (error) {
      console.error('Error generating profile building actions:', error);
      return [];
    }
  }

  /**
   * Format response with mindset-first ordering if needed
   */
  private async formatResponse(
    intent: Intent,
    recommendations: any,
    userProfile: UserProfile | null,
    session: Session
  ): Promise<{
    content: string;
    recommendations?: any;
  }> {
    try {
      // Check if mindset should be prioritized
      const prioritizeMindset = shouldPrioritizeMindset(intent);

      let content = '';

      // Add mindset support first if needed
      if (prioritizeMindset) {
        content += this.generateMindsetSupport(intent, userProfile);
        content += '\n\n';
      }

      // Check for progress acknowledgment
      const hasProgress = userProfile ? userProfile.progress.completedActions.length > 0 : false;

      // Create response context
      const context: ResponseContext = {
        userProfile: userProfile || undefined,
        intent: intent.type,
        isReturningUser: hasProgress || false,
        hasProgress: hasProgress
      };

      // Format recommendations
      const formatted = this.responseFormatter.formatCombinedResponse(
        recommendations,
        context
      );

      content += formatted.content;

      // Ensure actionable element is present
      if (!formatted.hasActionableElement) {
        content += '\n\nWhat would you like to focus on next?';
      }

      return {
        content,
        recommendations: formatted.recommendations
      };
    } catch (error) {
      console.error('Error formatting response:', error);
      return {
        content: 'I\'m here to help you with your career journey. What would you like to discuss?',
        recommendations
      };
    }
  }

  /**
   * Generate mindset support content
   */
  private generateMindsetSupport(intent: Intent, userProfile: UserProfile | null): string {
    const emotional = intent.entities.emotional as any;
    
    if (!emotional || !emotional.hasEmotionalContent) {
      return '';
    }

    const indicators = emotional.emotionalIndicators as string[];
    
    let support = '';

    if (indicators.includes('anxiety') || indicators.includes('stress')) {
      support = 'I hear that you\'re feeling anxious or stressed. That\'s completely normal when navigating career decisions. Let\'s break this down into manageable steps.';
    } else if (indicators.includes('confusion') || indicators.includes('doubt')) {
      support = 'Feeling uncertain about your career direction is something many professionals experience. Let\'s work together to bring some clarity.';
    } else if (indicators.includes('fear')) {
      support = 'It takes courage to acknowledge your fears. Let\'s address them head-on and create a plan that feels achievable.';
    } else if (indicators.includes('frustration')) {
      support = 'I understand your frustration. Let\'s identify what\'s not working and find practical solutions.';
    } else if (indicators.includes('stagnation')) {
      support = 'Feeling stuck is a signal that it\'s time for change. Let\'s explore your options and create momentum.';
    } else if (indicators.includes('low confidence')) {
      support = 'Building confidence is a journey. Let\'s focus on your strengths and create wins that reinforce your capabilities.';
    } else {
      support = 'I\'m here to support you through this. Let\'s work through it together.';
    }

    return support;
  }

  /**
   * Safely get user profile with error handling
   */
  private async getUserProfileSafely(userId: string): Promise<UserProfile | null> {
    try {
      return await this.dataStore.getUserProfile(userId);
    } catch (error) {
      console.error('Error retrieving user profile:', error);
      return null;
    }
  }

  /**
   * Get existing growth plan for user
   */
  private async getExistingGrowthPlan(userProfile: UserProfile): Promise<GrowthPlan | null> {
    // This would typically query the data store for an existing plan
    // For now, return null to always create new plans
    return null;
  }

  /**
   * Handle errors with graceful degradation
   */
  private handleError(error: any, request: CoachingRequest): CoachingResponse {
    console.error('Coaching engine error:', error);

    // Create a fallback session
    const session = this.conversationManager.startSession(request.userId);

    return {
      content: 'I\'m experiencing some technical difficulties, but I\'m still here to help. ' +
               'Could you tell me more about what you\'re looking for guidance on?',
      sessionId: session.id,
      timestamp: new Date(),
      intent: {
        type: 'profile_building',
        confidence: 0.5,
        entities: {}
      }
    };
  }

  /**
   * End a coaching session
   */
  async endSession(sessionId: string): Promise<void> {
    try {
      await this.conversationManager.endSession(sessionId);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }
}
