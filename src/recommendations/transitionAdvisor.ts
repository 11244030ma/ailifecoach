/**
 * Career Transition Advisor
 * Provides guidance for transitioning between career fields
 */

import { UserProfile, TransitionPlan, TransitionPhase, SkillRecommendation, ActionStep } from '../models/index.js';
import { recommendSkills } from './skillRecommender.js';

/**
 * Field transition metadata
 */
interface FieldMetadata {
  name: string;
  coreSkills: string[];
  industryKnowledge: string[];
  typicalRoles: string[];
}

/**
 * Skill transferability assessment
 */
interface TransferabilityScore {
  skill: string;
  transferability: number; // 0-1, how well it transfers
  relevance: number; // 0-1, how relevant to target field
}

/**
 * Generates a career transition plan from source field to target field
 * @param sourceField - Current career field
 * @param targetField - Desired career field
 * @param profile - User profile
 * @returns Comprehensive transition plan
 */
export function generateTransitionPlan(
  sourceField: string,
  targetField: string,
  profile: UserProfile
): TransitionPlan {
  // Get field metadata
  const sourceMetadata = getFieldMetadata(sourceField);
  const targetMetadata = getFieldMetadata(targetField);
  
  // Identify transferable skills
  const transferableSkills = identifyTransferableSkills(
    profile,
    sourceMetadata,
    targetMetadata
  );
  
  // Identify skills to acquire
  const skillsToAcquire = identifySkillsToAcquire(
    profile,
    transferableSkills,
    targetMetadata
  );
  
  // Assess difficulty
  const difficultyLevel = assessTransitionDifficulty(
    transferableSkills,
    skillsToAcquire,
    sourceMetadata,
    targetMetadata
  );
  
  // Estimate duration
  const estimatedDuration = estimateTransitionDuration(
    difficultyLevel,
    skillsToAcquire,
    profile
  );
  
  // Generate transition phases
  const phases = generateTransitionPhases(
    difficultyLevel,
    transferableSkills,
    skillsToAcquire,
    sourceField,
    targetField,
    profile
  );
  
  // Identify risks and success factors
  const risks = identifyTransitionRisks(
    difficultyLevel,
    transferableSkills,
    skillsToAcquire,
    profile
  );
  
  const successFactors = identifySuccessFactors(
    transferableSkills,
    profile,
    sourceField,
    targetField
  );
  
  return {
    sourceField,
    targetField,
    transferableSkills: transferableSkills.map(s => s.skill),
    skillsToAcquire,
    phases,
    estimatedDuration,
    difficultyLevel,
    risks,
    successFactors,
  };
}

/**
 * Identifies skills that transfer from source to target field
 */
function identifyTransferableSkills(
  profile: UserProfile,
  sourceMetadata: FieldMetadata,
  targetMetadata: FieldMetadata
): TransferabilityScore[] {
  const transferable: TransferabilityScore[] = [];
  const currentSkills = profile.skills.current;
  
  // Check each current skill for transferability
  for (const skill of currentSkills) {
    const skillLower = skill.name.toLowerCase();
    
    // Check if skill is relevant to target field
    const isTargetCore = targetMetadata.coreSkills.some(s =>
      s.toLowerCase() === skillLower ||
      skillLower.includes(s.toLowerCase()) ||
      s.toLowerCase().includes(skillLower)
    );
    
    const isSourceCore = sourceMetadata.coreSkills.some(s =>
      s.toLowerCase() === skillLower ||
      skillLower.includes(s.toLowerCase()) ||
      s.toLowerCase().includes(skillLower)
    );
    
    // Universal skills (communication, leadership, etc.) transfer well
    const universalSkills = [
      'communication', 'leadership', 'problem solving', 'critical thinking',
      'project management', 'teamwork', 'time management', 'presentation',
      'writing', 'research', 'analysis', 'collaboration'
    ];
    
    const isUniversal = universalSkills.some(u =>
      skillLower.includes(u) || u.includes(skillLower)
    );
    
    // Calculate transferability
    let transferability = 0;
    let relevance = 0;
    
    if (isTargetCore) {
      transferability = 1.0;
      relevance = 1.0;
    } else if (isUniversal) {
      transferability = 0.9;
      relevance = 0.7;
    } else if (isSourceCore) {
      // Source-specific skills have lower transferability
      transferability = 0.3;
      relevance = 0.4;
    } else {
      // General skills
      transferability = 0.6;
      relevance = 0.5;
    }
    
    // Adjust based on skill level
    transferability *= Math.min(skill.level / 5, 1);
    
    if (transferability > 0.3 || relevance > 0.4) {
      transferable.push({
        skill: skill.name,
        transferability,
        relevance,
      });
    }
  }
  
  // Sort by combined score
  transferable.sort((a, b) => {
    const scoreA = (a.transferability + a.relevance) / 2;
    const scoreB = (b.transferability + b.relevance) / 2;
    return scoreB - scoreA;
  });
  
  return transferable;
}

