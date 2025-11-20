/**
 * Demo of WorkLife AI Coach Behavior Integration
 * Shows how the coach personality and response patterns work
 */

import { CoachBehavior } from '../src/conversation/coachBehavior.js';

// Initialize the coach behavior
const coach = new CoachBehavior();

console.log('=== WorkLife AI Coach Behavior Demo ===\n');

// 1. Welcome Message
console.log('1. WELCOME MESSAGE:');
console.log(coach.getWelcomeMessage());
console.log('\n---\n');

// 2. First-Time Greeting
console.log('2. FIRST-TIME USER GREETING:');
console.log(coach.getFirstTimeGreeting());
console.log('\n---\n');

// 3. Starter Questions
console.log('3. STARTER QUESTIONS:');
const starterQuestions = coach.getStarterQuestions();
starterQuestions.slice(0, 5).forEach((q, i) => {
  console.log(`${i + 1}. ${q}`);
});
console.log('\n---\n');

// 4. Emotional Struggle Detection
console.log('4. EMOTIONAL STRUGGLE DETECTION:');
const emotionalMessages = [
  "I'm scared to make a career change",
  "I feel stuck in my current job",
  "I don't think I'm good enough for senior roles"
];

emotionalMessages.forEach(msg => {
  const hasStruggle = coach.detectEmotionalStruggle(msg);
  console.log(`Message: "${msg}"`);
  console.log(`Has emotional struggle: ${hasStruggle}`);
  if (hasStruggle) {
    console.log(`Mindset response: ${coach.generateMindsetResponse(msg)}`);
  }
  console.log();
});
console.log('---\n');

// 5. Acknowledgment Generation
console.log('5. ACKNOWLEDGMENT EXAMPLES:');
const userMessages = [
  "I feel stuck in my career",
  "I'm confused about what to do next",
  "I'm overwhelmed with too many options"
];

userMessages.forEach(msg => {
  const ack = coach.generateAcknowledgment(msg);
  console.log(`User: "${msg}"`);
  console.log(`Coach: ${ack}`);
  console.log();
});
console.log('---\n');

// 6. Follow-up Questions
console.log('6. FOLLOW-UP QUESTIONS BY INTENT:');
const intents = [
  'career_clarity',
  'skill_guidance',
  'action_planning',
  'transition_guidance',
  'mindset_support'
];

intents.forEach(intent => {
  const question = coach.generateFollowUpQuestion(intent, null, 1);
  console.log(`Intent: ${intent}`);
  console.log(`Question: ${question}`);
  console.log();
});
console.log('---\n');

// 7. Structured Response Example
console.log('7. STRUCTURED RESPONSE EXAMPLE:');
const structuredResponse = coach.structureResponse(
  "I hear you—feeling stuck after 3 years in the same role is frustrating.",
  [
    "Here's what I'd suggest:",
    "Talk to your manager about growth opportunities",
    "Start exploring roles one level up at other companies",
    "Connect with 2-3 people in roles you're interested in"
  ],
  [
    { timeframe: 'today', action: 'Update your LinkedIn profile' },
    { timeframe: 'this week', action: 'Have a conversation with your manager' },
    { timeframe: 'this month', action: 'Apply to 5-10 roles that interest you' }
  ],
  "What feels like the biggest blocker to making a move—clarity on what you want, or confidence that you're ready?"
);

console.log(structuredResponse.content);
console.log('\n' + structuredResponse.followUpQuestion);
console.log('\n---\n');

// 8. Validation Examples
console.log('8. RESPONSE VALIDATION:');

const testResponses = [
  "Just follow your passion and believe in yourself!",
  "Here's what you should do this week: update your resume and apply to 3 jobs.",
  "I understand how you feel."
];

testResponses.forEach(response => {
  const avoidsGeneric = coach.avoidGenericAdvice(response);
  const hasActionable = coach.hasActionableElement(response);
  
  console.log(`Response: "${response}"`);
  console.log(`Avoids generic advice: ${avoidsGeneric}`);
  console.log(`Has actionable element: ${hasActionable}`);
  console.log();
});

console.log('=== Demo Complete ===');
