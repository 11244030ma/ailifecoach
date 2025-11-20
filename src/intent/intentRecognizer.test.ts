/**
 * Property-based tests for Intent Recognition System
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { recognizeIntent, detectEmotionalContent, shouldPrioritizeMindset } from './intentRecognizer.js';
import { Intent } from '../models/index.js';

// Arbitraries for generating test data

/**
 * Generates messages with emotional content
 */
const emotionalKeywordsArb = fc.constantFrom(
  'anxious', 'stressed', 'overwhelmed', 'confused', 'scared', 'frustrated',
  'depressed', 'stuck', 'doubt', 'lack confidence', 'worried', 'nervous',
  'afraid', 'hopeless', 'uncertain', 'failing'
);

/**
 * Generates neutral/tactical keywords
 */
const tacticalKeywordsArb = fc.constantFrom(
  'learn', 'skill', 'career path', 'next step', 'training', 'course',
  'plan', 'goal', 'transition', 'background', 'experience'
);

/**
 * Generates a message with emotional content
 */
const emotionalMessageArb = fc.tuple(
  emotionalKeywordsArb,
  fc.array(fc.lorem({ maxCount: 10 }), { minLength: 1, maxLength: 5 }),
  fc.option(tacticalKeywordsArb, { nil: null })
).map(([emotional, words, tactical]) => {
  const parts = [...words, emotional];
  if (tactical) {
    parts.push(tactical);
  }
  return parts.join(' ');
});

/**
 * Generates a message without emotional content
 */
const neutralMessageArb = fc.tuple(
  tacticalKeywordsArb,
  fc.array(fc.lorem({ maxCount: 10 }), { minLength: 1, maxLength: 5 })
).map(([tactical, words]) => {
  return [...words, tactical].join(' ');
});

/**
 * Generates a message that may or may not have emotional content
 */
const messageArb = fc.oneof(emotionalMessageArb, neutralMessageArb);

describe('Intent Recognition System - Property Tests', () => {
  // Feature: worklife-ai-coach, Property 13: Mindset-first response ordering
  // Validates: Requirements 5.2
  describe('Property 13: Mindset-first response ordering', () => {
    it('should prioritize mindset when emotional content is detected', () => {
      fc.assert(
        fc.property(
          emotionalMessageArb,
          (message: string) => {
            const intent = recognizeIntent(message);
            
            // Verify that emotional content is detected
            const emotional = detectEmotionalContent(message);
            
            // If emotional content is present with high severity, mindset should be prioritized
            if (emotional.hasEmotionalContent && emotional.severity >= 0.5) {
              const shouldPrioritize = shouldPrioritizeMindset(intent);
              expect(shouldPrioritize).toBe(true);
              
              // Emotional content should be captured in entities
              expect(intent.entities.emotional).toBeDefined();
              expect(intent.entities.emotional.hasEmotionalContent).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not prioritize mindset for neutral messages', () => {
      fc.assert(
        fc.property(
          neutralMessageArb,
          (message: string) => {
            const intent = recognizeIntent(message);
            const emotional = detectEmotionalContent(message);
            
            // If no emotional content, mindset should not be prioritized
            if (!emotional.hasEmotionalContent) {
              const shouldPrioritize = shouldPrioritizeMindset(intent);
              expect(shouldPrioritize).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect emotional indicators in messages', () => {
      fc.assert(
        fc.property(
          emotionalKeywordsArb,
          fc.array(fc.lorem({ maxCount: 10 }), { minLength: 0, maxLength: 5 }),
          (emotionalKeyword: string, words: string[]) => {
            const message = [...words, emotionalKeyword].join(' ');
            const emotional = detectEmotionalContent(message);
            
            // Should detect emotional content
            expect(emotional.hasEmotionalContent).toBe(true);
            expect(emotional.emotionalIndicators.length).toBeGreaterThan(0);
            expect(emotional.severity).toBeGreaterThan(0);
            expect(emotional.severity).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Intent Classification', () => {
    it('should classify all messages into valid intent types', () => {
      fc.assert(
        fc.property(
          messageArb,
          (message: string) => {
            const intent = recognizeIntent(message);
            
            // Should have a valid intent type
            const validTypes: Intent['type'][] = [
              'profile_building', 'career_clarity', 'skill_guidance',
              'action_planning', 'mindset_support', 'growth_planning',
              'transition_guidance', 'progress_check'
            ];
            expect(validTypes).toContain(intent.type);
            
            // Should have confidence between 0 and 1
            expect(intent.confidence).toBeGreaterThanOrEqual(0);
            expect(intent.confidence).toBeLessThanOrEqual(1);
            
            // Should have entities object
            expect(typeof intent.entities).toBe('object');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should extract entities from messages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'I want to learn python and javascript',
            'I have 5 years of experience in software engineering',
            'I need help this week with my career path',
            'I want to transition to data science'
          ),
          (message: string) => {
            const intent = recognizeIntent(message);
            
            // Should extract relevant entities
            expect(typeof intent.entities).toBe('object');
            
            // Verify specific extractions based on message content
            if (message.includes('python') || message.includes('javascript')) {
              expect(intent.entities.skills).toBeDefined();
              expect(Array.isArray(intent.entities.skills)).toBe(true);
            }
            
            if (message.includes('years of experience')) {
              expect(intent.entities.yearsOfExperience).toBeDefined();
              expect(typeof intent.entities.yearsOfExperience).toBe('number');
            }
            
            if (message.includes('this week')) {
              expect(intent.entities.timeframe).toBeDefined();
            }
            
            if (message.includes('software engineering') || message.includes('data science')) {
              expect(intent.entities.careerFields).toBeDefined();
              expect(Array.isArray(intent.entities.careerFields)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
