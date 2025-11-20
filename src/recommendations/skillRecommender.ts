/**
 * Skill Recommendation Engine
 * Generates prioritized skill recommendations based on career path and skill gaps
 */

import { UserProfile, CareerPath, SkillRecommendation, Skill } from '../models/index.js';

/**
 * Skill gap analysis result
 */
interface SkillGap {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  priority: 'high' | 'medium' | 'low';
  estimatedLearningTime: string;
  impact: number;
}

/**
 * Skill metadata for dependency tracking and prioritization
 */
interface SkillMetadata {
  name: string;
  category: string;
  dependencies: string[];
  learningTimeMonths: number;
  impact: number;
  resources: string[];
}

/**
 * Recommends skills based on career path and user profile
 * @param profile - The user profile
 * @param careerPath - The target career path
 * @returns Array of prioritized skill recommendations
 */
export function recommendSkills(
  profile: UserProfile,
  careerPath: CareerPath
): SkillRecommendation[] {
  // Identify skill gaps
  const gaps = identifySkillGaps(profile, careerPath);
  
  // Get skill metadata for all gap skills
  const skillsWithMetadata = gaps.map(gap => ({
    gap,
    metadata: getSkillMetadata(gap.skill),
  }));
  
  // Calculate priority scores
  const scoredSkills = skillsWithMetadata.map(({ gap, metadata }) => ({
    gap,
    metadata,
    priorityScore: calculatePriorityScore(gap, metadata, profile),
  }));
  
  // Sort by priority score (highest first)
  scoredSkills.sort((a, b) => b.priorityScore - a.priorityScore);
  
  // Order skills respecting dependencies
  const orderedSkills = orderByDependencies(scoredSkills);
  
  // Convert to skill recommendations
  const recommendations = orderedSkills.map(({ gap, metadata, priorityScore }) => ({
    skill: gap.skill,
    priority: priorityScore,
    reasoning: generateSkillReasoning(gap, metadata, careerPath, profile),
    learningResources: metadata.resources,
    estimatedTime: gap.estimatedLearningTime,
    dependencies: metadata.dependencies,
  }));
  
  return recommendations;
}

/**
 * Identifies the highest-impact skill when time is constrained
 * @param profile - The user profile
 * @param careerPath - The target career path
 * @returns The single highest-impact skill recommendation
 */
export function getHighestImpactSkill(
  profile: UserProfile,
  careerPath: CareerPath
): SkillRecommendation | null {
  const recommendations = recommendSkills(profile, careerPath);
  
  if (recommendations.length === 0) {
    return null;
  }
  
  // Find skill with highest priority that has no unmet dependencies
  const currentSkillNames = profile.skills.current.map(s => s.name.toLowerCase());
  const learningSkillNames = profile.skills.learning.map(s => s.name.toLowerCase());
  const knownSkills = [...currentSkillNames, ...learningSkillNames];
  
  // Helper function to check if a dependency is satisfied
  const isDependencySatisfied = (dep: string): boolean => {
    const depLower = dep.toLowerCase();
    for (const known of knownSkills) {
      if (known === depLower || 
          known.includes(depLower) || 
          depLower.includes(known)) {
        return true;
      }
    }
    return false;
  };
  
  // Find all skills with met dependencies
  const skillsWithMetDeps = recommendations.filter(rec => {
    const unmetDeps = rec.dependencies.filter(dep => !isDependencySatisfied(dep));
    return unmetDeps.length === 0;
  });
  
  if (skillsWithMetDeps.length > 0) {
    // Return the one with highest priority
    return skillsWithMetDeps.reduce((max, rec) =>
      rec.priority > max.priority ? rec : max
    );
  }
  
  // If all skills have unmet dependencies, return the first one
  return recommendations[0];
}

/**
 * Identifies skill gaps between current state and target career path
 */
