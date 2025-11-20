/**
 * Intent Recognition System
 * Categorizes user messages and detects emotional content
 */

import { Intent } from '../models/index.js';

/**
 * Emotional content indicators
 */
interface EmotionalContent {
  hasEmotionalContent: boolean;
  emotionalIndicators: string[];
  severity: number; // 0-1, how strong the emotional content is
}

/**
 * Recognizes the intent of a user message
 * @param message - User's message text
 * @returns Intent with type, confidence, and extracted entities
 */
export function recognizeIntent(message: string): Intent {
  const messageLower = message.toLowerCase();
  
  // Detect emotional content first
  const emotional = detectEmotionalContent(message);
  
  // Classify intent type
  const intentType = classifyIntentType(messageLower);
  
  // Calculate confidence based on keyword matches
  const confidence = calculateConfidence(messageLower, intentType);
  
  // Extract entities
  const entities = extractEntities(message, intentType);
  
  // Add emotional content to entities if present
  if (emotional.hasEmotionalContent) {
    entities.emotional = emotional;
  }
  
  return {
    type: intentType,
    confidence,
    entities,
  };
}

/**
 * Detects emotional content in user message
 * @param message - User's message text
 * @returns Emotional content analysis
 */
export function detectEmotionalContent(message: string): EmotionalContent {
  const messageLower = message.toLowerCase();
  
  // Emotional keywords and phrases
  const emotionalIndicators: { pattern: RegExp; indicator: string; weight: number }[] = [
    // Negative emotions
    { pattern: /\b(anxious|anxiety|worried|worry|nervous)\b/gi, indicator: 'anxiety', weight: 0.8 },
    { pattern: /\b(stressed|stress|overwhelmed|overwhelm)\b/gi, indicator: 'stress', weight: 0.9 },
    { pattern: /\b(confused|confusing|lost|don't know|unsure)\b/gi, indicator: 'confusion', weight: 0.7 },
    { pattern: /\b(scared|afraid|fear|terrified)\b/gi, indicator: 'fear', weight: 0.8 },
    { pattern: /\b(frustrated|frustrating|frustration)\b/gi, indicator: 'frustration', weight: 0.7 },
    { pattern: /\b(depressed|depression|sad|hopeless)\b/gi, indicator: 'sadness', weight: 0.9 },
    { pattern: /\b(stuck|trapped|can't move forward)\b/gi, indicator: 'stagnation', weight: 0.7 },
    { pattern: /\b(doubt|doubting|uncertain|unsure)\b/gi, indicator: 'doubt', weight: 0.6 },
    { pattern: /\b(lack confidence|no confidence|not confident)\b/gi, indicator: 'low confidence', weight: 0.8 },
    { pattern: /\b(failing|failure|failed)\b/gi, indicator: 'failure', weight: 0.7 },
    
    // Positive emotions (lower weight for mindset-first ordering)
    { pattern: /\b(excited|exciting|enthusiastic)\b/gi, indicator: 'excitement', weight: 0.3 },
    { pattern: /\b(motivated|motivation|inspired)\b/gi, indicator: 'motivation', weight: 0.3 },
    { pattern: /\b(hopeful|optimistic|positive)\b/gi, indicator: 'hope', weight: 0.3 },
  ];
  
  const foundIndicators: string[] = [];
  let totalWeight = 0;
  
  for (const { pattern, indicator, weight } of emotionalIndicators) {
    const matches = message.match(pattern);
    if (matches) {
      foundIndicators.push(indicator);
      totalWeight += weight * matches.length;
    }
  }
  
  // Check for emotional punctuation (multiple exclamation/question marks)
  if (/[!?]{2,}/.test(message)) {
    totalWeight += 0.2;
  }
  
  // Normalize severity to 0-1 range
  const severity = Math.min(totalWeight / 2, 1);
  
  return {
    hasEmotionalContent: foundIndicators.length > 0,
    emotionalIndicators: foundIndicators,
    severity,
  };
}

/**
 * Classifies the intent type based on message content
 */
function classifyIntentType(messageLower: string): Intent['type'] {
  // Define intent patterns with keywords
  const intentPatterns: { type: Intent['type']; keywords: string[]; phrases: RegExp[] }[] = [
    {
      type: 'profile_building',
      keywords: ['background', 'experience', 'education', 'skills', 'current role', 'about me', 'my story'],
      phrases: [/i (am|work|studied|have|graduated)/i, /my (background|experience|education|skills)/i],
    },
    {
      type: 'career_clarity',
      keywords: ['career path', 'direction', 'what should i do', 'career options', 'confused', 'lost', 'unclear'],
      phrases: [/what (career|path|direction)/i, /should i (become|pursue|go into)/i, /don't know what/i],
    },
    {
      type: 'skill_guidance',
      keywords: ['learn', 'skill', 'training', 'course', 'what to learn', 'improve', 'develop'],
      phrases: [/what (skill|should i learn)/i, /how (do i|can i) learn/i, /need to (learn|improve)/i],
    },
    {
      type: 'action_planning',
      keywords: ['next step', 'what should i do', 'action', 'plan', 'today', 'this week', 'start'],
      phrases: [/what (should|can) i do/i, /next step/i, /how do i (start|begin)/i, /where do i start/i],
    },
    {
      type: 'mindset_support',
      keywords: ['confidence', 'motivation', 'doubt', 'fear', 'anxious', 'stressed', 'overwhelmed', 'stuck'],
      phrases: [/feel (anxious|stressed|overwhelmed|stuck|lost)/i, /lack (confidence|motivation)/i, /not confident/i],
    },
    {
      type: 'growth_planning',
      keywords: ['growth plan', 'long term', 'future', 'roadmap', 'milestone', 'goal', 'plan'],
      phrases: [/long[- ]term (plan|goal)/i, /growth plan/i, /where (will|should) i be/i, /in \d+ (months|years)/i],
    },
    {
      type: 'transition_guidance',
      keywords: ['career change', 'switch', 'transition', 'move to', 'change field', 'new career'],
      phrases: [/(change|switch|transition) (career|field|to)/i, /move (to|into)/i, /from .* to/i],
    },
    {
      type: 'progress_check',
      keywords: ['progress', 'update', 'completed', 'finished', 'done', 'accomplished'],
      phrases: [/i (completed|finished|did|accomplished)/i, /made progress/i, /update on/i],
    },
  ];
  
  // Score each intent type
  const scores: Record<Intent['type'], number> = {
    profile_building: 0,
    career_clarity: 0,
    skill_guidance: 0,
    action_planning: 0,
    mindset_support: 0,
    growth_planning: 0,
    transition_guidance: 0,
    progress_check: 0,
  };
  
  for (const { type, keywords, phrases } of intentPatterns) {
    // Check keywords
    for (const keyword of keywords) {
      if (messageLower.includes(keyword)) {
        scores[type] += 1;
      }
    }
    
    // Check phrases (higher weight)
    for (const phrase of phrases) {
      if (phrase.test(messageLower)) {
        scores[type] += 2;
      }
    }
  }
  
  // Find highest scoring intent
  let maxScore = 0;
  let bestIntent: Intent['type'] = 'profile_building'; // default
  
  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestIntent = type as Intent['type'];
    }
  }
  
  // If no clear intent, default based on message characteristics
  if (maxScore === 0) {
    if (messageLower.includes('?')) {
      bestIntent = 'career_clarity';
    } else {
      bestIntent = 'profile_building';
    }
  }
  
  return bestIntent;
}

/**
 * Calculates confidence score for the classified intent
 */
function calculateConfidence(messageLower: string, intentType: Intent['type']): number {
  // Base confidence
  let confidence = 0.5;
  
  // Increase confidence based on message length (more context = higher confidence)
  const wordCount = messageLower.split(/\s+/).length;
  if (wordCount > 20) {
    confidence += 0.2;
  } else if (wordCount > 10) {
    confidence += 0.1;
  }
  
  // Increase confidence if message contains specific keywords for the intent
  const intentKeywords: Record<Intent['type'], string[]> = {
    profile_building: ['background', 'experience', 'education'],
    career_clarity: ['career', 'path', 'direction'],
    skill_guidance: ['learn', 'skill', 'training'],
    action_planning: ['next', 'step', 'action'],
    mindset_support: ['feel', 'confidence', 'motivation'],
    growth_planning: ['plan', 'goal', 'future'],
    transition_guidance: ['change', 'transition', 'switch'],
    progress_check: ['progress', 'completed', 'done'],
  };
  
  const keywords = intentKeywords[intentType] || [];
  const matchCount = keywords.filter(k => messageLower.includes(k)).length;
  confidence += matchCount * 0.1;
  
  // Cap at 1.0
  return Math.min(confidence, 1.0);
}

/**
 * Extracts relevant entities from the message
 */
function extractEntities(message: string, intentType: Intent['type']): Record<string, any> {
  const entities: Record<string, any> = {};
  
  // Extract career fields
  const careerFields = [
    'software engineering', 'data science', 'product management', 'ux design',
    'digital marketing', 'business analysis', 'project management', 'finance',
    'healthcare', 'education', 'sales', 'consulting', 'engineering'
  ];
  
  const messageLower = message.toLowerCase();
  const foundFields: string[] = [];
  
  for (const field of careerFields) {
    if (messageLower.includes(field)) {
      foundFields.push(field);
    }
  }
  
  if (foundFields.length > 0) {
    entities.careerFields = foundFields;
  }
  
  // Extract skills mentioned
  const skills = [
    'python', 'javascript', 'java', 'sql', 'react', 'node',
    'communication', 'leadership', 'project management', 'data analysis',
    'design', 'marketing', 'sales', 'writing'
  ];
  
  const foundSkills: string[] = [];
  
  for (const skill of skills) {
    if (messageLower.includes(skill)) {
      foundSkills.push(skill);
    }
  }
  
  if (foundSkills.length > 0) {
    entities.skills = foundSkills;
  }
  
  // Extract time references
  const timePatterns = [
    { pattern: /\b(today|now|immediately)\b/i, value: 'today' },
    { pattern: /\bthis week\b/i, value: 'this_week' },
    { pattern: /\bthis month\b/i, value: 'this_month' },
    { pattern: /\b(\d+)\s*(month|year)s?\b/i, value: 'long_term' },
  ];
  
  for (const { pattern, value } of timePatterns) {
    const match = message.match(pattern);
    if (match) {
      entities.timeframe = value;
      if (match[1] && !isNaN(parseInt(match[1]))) {
        entities.duration = parseInt(match[1]);
        entities.durationUnit = match[2];
      }
      break;
    }
  }
  
  // Extract years of experience
  const expMatch = message.match(/(\d+)\s*years?\s*(of\s*)?(experience|exp)/i);
  if (expMatch) {
    entities.yearsOfExperience = parseInt(expMatch[1]);
  }
  
  return entities;
}

/**
 * Determines if mindset support should be prioritized in response
 * @param intent - Recognized intent
 * @returns True if mindset should be addressed first
 */
export function shouldPrioritizeMindset(intent: Intent): boolean {
  // If intent is explicitly mindset support
  if (intent.type === 'mindset_support') {
    return true;
  }
  
  // If emotional content is detected with high severity
  if (intent.entities.emotional) {
    const emotional = intent.entities.emotional as EmotionalContent;
    return emotional.hasEmotionalContent && emotional.severity >= 0.5;
  }
  
  return false;
}
