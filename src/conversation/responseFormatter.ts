/**
 * Response Formatter for WorkLife AI Coach
 * Combines recommendations into natural, conversational language
 * Ensures all responses contain actionable elements
 */

import { 
  UserProfile, 
  ActionStep, 
  Goal 
} from '../models/core.js';
import { 
  CareerPath, 
  SkillRecommendation, 
  GrowthPlan, 
  TransitionPlan 
} from '../models/recommendations.js';

export interface FormattedResponse {
  content: string;
  hasActionableElement: boolean;
  recommendations?: {
    careerPaths?: CareerPath[];
    skills?: SkillRecommendation[];
    actions?: ActionStep[];
    growthPlan?: GrowthPlan;
    transitionPlan?: TransitionPlan;
  };
}

export interface ResponseContext {
  userProfile?: UserProfile;
  intent: string;
  isReturningUser: boolean;
  hasProgress?: boolean;
}

/**
 * ResponseFormatter creates natural language responses that combine
 * recommendations with conversational tone while maintaining specificity
 */
export class ResponseFormatter {
  
  /**
   * Format a career path recommendation into natural language
   * Includes reasoning explanation as required by Property 6
   */
  formatCareerPathRecommendation(
    paths: CareerPath[],
    context: ResponseContext
  ): FormattedResponse {
    let content = '';
    
    if (paths.length === 0) {
      content = "I'd like to learn more about your background and interests to provide better career guidance. ";
      return {
        content,
        hasActionableElement: true // Asking for information is actionable
      };
    }

    if (paths.length === 1) {
      const path = paths[0];
      content = `Based on your profile, I recommend exploring **${path.title}**. `;
      content += `${path.reasoning} `;
      content += `\n\nThis path aligns well with your background (fit score: ${Math.round(path.fitScore * 100)}%). `;
      content += this.formatActionableNext(path);
    } else {
      content = `I see ${paths.length} promising career paths for you:\n\n`;
      paths.forEach((path, index) => {
        content += `${index + 1}. **${path.title}** (fit: ${Math.round(path.fitScore * 100)}%)\n`;
        content += `   ${path.reasoning}\n\n`;
      });
      content += `\nWhich of these resonates most with you? I can dive deeper into any of them.`;
    }

    return {
      content,
      hasActionableElement: true,
      recommendations: { careerPaths: paths }
    };
  }

  /**
   * Format skill recommendations into natural language
   * Includes reasoning and prioritization as required by Properties 6 and 8
   */
  formatSkillRecommendation(
    skills: SkillRecommendation[],
    context: ResponseContext
  ): FormattedResponse {
    if (skills.length === 0) {
      return {
        content: "Let's first clarify your career direction so I can recommend the most relevant skills.",
        hasActionableElement: true
      };
    }

    let content = '';
    const topSkill = skills[0];
    
    if (skills.length === 1) {
      content = `The most impactful skill for you to develop right now is **${topSkill.skill}**. `;
      content += `${topSkill.reasoning} `;
      content += `\nEstimated learning time: ${topSkill.estimatedTime}. `;
      content += `\nWould you like specific resources to get started?`;
    } else {
      content = `Here are the key skills I recommend, prioritized by impact:\n\n`;
      skills.slice(0, 3).forEach((skill, index) => {
        content += `${index + 1}. **${skill.skill}** (Priority: ${skill.priority})\n`;
        content += `   ${skill.reasoning}\n`;
        content += `   Time: ${skill.estimatedTime}\n\n`;
      });
      
      if (context.userProfile?.careerInfo.goals.some(g => g.type === 'short_term')) {
        content += `\nGiven your timeline, I'd suggest starting with **${topSkill.skill}** for maximum impact.`;
      }
    }

    return {
      content,
      hasActionableElement: true,
      recommendations: { skills }
    };
  }