function identifySkillGaps(profile: UserProfile, careerPath: CareerPath): SkillGap[] {
  const gaps: SkillGap[] = [];
  const currentSkills = profile.skills.current;
  const targetSkills = profile.skills.target;
  
  // Combine required skills from career path and target skills
  const allRequiredSkills = new Set([
    ...careerPath.requiredSkills,
    ...targetSkills.map(s => s.name),
  ]);
  
  for (const requiredSkill of allRequiredSkills) {
    const currentSkill = currentSkills.find(s => 
      s.name.toLowerCase() === requiredSkill.toLowerCase() ||
      s.name.toLowerCase().includes(requiredSkill.toLowerCase()) ||
      requiredSkill.toLowerCase().includes(s.name.toLowerCase())
    );
    
    const targetSkill = targetSkills.find(s =>
      s.name.toLowerCase() === requiredSkill.toLowerCase()
    );
    
    const currentLevel = currentSkill?.level || 0;
    const targetLevel = targetSkill?.level || 5; // Default target level
    
    if (currentLevel < targetLevel) {
      const metadata = getSkillMetadata(requiredSkill);
      const levelGap = targetLevel - currentLevel;
      
      gaps.push({
        skill: requiredSkill,
        currentLevel,
        targetLevel,
        priority: levelGap >= 4 ? 'high' : levelGap >= 2 ? 'medium' : 'low',
        estimatedLearningTime: estimateLearningTime(levelGap, metadata.learningTimeMonths),
        impact: metadata.impact,
      });
    }
  }
  
  return gaps;
}

/**
 * Calculates priority score for a skill
 */
function calculatePriorityScore(
  gap: SkillGap,
  metadata: SkillMetadata,
  profile: UserProfile
): number {
  let score = 0;
  
  // Impact weight (40%)
  score += metadata.impact * 0.4;
  
  // Gap size weight (30%)
  const gapSize = (gap.targetLevel - gap.currentLevel) / 10;
  score += gapSize * 0.3;
  
  // Learning time weight (20% - inverse, shorter is better)
  const timeScore = 1 - Math.min(metadata.learningTimeMonths / 12, 1);
  score += timeScore * 0.2;
  
  // Dependency count weight (10% - fewer dependencies is better)
  const depScore = 1 - Math.min(metadata.dependencies.length / 5, 1);
  score += depScore * 0.1;
  
  return score;
}

/**
 * Orders skills respecting dependency constraints
 */
function orderByDependencies(
  scoredSkills: Array<{
    gap: SkillGap;
    metadata: SkillMetadata;
    priorityScore: number;
  }>
): Array<{
  gap: SkillGap;
  metadata: SkillMetadata;
  priorityScore: number;
}> {
  const ordered: typeof scoredSkills = [];
  const remaining = [...scoredSkills];
  const addedSkills = new Set<string>();
  
  // Build a set of all skills in the list for quick lookup
  const allSkillNames = new Set(
    scoredSkills.map(s => s.gap.skill.toLowerCase())
  );
  
  // Helper function to check if a dependency is in the skills list
  const isDependencyInList = (dep: string): boolean => {
    const depLower = dep.toLowerCase();
    for (const skillName of allSkillNames) {
      if (skillName === depLower ||
          skillName.includes(depLower) ||
          depLower.includes(skillName)) {
        return true;
      }
    }
    return false;
  };
  
  // Helper function to check if a dependency is satisfied
  const isDependencySatisfied = (dep: string): boolean => {
    // If the dependency is not in our list of skills to recommend,
    // we don't need to wait for it
    if (!isDependencyInList(dep)) {
      return true;
    }
    
    // Check if it's been added already
    const depLower = dep.toLowerCase();
    for (const addedSkill of addedSkills) {
      if (addedSkill === depLower ||
          addedSkill.includes(depLower) ||
          depLower.includes(addedSkill)) {
        return true;
      }
    }
    return false;
  };
  
  // Keep adding skills until all are ordered
  while (remaining.length > 0) {
    // Find all skills whose dependencies are met
    const readySkills: typeof scoredSkills = [];
    
    for (const skill of remaining) {
      const unmetDeps = skill.metadata.dependencies.filter(
        dep => !isDependencySatisfied(dep)
      );
      
      if (unmetDeps.length === 0) {
        readySkills.push(skill);
      }
    }
    
    // If no skills are ready, we have a circular dependency
    // Add the highest priority remaining skill
    if (readySkills.length === 0 && remaining.length > 0) {
      const highestPriority = remaining.reduce((max, skill) =>
        skill.priorityScore > max.priorityScore ? skill : max
      );
      readySkills.push(highestPriority);
    }
    
    // Sort ready skills by priority (highest first) and add them
    readySkills.sort((a, b) => b.priorityScore - a.priorityScore);
    
    for (const skill of readySkills) {
      ordered.push(skill);
      addedSkills.add(skill.gap.skill.toLowerCase());
      const index = remaining.indexOf(skill);
      if (index !== -1) {
        remaining.splice(index, 1);
      }
    }
  }
  
  return ordered;
}

