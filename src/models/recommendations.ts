/**
 * Recommendation models for WorkLife AI Coach
 */

import { ActionStep, Milestone, Skill } from './core.js';

export interface CareerPath {
  id: string;
  title: string;
  description: string;
  reasoning: string;
  fitScore: number;
  requiredSkills: string[];
  timeToTransition: string;
  growthPotential: number;
}

export interface SkillRecommendation {
  skill: string;
  priority: number;
  reasoning: string;
  learningResources: string[];
  estimatedTime: string;
  dependencies: string[];
}

export interface GrowthPlan {
  id: string;
  userId: string;
  careerPath: CareerPath;
  timeline: string;
  phases: Phase[];
  milestones: Milestone[];
  createdAt: Date;
  lastUpdated: Date;
}

export interface Phase {
  name: string;
  duration: string;
  objectives: string[];
  skills: string[];
  actions: ActionStep[];
}

export interface TransitionPlan {
  sourceField: string;
  targetField: string;
  transferableSkills: string[];
  skillsToAcquire: SkillRecommendation[];
  phases: TransitionPhase[];
  estimatedDuration: string;
  difficultyLevel: 'easy' | 'moderate' | 'challenging';
  risks: string[];
  successFactors: string[];
}

export interface TransitionPhase {
  name: string;
  duration: string;
  focus: string;
  actions: ActionStep[];
  successCriteria: string[];
}
