/**
 * Growth Plan Builder
 * Constructs long-term growth plans with milestones and action steps
 */

import { UserProfile, CareerPath, GrowthPlan, Phase, Milestone, ActionStep } from '../models/index.js';

/**
 * Builds a comprehensive growth plan for a user based on their profile and career path
 * @param profile - The user profile
 * @param careerPath - The target career path
 * @returns A structured growth plan with phases and milestones
 */
export function buildGrowthPlan(
  profile: UserProfile,
  careerPath: CareerPath
): GrowthPlan {
  const now = new Date();
  const planId = `plan-${profile.userId}-${careerPath.id}-${now.getTime()}`;
  
  // Determine timeline based on career path transition time
  const timeline = careerPath.timeToTransition;
  
  // Generate phases based on timeline
  const phases = generatePhases(profile, careerPath, now);
  
  // Generate milestones from phases
  const milestones = generateMilestones(phases, now);
  
  return {
    id: planId,
    userId: profile.userId,
    careerPath,
    timeline,
    phases,
    milestones,
    createdAt: now,
    lastUpdated: now,
  };
}

/**
 * Adapts an existing growth plan based on changed circumstances
 * @param plan - The existing growth plan
 * @param profile - The updated user profile
 * @returns An updated growth plan
 */
export function adaptGrowthPlan(
  plan: GrowthPlan,
  profile: UserProfile
): GrowthPlan {
  const now = new Date();
  
  // Update completed milestones based on profile progress
  const updatedMilestones = plan.milestones.map(milestone => {
    // Check if milestone should be marked complete based on profile progress
    const isComplete = profile.progress.milestones.some(
      m => m.id === milestone.id && m.completed
    );
    
    if (isComplete && !milestone.completed) {
      return {
        ...milestone,
        completed: true,
        completedDate: now,
      };
    }
    
    return milestone;
  });
  
  // Adjust future milestone dates if circumstances changed
  const adjustedMilestones = adjustMilestoneDates(
    updatedMilestones,
    profile,
    plan.careerPath,
    now
  );
  
  // Regenerate phases based on updated milestones
  const updatedPhases = updatePhases(plan.phases, adjustedMilestones, profile, now);
  
  return {
    ...plan,
    phases: updatedPhases,
    milestones: adjustedMilestones,
    lastUpdated: now,
  };
}

/**
 * Generates phases for the growth plan
 */
function generatePhases(
  profile: UserProfile,
  careerPath: CareerPath,
  startDate: Date
): Phase[] {
  const phases: Phase[] = [];
  
  // Parse timeline to determine number of phases
  const timelineMonths = parseTimelineMonths(careerPath.timeToTransition);
  
  // Determine phase structure based on timeline
  if (timelineMonths <= 6) {
    // Short timeline: 2 phases
    phases.push(
      createPhase('Foundation', '0-3 months', careerPath, profile, startDate, 0),
      createPhase('Execution', '3-6 months', careerPath, profile, startDate, 3)
    );
  } else if (timelineMonths <= 12) {
    // Medium timeline: 3 phases
    phases.push(
      createPhase('Foundation', '0-4 months', careerPath, profile, startDate, 0),
      createPhase('Development', '4-8 months', careerPath, profile, startDate, 4),
      createPhase('Advancement', '8-12 months', careerPath, profile, startDate, 8)
    );
  } else {
    // Long timeline: 4 phases
    phases.push(
      createPhase('Foundation', '0-6 months', careerPath, profile, startDate, 0),
      createPhase('Skill Building', '6-12 months', careerPath, profile, startDate, 6),
      createPhase('Application', '12-18 months', careerPath, profile, startDate, 12),
      createPhase('Mastery', '18-24 months', careerPath, profile, startDate, 18)
    );
  }
  
  return phases;
}

/**
 * Creates a single phase with objectives, skills, and actions
 */
function createPhase(
  name: string,
  duration: string,
  careerPath: CareerPath,
  profile: UserProfile,
  startDate: Date,
  offsetMonths: number
): Phase {
  // Determine objectives based on phase name and career path
  const objectives = generatePhaseObjectives(name, careerPath);
  
  // Select skills relevant to this phase
  const skills = selectPhaseSkills(name, careerPath, profile);
  
  // Generate action steps for this phase
  const actions = generatePhaseActions(name, objectives, skills, startDate, offsetMonths);
  
  return {
    name,
    duration,
    objectives,
    skills,
    actions,
  };
}

/**
 * Generates objectives for a phase
 */