/**
 * Generates reasoning for a skill recommendation
 */
function generateSkillReasoning(
  gap: SkillGap,
  metadata: SkillMetadata,
  careerPath: CareerPath,
  profile: UserProfile
): string {
  const reasons: string[] = [];
  
  // Career path alignment
  if (careerPath.requiredSkills.some(s => 
    s.toLowerCase() === gap.skill.toLowerCase()
  )) {
    reasons.push(`${gap.skill} is essential for your target career path in ${careerPath.title}`);
  }
  
  // Impact reasoning
  if (metadata.impact >= 0.8) {
    reasons.push('This skill has high impact on your career progression');
  } else if (metadata.impact >= 0.6) {
    reasons.push('This skill will significantly enhance your capabilities');
  }
  
  // Gap size reasoning
  const gapSize = gap.targetLevel - gap.currentLevel;
  if (gapSize >= 4) {
    reasons.push('Closing this skill gap is a priority for reaching your goals');
  } else if (gapSize >= 2) {
    reasons.push('Developing this skill will help you advance toward your target level');
  }
  
  // Learning time reasoning
  if (metadata.learningTimeMonths <= 3) {
    reasons.push('This skill can be learned relatively quickly');
  } else if (metadata.learningTimeMonths >= 9) {
    reasons.push('This skill requires significant time investment but offers long-term value');
  }
  
  // Dependency reasoning
  if (metadata.dependencies.length > 0) {
    reasons.push(`Building on your knowledge of ${metadata.dependencies.slice(0, 2).join(' and ')}`);
  }
  
  return reasons.join('. ') + '.';
}

/**
 * Estimates learning time based on level gap and base learning time
 */
function estimateLearningTime(levelGap: number, baseMonths: number): string {
  const months = Math.ceil((levelGap / 5) * baseMonths);
  
  if (months <= 1) {
    return '2-4 weeks';
  } else if (months <= 3) {
    return `${months} months`;
  } else if (months <= 6) {
    return `${months} months`;
  } else {
    return `${months}-${months + 3} months`;
  }
}

/**
 * Gets metadata for a skill including dependencies and learning time
 */
