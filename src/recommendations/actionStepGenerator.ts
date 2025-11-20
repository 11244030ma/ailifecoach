/**
 * Action Step Generation System
 * Creates time-bound, actionable tasks for users based on their goals and career path
 */

import { UserProfile, Goal, ActionStep, CareerPath, SkillRecommendation } from '../models/index.js';

/**
 * Generates action steps for a user based on their goals and career path
 * @param profile - The user profile
 * @param goals - The goals to create action steps for
 * @param careerPath - Optional career path for context
 * @param skillRecommendations - Optional skill recommendations to incorporate
 * @returns Array of time-bound action steps
 */
export function generateActionSteps(
  profile: UserProfile,
  goals: Goal[],
  careerPath?: CareerPath,
  skillRecommendations?: SkillRecommendation[]
): ActionStep[] {
  const steps: ActionStep[] = [];
  
  // Prioritize goals if multiple exist
  const prioritizedGoals = prioritizeGoals(goals, profile);
  
  // Generate steps for each goal, distributing across timeframes
  for (const goal of prioritizedGoals) {
    const goalSteps = generateStepsForGoal(goal, profile, careerPath, skillRecommendations);
    steps.push(...goalSteps);
  }
  
  // Ensure balanced distribution across timeframes
  const balancedSteps = balanceTimeframes(steps, profile);
  
  return balancedSteps;
}

/**
 * Generates an acknowledgment message for completed action steps
 * @param completedSteps - Array of completed action steps
 * @param profile - The user profile
 * @returns Acknowledgment message
 */
export function generateProgressAcknowledgment(
  completedSteps: ActionStep[],
  profile: UserProfile
): string {
  if (completedSteps.length === 0) {
    return '';
  }
  
  const acknowledgments: string[] = [];
  
  // Overall progress acknowledgment
  if (completedSteps.length === 1) {
    acknowledgments.push(`Great work completing "${completedSteps[0].description}"!`);
  } else {
    acknowledgments.push(`Excellent progress! You've completed ${completedSteps.length} action steps.`);
  }
  
  // Category-specific acknowledgments
  const byCategory = groupByCategory(completedSteps);
  
  if (byCategory.learning && byCategory.learning.length > 0) {
    acknowledgments.push(`You're building valuable skills through your learning efforts.`);
  }
  
  if (byCategory.networking && byCategory.networking.length > 0) {
    acknowledgments.push(`Your networking activities are expanding your professional connections.`);
  }
  
  if (byCategory.application && byCategory.application.length > 0) {
    acknowledgments.push(`You're taking concrete steps toward your career goals.`);
  }
  
  if (byCategory.reflection && byCategory.reflection.length > 0) {
    acknowledgments.push(`Your reflection work is helping you gain clarity on your path.`);
  }
  
  // Momentum message
  const totalCompleted = profile.progress.completedActions.length + completedSteps.length;
  if (totalCompleted >= 10) {
    acknowledgments.push(`You've completed ${totalCompleted} total actions - you're building real momentum!`);
  } else if (totalCompleted >= 5) {
    acknowledgments.push(`You're building momentum with ${totalCompleted} completed actions.`);
  }
  
  return acknowledgments.join(' ');
}

/**
 * Prioritizes goals for users with multiple active goals
 * @param goals - Array of goals to prioritize
 * @param profile - The user profile for context
 * @returns Prioritized array of goals
 */
function prioritizeGoals(goals: Goal[], profile: UserProfile): Goal[] {
  if (goals.length <= 1) {
    return goals;
  }
  
  // Sort by explicit priority first, then by type (short-term before long-term)
  const sorted = [...goals].sort((a, b) => {
    // Higher priority number = higher priority
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    
    // Short-term goals before long-term
    if (a.type !== b.type) {
      return a.type === 'short_term' ? -1 : 1;
    }
    
    // Earlier target dates first
    if (a.targetDate && b.targetDate) {
      return a.targetDate.getTime() - b.targetDate.getTime();
    }
    
    return 0;
  });
  
  return sorted;
}

/**
 * Generates action steps for a specific goal
 */
function generateStepsForGoal(
  goal: Goal,
  profile: UserProfile,
  careerPath?: CareerPath,
  skillRecommendations?: SkillRecommendation[]
): ActionStep[] {
  const steps: ActionStep[] = [];
  
  // Determine appropriate categories based on goal and profile
  const categories = determineCategories(goal, profile);
  
  // Generate steps for each timeframe
  const todayStep = generateStepForTimeframe('today', goal, categories, profile, careerPath, skillRecommendations);
  if (todayStep) steps.push(todayStep);
  
  const weekStep = generateStepForTimeframe('this_week', goal, categories, profile, careerPath, skillRecommendations);
  if (weekStep) steps.push(weekStep);
  
  const monthStep = generateStepForTimeframe('this_month', goal, categories, profile, careerPath, skillRecommendations);
  if (monthStep) steps.push(monthStep);
  
  return steps;
}

/**
 * Generates a single action step for a specific timeframe
 */
