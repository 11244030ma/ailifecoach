/**
 * Profile Analyzer component for WorkLife AI Coach
 * Analyzes user profiles, identifies gaps, assesses readiness, and tracks progress
 */

import { UserProfile, Goal, Challenge, Skill } from '../models/core.js';
import { CareerPath } from '../models/recommendations.js';

export interface ProfileAnalysis {
  strengths: string[];
  weaknesses: string[];
  interests: string[];
  careerStage: 'early' | 'mid' | 'transition';
  confidenceLevel: number;
  primaryChallenges: Challenge[];
}

export interface SkillGap {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  priority: 'high' | 'medium' | 'low';
  estimatedLearningTime: string;
}

export interface ReadinessScore {
  score: number;
  factors: {
    skillAlignment: number;
    experienceLevel: number;
    motivationLevel: number;
  };
  blockers: string[];
  recommendations: string[];
}

export interface ProgressReport {
  userId: string;
  timeframe: TimeRange;
  completedActions: number;
  completedMilestones: number;
  skillsAcquired: string[];
  goalsAchieved: number;
  overallProgress: number;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface IncompleteProfileInfo {
  isComplete: boolean;
  missingFields: string[];
}

export class ProfileAnalyzer {
  /**
   * Analyzes a user profile to extract insights about strengths, weaknesses, and career stage
   */
  analyzeProfile(profile: UserProfile): ProfileAnalysis {
    const strengths = this.identifyStrengths(profile);
    const weaknesses = this.identifyWeaknesses(profile);
    const careerStage = this.determineCareerStage(profile);
    
    return {
      strengths,
      weaknesses,
      interests: profile.careerInfo.interests,
      careerStage,
      confidenceLevel: profile.mindset.confidenceLevel,
      primaryChallenges: profile.careerInfo.struggles,
    };
  }

  /**
   * Categorizes challenges from user input into defined struggle types
   * Validates: Requirements 1.2
   */
  categorizeChallenge(description: string): Challenge['type'] {
    const lowerDesc = description.toLowerCase();
    
    // Direction-related keywords
    if (lowerDesc.includes('lost') || lowerDesc.includes('direction') || 
        lowerDesc.includes('confused') || lowerDesc.includes('unclear') ||
        lowerDesc.includes('don\'t know what') || lowerDesc.includes('unsure about path')) {
      return 'direction';
    }
    
    // Skills-related keywords
    if (lowerDesc.includes('skill') || lowerDesc.includes('learn') || 
        lowerDesc.includes('knowledge') || lowerDesc.includes('technical') ||
        lowerDesc.includes('don\'t know how')) {
      return 'skills';
    }
    
    // Confidence-related keywords
    if (lowerDesc.includes('confidence') || lowerDesc.includes('confident') ||
        lowerDesc.includes('doubt') || lowerDesc.includes('imposter') || 
        lowerDesc.includes('not good enough') || lowerDesc.includes('afraid') || 
        lowerDesc.includes('anxious')) {
      return 'confidence';
    }
    
    // Overwhelm-related keywords
    if (lowerDesc.includes('overwhelm') || lowerDesc.includes('too much') || 
        lowerDesc.includes('stressed') || lowerDesc.includes('burned out') ||
        lowerDesc.includes('can\'t handle')) {
      return 'overwhelm';
    }
    
    // Transition-related keywords
    if (lowerDesc.includes('transition') || lowerDesc.includes('change career') || 
        lowerDesc.includes('switch') || lowerDesc.includes('move to') ||
        lowerDesc.includes('different field')) {
      return 'transition';
    }
    
    // Stagnation-related keywords
    if (lowerDesc.includes('stagnant') || lowerDesc.includes('stuck') || 
        lowerDesc.includes('not growing') || lowerDesc.includes('plateau') ||
        lowerDesc.includes('same place')) {
      return 'stagnation';
    }
    
    // Default to direction if no clear match
    return 'direction';
  }

  /**
   * Identifies skill gaps between current state and target career path
   */
  identifyGaps(profile: UserProfile, targetPath: CareerPath): SkillGap[] {
    const currentSkillNames = new Set(profile.skills.current.map(s => s.name.toLowerCase()));
    const gaps: SkillGap[] = [];
    
    for (const requiredSkill of targetPath.requiredSkills) {
      const skillLower = requiredSkill.toLowerCase();
      const currentSkill = profile.skills.current.find(s => s.name.toLowerCase() === skillLower);
      
      if (!currentSkill) {
        // Skill is completely missing
        gaps.push({
          skill: requiredSkill,
          currentLevel: 0,
          targetLevel: 7, // Assume proficiency level of 7/10
          priority: 'high',
          estimatedLearningTime: '3-6 months',
        });
      } else if (currentSkill.level < 7) {
        // Skill exists but needs improvement
        gaps.push({
          skill: requiredSkill,
          currentLevel: currentSkill.level,
          targetLevel: 7,
          priority: currentSkill.level < 4 ? 'high' : 'medium',
          estimatedLearningTime: this.estimateLearningTime(currentSkill.level, 7),
        });
      }
    }
    
    return gaps;
  }

