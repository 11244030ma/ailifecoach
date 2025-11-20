/**
 * Tests for validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  validateUserProfile,
  validateGoal,
  validateChallenge,
  validateSkill,
  validateActionStep,
  checkRequiredFields,
} from './validation.js';
import { UserProfile, Goal, Challenge, Skill, ActionStep } from '../models/core.js';

describe('validateUserProfile', () => {
  it('should return no errors for valid profile', () => {
    const profile: Partial<UserProfile> = {
      userId: 'user123',
      personalInfo: {
        age: 28,
        yearsOfExperience: 5,
        education: 'Bachelor of Science',
      },
      mindset: {
        confidenceLevel: 0.7,
        motivationLevel: 0.8,
        primaryConcerns: [],
      },
    };

    const errors = validateUserProfile(profile);
    expect(errors).toHaveLength(0);
  });

  it('should return error for missing userId', () => {
    const profile: Partial<UserProfile> = {
      userId: '',
    };

    const errors = validateUserProfile(profile);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].field).toBe('userId');
  });

  it('should return error for invalid age', () => {
    const profile: Partial<UserProfile> = {
      userId: 'user123',
      personalInfo: {
        age: 150,
        yearsOfExperience: 5,
        education: 'Bachelor',
      },
    };

    const errors = validateUserProfile(profile);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.field === 'personalInfo.age')).toBe(true);
  });

  it('should return error for negative years of experience', () => {
    const profile: Partial<UserProfile> = {
      userId: 'user123',
      personalInfo: {
        age: 28,
        yearsOfExperience: -1,
        education: 'Bachelor',
      },
    };

    const errors = validateUserProfile(profile);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.field === 'personalInfo.yearsOfExperience')).toBe(true);
  });

  it('should return error for invalid confidence level', () => {
    const profile: Partial<UserProfile> = {
      userId: 'user123',
      mindset: {
        confidenceLevel: 1.5,
        motivationLevel: 0.5,
        primaryConcerns: [],
      },
    };

    const errors = validateUserProfile(profile);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.field === 'mindset.confidenceLevel')).toBe(true);
  });
});

describe('validateGoal', () => {
  it('should return no errors for valid goal', () => {
    const goal: Partial<Goal> = {
      id: 'goal1',
      description: 'Learn Python',
      type: 'short_term',
      priority: 1,
    };

    const errors = validateGoal(goal);
    expect(errors).toHaveLength(0);
  });

  it('should return error for missing description', () => {
    const goal: Partial<Goal> = {
      id: 'goal1',
      description: '',
      type: 'short_term',
    };

    const errors = validateGoal(goal);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.field === 'description')).toBe(true);
  });

  it('should return error for invalid goal type', () => {
    const goal: any = {
      id: 'goal1',
      description: 'Learn Python',
      type: 'invalid_type',
    };

    const errors = validateGoal(goal);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.field === 'type')).toBe(true);
  });
});

describe('validateChallenge', () => {
  it('should return no errors for valid challenge', () => {
    const challenge: Partial<Challenge> = {
      type: 'direction',
      description: 'Feeling lost in career',
      severity: 7,
    };

    const errors = validateChallenge(challenge);
    expect(errors).toHaveLength(0);
  });

  it('should return error for invalid challenge type', () => {
    const challenge: any = {
      type: 'invalid_type',
      description: 'Some challenge',
      severity: 5,
    };

    const errors = validateChallenge(challenge);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.field === 'type')).toBe(true);
  });

  it('should return error for severity out of range', () => {
    const challenge: Partial<Challenge> = {
      type: 'confidence',
      description: 'Low confidence',
      severity: 15,
    };

    const errors = validateChallenge(challenge);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.field === 'severity')).toBe(true);
  });
});

describe('validateSkill', () => {
  it('should return no errors for valid skill', () => {
    const skill: Partial<Skill> = {
      name: 'Python',
      level: 7,
      category: 'programming',
    };

    const errors = validateSkill(skill);
    expect(errors).toHaveLength(0);
  });

  it('should return error for missing skill name', () => {
    const skill: Partial<Skill> = {
      name: '',
      level: 5,
      category: 'programming',
    };

    const errors = validateSkill(skill);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.field === 'name')).toBe(true);
  });

  it('should return error for skill level out of range', () => {
    const skill: Partial<Skill> = {
      name: 'Python',
      level: 15,
      category: 'programming',
    };

    const errors = validateSkill(skill);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.field === 'level')).toBe(true);
  });
});

describe('validateActionStep', () => {
  it('should return no errors for valid action step', () => {
    const actionStep: Partial<ActionStep> = {
      id: 'action1',
      description: 'Complete Python tutorial',
      timeframe: 'this_week',
      category: 'learning',
      completed: false,
    };

    const errors = validateActionStep(actionStep);
    expect(errors).toHaveLength(0);
  });

  it('should return error for invalid timeframe', () => {
    const actionStep: any = {
      id: 'action1',
      description: 'Complete tutorial',
      timeframe: 'invalid_timeframe',
      category: 'learning',
    };

    const errors = validateActionStep(actionStep);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.field === 'timeframe')).toBe(true);
  });

  it('should return error for invalid category', () => {
    const actionStep: any = {
      id: 'action1',
      description: 'Complete tutorial',
      timeframe: 'today',
      category: 'invalid_category',
    };

    const errors = validateActionStep(actionStep);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.field === 'category')).toBe(true);
  });
});

describe('checkRequiredFields', () => {
  it('should return empty array for complete profile', () => {
    const profile: Partial<UserProfile> = {
      userId: 'user123',
      personalInfo: {
        age: 28,
        yearsOfExperience: 5,
        education: 'Bachelor of Science',
      },
    };

    const missing = checkRequiredFields(profile);
    expect(missing).toHaveLength(0);
  });

  it('should identify missing userId', () => {
    const profile: Partial<UserProfile> = {
      personalInfo: {
        age: 28,
        yearsOfExperience: 5,
        education: 'Bachelor',
      },
    };

    const missing = checkRequiredFields(profile);
    expect(missing).toContain('userId');
  });

  it('should identify missing age', () => {
    const profile: Partial<UserProfile> = {
      userId: 'user123',
      personalInfo: {
        yearsOfExperience: 5,
        education: 'Bachelor',
      } as any,
    };

    const missing = checkRequiredFields(profile);
    expect(missing).toContain('personalInfo.age');
  });

  it('should identify missing education', () => {
    const profile: Partial<UserProfile> = {
      userId: 'user123',
      personalInfo: {
        age: 28,
        yearsOfExperience: 5,
        education: '',
      },
    };

    const missing = checkRequiredFields(profile);
    expect(missing).toContain('personalInfo.education');
  });
});
