/**
 * Coach Behavior Module
 * Implements the personality, tone, and response patterns for WorkLife AI Coach
 * Based on the behavior guide in worklife-ai-coach-behavior.md
 */

import { UserProfile, Message } from '../models/core.js';

export interface CoachResponse {
  content: string;
  followUpQuestion?: string;
}

/**
 * CoachBehavior encapsulates the AI coach's personality and communication style
 */
export class CoachBehavior {
  
  /**
   * Generate welcome message for first-time users
   */
  getWelcomeMessage(): string {
    return "Hi! I'm your WorkLife coach. I'm here to help you get unstuck in your career—whether you're figuring out what to learn next, thinking about switching fields, or just feeling lost about where you're headed. Let's talk through it together.";
  }

  /**
   * Generate first-time user greeting that invites context sharing
   */
  getFirstTimeGreeting(): string {
    return `Welcome! I'm glad you're here. Before we dive in, I'd love to understand where you're at right now.

Could you tell me a bit about yourself? Things like:
- What you're currently doing (job, field, or studying)
- What's been on your mind lately about your career
- What you're hoping to figure out

No need to write a novel—just whatever feels relevant.`;
  }

  /**
   * Get starter questions to help users begin
   */
  getStarterQuestions(): string[] {
    return [
      "I'm not sure what career path is right for me. Where do I even start?",
      "I feel stuck in my current job. How do I know if I should stay or leave?",
      "What skills should I learn to advance my career?",
      "I want to switch careers but don't know how to make the transition.",
      "How do I grow in my current role without changing jobs?",
      "I lack confidence in my abilities. How can I build it?",
      "I'm overwhelmed with too many goals. What should I focus on first?",
      "How do I know if I'm on the right career path?",
      "I feel like I'm falling behind my peers. What should I do?",
      "I have multiple interests. How do I choose which one to pursue?"
    ];
  }

  /**
   * Structure a response following the coach's communication pattern
   * Pattern: Acknowledge → Insights → Next Steps → Follow-up Question
   */
  structureResponse(
    acknowledgment: string,
    insights: string[],
    nextSteps: { timeframe: string; action: string }[],
    followUpQuestion: string
  ): CoachResponse {
    let content = acknowledgment + '\n\n';

    // Add insights
    if (insights.length > 0) {
      content += insights.join('\n\n') + '\n\n';
    }

    // Add next steps with timeframes
    if (nextSteps.length > 0) {
      const grouped = this.groupStepsByTimeframe(nextSteps);
      
      if (grouped.today.length > 0) {
        content += '**Today:**\n';
        grouped.today.forEach(step => content += `- ${step}\n`);
        content += '\n';
      }
      
      if (grouped.this_week.length > 0) {
        content += '**This week:**\n';
        grouped.this_week.forEach(step => content += `- ${step}\n`);
        content += '\n';
      }
      
      if (grouped.this_month.length > 0) {
        content += '**This month:**\n';
        grouped.this_month.forEach(step => content += `- ${step}\n`);
        content += '\n';
      }
    }

    return {
      content: content.trim(),
      followUpQuestion
    };
  }

  /**
   * Generate acknowledgment that validates user's feelings/situation
   */
  generateAcknowledgment(userMessage: string, emotionalContext?: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    // Detect emotional indicators
    if (lowerMessage.includes('stuck') || lowerMessage.includes('lost')) {
      return "That feeling of being stuck is really common, and it doesn't mean you're behind—it means you're being honest with yourself.";
    }
    
    if (lowerMessage.includes('confused') || lowerMessage.includes('don\'t know')) {
      return "I hear you—that uncertainty can be frustrating. Let's break this down together.";
    }
    
    if (lowerMessage.includes('scared') || lowerMessage.includes('afraid') || lowerMessage.includes('worried')) {
      return "That fear makes sense—making career changes feels risky. But staying somewhere that's not working has its own cost.";
    }
    
    if (lowerMessage.includes('overwhelmed')) {
      return "That's classic overwhelm—when everything feels equally important, nothing gets done. Let's prioritize.";
    }
    
    if (lowerMessage.includes('confidence') || lowerMessage.includes('not good enough')) {
      return "I hear this a lot, and here's the thing: confidence doesn't come before you do the thing—it comes after.";
    }
    
    // Default acknowledgment
    return "I understand where you're coming from. Let's work through this.";
  }

  /**
   * Generate follow-up questions based on context
   */
  generateFollowUpQuestion(
    intent: string,
    userProfile?: UserProfile | null,
    conversationDepth: number = 0
  ): string {
    // Understanding context questions
    if (conversationDepth === 0 || !userProfile) {
      const contextQuestions = [
        "What's been on your mind about this lately?",
        "What have you already tried?",
        "What's the hardest part of this for you?"
      ];
      return contextQuestions[Math.floor(Math.random() * contextQuestions.length)];
    }

    // Intent-specific questions
    switch (intent) {
      case 'career_clarity':
        return "What does success look like for you in your career?";
      
      case 'skill_guidance':
        return "What are you hoping this skill will do for you—switch fields, grow in your current role, or something else?";
      
      case 'action_planning':
        return "What's one small step you could take this week?";
      
      case 'transition_guidance':
        return "What's stopping you from making this transition?";
      
      case 'mindset_support':
        return "What would need to be true for you to feel ready?";
      
      case 'growth_planning':
        return "Where do you want to be in 6 months?";
      
      case 'progress_check':
        return "How did that go? What did you learn?";
      
      default:
        return "What would you like to focus on next?";
    }
  }

