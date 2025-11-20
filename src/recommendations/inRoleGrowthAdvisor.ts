/**
 * In-Role Growth Advisor
 * Provides guidance for advancing within current position
 */

import { UserProfile, Challenge } from '../models/core.js';
import { SkillRecommendation, CareerPath } from '../models/recommendations.js';

/**
 * In-role growth analysis result
 */
export interface InRoleGrowthAnalysis {
  scope: 'current_role_only';
  opportunities: GrowthOpportunity[];
  skillRecommendations: SkillRecommendation[];
  stagnationAssessment: StagnationAssessment | null;
  alternativePaths: CareerPath[];
}

/**
 * Growth opportunity within current role
 */
export interface GrowthOpportunity {
  type: 'responsibility' | 'visibility' | 'skill_development' | 'leadership';
  description: string;
  actionable: boolean;
  estimatedImpact: 'high' | 'medium' | 'low';
}

/**
 * Stagnation assessment for current role
 */
export interface StagnationAssessment {
  isStagnant: boolean;
  severity: 'high' | 'medium' | 'low';
  reasons: string[];
  honestAssessment: string;
  growthLimitations: string[];
}

/**
 * Analyzes in-role growth opportunities for a user
 * @param profile - The user profile
 * @returns In-role growth analysis
 */
export function analyzeInRoleGrowth(profile: UserProfile): InRoleGrowthAnalysis {
  const opportunities = identifyOpportunities(profile);
  const skillRecommendations = recommendEmployerRelevantSkills(profile);
  const stagnationAssessment = assessStagnation(profile);
  const alternativePaths = stagnationAssessment?.isStagnant 
    ? generateAlternativePaths(profile)
    : [];

  return {
    scope: 'current_role_only',
    opportunities,
    skillRecommendations,
    stagnationAssessment,
    alternativePaths,
  };
}

/**
 * Identifies opportunities for increased responsibility and visibility
 */
function identifyOpportunities(profile: UserProfile): GrowthOpportunity[] {
  const opportunities: GrowthOpportunity[] = [];
  const currentRole = profile.personalInfo.currentRole;
  const yearsOfExperience = profile.personalInfo.yearsOfExperience;
  const currentSkills = profile.skills.current;

  // Responsibility opportunities
  if (yearsOfExperience >= 2) {
    opportunities.push({
      type: 'responsibility',
      description: 'Lead a small project or initiative within your team',
      actionable: true,
      estimatedImpact: 'high',
    });
  }

  if (yearsOfExperience >= 3 && currentSkills.length >= 3) {
    opportunities.push({
      type: 'responsibility',
      description: 'Mentor junior team members or new hires',
      actionable: true,
      estimatedImpact: 'medium',
    });
  }

  // Visibility opportunities
  opportunities.push({
    type: 'visibility',
    description: 'Present your work at team meetings or company all-hands',
    actionable: true,
    estimatedImpact: 'medium',
  });

  if (yearsOfExperience >= 2) {
    opportunities.push({
      type: 'visibility',
      description: 'Volunteer for cross-functional projects to expand your network',
      actionable: true,
      estimatedImpact: 'high',
    });
  }

  // Skill development opportunities
  const learningSkills = profile.skills.learning;
  if (learningSkills.length > 0) {
    opportunities.push({
      type: 'skill_development',
      description: `Complete your current learning goals: ${learningSkills.map(s => s.name).join(', ')}`,
      actionable: true,
      estimatedImpact: 'high',
    });
  }

  opportunities.push({
    type: 'skill_development',
    description: 'Identify and learn skills that are valued by your current employer',
    actionable: true,
    estimatedImpact: 'high',
  });

  // Leadership opportunities
  if (yearsOfExperience >= 4) {
    opportunities.push({
      type: 'leadership',
      description: 'Take ownership of a key area or process within your team',
      actionable: true,
      estimatedImpact: 'high',
    });
  }

  return opportunities;
}

/**
 * Recommends skills that are relevant to the user's current employer
 */