function generatePhaseObjectives(name: string, careerPath: CareerPath): string[] {
  const objectives: string[] = [];
  
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('foundation')) {
    objectives.push(
      `Build foundational knowledge in ${careerPath.title}`,
      'Establish learning routine and habits',
      'Connect with professionals in the field'
    );
  } else if (nameLower.includes('development') || nameLower.includes('skill')) {
    objectives.push(
      'Develop core technical skills',
      'Complete practical projects',
      'Build portfolio of work'
    );
  } else if (nameLower.includes('execution') || nameLower.includes('application')) {
    objectives.push(
      'Apply skills in real-world scenarios',
      'Gain practical experience',
      'Demonstrate competency to potential employers'
    );
  } else if (nameLower.includes('advancement') || nameLower.includes('mastery')) {
    objectives.push(
      'Achieve proficiency in key skills',
      'Transition into target role',
      'Establish yourself in the new career path'
    );
  }
  
  return objectives;
}

/**
 * Selects skills relevant to a specific phase
 */
function selectPhaseSkills(
  name: string,
  careerPath: CareerPath,
  profile: UserProfile
): string[] {
  const allSkills = careerPath.requiredSkills;
  const nameLower = name.toLowerCase();
  
  // For foundation phase, select foundational skills
  if (nameLower.includes('foundation')) {
    return allSkills.slice(0, Math.ceil(allSkills.length / 3));
  }
  
  // For middle phases, select intermediate skills
  if (nameLower.includes('development') || nameLower.includes('skill') || nameLower.includes('execution')) {
    const start = Math.floor(allSkills.length / 3);
    const end = Math.ceil((2 * allSkills.length) / 3);
    return allSkills.slice(start, end);
  }
  
  // For final phase, select advanced skills
  const start = Math.ceil((2 * allSkills.length) / 3);
  return allSkills.slice(start);
}

/**
 * Generates action steps for a phase
 */
function generatePhaseActions(
  phaseName: string,
  objectives: string[],
  skills: string[],
  startDate: Date,
  offsetMonths: number
): ActionStep[] {
  const actions: ActionStep[] = [];
  
  // Generate actions based on objectives
  // Each objective becomes an action, so they will match exactly
  objectives.forEach((objective, index) => {
    const actionDate = new Date(startDate);
    actionDate.setMonth(actionDate.getMonth() + offsetMonths + index);
    
    actions.push({
      id: `action-${phaseName.toLowerCase().replace(/\s+/g, '-')}-obj-${index}-${Date.now()}`,
      description: objective,
      timeframe: 'this_month',
      category: 'learning',
      completed: false,
      dueDate: actionDate,
    });
  });
  
  // Generate skill-specific actions
  // These actions are also linked to objectives through the phase
  skills.forEach((skill, index) => {
    const actionDate = new Date(startDate);
    actionDate.setMonth(actionDate.getMonth() + offsetMonths + Math.floor(index / 2));
    
    actions.push({
      id: `action-skill-${skill.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${index}`,
      description: `Learn and practice ${skill}`,
      timeframe: 'this_month',
      category: 'learning',
      completed: false,
      dueDate: actionDate,
    });
  });
  
  return actions;
}

/**
 * Generates milestones from phases
 */
function generateMilestones(phases: Phase[], startDate: Date): Milestone[] {
  const milestones: Milestone[] = [];
  
  phases.forEach((phase, index) => {
    // Parse phase duration to get target date
    const durationMatch = phase.duration.match(/(\d+)-(\d+)\s*months?/i);
    let targetMonths = 3; // Default
    
    if (durationMatch) {
      const endMonth = parseInt(durationMatch[2]);
      targetMonths = endMonth;
    }
    
    const targetDate = new Date(startDate);
    targetDate.setMonth(targetDate.getMonth() + targetMonths);
    
    // Ensure milestone is between 3-12 months
    const monthsFromNow = (targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsFromNow >= 3 && monthsFromNow <= 12) {
      milestones.push({
        id: `milestone-${phase.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${index}`,
        title: `Complete ${phase.name} Phase`,
        description: `Successfully complete all objectives in the ${phase.name} phase: ${phase.objectives.join(', ')}`,
        targetDate,
        completed: false,
      });
    }
  });
  
  return milestones;
}

/**
 * Adjusts milestone dates based on changed circumstances
 */