  /**
   * Assesses user readiness for a specific goal
   */
  assessReadiness(profile: UserProfile, goal: Goal): ReadinessScore {
    const skillAlignment = this.calculateSkillAlignment(profile, goal);
    const experienceLevel = Math.min(profile.personalInfo.yearsOfExperience / 10, 1);
    const motivationLevel = profile.mindset.motivationLevel;
    
    const score = (skillAlignment * 0.4 + experienceLevel * 0.3 + motivationLevel * 0.3);
    
    const blockers: string[] = [];
    const recommendations: string[] = [];
    
    if (skillAlignment < 0.5) {
      blockers.push('Significant skill gaps exist');
      recommendations.push('Focus on acquiring foundational skills first');
    }
    
    if (motivationLevel < 0.5) {
      blockers.push('Low motivation level');
      recommendations.push('Work on clarifying your "why" and building intrinsic motivation');
    }
    
    if (profile.personalInfo.yearsOfExperience < 2 && goal.type === 'long_term') {
      recommendations.push('Consider breaking this long-term goal into smaller milestones');
    }
    
    return {
      score,
      factors: {
        skillAlignment,
        experienceLevel,
        motivationLevel,
      },
      blockers,
      recommendations,
    };
  }

  /**
   * Tracks user progress over a specified timeframe
   */
  trackProgress(profile: UserProfile, timeframe: TimeRange): ProgressReport {
    const completedActions = profile.progress.completedActions.length;
    const completedMilestones = profile.progress.milestones.filter(m => 
      m.completed && 
      m.completedDate && 
      m.completedDate >= timeframe.start && 
      m.completedDate <= timeframe.end
    ).length;
    
    const skillsAcquired = profile.skills.current
      .filter(s => s.level >= 7)
      .map(s => s.name);
    
    const goalsAchieved = profile.careerInfo.goals.filter(g => 
      g.targetDate && g.targetDate <= timeframe.end
    ).length;
    
    const totalMilestones = profile.progress.milestones.length;
    const overallProgress = totalMilestones > 0 
      ? completedMilestones / totalMilestones 
      : 0;
    
    return {
      userId: profile.userId,
      timeframe,
      completedActions,
      completedMilestones,
      skillsAcquired,
      goalsAchieved,
      overallProgress,
    };
  }

  /**
   * Checks if a profile has all required fields
   * Validates: Requirements 1.5
   */
  checkProfileCompleteness(profile: UserProfile): IncompleteProfileInfo {
    const missingFields: string[] = [];
    
    // Check personal info required fields
    if (!profile.personalInfo.currentRole) {
      missingFields.push('currentRole');
    }
    if (!profile.personalInfo.education) {
      missingFields.push('education');
    }
    
    // Check career info
    if (profile.careerInfo.goals.length === 0) {
      missingFields.push('goals');
    }
    if (profile.careerInfo.interests.length === 0) {
      missingFields.push('interests');
    }
    
    // Check if struggles are captured
    if (profile.careerInfo.struggles.length === 0) {
      missingFields.push('struggles');
    }
    
    return {
      isComplete: missingFields.length === 0,
      missingFields,
    };
  }

  // Private helper methods
  
  private identifyStrengths(profile: UserProfile): string[] {
    const strengths: string[] = [];
    
    // High-level skills are strengths
    profile.skills.current
      .filter(s => s.level >= 7)
      .forEach(s => strengths.push(s.name));
    
    // High confidence is a strength
    if (profile.mindset.confidenceLevel >= 0.7) {
      strengths.push('High self-confidence');
    }
    
    // Experience is a strength
    if (profile.personalInfo.yearsOfExperience >= 5) {
      strengths.push('Significant work experience');
    }
    
    return strengths;
  }

  private identifyWeaknesses(profile: UserProfile): string[] {
    const weaknesses: string[] = [];
    
    // Low-level skills are weaknesses
    profile.skills.current
      .filter(s => s.level < 4)
      .forEach(s => weaknesses.push(`Limited ${s.name}`));
    
    // Low confidence is a weakness
    if (profile.mindset.confidenceLevel < 0.5) {
      weaknesses.push('Low self-confidence');
    }
    
    // Struggles are weaknesses
    profile.careerInfo.struggles.forEach(c => {
      weaknesses.push(c.description);
    });
    
    return weaknesses;
  }

  private determineCareerStage(profile: UserProfile): 'early' | 'mid' | 'transition' {
    const hasTransitionStruggle = profile.careerInfo.struggles.some(c => c.type === 'transition');
    
    if (hasTransitionStruggle) {
      return 'transition';
    }
    
    if (profile.personalInfo.yearsOfExperience < 3) {
      return 'early';
    }
    
    return 'mid';
  }

  private calculateSkillAlignment(profile: UserProfile, goal: Goal): number {
    // Simple heuristic: ratio of current skills to target skills
    const currentSkillCount = profile.skills.current.length;
    const targetSkillCount = profile.skills.target.length;
    
    if (targetSkillCount === 0) return 1;
    
    return Math.min(currentSkillCount / targetSkillCount, 1);
  }

  private estimateLearningTime(currentLevel: number, targetLevel: number): string {
    const gap = targetLevel - currentLevel;
    
    if (gap <= 2) return '1-2 months';
    if (gap <= 4) return '3-4 months';
    if (gap <= 6) return '5-6 months';
    return '6+ months';
  }
}