function recommendEmployerRelevantSkills(profile: UserProfile): SkillRecommendation[] {
  const recommendations: SkillRecommendation[] = [];
  const currentRole = profile.personalInfo.currentRole?.toLowerCase() || '';
  const industry = profile.personalInfo.industry?.toLowerCase() || '';
  const currentSkills = profile.skills.current.map(s => s.name.toLowerCase());

  // Role-specific skill recommendations
  if (currentRole.includes('engineer') || currentRole.includes('developer')) {
    if (!hasSkill(currentSkills, 'testing')) {
      recommendations.push({
        skill: 'Testing',
        priority: 0.85,
        reasoning: 'Testing skills are highly valued by employers and improve code quality in your current role',
        learningResources: ['Jest documentation', 'Testing Library', 'Test-Driven Development book'],
        estimatedTime: '2-3 months',
        dependencies: [],
      });
    }

    if (!hasSkill(currentSkills, 'system design')) {
      recommendations.push({
        skill: 'System Design',
        priority: 0.9,
        reasoning: 'System design expertise is critical for senior engineering roles and demonstrates technical leadership',
        learningResources: ['System Design Primer', 'Designing Data-Intensive Applications'],
        estimatedTime: '6-8 months',
        dependencies: ['programming'],
      });
    }
  }

  if (currentRole.includes('product')) {
    if (!hasSkill(currentSkills, 'stakeholder management')) {
      recommendations.push({
        skill: 'Stakeholder Management',
        priority: 0.9,
        reasoning: 'Stakeholder management is essential for product roles and increases your influence within the organization',
        learningResources: ['Crucial Conversations book', 'Leadership courses'],
        estimatedTime: '3-4 months',
        dependencies: [],
      });
    }

    if (!hasSkill(currentSkills, 'analytics')) {
      recommendations.push({
        skill: 'Analytics',
        priority: 0.8,
        reasoning: 'Data-driven decision making is highly valued in product management',
        learningResources: ['Google Analytics Academy', 'Mixpanel guides'],
        estimatedTime: '3-4 months',
        dependencies: [],
      });
    }
  }

  if (currentRole.includes('design')) {
    if (!hasSkill(currentSkills, 'user research')) {
      recommendations.push({
        skill: 'User Research',
        priority: 0.85,
        reasoning: 'User research skills are highly valued in design roles and demonstrate strategic thinking',
        learningResources: ['Nielsen Norman Group', 'Just Enough Research book'],
        estimatedTime: '3-4 months',
        dependencies: [],
      });
    }
  }

  // General professional skills
  if (!hasSkill(currentSkills, 'communication') && profile.personalInfo.yearsOfExperience >= 2) {
    recommendations.push({
      skill: 'Communication',
      priority: 0.85,
      reasoning: 'Strong communication skills are valued across all roles and essential for career advancement',
      learningResources: ['Toastmasters', 'Business writing courses'],
      estimatedTime: '4-6 months',
      dependencies: [],
    });
  }

  // Sort by priority
  recommendations.sort((a, b) => b.priority - a.priority);

  return recommendations;
}

/**
 * Assesses whether the user is experiencing stagnation in their current role
 */
function assessStagnation(profile: UserProfile): StagnationAssessment | null {
  const yearsOfExperience = profile.personalInfo.yearsOfExperience;
  const struggles = profile.careerInfo.struggles;
  const completedActions = profile.progress.completedActions;
  const milestones = profile.progress.milestones;

  // Check for stagnation indicators
  const hasStagnationChallenge = struggles.some(c => c.type === 'stagnation');
  const hasDirectionChallenge = struggles.some(c => c.type === 'direction');
  const lowProgress = completedActions.length < 3 && 
    milestones.filter(m => m.completed).length < 2;
  const longTenure = yearsOfExperience >= 5;

  const isStagnant = hasStagnationChallenge || 
    (hasDirectionChallenge && longTenure) ||
    (lowProgress && yearsOfExperience >= 3);

  if (!isStagnant) {
    return null;
  }

  // Determine severity
  let severity: 'high' | 'medium' | 'low' = 'low';
  const reasons: string[] = [];
  const growthLimitations: string[] = [];

  if (hasStagnationChallenge) {
    const stagnationChallenge = struggles.find(c => c.type === 'stagnation');
    if (stagnationChallenge && stagnationChallenge.severity >= 0.7) {
      severity = 'high';
    } else if (stagnationChallenge && stagnationChallenge.severity >= 0.4) {
      severity = 'medium';
    }
    reasons.push('You have explicitly identified feeling stuck in your current role');
  }

  if (longTenure && lowProgress) {
    severity = severity === 'high' ? 'high' : 'medium';
    reasons.push('Limited recent progress despite significant experience');
    growthLimitations.push('Few advancement opportunities in current position');
  }

  if (hasDirectionChallenge) {
    reasons.push('Lack of clear direction may indicate limited growth path in current role');
    growthLimitations.push('Unclear career progression within current organization');
  }

  // If we detected stagnation but haven't added reasons yet, add a general reason
  if (reasons.length === 0 && lowProgress) {
    reasons.push('Limited progress in completing actions and milestones');
    growthLimitations.push('May need to increase engagement with growth activities');
  }

  // Generate honest assessment
  let honestAssessment = '';
  if (severity === 'high') {
    honestAssessment = 'Based on your profile, it appears your current role has significant growth limitations. ' +
      'While there may be some opportunities to expand your responsibilities, ' +
      'you may need to consider alternative paths to achieve your career goals.';
  } else if (severity === 'medium') {
    honestAssessment = 'Your current role shows some signs of stagnation. ' +
      'There are likely opportunities to grow within your position, but they may be limited. ' +
      'It\'s worth exploring both in-role advancement and alternative options.';
  } else {
    honestAssessment = 'While you may be experiencing some challenges, ' +
      'there appear to be opportunities for growth in your current role. ' +
      'Focus on the identified opportunities while staying open to other possibilities.';
  }

  return {
    isStagnant: true,
    severity,
    reasons,
    honestAssessment,
    growthLimitations,
  };
}