  /**
   * Format action steps into natural language
   * Ensures timeframes are clear as required by Property 10
   */
  formatActionSteps(
    actions: ActionStep[],
    context: ResponseContext
  ): FormattedResponse {
    if (actions.length === 0) {
      return {
        content: "Let's identify some concrete steps you can take. What's your biggest priority right now?",
        hasActionableElement: true
      };
    }

    let content = "Here are your next steps:\n\n";
    
    const byTimeframe = this.groupActionsByTimeframe(actions);
    
    if (byTimeframe.today.length > 0) {
      content += "**Today:**\n";
      byTimeframe.today.forEach(action => {
        content += `- ${action.description}\n`;
      });
      content += "\n";
    }
    
    if (byTimeframe.this_week.length > 0) {
      content += "**This Week:**\n";
      byTimeframe.this_week.forEach(action => {
        content += `- ${action.description}\n`;
      });
      content += "\n";
    }
    
    if (byTimeframe.this_month.length > 0) {
      content += "**This Month:**\n";
      byTimeframe.this_month.forEach(action => {
        content += `- ${action.description}\n`;
      });
      content += "\n";
    }

    content += "\nStart with the 'today' items - small wins build momentum. Let me know when you complete them!";

    return {
      content,
      hasActionableElement: true,
      recommendations: { actions }
    };
  }

  /**
   * Format growth plan into natural language
   * Links actions to objectives as required by Property 15
   */
  formatGrowthPlan(
    plan: GrowthPlan,
    context: ResponseContext
  ): FormattedResponse {
    let content = `I've created a ${plan.timeline} growth plan for your journey toward **${plan.careerPath.title}**.\n\n`;
    
    content += "**Key Milestones:**\n";
    plan.milestones.slice(0, 3).forEach((milestone, index) => {
      const monthsAway = this.getMonthsUntil(milestone.targetDate);
      content += `${index + 1}. ${milestone.title} (${monthsAway} months)\n`;
      content += `   ${milestone.description}\n\n`;
    });

    if (plan.phases.length > 0) {
      const firstPhase = plan.phases[0];
      content += `\n**Your First Phase: ${firstPhase.name}** (${firstPhase.duration})\n`;
      content += `Focus: ${firstPhase.objectives.join(', ')}\n\n`;
      
      if (firstPhase.actions.length > 0) {
        content += "Immediate actions:\n";
        firstPhase.actions.slice(0, 2).forEach(action => {
          content += `- ${action.description}\n`;
        });
      }
    }

    content += "\n\nThis plan connects your daily actions to your long-term goals. Ready to get started?";

    return {
      content,
      hasActionableElement: true,
      recommendations: { growthPlan: plan }
    };
  }

  /**
   * Format transition guidance into natural language
   * Highlights transferable skills as required by Property 18
   */
  formatTransitionPlan(
    plan: TransitionPlan,
    context: ResponseContext
  ): FormattedResponse {
    let content = `Let's map out your transition from **${plan.sourceField}** to **${plan.targetField}**.\n\n`;
    
    content += `**Good news:** You already have valuable transferable skills:\n`;
    plan.transferableSkills.slice(0, 3).forEach(skill => {
      content += `- ${skill}\n`;
    });
    
    content += `\n**Skills to develop:**\n`;
    plan.skillsToAcquire.slice(0, 3).forEach(skill => {
      content += `- ${skill.skill}: ${skill.reasoning}\n`;
    });

    content += `\n**Timeline:** ${plan.estimatedDuration} (${plan.difficultyLevel} transition)\n\n`;

    if (plan.phases.length > 0) {
      const firstPhase = plan.phases[0];
      content += `**Phase 1: ${firstPhase.name}** (${firstPhase.duration})\n`;
      content += `${firstPhase.focus}\n\n`;
      
      if (firstPhase.actions.length > 0) {
        content += "First steps:\n";
        firstPhase.actions.slice(0, 2).forEach(action => {
          content += `- ${action.description}\n`;
        });
      }
    }

    content += "\n\nThis is a realistic path forward. Shall we start with Phase 1?";

    return {
      content,
      hasActionableElement: true,
      recommendations: { transitionPlan: plan }
    };
  }

  /**
   * Format progress acknowledgment
   * Required by Property 11
   */
  formatProgressAcknowledgment(
    completedActions: ActionStep[],
    context: ResponseContext
  ): string {
    if (completedActions.length === 0) {
      return '';
    }

    if (completedActions.length === 1) {
      return `Great work completing "${completedActions[0].description}"! `;
    }

    return `Excellent progress! You've completed ${completedActions.length} action items. `;
  }