/**
 * Identifies skills that need to be acquired for the transition
 */
function identifySkillsToAcquire(
  profile: UserProfile,
  transferableSkills: TransferabilityScore[],
  targetMetadata: FieldMetadata
): SkillRecommendation[] {
  const skillsToAcquire: SkillRecommendation[] = [];
  const currentSkillNames = profile.skills.current.map(s => s.name.toLowerCase());
  const transferableNames = transferableSkills.map(s => s.skill.toLowerCase());
  
  // Check each core skill in target field
  for (const targetSkill of targetMetadata.coreSkills) {
    const targetLower = targetSkill.toLowerCase();
    
    // Check if user already has this skill
    const hasSkill = currentSkillNames.some(s =>
      s === targetLower || s.includes(targetLower) || targetLower.includes(s)
    );
    
    if (!hasSkill) {
      // Determine priority based on how core it is
      const priority = 0.8 + Math.random() * 0.2; // High priority for core skills
      
      skillsToAcquire.push({
        skill: targetSkill,
        priority,
        reasoning: `${targetSkill} is a core skill for ${targetMetadata.name} and essential for successful transition`,
        learningResources: getSkillResources(targetSkill),
        estimatedTime: estimateSkillLearningTime(targetSkill),
        dependencies: getSkillDependencies(targetSkill),
      });
    }
  }
  
  // Sort by priority
  skillsToAcquire.sort((a, b) => b.priority - a.priority);
  
  return skillsToAcquire;
}

/**
 * Assesses the difficulty of the transition
 */
function assessTransitionDifficulty(
  transferableSkills: TransferabilityScore[],
  skillsToAcquire: SkillRecommendation[],
  sourceMetadata: FieldMetadata,
  targetMetadata: FieldMetadata
): 'easy' | 'moderate' | 'challenging' {
  // Calculate transferability ratio
  const avgTransferability = transferableSkills.length > 0
    ? transferableSkills.reduce((sum, s) => sum + s.transferability, 0) / transferableSkills.length
    : 0;
  
  // Calculate skill gap
  const skillGapRatio = skillsToAcquire.length / Math.max(targetMetadata.coreSkills.length, 1);
  
  // Calculate field similarity
  const commonSkills = sourceMetadata.coreSkills.filter(s =>
    targetMetadata.coreSkills.some(t =>
      t.toLowerCase() === s.toLowerCase() ||
      t.toLowerCase().includes(s.toLowerCase()) ||
      s.toLowerCase().includes(t.toLowerCase())
    )
  );
  const fieldSimilarity = commonSkills.length / Math.max(targetMetadata.coreSkills.length, 1);
  
  // Combine factors
  const difficultyScore = (
    (1 - avgTransferability) * 0.3 +
    skillGapRatio * 0.4 +
    (1 - fieldSimilarity) * 0.3
  );
  
  if (difficultyScore < 0.4) {
    return 'easy';
  } else if (difficultyScore < 0.7) {
    return 'moderate';
  } else {
    return 'challenging';
  }
}

