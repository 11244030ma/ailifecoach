/**
 * Core data models for WorkLife AI Coach
 */

export interface UserProfile {
  userId: string;
  personalInfo: {
    age: number;
    currentRole?: string;
    yearsOfExperience: number;
    education: string;
    industry?: string;
  };
  careerInfo: {
    currentPath?: CareerPath;
    goals: Goal[];
    interests: string[];
    struggles: Challenge[];
  };
  skills: {
    current: Skill[];
    learning: Skill[];
    target: Skill[];
  };
  mindset: {
    confidenceLevel: number;
    motivationLevel: number;
    primaryConcerns: string[];
  };
  progress: {
    completedActions: string[];
    milestones: Milestone[];
    lastUpdated: Date;
  };
}

export interface Goal {
  id: string;
  description: string;
  type: 'short_term' | 'long_term';
  priority: number;
  targetDate?: Date;
}

export interface Challenge {
  type: 'direction' | 'skills' | 'confidence' | 'overwhelm' | 'transition' | 'stagnation';
  description: string;
  severity: number;
}

export interface Skill {
  name: string;
  level: number;
  category: string;
}

export interface Session {
  id: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  context: SessionContext;
}

export interface SessionContext {
  conversationHistory: Message[];
  currentIntent: Intent;
  activeTopics: string[];
  pendingActions: ActionStep[];
}

export interface Message {
  id: string;
  sender: 'user' | 'system';
  content: string;
  timestamp: Date;
}

export interface Intent {
  type: 'profile_building' | 'career_clarity' | 'skill_guidance' | 
        'action_planning' | 'mindset_support' | 'growth_planning' | 
        'transition_guidance' | 'progress_check';
  confidence: number;
  entities: Record<string, any>;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completed: boolean;
  completedDate?: Date;
}

export interface ActionStep {
  id: string;
  description: string;
  timeframe: 'today' | 'this_week' | 'this_month';
  category: 'learning' | 'networking' | 'application' | 'reflection';
  completed: boolean;
  dueDate?: Date;
}
