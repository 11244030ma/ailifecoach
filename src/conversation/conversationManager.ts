/**
 * Conversation Manager for WorkLife AI Coach
 * Handles session lifecycle, context tracking, and conversation continuity
 */

import { 
  Session, 
  SessionContext, 
  Message, 
  Intent, 
  UserProfile,
  ActionStep 
} from '../models/core.js';
import { 
  CareerPath, 
  SkillRecommendation, 
  GrowthPlan 
} from '../models/recommendations.js';
import { DataStore } from '../persistence/dataStore.js';
import { CoachBehavior } from './coachBehavior.js';

export interface Response {
  content: string;
  sessionId: string;
  timestamp: Date;
  recommendations?: {
    careerPaths?: CareerPath[];
    skills?: SkillRecommendation[];
    actions?: ActionStep[];
    growthPlan?: GrowthPlan;
  };
}

/**
 * ConversationManager handles multi-turn conversation sessions,
 * tracks conversation context and history, and ensures continuity
 * across sessions for returning users.
 */
export class ConversationManager {
  private sessions: Map<string, Session> = new Map();
  private dataStore: DataStore;
  private coachBehavior: CoachBehavior;

  constructor(dataStore: DataStore) {
    this.dataStore = dataStore;
    this.coachBehavior = new CoachBehavior();
  }

  /**
   * Start a new conversation session for a user
   * Retrieves user profile and conversation history if user is returning
   */
  startSession(userId: string): Session {
    const sessionId = this.generateSessionId();
    
    const session: Session = {
      id: sessionId,
      userId,
      startTime: new Date(),
      lastActivity: new Date(),
      context: {
        conversationHistory: [],
        currentIntent: {
          type: 'profile_building',
          confidence: 1.0,
          entities: {}
        },
        activeTopics: [],
        pendingActions: []
      }
    };

    this.sessions.set(sessionId, session);
    
    // Associate session with user in data store for history retrieval
    if ('associateSessionWithUser' in this.dataStore) {
      (this.dataStore as any).associateSessionWithUser(sessionId, userId);
    }

    return session;
  }

  /**
   * Continue an existing session with a new user message
   * Maintains context and references previous discussions
   */
  async continueSession(sessionId: string, userMessage: string): Promise<Response> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Update last activity
    session.lastActivity = new Date();

    // Add user message to conversation history
    const message: Message = {
      id: this.generateMessageId(),
      sender: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    session.context.conversationHistory.push(message);

    // Get user profile and historical context for returning users
    const userProfile = await this.dataStore.getUserProfile(session.userId);
    const historicalMessages = await this.dataStore.getConversationHistory(session.userId);

    // Generate response with context awareness
    const responseContent = await this.generateContextAwareResponse(
      session,
      userMessage,
      userProfile,
      historicalMessages
    );

    // Add system response to conversation history
    const systemMessage: Message = {
      id: this.generateMessageId(),
      sender: 'system',
      content: responseContent,
      timestamp: new Date()
    };
    session.context.conversationHistory.push(systemMessage);

    // Save conversation to data store
    await this.dataStore.saveConversation(sessionId, session.context.conversationHistory);

    return {
      content: responseContent,
      sessionId,
      timestamp: systemMessage.timestamp
    };
  }

  /**
   * End a conversation session and persist final state
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    // Save final conversation state
    await this.dataStore.saveConversation(sessionId, session.context.conversationHistory);

    // Remove from active sessions
    this.sessions.delete(sessionId);
  }

  /**
   * Get the current context for a session
   */
  getSessionContext(sessionId: string): SessionContext | null {
    const session = this.sessions.get(sessionId);
    return session ? session.context : null;
  }

  /**
   * Generate a context-aware response that references previous discussions
   * and maintains recommendation consistency
   */
  private async generateContextAwareResponse(
    session: Session,
    userMessage: string,
    userProfile: UserProfile | null,
    historicalMessages: Message[]
  ): Promise<string> {
    let response = '';

    // Check if this is a returning user with history
    const isReturningUser = historicalMessages.length > 0;
    
    if (isReturningUser) {
      // Reference previous discussions when relevant
      response += this.referencePreviousContext(session, historicalMessages);
    }

    // Check for recommendation consistency
    if (userProfile) {
      const consistencyCheck = this.checkRecommendationConsistency(
        session,
        userProfile,
        historicalMessages
      );
      
      if (consistencyCheck.hasInconsistency) {
        response += consistencyCheck.explanation;
      }
    }

    // Generate main response content
    response += this.generateMainResponse(session, userMessage, userProfile);

    return response.trim();
  }