/**
 * Estimates the duration of the transition
 */
function estimateTransitionDuration(
  difficultyLevel: 'easy' | 'moderate' | 'challenging',
  skillsToAcquire: SkillRecommendation[],
  profile: UserProfile
): string {
  // Base duration by difficulty
  let baseMonths = 0;
  switch (difficultyLevel) {
    case 'easy':
      baseMonths = 6;
      break;
    case 'moderate':
      baseMonths = 12;
      break;
    case 'challenging':
      baseMonths = 18;
      break;
  }
  
  // Adjust for number of skills to acquire
  const skillAdjustment = Math.min(skillsToAcquire.length * 2, 12);
  const totalMonths = baseMonths + skillAdjustment;
  
  // Adjust for experience level
  const yearsExp = profile.personalInfo.yearsOfExperience;
  const experienceMultiplier = yearsExp >= 5 ? 0.8 : yearsExp >= 3 ? 0.9 : 1.0;
  
  const adjustedMonths = Math.round(totalMonths * experienceMultiplier);
  
  // Format as range
  const minMonths = Math.max(adjustedMonths - 3, 3);
  const maxMonths = adjustedMonths + 3;
  
  return `${minMonths}-${maxMonths} months`;
}

/**
 * Generates transition phases based on difficulty and skills
 */
function generateTransitionPhases(
  difficultyLevel: 'easy' | 'moderate' | 'challenging',
  transferableSkills: TransferabilityScore[],
  skillsToAcquire: SkillRecommendation[],
  sourceField: string,
  targetField: string,
  profile: UserProfile
): TransitionPhase[] {
  const phases: TransitionPhase[] = [];
  
  if (difficultyLevel === 'easy') {
    // Single phase for easy transitions
    phases.push({
      name: 'Skill Development and Transition',
      duration: '3-6 months',
      focus: 'Acquire core skills and begin applying to target roles',
      actions: generatePhaseActions('single', skillsToAcquire, transferableSkills),
      successCriteria: [
        'Complete learning for core skills',
        'Build portfolio projects demonstrating new skills',
        'Network with professionals in target field',
        'Apply to entry-level positions in target field',
      ],
    });
  } else if (difficultyLevel === 'moderate') {
    // Two phases for moderate transitions
    phases.push({
      name: 'Foundation Building',
      duration: '4-6 months',
      focus: 'Learn fundamental skills required for target field',
      actions: generatePhaseActions('foundation', skillsToAcquire, transferableSkills),
      successCriteria: [
        'Complete foundational skill training',
        'Build 2-3 portfolio projects',
        'Join relevant professional communities',
        'Identify potential mentors in target field',
      ],
    });
    
    phases.push({
      name: 'Transition and Application',
      duration: '4-6 months',
      focus: 'Apply skills and actively pursue opportunities',
      actions: generatePhaseActions('application', skillsToAcquire, transferableSkills),
      successCriteria: [
        'Complete advanced skill development',
        'Build comprehensive portfolio',
        'Conduct informational interviews',
        'Apply to target roles and secure interviews',
      ],
    });
  } else {
    // Three phases for challenging transitions
    phases.push({
      name: 'Exploration and Foundation',
      duration: '4-6 months',
      focus: 'Understand target field and build foundational knowledge',
      actions: generatePhaseActions('exploration', skillsToAcquire, transferableSkills),
      successCriteria: [
        'Complete introductory courses in target field',
        'Understand industry landscape and key players',
        'Identify specific role targets within field',
        'Begin building foundational skills',
      ],
    });
    
    phases.push({
      name: 'Skill Development',
      duration: '6-9 months',
      focus: 'Intensive skill building and practical application',
      actions: generatePhaseActions('development', skillsToAcquire, transferableSkills),
      successCriteria: [
        'Achieve proficiency in core technical skills',
        'Complete multiple portfolio projects',
        'Contribute to open source or volunteer projects',
        'Build network in target field',
      ],
    });
    
    phases.push({
      name: 'Transition Execution',
      duration: '3-6 months',
      focus: 'Active job search and transition to new role',
      actions: generatePhaseActions('execution', skillsToAcquire, transferableSkills),
      successCriteria: [
        'Polish portfolio and professional materials',
        'Conduct targeted job search',
        'Leverage network for opportunities',
        'Successfully transition to new role',
      ],
    });
  }
  
  return phases;
}