function generateStepForTimeframe(
  timeframe: 'today' | 'this_week' | 'this_month',
  goal: Goal,
  categories: Array<'learning' | 'networking' | 'application' | 'reflection'>,
  profile: UserProfile,
  careerPath?: CareerPath,
  skillRecommendations?: SkillRecommendation[]
): ActionStep | null {
  // Select category based on timeframe and available categories
  const category = selectCategoryForTimeframe(timeframe, categories);
  
  // Generate description based on timeframe, category, and context
  const description = generateStepDescription(
    timeframe,
    category,
    goal,
    profile,
    careerPath,
    skillRecommendations
  );
  
  if (!description) {
    return null;
  }
  
  // Calculate due date
  const dueDate = calculateDueDate(timeframe);
  
  return {
    id: generateStepId(),
    description,
    timeframe,
    category,
    completed: false,
    dueDate,
  };
}

/**
 * Determines appropriate categories for a goal
 */
function determineCategories(
  goal: Goal,
  profile: UserProfile
): Array<'learning' | 'networking' | 'application' | 'reflection'> {
  const categories: Array<'learning' | 'networking' | 'application' | 'reflection'> = [];
  
  // Check for skill-related goals
  if (goal.description.toLowerCase().includes('learn') ||
      goal.description.toLowerCase().includes('skill') ||
      profile.careerInfo.struggles.some(s => s.type === 'skills')) {
    categories.push('learning');
  }
  
  // Check for networking needs
  if (goal.description.toLowerCase().includes('network') ||
      goal.description.toLowerCase().includes('connect') ||
      goal.description.toLowerCase().includes('mentor')) {
    categories.push('networking');
  }
  
  // Check for application/action needs
  if (goal.description.toLowerCase().includes('apply') ||
      goal.description.toLowerCase().includes('job') ||
      goal.description.toLowerCase().includes('project') ||
      goal.type === 'short_term') {
    categories.push('application');
  }
  
  // Check for reflection needs
  if (profile.careerInfo.struggles.some(s => s.type === 'direction' || s.type === 'confidence') ||
      goal.description.toLowerCase().includes('clarity') ||
      goal.description.toLowerCase().includes('explore')) {
    categories.push('reflection');
  }
  
  // Default to all categories if none matched
  if (categories.length === 0) {
    return ['learning', 'networking', 'application', 'reflection'];
  }
  
  return categories;
}

/**
 * Selects appropriate category for a timeframe
 */
function selectCategoryForTimeframe(
  timeframe: 'today' | 'this_week' | 'this_month',
  categories: Array<'learning' | 'networking' | 'application' | 'reflection'>
): 'learning' | 'networking' | 'application' | 'reflection' {
  // Today: prefer reflection or quick actions
  if (timeframe === 'today') {
    if (categories.includes('reflection')) return 'reflection';
    if (categories.includes('application')) return 'application';
  }
  
  // This week: prefer networking or application
  if (timeframe === 'this_week') {
    if (categories.includes('networking')) return 'networking';
    if (categories.includes('application')) return 'application';
  }
  
  // This month: prefer learning
  if (timeframe === 'this_month') {
    if (categories.includes('learning')) return 'learning';
  }
  
  // Fallback to first available category
  return categories[0];
}

/**
 * Generates step description based on context
 */
function generateStepDescription(
  timeframe: 'today' | 'this_week' | 'this_month',
  category: 'learning' | 'networking' | 'application' | 'reflection',
  goal: Goal,
  profile: UserProfile,
  careerPath?: CareerPath,
  skillRecommendations?: SkillRecommendation[]
): string {
  const templates = getStepTemplates();
  
  // Get templates for this category and timeframe
  const categoryTemplates = templates[category][timeframe];
  
  // Select template based on context
  let template = categoryTemplates[0]; // Default to first
  
  // Customize based on available context
  if (category === 'learning' && skillRecommendations && skillRecommendations.length > 0) {
    const topSkill = skillRecommendations[0].skill;
    if (timeframe === 'today') {
      return `Research learning resources for ${topSkill}`;
    } else if (timeframe === 'this_week') {
      return `Complete an introductory tutorial or course module on ${topSkill}`;
    } else {
      return `Dedicate 10 hours to learning ${topSkill} through structured practice`;
    }
  }
  
  if (category === 'networking' && careerPath) {
    if (timeframe === 'today') {
      return `Identify 3 professionals in ${careerPath.title} to connect with on LinkedIn`;
    } else if (timeframe === 'this_week') {
      return `Reach out to 2 people working in ${careerPath.title} for informational interviews`;
    } else {
      return `Attend a virtual or in-person event related to ${careerPath.title}`;
    }
  }
  
  if (category === 'application') {
    if (timeframe === 'today') {
      return `Update your resume to highlight relevant experience for ${goal.description}`;
    } else if (timeframe === 'this_week') {
      return `Apply to 3 opportunities aligned with ${goal.description}`;
    } else {
      return `Complete a portfolio project that demonstrates skills for ${goal.description}`;
    }
  }
  
  if (category === 'reflection') {
    if (timeframe === 'today') {
      return `Write down 3 specific outcomes you want from ${goal.description}`;
    } else if (timeframe === 'this_week') {
      return `Reflect on your strengths and how they align with ${goal.description}`;
    } else {
      return `Create a vision document outlining where you want to be in 6 months regarding ${goal.description}`;
    }
  }
  
  // Fallback to template
  return template.replace('{goal}', goal.description);
}