  /**
   * Reference previous discussions when contextually appropriate
   * Validates: Property 23 - Historical context reference
   */
  private referencePreviousContext(
    session: Session,
    historicalMessages: Message[]
  ): string {
    if (historicalMessages.length === 0) {
      return '';
    }

    // Check if current conversation should reference history
    const recentHistory = historicalMessages.slice(-10);
    const hasRelevantHistory = recentHistory.some(msg => 
      msg.sender === 'system' && msg.content.length > 50
    );

    if (hasRelevantHistory) {
      return 'Based on our previous conversations, ';
    }

    return '';
  }

  /**
   * Check for recommendation consistency with previous guidance
   * Validates: Property 24 - Recommendation consistency
   */
  private checkRecommendationConsistency(
    session: Session,
    userProfile: UserProfile,
    historicalMessages: Message[]
  ): { hasInconsistency: boolean; explanation: string } {
    // Extract previous recommendations from history
    const previousCareerPath = userProfile.careerInfo.currentPath;
    
    // Check if circumstances have changed
    const circumstancesChanged = this.haveCircumstancesChanged(
      userProfile,
      historicalMessages
    );

    if (previousCareerPath && !circumstancesChanged) {
      // Ensure new recommendations align with previous career path
      return {
        hasInconsistency: false,
        explanation: `Continuing with your ${previousCareerPath.title} path. `
      };
    }

    if (circumstancesChanged) {
      return {
        hasInconsistency: false,
        explanation: 'I notice your situation has evolved since we last spoke. '
      };
    }

    return {
      hasInconsistency: false,
      explanation: ''
    };
  }

  /**
   * Determine if user circumstances have changed since previous sessions
   */
  private haveCircumstancesChanged(
    userProfile: UserProfile,
    historicalMessages: Message[]
  ): boolean {
    // Check if profile was recently updated
    const lastUpdate = userProfile.progress.lastUpdated;
    const recentThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    
    return lastUpdate > recentThreshold;
  }

  /**
   * Generate the main response content based on current message
   * Integrates coach behavior for natural, supportive responses
   */
  private generateMainResponse(
    session: Session,
    userMessage: string,
    userProfile: UserProfile | null
  ): string {
    // Check if this is the first message (no history)
    const isFirstMessage = session.context.conversationHistory.length === 1;
    
    if (isFirstMessage && !userProfile) {
      return this.coachBehavior.getFirstTimeGreeting();
    }

    // Detect emotional struggle and prioritize mindset support (Property 13)
    const hasEmotionalStruggle = this.coachBehavior.detectEmotionalStruggle(userMessage);
    
    if (hasEmotionalStruggle) {
      const mindsetResponse = this.coachBehavior.generateMindsetResponse(userMessage);
      const followUpQuestion = this.coachBehavior.generateFollowUpQuestion(
        session.context.currentIntent.type,
        userProfile,
        session.context.conversationHistory.length
      );
      return `${mindsetResponse}\n\n${followUpQuestion}`;
    }

    // Generate acknowledgment
    const acknowledgment = this.coachBehavior.generateAcknowledgment(userMessage);
    
    // Generate follow-up question
    const followUpQuestion = this.coachBehavior.generateFollowUpQuestion(
      session.context.currentIntent.type,
      userProfile,
      session.context.conversationHistory.length
    );

    // For now, provide a structured response
    // In full implementation, this would integrate with recommendation engines
    const response = this.coachBehavior.structureResponse(
      acknowledgment,
      [`Let me help you work through this.`],
      [
        { timeframe: 'today', action: 'Share more details about your situation' },
        { timeframe: 'this week', action: 'Reflect on what you want to achieve' }
      ],
      followUpQuestion
    );

    return response.content + '\n\n' + response.followUpQuestion;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