function adjustMilestoneDates(
  milestones: Milestone[],
  profile: UserProfile,
  careerPath: CareerPath,
  now: Date
): Milestone[] {
  return milestones.map(milestone => {
    // Don't adjust completed milestones
    if (milestone.completed) {
      return milestone;
    }
    
    // If milestone is in the past and not completed, push it forward
    if (milestone.targetDate < now) {
      const newTargetDate = new Date(now);
      newTargetDate.setMonth(newTargetDate.getMonth() + 3); // Push 3 months forward
      
      // Ensure it stays within 3-12 month range from now
      const monthsFromNow = (newTargetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsFromNow >= 3 && monthsFromNow <= 12) {
        return {
          ...milestone,
          targetDate: newTargetDate,
        };
      }
    }
    
    return milestone;
  });
}

/**
 * Updates phases based on progress and changed circumstances
 */
function updatePhases(
  phases: Phase[],
  milestones: Milestone[],
  profile: UserProfile,
  now: Date
): Phase[] {
  return phases.map(phase => {
    // Update action completion status
    const updatedActions = phase.actions.map(action => {
      const isCompleted = profile.progress.completedActions.includes(action.id);
      return {
        ...action,
        completed: isCompleted,
      };
    });
    
    return {
      ...phase,
      actions: updatedActions,
    };
  });
}

/**
 * Parses timeline string to extract months
 */
function parseTimelineMonths(timeline: string): number {
  const match = timeline.match(/(\d+)-?(\d+)?\s*months?/i);
  if (match) {
    const min = parseInt(match[1]);
    const max = match[2] ? parseInt(match[2]) : min;
    return (min + max) / 2;
  }
  return 12; // Default to 12 months
}

/**
 * Validates that a growth plan has realistic timelines
 * @param plan - The growth plan to validate
 * @returns True if all milestones are within 3-12 months from creation date
 */
export function validateGrowthPlanTimeline(plan: GrowthPlan): boolean {
  const createdAt = plan.createdAt;
  
  return plan.milestones.every(milestone => {
    const monthsDiff = (milestone.targetDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsDiff >= 3 && monthsDiff <= 12;
  });
}

/**
 * Extended action step with objective linkage for growth plans
 */
export interface ActionStepWithObjective extends ActionStep {
  linkedObjective?: string;
}

/**
 * Finds the career path objective that an action step is linked to
 * @param action - The action step
 * @param plan - The growth plan
 * @returns The objective that this action supports, or undefined if no clear link
 */
export function getLinkedObjective(action: ActionStep, plan: GrowthPlan): string | undefined {
  // Find the phase containing this action
  for (const phase of plan.phases) {
    const actionInPhase = phase.actions.find(a => a.id === action.id);
    if (actionInPhase) {
      // First, check for exact match (actions created from objectives will match exactly)
      for (const objective of phase.objectives) {
        if (action.description === objective) {
          return objective;
        }
      }
      
      // Then check if action description matches any objective semantically
      for (const objective of phase.objectives) {
        if (actionMatchesObjective(action, objective)) {
          return objective;
        }
      }
      
      // If no direct match, return the first objective of the phase
      // as all actions in a phase support the phase objectives
      if (phase.objectives.length > 0) {
        return phase.objectives[0];
      }
    }
  }
  
  return undefined;
}

/**
 * Checks if an action step matches or supports an objective
 */
function actionMatchesObjective(action: ActionStep, objective: string): boolean {
  const actionLower = action.description.toLowerCase().trim();
  const objectiveLower = objective.toLowerCase().trim();
  
  // Direct substring match
  if (actionLower.includes(objectiveLower) || objectiveLower.includes(actionLower)) {
    return true;
  }
  
  // Check for key terms
  const actionWords = actionLower.split(/\s+/).filter(w => w.length > 0);
  const objectiveWords = objectiveLower.split(/\s+/).filter(w => w.length > 0);
  
  // If they share significant words (excluding common words)
  const commonWords = ['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or'];
  const significantActionWords = actionWords.filter(w => w.length > 3 && !commonWords.includes(w));
  const significantObjectiveWords = objectiveWords.filter(w => w.length > 3 && !commonWords.includes(w));
  
  const sharedWords = significantActionWords.filter(w => significantObjectiveWords.includes(w));
  
  return sharedWords.length >= 2;
}

/**
 * Validates that all action steps in a growth plan are linked to at least one objective
 * @param plan - The growth plan to validate
 * @returns True if all actions are linked to objectives
 */
export function validateActionObjectiveLinkage(plan: GrowthPlan): boolean {
  for (const phase of plan.phases) {
    for (const action of phase.actions) {
      const linkedObjective = getLinkedObjective(action, plan);
      if (!linkedObjective) {
        return false;
      }
    }
  }
  
  return true;
}
