/**
 * Input validation utilities for WorkLife AI Coach
 * Validates: Requirements 1.5
 */

import { UserProfile, Goal, Challenge, Skill, ActionStep } from '../models/core.js';

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates user profile input data
 */
export function validateUserProfile(profile: Partial<UserProfile>): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate userId
  if (!profile.userId || typeof profile.userId !== 'string' || profile.userId.trim() === '') {
    errors.push(new ValidationError('User ID is required and must be a non-empty string', 'userId', profile.userId));
  }

  // Validate personal info
  if (profile.personalInfo) {
    const { age, yearsOfExperience, education } = profile.personalInfo;

    // Age validation
    if (age !== undefined) {
      if (typeof age !== 'number' || age < 0 || age > 120) {
        errors.push(new ValidationError('Age must be a number between 0 and 120', 'personalInfo.age', age));
      }
    }

    // Years of experience validation
    if (yearsOfExperience !== undefined) {
      if (typeof yearsOfExperience !== 'number' || yearsOfExperience < 0 || yearsOfExperience > 60) {
        errors.push(new ValidationError('Years of experience must be a number between 0 and 60', 'personalInfo.yearsOfExperience', yearsOfExperience));
      }
    }

    // Education validation
    if (education !== undefined && (typeof education !== 'string' || education.trim() === '')) {
      errors.push(new ValidationError('Education must be a non-empty string', 'personalInfo.education', education));
    }
  }

  // Validate mindset scores
  if (profile.mindset) {
    const { confidenceLevel, motivationLevel } = profile.mindset;

    if (confidenceLevel !== undefined && (typeof confidenceLevel !== 'number' || confidenceLevel < 0 || confidenceLevel > 1)) {
      errors.push(new ValidationError('Confidence level must be a number between 0 and 1', 'mindset.confidenceLevel', confidenceLevel));
    }

    if (motivationLevel !== undefined && (typeof motivationLevel !== 'number' || motivationLevel < 0 || motivationLevel > 1)) {
      errors.push(new ValidationError('Motivation level must be a number between 0 and 1', 'mindset.motivationLevel', motivationLevel));
    }
  }

  return errors;
}

/**
 * Validates goal data
 */
export function validateGoal(goal: Partial<Goal>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!goal.id || typeof goal.id !== 'string' || goal.id.trim() === '') {
    errors.push(new ValidationError('Goal ID is required and must be a non-empty string', 'id', goal.id));
  }

  if (!goal.description || typeof goal.description !== 'string' || goal.description.trim() === '') {
    errors.push(new ValidationError('Goal description is required and must be a non-empty string', 'description', goal.description));
  }

  if (goal.type && !['short_term', 'long_term'].includes(goal.type)) {
    errors.push(new ValidationError('Goal type must be either "short_term" or "long_term"', 'type', goal.type));
  }

  if (goal.priority !== undefined && (typeof goal.priority !== 'number' || goal.priority < 0)) {
    errors.push(new ValidationError('Goal priority must be a non-negative number', 'priority', goal.priority));
  }

  if (goal.targetDate !== undefined && !(goal.targetDate instanceof Date) && isNaN(Date.parse(goal.targetDate as any))) {
    errors.push(new ValidationError('Goal target date must be a valid date', 'targetDate', goal.targetDate));
  }

  return errors;
}

/**
 * Validates challenge data
 */
export function validateChallenge(challenge: Partial<Challenge>): ValidationError[] {
  const errors: ValidationError[] = [];

  const validTypes = ['direction', 'skills', 'confidence', 'overwhelm', 'transition', 'stagnation'];
  if (challenge.type && !validTypes.includes(challenge.type)) {
    errors.push(new ValidationError(`Challenge type must be one of: ${validTypes.join(', ')}`, 'type', challenge.type));
  }

  if (!challenge.description || typeof challenge.description !== 'string' || challenge.description.trim() === '') {
    errors.push(new ValidationError('Challenge description is required and must be a non-empty string', 'description', challenge.description));
  }

  if (challenge.severity !== undefined && (typeof challenge.severity !== 'number' || challenge.severity < 0 || challenge.severity > 10)) {
    errors.push(new ValidationError('Challenge severity must be a number between 0 and 10', 'severity', challenge.severity));
  }

  return errors;
}

/**
 * Validates skill data
 */
export function validateSkill(skill: Partial<Skill>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!skill.name || typeof skill.name !== 'string' || skill.name.trim() === '') {
    errors.push(new ValidationError('Skill name is required and must be a non-empty string', 'name', skill.name));
  }

  if (skill.level !== undefined && (typeof skill.level !== 'number' || skill.level < 0 || skill.level > 10)) {
    errors.push(new ValidationError('Skill level must be a number between 0 and 10', 'level', skill.level));
  }

  if (!skill.category || typeof skill.category !== 'string' || skill.category.trim() === '') {
    errors.push(new ValidationError('Skill category is required and must be a non-empty string', 'category', skill.category));
  }

  return errors;
}

/**
 * Validates action step data
 */
export function validateActionStep(actionStep: Partial<ActionStep>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!actionStep.id || typeof actionStep.id !== 'string' || actionStep.id.trim() === '') {
    errors.push(new ValidationError('Action step ID is required and must be a non-empty string', 'id', actionStep.id));
  }

  if (!actionStep.description || typeof actionStep.description !== 'string' || actionStep.description.trim() === '') {
    errors.push(new ValidationError('Action step description is required and must be a non-empty string', 'description', actionStep.description));
  }

  const validTimeframes = ['today', 'this_week', 'this_month'];
  if (actionStep.timeframe && !validTimeframes.includes(actionStep.timeframe)) {
    errors.push(new ValidationError(`Action step timeframe must be one of: ${validTimeframes.join(', ')}`, 'timeframe', actionStep.timeframe));
  }

  const validCategories = ['learning', 'networking', 'application', 'reflection'];
  if (actionStep.category && !validCategories.includes(actionStep.category)) {
    errors.push(new ValidationError(`Action step category must be one of: ${validCategories.join(', ')}`, 'category', actionStep.category));
  }

  if (actionStep.completed !== undefined && typeof actionStep.completed !== 'boolean') {
    errors.push(new ValidationError('Action step completed must be a boolean', 'completed', actionStep.completed));
  }

  return errors;
}

/**
 * Checks if a profile has all required fields
 */
export function checkRequiredFields(profile: Partial<UserProfile>): string[] {
  const missingFields: string[] = [];

  if (!profile.userId) {
    missingFields.push('userId');
  }

  if (!profile.personalInfo) {
    missingFields.push('personalInfo');
  } else {
    if (profile.personalInfo.age === undefined) {
      missingFields.push('personalInfo.age');
    }
    if (profile.personalInfo.yearsOfExperience === undefined) {
      missingFields.push('personalInfo.yearsOfExperience');
    }
    if (!profile.personalInfo.education) {
      missingFields.push('personalInfo.education');
    }
  }

  return missingFields;
}
