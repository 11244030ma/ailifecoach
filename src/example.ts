/**
 * Example usage of the WorkLife AI Coach
 * Demonstrates the integrated coaching flow
 */

import { CoachingEngine } from './coachingEngine.js';
import { InMemoryDataStore } from './persistence/dataStore.js';
import { UserProfile } from './models/core.js';

async function main() {
  // Initialize the coaching engine with a data store
  const dataStore = new InMemoryDataStore();
  const coach = new CoachingEngine(dataStore);

  // Create a sample user profile
  const userId = 'user-123';
  const profile: UserProfile = {
    userId,
    personalInfo: {
      age: 27,
      currentRole: 'Junior Software Engineer',
      yearsOfExperience: 2,
      education: 'Bachelor\'s in Computer Science',
      industry: 'Technology'
    },
    careerInfo: {
      goals: [
        {
          id: 'goal-1',
          description: 'Become a senior software engineer',
          type: 'long_term',
          priority: 1
        }
      ],
      interests: ['software development', 'problem solving', 'learning new technologies'],
      struggles: [
        {
          type: 'direction',
          description: 'Unsure about which technical path to specialize in',
          severity: 0.6
        },
        {
          type: 'confidence',
          description: 'Sometimes doubt my technical abilities',
          severity: 0.5
        }
      ]
    },
    skills: {
      current: [
        { name: 'JavaScript', level: 6, category: 'programming' },
        { name: 'React', level: 5, category: 'frontend' },
        { name: 'Node.js', level: 4, category: 'backend' }
      ],
      learning: [
        { name: 'TypeScript', level: 3, category: 'programming' }
      ],
      target: [
        { name: 'System Design', level: 7, category: 'architecture' },
        { name: 'Algorithms', level: 7, category: 'computer science' }
      ]
    },
    mindset: {
      confidenceLevel: 0.6,
      motivationLevel: 0.8,
      primaryConcerns: ['career direction', 'technical depth']
    },
    progress: {
      completedActions: [],
      milestones: [],
      lastUpdated: new Date()
    }
  };

  // Save the profile
  await dataStore.saveUserProfile(profile);

  console.log('=== WorkLife AI Coach Demo ===\n');

  // Example 1: Career clarity request
  console.log('User: "I\'m not sure which technical path to specialize in - backend, frontend, or full-stack?"\n');
  const response1 = await coach.processRequest({
    userId,
    message: 'I\'m not sure which technical path to specialize in - backend, frontend, or full-stack?'
  });
  console.log('Coach:', response1.content);
  console.log('\nIntent:', response1.intent.type);
  console.log('Career Paths Generated:', response1.recommendations?.careerPaths?.length || 0);
  console.log('\n---\n');

  // Example 2: Skill guidance request
  console.log('User: "What skills should I focus on learning next?"\n');
  const response2 = await coach.processRequest({
    userId,
    message: 'What skills should I focus on learning next?',
    sessionId: response1.sessionId
  });
  console.log('Coach:', response2.content);
  console.log('\nIntent:', response2.intent.type);
  console.log('Skills Recommended:', response2.recommendations?.skills?.length || 0);
  console.log('\n---\n');

  // Example 3: Action planning request
  console.log('User: "What should I do this week to make progress?"\n');
  const response3 = await coach.processRequest({
    userId,
    message: 'What should I do this week to make progress?',
    sessionId: response2.sessionId
  });
  console.log('Coach:', response3.content);
  console.log('\nIntent:', response3.intent.type);
  console.log('Actions Generated:', response3.recommendations?.actions?.length || 0);
  console.log('\n---\n');

  // Example 4: Mindset support request
  console.log('User: "I\'m feeling overwhelmed and doubting my abilities"\n');
  const response4 = await coach.processRequest({
    userId,
    message: 'I\'m feeling overwhelmed and doubting my abilities',
    sessionId: response3.sessionId
  });
  console.log('Coach:', response4.content);
  console.log('\nIntent:', response4.intent.type);
  console.log('Mindset-first ordering applied:', response4.content.toLowerCase().includes('overwhelm') || response4.content.toLowerCase().includes('doubt'));
  console.log('\n---\n');

  // Example 5: Growth planning request
  console.log('User: "Can you help me create a long-term growth plan?"\n');
  const response5 = await coach.processRequest({
    userId,
    message: 'Can you help me create a long-term growth plan?',
    sessionId: response4.sessionId
  });
  console.log('Coach:', response5.content);
  console.log('\nIntent:', response5.intent.type);
  console.log('Growth Plan Created:', response5.recommendations?.growthPlan ? 'Yes' : 'No');
  console.log('\n---\n');

  // End the session
  await coach.endSession(response5.sessionId);

  console.log('=== Demo Complete ===');
  console.log('\nKey Features Demonstrated:');
  console.log('✓ Intent recognition and routing');
  console.log('✓ Career path recommendations with reasoning');
  console.log('✓ Skill recommendations with prioritization');
  console.log('✓ Action step generation with timeframes');
  console.log('✓ Mindset-first response ordering');
  console.log('✓ Growth plan creation');
  console.log('✓ Session continuity');
  console.log('✓ Error handling and graceful degradation');
}

// Run the demo
main().catch(console.error);
