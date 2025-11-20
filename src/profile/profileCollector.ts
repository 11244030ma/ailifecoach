/**
 * Profile data collection functionality
 */

import { UserProfile, Goal, Challenge, Skill, Milestone } from '../models/index.js';

export interface ProfileInput {
  userId: string;
  age: number;
  currentRole?: string;
  yearsOfExperience: number;
  education: string;
  industry?: string;
}

/**
 * Collects and validates profile data from user input during first coaching session
 * Validates: Requirements 1.1
 */
export function collectProfileData(input: ProfileInput): UserProfile {
  return {
    userId: input.userId,
    personalInfo: {
      age: input.age,
      currentRole: input.currentRole,
      yearsOfExperience: input.yearsOfExperience,
      education: input.education,
      industry: input.industry,
    },
    careerInfo: {
      goals: [],
      interests: [],
      struggles: [],
    },
    skills: {
      current: [],
      learning: [],
      target: [],
    },
    mindset: {
      confidenceLevel: 0,
      motivationLevel: 0,
      primaryConcerns: [],
    },
    progress: {
      completedActions: [],
      milestones: [],
      lastUpdated: new Date(),
    },
  };
}

/**
 * Checks if a user profile has all required fields populated
 */
export function hasRequiredFields(profile: UserProfile): boolean {
  return !!(
    profile.personalInfo.age &&
    profile.personalInfo.yearsOfExperience !== undefined &&
    profile.personalInfo.education
  );
}