/**
 * Generates action steps for a transition phase
 */
function generatePhaseActions(
  phaseType: 'single' | 'foundation' | 'application' | 'exploration' | 'development' | 'execution',
  skillsToAcquire: SkillRecommendation[],
  transferableSkills: TransferabilityScore[]
): ActionStep[] {
  const actions: ActionStep[] = [];
  let actionId = 1;
  
  switch (phaseType) {
    case 'single':
    case 'foundation':
    case 'exploration':
      // Early phase actions
      if (skillsToAcquire.length > 0) {
        actions.push({
          id: `action-${actionId++}`,
          description: `Begin learning ${skillsToAcquire[0].skill}`,
          timeframe: 'this_week',
          category: 'learning',
          completed: false,
        });
      }
      actions.push({
        id: `action-${actionId++}`,
        description: 'Research target field and identify key companies',
        timeframe: 'this_week',
        category: 'reflection',
        completed: false,
      });
      actions.push({
        id: `action-${actionId++}`,
        description: 'Join online communities in target field',
        timeframe: 'this_month',
        category: 'networking',
        completed: false,
      });
      break;
      
    case 'development':
      // Middle phase actions
      actions.push({
        id: `action-${actionId++}`,
        description: 'Complete intermediate skill courses',
        timeframe: 'this_month',
        category: 'learning',
        completed: false,
      });
      actions.push({
        id: `action-${actionId++}`,
        description: 'Build portfolio project showcasing new skills',
        timeframe: 'this_month',
        category: 'application',
        completed: false,
      });
      actions.push({
        id: `action-${actionId++}`,
        description: 'Attend industry events or webinars',
        timeframe: 'this_month',
        category: 'networking',
        completed: false,
      });
      break;
      
    case 'application':
    case 'execution':
      // Late phase actions
      actions.push({
        id: `action-${actionId++}`,
        description: 'Update resume highlighting transferable skills',
        timeframe: 'this_week',
        category: 'application',
        completed: false,
      });
      actions.push({
        id: `action-${actionId++}`,
        description: 'Conduct informational interviews with target field professionals',
        timeframe: 'this_month',
        category: 'networking',
        completed: false,
      });
      actions.push({
        id: `action-${actionId++}`,
        description: 'Apply to entry-level or transition roles',
        timeframe: 'this_month',
        category: 'application',
        completed: false,
      });
      break;
  }
  
  return actions;
}

/**
 * Identifies risks associated with the transition
 */
function identifyTransitionRisks(
  difficultyLevel: 'easy' | 'moderate' | 'challenging',
  transferableSkills: TransferabilityScore[],
  skillsToAcquire: SkillRecommendation[],
  profile: UserProfile
): string[] {
  const risks: string[] = [];
  
  // Difficulty-based risks
  if (difficultyLevel === 'challenging') {
    risks.push('Significant time investment required (18+ months)');
    risks.push('May need to accept entry-level position despite experience');
  } else if (difficultyLevel === 'moderate') {
    risks.push('Moderate time commitment (12+ months) required');
  }
  
  // Skill gap risks
  if (skillsToAcquire.length >= 5) {
    risks.push('Large skill gap requires substantial learning effort');
  }
  
  // Transferability risks
  const avgTransferability = transferableSkills.length > 0
    ? transferableSkills.reduce((sum, s) => sum + s.transferability, 0) / transferableSkills.length
    : 0;
  
  if (avgTransferability < 0.5) {
    risks.push('Limited skill transferability may require starting from basics');
  }
  
  // Experience risks
  if (profile.personalInfo.yearsOfExperience < 2) {
    risks.push('Limited work experience may make transition more challenging');
  }
  
  // Financial risks
  risks.push('Potential salary reduction during transition period');
  
  // Market risks
  risks.push('Competitive job market for career changers');
  
  return risks;
}