/**
 * Generates alternative career paths when current role growth is limited
 */
function generateAlternativePaths(profile: UserProfile): CareerPath[] {
  const alternativePaths: CareerPath[] = [];
  const currentRole = profile.personalInfo.currentRole?.toLowerCase() || '';
  const industry = profile.personalInfo.industry;
  const interests = profile.careerInfo.interests;

  // Internal transfer options
  if (industry) {
    alternativePaths.push({
      id: `internal-transfer-${Date.now()}`,
      title: `Internal Transfer within ${industry}`,
      description: `Explore opportunities in different teams or departments within your current organization`,
      reasoning: 'Internal transfers allow you to leverage your existing knowledge of the company while finding new growth opportunities',
      fitScore: 0.75,
      requiredSkills: profile.skills.current.map(s => s.name),
      timeToTransition: '3-6 months',
      growthPotential: 0.7,
    });
  }

  // Similar role at different company
  if (currentRole) {
    alternativePaths.push({
      id: `external-similar-${Date.now()}`,
      title: `${currentRole} at a Different Company`,
      description: `Seek similar roles at companies with better growth opportunities or culture fit`,
      reasoning: 'Moving to a new company in a similar role can provide fresh challenges and advancement opportunities',
      fitScore: 0.8,
      requiredSkills: profile.skills.current.map(s => s.name),
      timeToTransition: '2-4 months',
      growthPotential: 0.75,
    });
  }

  // Adjacent role based on interests
  if (interests.length > 0) {
    const primaryInterest = interests[0];
    alternativePaths.push({
      id: `adjacent-role-${Date.now()}`,
      title: `Transition to ${primaryInterest}-focused Role`,
      description: `Pivot to a role that aligns more closely with your interests in ${primaryInterest}`,
      reasoning: `Your interest in ${primaryInterest} suggests this could be a more fulfilling career direction`,
      fitScore: 0.7,
      requiredSkills: [...profile.skills.current.map(s => s.name), primaryInterest],
      timeToTransition: '6-12 months',
      growthPotential: 0.8,
    });
  }

  // Senior/leadership track
  if (profile.personalInfo.yearsOfExperience >= 5) {
    alternativePaths.push({
      id: `leadership-track-${Date.now()}`,
      title: 'Leadership or Management Track',
      description: 'Transition into a leadership role managing teams or projects',
      reasoning: 'Your experience level positions you well for leadership opportunities',
      fitScore: 0.65,
      requiredSkills: [...profile.skills.current.map(s => s.name), 'Leadership', 'Communication', 'Mentoring'],
      timeToTransition: '6-12 months',
      growthPotential: 0.85,
    });
  }

  return alternativePaths;
}

/**
 * Helper function to check if a skill exists in the current skills list
 */
function hasSkill(currentSkills: string[], skillName: string): boolean {
  const skillLower = skillName.toLowerCase();
  return currentSkills.some(s => 
    s === skillLower || 
    s.includes(skillLower) || 
    skillLower.includes(s)
  );
}