function getSkillMetadata(skillName: string): SkillMetadata {
  const skillLower = skillName.toLowerCase();
  
  // Skill database with dependencies and metadata
  const skillDatabase: Record<string, Partial<SkillMetadata>> = {
    'programming': {
      dependencies: [],
      learningTimeMonths: 6,
      impact: 0.9,
      resources: ['Codecademy', 'freeCodeCamp', 'The Odin Project'],
    },
    'python': {
      dependencies: ['programming'],
      learningTimeMonths: 4,
      impact: 0.85,
      resources: ['Python.org tutorials', 'Automate the Boring Stuff', 'Real Python'],
    },
    'javascript': {
      dependencies: ['programming'],
      learningTimeMonths: 4,
      impact: 0.85,
      resources: ['MDN Web Docs', 'JavaScript.info', 'Eloquent JavaScript'],
    },
    'algorithms': {
      dependencies: ['programming'],
      learningTimeMonths: 6,
      impact: 0.8,
      resources: ['LeetCode', 'HackerRank', 'Introduction to Algorithms book'],
    },
    'system design': {
      dependencies: ['programming', 'algorithms'],
      learningTimeMonths: 8,
      impact: 0.9,
      resources: ['System Design Primer', 'Designing Data-Intensive Applications', 'Grokking System Design'],
    },
    'testing': {
      dependencies: ['programming'],
      learningTimeMonths: 3,
      impact: 0.7,
      resources: ['Test-Driven Development book', 'Jest documentation', 'Testing Library'],
    },
    'statistics': {
      dependencies: [],
      learningTimeMonths: 6,
      impact: 0.85,
      resources: ['Khan Academy Statistics', 'Statistics for Data Science', 'Coursera Statistics'],
    },
    'machine learning': {
      dependencies: ['python', 'statistics'],
      learningTimeMonths: 8,
      impact: 0.9,
      resources: ['Coursera ML', 'Fast.ai', 'Hands-On Machine Learning book'],
    },
    'data visualization': {
      dependencies: ['python', 'statistics'],
      learningTimeMonths: 3,
      impact: 0.7,
      resources: ['Tableau tutorials', 'D3.js', 'Matplotlib documentation'],
    },
    'sql': {
      dependencies: [],
      learningTimeMonths: 2,
      impact: 0.8,
      resources: ['SQLZoo', 'Mode Analytics SQL Tutorial', 'PostgreSQL documentation'],
    },
    'product strategy': {
      dependencies: [],
      learningTimeMonths: 6,
      impact: 0.85,
      resources: ['Inspired by Marty Cagan', 'Product School', 'Reforge Product Strategy'],
    },
    'stakeholder management': {
      dependencies: [],
      learningTimeMonths: 4,
      impact: 0.8,
      resources: ['Crucial Conversations book', 'Leadership courses', 'Communication workshops'],
    },
    'roadmapping': {
      dependencies: ['product strategy'],
      learningTimeMonths: 3,
      impact: 0.7,
      resources: ['ProductPlan guides', 'Aha! roadmapping', 'Product Roadmap templates'],
    },
    'analytics': {
      dependencies: [],
      learningTimeMonths: 4,
      impact: 0.75,
      resources: ['Google Analytics Academy', 'Mixpanel guides', 'Amplitude tutorials'],
    },
    'user research': {
      dependencies: [],
      learningTimeMonths: 4,
      impact: 0.8,
      resources: ['Nielsen Norman Group', 'User Interviews guide', 'Just Enough Research book'],
    },
    'prototyping': {
      dependencies: ['user research'],
      learningTimeMonths: 3,
      impact: 0.75,
      resources: ['Figma tutorials', 'InVision guides', 'Prototyping basics'],
    },
    'visual design': {
      dependencies: [],
      learningTimeMonths: 6,
      impact: 0.8,
      resources: ['Refactoring UI', 'Design principles courses', 'Dribbble inspiration'],
    },
    'interaction design': {
      dependencies: ['user research', 'prototyping'],
      learningTimeMonths: 5,
      impact: 0.8,
      resources: ['Interaction Design Foundation', 'UX Design courses', 'Microinteractions book'],
    },
    'leadership': {
      dependencies: [],
      learningTimeMonths: 12,
      impact: 0.9,
      resources: ['Leadership books', 'Executive coaching', 'Management training'],
    },
    'mentoring': {
      dependencies: ['leadership'],
      learningTimeMonths: 6,
      impact: 0.7,
      resources: ['Mentoring guides', 'Coaching skills', 'Feedback frameworks'],
    },
    'communication': {
      dependencies: [],
      learningTimeMonths: 6,
      impact: 0.85,
      resources: ['Toastmasters', 'Business writing courses', 'Presentation skills'],
    },
  };
  
  // Find matching skill in database (case-insensitive, partial match)
  let metadata = skillDatabase[skillLower];
  
  if (!metadata) {
    // Try partial match
    for (const [key, value] of Object.entries(skillDatabase)) {
      if (skillLower.includes(key) || key.includes(skillLower)) {
        metadata = value;
        break;
      }
    }
  }
  
  // Return metadata with defaults
  return {
    name: skillName,
    category: 'general',
    dependencies: metadata?.dependencies || [],
    learningTimeMonths: metadata?.learningTimeMonths || 4,
    impact: metadata?.impact || 0.7,
    resources: metadata?.resources || ['Online courses', 'Books', 'Practice projects'],
  };
}