/**
 * Identifies success factors for the transition
 */
function identifySuccessFactors(
  transferableSkills: TransferabilityScore[],
  profile: UserProfile,
  sourceField: string,
  targetField: string
): string[] {
  const factors: string[] = [];
  
  // Transferable skills
  const highTransferSkills = transferableSkills.filter(s => s.transferability >= 0.7);
  if (highTransferSkills.length > 0) {
    factors.push(`Strong transferable skills: ${highTransferSkills.slice(0, 3).map(s => s.skill).join(', ')}`);
  }
  
  // Experience
  const yearsExp = profile.personalInfo.yearsOfExperience;
  if (yearsExp >= 3) {
    factors.push('Solid work experience demonstrates professionalism and work ethic');
  }
  
  // Motivation
  if (profile.mindset.motivationLevel >= 0.7) {
    factors.push('High motivation level supports sustained learning effort');
  }
  
  // Goals
  if (profile.careerInfo.goals.length > 0) {
    factors.push('Clear goals provide direction and focus');
  }
  
  // Universal success factors
  factors.push('Networking and building relationships in target field');
  factors.push('Demonstrating passion and commitment through projects and learning');
  factors.push('Leveraging unique perspective from previous field');
  
  return factors;
}

/**
 * Gets field metadata for a given field name
 */
function getFieldMetadata(fieldName: string): FieldMetadata {
  const fieldLower = fieldName.toLowerCase();
  
  const fieldDatabase: Record<string, FieldMetadata> = {
    'software engineering': {
      name: 'Software Engineering',
      coreSkills: ['programming', 'algorithms', 'system design', 'testing', 'version control'],
      industryKnowledge: ['software development lifecycle', 'agile methodologies', 'code review'],
      typicalRoles: ['Software Engineer', 'Developer', 'Backend Engineer', 'Frontend Engineer'],
    },
    'data science': {
      name: 'Data Science',
      coreSkills: ['statistics', 'python', 'machine learning', 'data visualization', 'sql'],
      industryKnowledge: ['data analysis', 'model evaluation', 'feature engineering'],
      typicalRoles: ['Data Scientist', 'ML Engineer', 'Data Analyst'],
    },
    'product management': {
      name: 'Product Management',
      coreSkills: ['product strategy', 'stakeholder management', 'roadmapping', 'analytics', 'user research'],
      industryKnowledge: ['product lifecycle', 'market analysis', 'competitive analysis'],
      typicalRoles: ['Product Manager', 'Associate Product Manager', 'Product Owner'],
    },
    'ux design': {
      name: 'UX Design',
      coreSkills: ['user research', 'prototyping', 'visual design', 'interaction design', 'usability testing'],
      industryKnowledge: ['design thinking', 'user-centered design', 'accessibility'],
      typicalRoles: ['UX Designer', 'UI Designer', 'Product Designer'],
    },
    'digital marketing': {
      name: 'Digital Marketing',
      coreSkills: ['seo', 'content marketing', 'analytics', 'social media', 'email marketing'],
      industryKnowledge: ['marketing funnel', 'customer acquisition', 'conversion optimization'],
      typicalRoles: ['Digital Marketer', 'Marketing Manager', 'Growth Marketer'],
    },
    'business analysis': {
      name: 'Business Analysis',
      coreSkills: ['business analysis', 'requirements gathering', 'process improvement', 'sql', 'data analysis'],
      industryKnowledge: ['business processes', 'stakeholder management', 'documentation'],
      typicalRoles: ['Business Analyst', 'Systems Analyst', 'Data Analyst'],
    },
    'project management': {
      name: 'Project Management',
      coreSkills: ['project planning', 'agile', 'risk management', 'stakeholder communication', 'budgeting'],
      industryKnowledge: ['project lifecycle', 'resource management', 'change management'],
      typicalRoles: ['Project Manager', 'Program Manager', 'Scrum Master'],
    },
  };
  
  // Try exact match
  if (fieldDatabase[fieldLower]) {
    return fieldDatabase[fieldLower];
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(fieldDatabase)) {
    if (fieldLower.includes(key) || key.includes(fieldLower)) {
      return value;
    }
  }
  
  // Return generic field metadata
  return {
    name: fieldName,
    coreSkills: ['communication', 'problem solving', 'critical thinking'],
    industryKnowledge: ['industry best practices', 'professional standards'],
    typicalRoles: ['Professional', 'Specialist', 'Analyst'],
  };
}