/**
 * Returns step templates organized by category and timeframe
 */
function getStepTemplates(): Record<
  'learning' | 'networking' | 'application' | 'reflection',
  Record<'today' | 'this_week' | 'this_month', string[]>
> {
  return {
    learning: {
      today: [
        'Identify one skill to focus on this week',
        'Research learning resources for your target skill',
        'Watch an introductory video on your chosen topic',
      ],
      this_week: [
        'Complete 2 hours of focused learning on your target skill',
        'Finish one tutorial or course module',
        'Practice your new skill with a small project',
      ],
      this_month: [
        'Complete a full online course or certification',
        'Build a project that demonstrates your new skill',
        'Dedicate 10+ hours to structured learning',
      ],
    },
    networking: {
      today: [
        'Identify 3 people to connect with on LinkedIn',
        'Update your LinkedIn profile with recent accomplishments',
        'Join an online community related to your field',
      ],
      this_week: [
        'Reach out to 2 professionals for informational interviews',
        'Engage meaningfully in 3 online discussions in your field',
        'Attend a virtual networking event or webinar',
      ],
      this_month: [
        'Conduct 3 informational interviews',
        'Attend an in-person industry event or meetup',
        'Build relationships with 5 new professional connections',
      ],
    },
    application: {
      today: [
        'Update your resume with recent accomplishments',
        'Research 5 companies aligned with your goals',
        'Draft a cover letter template',
      ],
      this_week: [
        'Apply to 3 relevant opportunities',
        'Customize your application materials for target roles',
        'Complete a take-home assignment or project',
      ],
      this_month: [
        'Apply to 10+ positions aligned with your goals',
        'Complete a portfolio project to showcase your skills',
        'Prepare for interviews by practicing common questions',
      ],
    },
    reflection: {
      today: [
        'Write down 3 specific career goals',
        'Identify your top 3 professional strengths',
        'List 3 things you want to learn or improve',
      ],
      this_week: [
        'Reflect on what energizes you in your work',
        'Identify patterns in roles or projects you\'ve enjoyed',
        'Write about where you want to be in 1 year',
      ],
      this_month: [
        'Create a detailed vision for your ideal career',
        'Assess your progress toward your goals',
        'Identify obstacles and create strategies to overcome them',
      ],
    },
  };
}

/**
 * Calculates due date based on timeframe
 */
function calculateDueDate(timeframe: 'today' | 'this_week' | 'this_month'): Date {
  const now = new Date();
  
  if (timeframe === 'today') {
    // End of today
    const dueDate = new Date(now);
    dueDate.setHours(23, 59, 59, 999);
    return dueDate;
  }
  
  if (timeframe === 'this_week') {
    // End of this week (Sunday)
    const dueDate = new Date(now);
    const daysUntilSunday = 7 - dueDate.getDay();
    dueDate.setDate(dueDate.getDate() + daysUntilSunday);
    dueDate.setHours(23, 59, 59, 999);
    return dueDate;
  }
  
  // this_month: End of this month
  const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  dueDate.setHours(23, 59, 59, 999);
  return dueDate;
}

/**
 * Generates a unique ID for an action step
 */
function generateStepId(): string {
  return `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Groups action steps by category
 */
function groupByCategory(steps: ActionStep[]): Record<string, ActionStep[]> {
  const grouped: Record<string, ActionStep[]> = {};
  
  for (const step of steps) {
    if (!grouped[step.category]) {
      grouped[step.category] = [];
    }
    grouped[step.category].push(step);
  }
  
  return grouped;
}

/**
 * Balances action steps across timeframes to prevent overwhelm
 * Ensures users with multiple goals don't get too many steps
 */
function balanceTimeframes(steps: ActionStep[], profile: UserProfile): ActionStep[] {
  // Count steps by timeframe
  const byTimeframe = {
    today: steps.filter(s => s.timeframe === 'today'),
    this_week: steps.filter(s => s.timeframe === 'this_week'),
    this_month: steps.filter(s => s.timeframe === 'this_month'),
  };
  
  // Limits based on number of active goals
  const activeGoals = profile.careerInfo.goals.length;
  const maxPerTimeframe = activeGoals > 2 ? 2 : 3;
  
  // Trim if over limits, keeping highest priority
  const balanced: ActionStep[] = [];
  
  // Keep up to maxPerTimeframe for each timeframe
  balanced.push(...byTimeframe.today.slice(0, maxPerTimeframe));
  balanced.push(...byTimeframe.this_week.slice(0, maxPerTimeframe));
  balanced.push(...byTimeframe.this_month.slice(0, maxPerTimeframe));
  
  return balanced;
}