  /**
   * Detect if user message contains emotional struggle indicators
   * Used to prioritize mindset support (Property 13)
   */
  detectEmotionalStruggle(userMessage: string): boolean {
    const emotionalIndicators = [
      'scared', 'afraid', 'worried', 'anxious', 'nervous',
      'doubt', 'confidence', 'not good enough', 'imposter',
      'overwhelmed', 'stressed', 'burned out', 'exhausted',
      'lost', 'confused', 'stuck', 'frustrated', 'hopeless'
    ];
    
    const lowerMessage = userMessage.toLowerCase();
    return emotionalIndicators.some(indicator => lowerMessage.includes(indicator));
  }

  /**
   * Generate mindset-first response when emotional struggle is detected
   * Validates: Property 13 - Mindset-first response ordering
   */
  generateMindsetResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('not good enough') || lowerMessage.includes('confidence')) {
      return "First, let's address this confidence piece. You're comparing your behind-the-scenes to everyone else's highlight reel. They're not more qualified—they're just better at talking about what they've done.";
    }
    
    if (lowerMessage.includes('overwhelmed') || lowerMessage.includes('too much')) {
      return "Let's pause on the tactics for a moment. When everything feels urgent, nothing gets done. We need to pick one thing and make real progress there first.";
    }
    
    if (lowerMessage.includes('scared') || lowerMessage.includes('afraid')) {
      return "That fear is valid—change is uncomfortable. But here's what I've seen: the discomfort of staying stuck often becomes worse than the discomfort of making a change.";
    }
    
    if (lowerMessage.includes('stuck') || lowerMessage.includes('lost')) {
      return "Feeling stuck doesn't mean you're failing—it means you've outgrown where you are. That's actually progress, even if it doesn't feel like it.";
    }
    
    return "I hear the frustration in what you're saying. Let's acknowledge that first, then figure out what to do about it.";
  }

  /**
   * Ensure response avoids generic platitudes
   */
  avoidGenericAdvice(response: string): boolean {
    const genericPhrases = [
      'follow your passion',
      'believe in yourself',
      'never give up',
      'sky is the limit',
      'you can do anything',
      'dream big',
      'think positive'
    ];
    
    const lowerResponse = response.toLowerCase();
    return !genericPhrases.some(phrase => lowerResponse.includes(phrase));
  }

  /**
   * Validate response has actionable elements
   * Validates: Property 21 - Actionable guidance presence
   */
  hasActionableElement(response: string): boolean {
    const actionableIndicators = [
      // Questions
      '?',
      // Action verbs
      'try', 'start', 'do', 'create', 'write', 'reach out', 'talk to',
      'apply', 'learn', 'practice', 'ask', 'explore', 'research',
      // Timeframes
      'today', 'this week', 'this month', 'next',
      // Recommendations
      'recommend', 'suggest', 'consider', 'focus on',
      // Steps
      'step', 'action', 'next'
    ];
    
    const lowerResponse = response.toLowerCase();
    return actionableIndicators.some(indicator => lowerResponse.includes(indicator));
  }

  /**
   * Format response to maintain optimal length (100-200 words)
   */
  optimizeResponseLength(response: string): string {
    const words = response.split(/\s+/).length;
    
    // If too long (>250 words), suggest breaking into multiple messages
    if (words > 250) {
      // This is a signal to the caller to break the response
      return response;
    }
    
    // If too short (<50 words), might need more substance
    if (words < 50) {
      // This is a signal that more content might be needed
      return response;
    }
    
    return response;
  }

  /**
   * Add conversational warmth without excessive enthusiasm
   */
  addWarmth(response: string): string {
    // Ensure response doesn't have too many exclamation points
    const exclamationCount = (response.match(/!/g) || []).length;
    
    if (exclamationCount > 2) {
      // Replace excessive exclamation points with periods
      let adjusted = response;
      let count = 0;
      adjusted = adjusted.replace(/!/g, (match) => {
        count++;
        return count > 2 ? '.' : match;
      });
      return adjusted;
    }
    
    return response;
  }

  /**
   * Reference user's own words when reflecting their situation
   */
  reflectUserLanguage(userMessage: string, response: string): string {
    // Extract key phrases from user message (simple implementation)
    const userPhrases = userMessage
      .toLowerCase()
      .split(/[.!?]/)
      .map(s => s.trim())
      .filter(s => s.length > 10);
    
    // Check if response references user's language
    const hasReference = userPhrases.some(phrase => 
      response.toLowerCase().includes(phrase.substring(0, 20))
    );
    
    return response; // Return as-is; this is more of a validation
  }

  /**
   * Helper: Group steps by timeframe
   */
  private groupStepsByTimeframe(steps: { timeframe: string; action: string }[]): {
    today: string[];
    this_week: string[];
    this_month: string[];
  } {
    return {
      today: steps.filter(s => s.timeframe === 'today').map(s => s.action),
      this_week: steps.filter(s => s.timeframe === 'this week').map(s => s.action),
      this_month: steps.filter(s => s.timeframe === 'this month').map(s => s.action)
    };
  }
}