/**
 * Gets learning resources for a skill
 */
function getSkillResources(skillName: string): string[] {
  const skillLower = skillName.toLowerCase();
  
  const resourceDatabase: Record<string, string[]> = {
    'programming': ['Codecademy', 'freeCodeCamp', 'The Odin Project'],
    'python': ['Python.org tutorials', 'Automate the Boring Stuff', 'Real Python'],
    'javascript': ['MDN Web Docs', 'JavaScript.info', 'Eloquent JavaScript'],
    'statistics': ['Khan Academy Statistics', 'Statistics for Data Science', 'Coursera Statistics'],
    'machine learning': ['Coursera ML', 'Fast.ai', 'Hands-On Machine Learning book'],
    'sql': ['SQLZoo', 'Mode Analytics SQL Tutorial', 'PostgreSQL documentation'],
    'user research': ['Nielsen Norman Group', 'User Interviews guide', 'Just Enough Research book'],
    'prototyping': ['Figma tutorials', 'InVision guides', 'Prototyping basics'],
    'seo': ['Moz SEO Guide', 'Google SEO Starter Guide', 'Ahrefs Academy'],
    'content marketing': ['HubSpot Academy', 'Content Marketing Institute', 'Copyblogger'],
  };
  
  // Try exact match
  if (resourceDatabase[skillLower]) {
    return resourceDatabase[skillLower];
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(resourceDatabase)) {
    if (skillLower.includes(key) || key.includes(skillLower)) {
      return value;
    }
  }
  
  return ['Online courses', 'Books and tutorials', 'Practice projects'];
}

/**
 * Estimates learning time for a skill
 */
function estimateSkillLearningTime(skillName: string): string {
  const skillLower = skillName.toLowerCase();
  
  // Complex skills
  if (['machine learning', 'system design', 'statistics'].some(s => skillLower.includes(s))) {
    return '6-9 months';
  }
  
  // Moderate skills
  if (['programming', 'python', 'javascript', 'user research', 'product strategy'].some(s => skillLower.includes(s))) {
    return '4-6 months';
  }
  
  // Simpler skills
  return '2-4 months';
}

/**
 * Gets dependencies for a skill
 */
function getSkillDependencies(skillName: string): string[] {
  const skillLower = skillName.toLowerCase();
  
  const dependencyDatabase: Record<string, string[]> = {
    'machine learning': ['python', 'statistics'],
    'system design': ['programming', 'algorithms'],
    'data visualization': ['python', 'statistics'],
    'interaction design': ['user research', 'prototyping'],
    'roadmapping': ['product strategy'],
  };
  
  // Try exact match
  if (dependencyDatabase[skillLower]) {
    return dependencyDatabase[skillLower];
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(dependencyDatabase)) {
    if (skillLower.includes(key) || key.includes(skillLower)) {
      return value;
    }
  }
  
  return [];
}