  /**
   * Format a general response with recommendations
   * Ensures actionable elements are present as required by Property 21
   */
  formatGeneralResponse(
    message: string,
    recommendations?: {
      careerPaths?: CareerPath[];
      skills?: SkillRecommendation[];
      actions?: ActionStep[];
      growthPlan?: GrowthPlan;
      transitionPlan?: TransitionPlan;
    },
    context?: ResponseContext
  ): FormattedResponse {
    let content = message;
    let hasActionableElement = false;

    // Check if message already contains actionable elements
    const actionableIndicators = [
      '?', // Questions are actionable
      'recommend', 'suggest', 'try', 'start', 'consider',
      'next step', 'action', 'do this', 'focus on'
    ];
    
    hasActionableElement = actionableIndicators.some(indicator => 
      content.toLowerCase().includes(indicator)
    );

    // If no actionable element, add one
    if (!hasActionableElement && recommendations) {
      if (recommendations.actions && recommendations.actions.length > 0) {
        content += `\n\nNext step: ${recommendations.actions[0].description}`;
        hasActionableElement = true;
      } else if (recommendations.skills && recommendations.skills.length > 0) {
        content += `\n\nI recommend focusing on ${recommendations.skills[0].skill} as your next learning priority.`;
        hasActionableElement = true;
      } else if (recommendations.careerPaths && recommendations.careerPaths.length > 0) {
        content += `\n\nShall we explore the ${recommendations.careerPaths[0].title} path in more detail?`;
        hasActionableElement = true;
      }
    }

    // If still no actionable element, add a generic one
    if (!hasActionableElement) {
      content += "\n\nWhat would you like to focus on next?";
      hasActionableElement = true;
    }

    return {
      content,
      hasActionableElement,
      recommendations
    };
  }

  /**
   * Combine multiple recommendation types into a cohesive response
   */
  formatCombinedResponse(
    recommendations: {
      careerPaths?: CareerPath[];
      skills?: SkillRecommendation[];
      actions?: ActionStep[];
      growthPlan?: GrowthPlan;
      transitionPlan?: TransitionPlan;
    },
    context: ResponseContext
  ): FormattedResponse {
    let content = '';
    let hasActionableElement = false;

    // Acknowledge progress if returning user
    if (context.hasProgress && context.userProfile) {
      const completedActions = context.userProfile.progress.completedActions
        .map(id => ({ id, description: 'completed action', timeframe: 'today' as const, category: 'learning' as const, completed: true }));
      content += this.formatProgressAcknowledgment(completedActions, context);
    }

    // Prioritize based on intent
    if (recommendations.transitionPlan) {
      const formatted = this.formatTransitionPlan(recommendations.transitionPlan, context);
      content += formatted.content;
      hasActionableElement = formatted.hasActionableElement;
    } else if (recommendations.growthPlan) {
      const formatted = this.formatGrowthPlan(recommendations.growthPlan, context);
      content += formatted.content;
      hasActionableElement = formatted.hasActionableElement;
    } else if (recommendations.careerPaths && recommendations.careerPaths.length > 0) {
      const formatted = this.formatCareerPathRecommendation(recommendations.careerPaths, context);
      content += formatted.content;
      hasActionableElement = formatted.hasActionableElement;
    } else if (recommendations.skills && recommendations.skills.length > 0) {
      const formatted = this.formatSkillRecommendation(recommendations.skills, context);
      content += formatted.content;
      hasActionableElement = formatted.hasActionableElement;
    } else if (recommendations.actions && recommendations.actions.length > 0) {
      const formatted = this.formatActionSteps(recommendations.actions, context);
      content += formatted.content;
      hasActionableElement = formatted.hasActionableElement;
    }

    return {
      content,
      hasActionableElement,
      recommendations
    };
  }

  /**
   * Helper: Group actions by timeframe
   */
  private groupActionsByTimeframe(actions: ActionStep[]): {
    today: ActionStep[];
    this_week: ActionStep[];
    this_month: ActionStep[];
  } {
    return {
      today: actions.filter(a => a.timeframe === 'today'),
      this_week: actions.filter(a => a.timeframe === 'this_week'),
      this_month: actions.filter(a => a.timeframe === 'this_month')
    };
  }

  /**
   * Helper: Calculate months until a date
   */
  private getMonthsUntil(targetDate: Date): number {
    const now = new Date();
    const months = (targetDate.getFullYear() - now.getFullYear()) * 12 + 
                   (targetDate.getMonth() - now.getMonth());
    return Math.max(0, months);
  }

  /**
   * Helper: Format actionable next step for career path
   */
  private formatActionableNext(path: CareerPath): string {
    return `\n\nNext step: Let's identify the key skills you'll need for this path. Ready?`;
  }
}
