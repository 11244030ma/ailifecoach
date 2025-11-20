/**
 * End-to-End Integration Tests for WorkLife AI Coach
 * Tests complete user flows from onboarding through various coaching scenarios
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDataStore } from './persistence/dataStore.js';
import { collectProfileData } from './profile/profileCollector.js';
import { ProfileAnalyzer } from './profile/profileAnalyzer.js';
import { generateCareerPaths, identifyTradeOffs } from './recommendations/careerPathEngine.js';
import { recommendSkills, getHighestImpactSkill } from './recommendations/skillRecommender.js';
import { generateActionSteps, generateProgressAcknowledgment } from './recommendations/actionStepGenerator.js';
import { buildGrowthPlan, adaptGrowthPlan, getLinkedObjective } from './recommendations/growthPlanBuilder.js';
import { generateTransitionPlan } from './recommendations/transitionAdvisor.js';
import { UserProfile, Goal, Challenge, Skill, ActionStep } from './models/index.js';

describe('End-to-End Integration Tests', () => {
  let dataStore: InMemoryDataStore;
  let profileAnalyzer: ProfileAnalyzer;

  beforeEach(() => {
    dataStore = new InMemoryDataStore();
    profileAnalyzer = new ProfileAnalyzer();
  });

  /**
   * Test 1: Complete onboarding flow from first message to career path selection
   * Requirements: All requirements
   */
  it('should complete full onboarding flow from profile creation to career path selection', async () => {
    // Step 1: User initiates first session and provides background
    const userId = 'user-onboarding-test';
    const profile = collectProfileData({
      userId,
      age: 26,
      currentRole: 'Junior Developer',
      yearsOfExperience: 2,
      education: 'Bachelor in Computer Science',
      industry: 'Technology',
    });

    // Step 2: User shares goals and interests
    profile.careerInfo.goals.push({
      id: 'goal-1',
      description: 'Become a senior software engineer',
      type: 'long_term',
      priority: 1,
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    });
    profile.careerInfo.interests.push('backend development', 'system design', 'cloud architecture');

    // Step 3: User describes struggles
    const struggleDescription = 'I feel lost about what to learn next and lack direction';
    const challengeType = profileAnalyzer.categorizeChallenge(struggleDescription);
    profile.careerInfo.struggles.push({
      type: challengeType,
      description: struggleDescription,
      severity: 7,
    });

    // Step 4: Add current skills
    profile.skills.current.push(
      { name: 'JavaScript', level: 6, category: 'programming' },
      { name: 'Python', level: 4, category: 'programming' },
      { name: 'Git', level: 5, category: 'tools' }
    );

    // Step 5: Set mindset data
    profile.mindset.confidenceLevel = 0.6;
    profile.mindset.motivationLevel = 0.8;
    profile.mindset.primaryConcerns.push('skill gaps', 'career direction');

    // Step 6: Save profile to data store
    await dataStore.saveUserProfile(profile);

    // Step 7: Analyze profile
    const analysis = profileAnalyzer.analyzeProfile(profile);
    expect(analysis).toBeDefined();
    expect(analysis.careerStage).toBe('early');
    expect(analysis.primaryChallenges).toHaveLength(1);
    expect(analysis.primaryChallenges[0].type).toBe('direction');

    // Step 8: Generate career path recommendations
    const careerPaths = generateCareerPaths(profile);
    expect(careerPaths.length).toBeGreaterThan(0);
    expect(careerPaths[0]).toHaveProperty('reasoning');
    expect(careerPaths[0].reasoning).toBeTruthy();

    // Step 9: Add trade-offs if multiple paths
    const pathsWithTradeOffs = identifyTradeOffs(careerPaths);
    expect(pathsWithTradeOffs.length).toBe(careerPaths.length);
    if (pathsWithTradeOffs.length > 1) {
      expect(pathsWithTradeOffs[0].reasoning).toContain('Trade-offs:');
    }

    // Step 10: User selects a career path
    const selectedPath = pathsWithTradeOffs[0];
    profile.careerInfo.currentPath = selectedPath;
    await dataStore.saveUserProfile(profile);

    // Step 11: Verify profile was persisted correctly
    const retrievedProfile = await dataStore.getUserProfile(userId);
    expect(retrievedProfile).toBeDefined();
    expect(retrievedProfile?.careerInfo.currentPath?.id).toBe(selectedPath.id);
    expect(retrievedProfile?.careerInfo.goals).toHaveLength(1);
    expect(retrievedProfile?.careerInfo.interests).toHaveLength(3);
  });

  /**
   * Test 2: Multi-turn conversation with context preservation
   * Requirements: 9.1, 9.2, 9.4
   */
  it('should preserve context across multiple conversation turns', async () => {
    const userId = 'user-multiturn-test';
    const sessionId = 'session-1';

    // Turn 1: Initial profile creation
    const profile = collectProfileData({
      userId,
      age: 28,
      currentRole: 'Marketing Coordinator',
      yearsOfExperience: 3,
      education: 'Bachelor in Marketing',
      industry: 'Marketing',
    });

    profile.careerInfo.goals.push({
      id: 'goal-1',
      description: 'Transition to digital marketing specialist',
      type: 'short_term',
      priority: 1,
    });

    await dataStore.saveUserProfile(profile);
    dataStore.associateSessionWithUser(sessionId, userId);

    // Turn 1: Save conversation
    const turn1Messages = [
      {
        id: 'msg-1',
        sender: 'user' as const,
        content: 'I want to transition to digital marketing',
        timestamp: new Date(),
      },
      {
        id: 'msg-2',
        sender: 'system' as const,
        content: 'Great! Let me help you with that transition.',
        timestamp: new Date(),
      },
    ];
    await dataStore.saveConversation(sessionId, turn1Messages);

    // Turn 2: Generate career paths and save conversation
    const careerPaths = generateCareerPaths(profile);
    const turn2Messages = [
      ...turn1Messages,
      {
        id: 'msg-3',
        sender: 'system' as const,
        content: `I recommend the ${careerPaths[0].title} path`,
        timestamp: new Date(),
      },
    ];
    await dataStore.saveConversation(sessionId, turn2Messages);

    // Turn 3: User completes an action and returns
    profile.careerInfo.currentPath = careerPaths[0];
    await dataStore.saveUserProfile(profile); // Save the updated profile with career path
    
    const actionSteps = generateActionSteps(profile, profile.careerInfo.goals);
    const completedAction = actionSteps[0];
    completedAction.completed = true;

    await dataStore.trackActionCompletion(userId, completedAction.id);

    // Turn 4: Retrieve conversation history
    const history = await dataStore.getConversationHistory(userId);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].content).toContain('transition to digital marketing');

    // Turn 5: Retrieve updated profile
    const updatedProfile = await dataStore.getUserProfile(userId);
    expect(updatedProfile?.progress.completedActions).toContain(completedAction.id);
    expect(updatedProfile?.careerInfo.currentPath?.id).toBe(careerPaths[0].id);

    // Turn 6: Generate acknowledgment for progress
    const acknowledgment = generateProgressAcknowledgment([completedAction], updatedProfile!);
    expect(acknowledgment).toBeTruthy();
    expect(acknowledgment).toContain('Great work');
  });

  /**
   * Test 3: Skill recommendation and action step generation flow
   * Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3
   */
  it('should generate skill recommendations and action steps based on career path', async () => {
    const userId = 'user-skill-action-test';

    // Create profile with career path
    const profile = collectProfileData({
      userId,
      age: 25,
      currentRole: 'Junior Analyst',
      yearsOfExperience: 1,
      education: 'Bachelor in Business',
      industry: 'Business',
    });

    profile.careerInfo.goals.push({
      id: 'goal-1',
      description: 'Become a data scientist',
      type: 'long_term',
      priority: 1,
    });

    profile.careerInfo.interests.push('data analysis', 'machine learning', 'statistics');
    profile.skills.current.push(
      { name: 'Excel', level: 7, category: 'tools' },
      { name: 'SQL', level: 5, category: 'programming' }
    );

    profile.skills.target.push(
      { name: 'Python', level: 7, category: 'programming' },
      { name: 'Machine Learning', level: 7, category: 'technical' },
      { name: 'Statistics', level: 7, category: 'technical' }
    );

    profile.mindset.confidenceLevel = 0.5;
    profile.mindset.motivationLevel = 0.9;

    await dataStore.saveUserProfile(profile);

    // Generate career paths
    const careerPaths = generateCareerPaths(profile);
    const dataSciencePath = careerPaths.find(p => p.title.toLowerCase().includes('data'));
    expect(dataSciencePath).toBeDefined();

    profile.careerInfo.currentPath = dataSciencePath;

    // Generate skill recommendations
    const skillRecommendations = recommendSkills(profile, dataSciencePath!);
    expect(skillRecommendations.length).toBeGreaterThan(0);

    // Verify each recommendation has reasoning
    skillRecommendations.forEach(rec => {
      expect(rec.reasoning).toBeTruthy();
      expect(rec.reasoning.length).toBeGreaterThan(0);
    });

    // Verify skill dependencies are ordered correctly
    const skillNames = skillRecommendations.map(r => r.skill.toLowerCase());
    skillRecommendations.forEach(rec => {
      if (rec.dependencies.length > 0) {
        rec.dependencies.forEach(dep => {
          const depIndex = skillNames.findIndex(s => 
            s === dep.toLowerCase() || s.includes(dep.toLowerCase()) || dep.toLowerCase().includes(s)
          );
          const recIndex = skillNames.indexOf(rec.skill.toLowerCase());
          // If dependency is in the list, it should come before the skill
          if (depIndex !== -1) {
            expect(depIndex).toBeLessThan(recIndex);
          }
        });
      }
    });

    // Get highest impact skill
    const highestImpact = getHighestImpactSkill(profile, dataSciencePath!);
    expect(highestImpact).toBeDefined();
    expect(highestImpact?.priority).toBeGreaterThan(0);

    // Generate action steps
    const actionSteps = generateActionSteps(
      profile,
      profile.careerInfo.goals,
      dataSciencePath,
      skillRecommendations
    );

    expect(actionSteps.length).toBeGreaterThan(0);

    // Verify action steps have valid timeframes
    actionSteps.forEach(step => {
      expect(['today', 'this_week', 'this_month']).toContain(step.timeframe);
      expect(step.description).toBeTruthy();
      expect(step.dueDate).toBeDefined();
    });

    // Verify timeframe distribution
    const todaySteps = actionSteps.filter(s => s.timeframe === 'today');
    const weekSteps = actionSteps.filter(s => s.timeframe === 'this_week');
    const monthSteps = actionSteps.filter(s => s.timeframe === 'this_month');

    expect(todaySteps.length + weekSteps.length + monthSteps.length).toBe(actionSteps.length);

    // Complete some actions and verify acknowledgment
    const completedSteps = actionSteps.slice(0, 2);
    completedSteps.forEach(step => {
      step.completed = true;
    });

    for (const step of completedSteps) {
      await dataStore.trackActionCompletion(userId, step.id);
    }

    const acknowledgment = generateProgressAcknowledgment(completedSteps, profile);
    expect(acknowledgment).toBeTruthy();
    expect(acknowledgment.toLowerCase()).toMatch(/great|excellent|progress/);
  });

  /**
   * Test 4: Growth plan creation and progress tracking
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
   */
  it('should create growth plan and track progress over time', async () => {
    const userId = 'user-growth-plan-test';

    // Create profile
    const profile = collectProfileData({
      userId,
      age: 27,
      currentRole: 'Software Developer',
      yearsOfExperience: 3,
      education: 'Bachelor in Computer Science',
      industry: 'Technology',
    });

    profile.careerInfo.goals.push({
      id: 'goal-1',
      description: 'Become a senior engineer with system design expertise',
      type: 'long_term',
      priority: 1,
    });

    profile.careerInfo.interests.push('system design', 'architecture', 'scalability');
    profile.skills.current.push(
      { name: 'JavaScript', level: 7, category: 'programming' },
      { name: 'Python', level: 6, category: 'programming' },
      { name: 'Algorithms', level: 5, category: 'technical' }
    );

    profile.mindset.confidenceLevel = 0.7;
    profile.mindset.motivationLevel = 0.8;

    await dataStore.saveUserProfile(profile);

    // Generate career path
    const careerPaths = generateCareerPaths(profile);
    const selectedPath = careerPaths[0];
    profile.careerInfo.currentPath = selectedPath;

    // Build growth plan
    const growthPlan = buildGrowthPlan(profile, selectedPath);

    // Verify growth plan structure
    expect(growthPlan.id).toBeTruthy();
    expect(growthPlan.userId).toBe(userId);
    expect(growthPlan.careerPath.id).toBe(selectedPath.id);
    expect(growthPlan.phases.length).toBeGreaterThan(0);
    expect(growthPlan.milestones.length).toBeGreaterThan(0);

    // Verify milestones are within 3-12 month range
    const now = new Date();
    growthPlan.milestones.forEach(milestone => {
      const monthsDiff = (milestone.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
      expect(monthsDiff).toBeGreaterThanOrEqual(3);
      expect(monthsDiff).toBeLessThanOrEqual(12);
    });

    // Verify action-to-objective linkage
    growthPlan.phases.forEach(phase => {
      phase.actions.forEach(action => {
        const linkedObjective = getLinkedObjective(action, growthPlan);
        expect(linkedObjective).toBeDefined();
        expect(linkedObjective).toBeTruthy();
      });
    });

    // Simulate progress: complete some actions
    const firstPhase = growthPlan.phases[0];
    const actionsToComplete = firstPhase.actions.slice(0, 2);

    for (const action of actionsToComplete) {
      await dataStore.trackActionCompletion(userId, action.id);
      profile.progress.completedActions.push(action.id);
    }

    // Complete a milestone
    const firstMilestone = growthPlan.milestones[0];
    firstMilestone.completed = true;
    firstMilestone.completedDate = new Date();
    profile.progress.milestones.push(firstMilestone);

    profile.progress.lastUpdated = new Date();
    await dataStore.saveUserProfile(profile);

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Adapt growth plan based on progress
    const updatedProfile = await dataStore.getUserProfile(userId);
    const adaptedPlan = adaptGrowthPlan(growthPlan, updatedProfile!);

    // Verify adapted plan reflects progress
    expect(adaptedPlan.lastUpdated.getTime()).toBeGreaterThanOrEqual(growthPlan.createdAt.getTime());
    const completedMilestone = adaptedPlan.milestones.find(m => m.id === firstMilestone.id);
    expect(completedMilestone?.completed).toBe(true);
    expect(completedMilestone?.completedDate).toBeDefined();

    // Track progress over time
    const timeframe = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
    };

    const progressReport = profileAnalyzer.trackProgress(updatedProfile!, timeframe);
    expect(progressReport.userId).toBe(userId);
    expect(progressReport.completedActions).toBeGreaterThanOrEqual(actionsToComplete.length);
  });

  /**
   * Test 5: Career transition guidance flow
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
   */
  it('should provide comprehensive career transition guidance', async () => {
    const userId = 'user-transition-test';

    // Create profile for someone wanting to transition
    const profile = collectProfileData({
      userId,
      age: 29,
      currentRole: 'Marketing Manager',
      yearsOfExperience: 5,
      education: 'Bachelor in Marketing',
      industry: 'Marketing',
    });

    profile.careerInfo.goals.push({
      id: 'goal-1',
      description: 'Transition from marketing to product management',
      type: 'long_term',
      priority: 1,
    });

    profile.careerInfo.interests.push('product strategy', 'user experience', 'technology');

    // Add struggle indicating transition need
    const transitionStruggle = 'I want to switch to a different field and change career';
    const challengeType = profileAnalyzer.categorizeChallenge(transitionStruggle);
    expect(challengeType).toBe('transition');

    profile.careerInfo.struggles.push({
      type: challengeType,
      description: transitionStruggle,
      severity: 8,
    });

    // Add current skills from marketing
    profile.skills.current.push(
      { name: 'Communication', level: 8, category: 'soft skills' },
      { name: 'Analytics', level: 6, category: 'technical' },
      { name: 'Stakeholder Management', level: 7, category: 'soft skills' },
      { name: 'Content Marketing', level: 8, category: 'marketing' }
    );

    profile.mindset.confidenceLevel = 0.6;
    profile.mindset.motivationLevel = 0.9;

    await dataStore.saveUserProfile(profile);

    // Generate transition plan
    const sourceField = 'Digital Marketing';
    const targetField = 'Product Management';
    const transitionPlan = generateTransitionPlan(sourceField, targetField, profile);

    // Verify transition plan is field-specific
    expect(transitionPlan.sourceField).toBe(sourceField);
    expect(transitionPlan.targetField).toBe(targetField);

    // Verify transferable skills are identified
    expect(transitionPlan.transferableSkills.length).toBeGreaterThan(0);
    const hasTransferableSkill = transitionPlan.transferableSkills.some(skill =>
      ['communication', 'analytics', 'stakeholder management'].some(s =>
        skill.toLowerCase().includes(s)
      )
    );
    expect(hasTransferableSkill).toBe(true);

    // Verify skills to acquire are identified
    expect(transitionPlan.skillsToAcquire.length).toBeGreaterThan(0);
    transitionPlan.skillsToAcquire.forEach(skill => {
      expect(skill.reasoning).toBeTruthy();
      expect(skill.estimatedTime).toBeTruthy();
    });

    // Verify difficulty assessment
    expect(['easy', 'moderate', 'challenging']).toContain(transitionPlan.difficultyLevel);

    // Verify timeline-difficulty correlation
    const durationMonths = parseInt(transitionPlan.estimatedDuration.split('-')[0]);
    if (transitionPlan.difficultyLevel === 'challenging') {
      expect(durationMonths).toBeGreaterThanOrEqual(12);
    } else if (transitionPlan.difficultyLevel === 'moderate') {
      expect(durationMonths).toBeGreaterThanOrEqual(6);
    }

    // Verify complex transitions have multiple phases
    if (transitionPlan.difficultyLevel === 'challenging') {
      expect(transitionPlan.phases.length).toBeGreaterThanOrEqual(3);
    }

    // Verify each phase has required components
    transitionPlan.phases.forEach(phase => {
      expect(phase.name).toBeTruthy();
      expect(phase.duration).toBeTruthy();
      expect(phase.focus).toBeTruthy();
      expect(phase.actions.length).toBeGreaterThan(0);
      expect(phase.successCriteria.length).toBeGreaterThan(0);
    });

    // Verify risks and success factors are provided
    expect(transitionPlan.risks.length).toBeGreaterThan(0);
    expect(transitionPlan.successFactors.length).toBeGreaterThan(0);

    // Simulate executing transition plan
    const firstPhase = transitionPlan.phases[0];
    const phaseActions = firstPhase.actions;

    // Complete first phase actions
    for (const action of phaseActions) {
      await dataStore.trackActionCompletion(userId, action.id);
      profile.progress.completedActions.push(action.id);
    }

    await dataStore.saveUserProfile(profile);

    // Verify progress tracking
    const progressHistory = await dataStore.getProgressHistory(userId);
    expect(progressHistory.length).toBe(phaseActions.length);

    // Generate acknowledgment for transition progress
    const completedActions = phaseActions.map(a => ({ ...a, completed: true }));
    const acknowledgment = generateProgressAcknowledgment(completedActions, profile);
    expect(acknowledgment).toBeTruthy();
  });

  /**
   * Test 6: Multi-goal prioritization and action balancing
   * Requirements: 4.5
   */
  it('should prioritize and balance actions across multiple goals', async () => {
    const userId = 'user-multigoal-test';

    // Create profile with multiple goals
    const profile = collectProfileData({
      userId,
      age: 30,
      currentRole: 'Developer',
      yearsOfExperience: 4,
      education: 'Bachelor in Computer Science',
      industry: 'Technology',
    });

    // Add multiple goals with different priorities
    profile.careerInfo.goals.push(
      {
        id: 'goal-1',
        description: 'Learn system design',
        type: 'short_term',
        priority: 2,
      },
      {
        id: 'goal-2',
        description: 'Improve leadership skills',
        type: 'short_term',
        priority: 1,
      },
      {
        id: 'goal-3',
        description: 'Build side project',
        type: 'short_term',
        priority: 3,
      }
    );

    profile.careerInfo.interests.push('leadership', 'system design', 'entrepreneurship');
    profile.skills.current.push(
      { name: 'Programming', level: 7, category: 'technical' }
    );

    profile.mindset.confidenceLevel = 0.7;
    profile.mindset.motivationLevel = 0.8;

    await dataStore.saveUserProfile(profile);

    // Generate action steps for all goals
    const actionSteps = generateActionSteps(profile, profile.careerInfo.goals);

    // Verify actions are distributed to prevent overwhelm
    expect(actionSteps.length).toBeGreaterThan(0);
    expect(actionSteps.length).toBeLessThanOrEqual(9); // Max 3 per timeframe * 3 timeframes

    // Verify each timeframe doesn't have too many actions
    const byTimeframe = {
      today: actionSteps.filter(s => s.timeframe === 'today'),
      this_week: actionSteps.filter(s => s.timeframe === 'this_week'),
      this_month: actionSteps.filter(s => s.timeframe === 'this_month'),
    };

    expect(byTimeframe.today.length).toBeLessThanOrEqual(3);
    expect(byTimeframe.this_week.length).toBeLessThanOrEqual(3);
    expect(byTimeframe.this_month.length).toBeLessThanOrEqual(3);

    // Verify actions are balanced across goals
    const goalIds = profile.careerInfo.goals.map(g => g.id);
    const actionsByGoal = new Map<string, number>();

    // Count actions per goal (approximate by checking description)
    profile.careerInfo.goals.forEach(goal => {
      const relatedActions = actionSteps.filter(action =>
        action.description.toLowerCase().includes(goal.description.toLowerCase().split(' ')[0])
      );
      actionsByGoal.set(goal.id, relatedActions.length);
    });

    // Verify no single goal dominates all actions
    const actionCounts = Array.from(actionsByGoal.values());
    const maxActions = Math.max(...actionCounts);
    const minActions = Math.min(...actionCounts);
    expect(maxActions - minActions).toBeLessThanOrEqual(3); // Reasonable distribution
  });

  /**
   * Test 7: Profile completeness checking and prompting
   * Requirements: 1.5
   */
  it('should detect incomplete profiles and identify missing fields', async () => {
    const userId = 'user-incomplete-test';

    // Create minimal profile
    const profile = collectProfileData({
      userId,
      age: 24,
      yearsOfExperience: 1,
      education: 'Bachelor in Business',
    });

    // Profile is missing: currentRole, goals, interests, struggles
    const completenessInfo = profileAnalyzer.checkProfileCompleteness(profile);

    expect(completenessInfo.isComplete).toBe(false);
    expect(completenessInfo.missingFields.length).toBeGreaterThan(0);
    expect(completenessInfo.missingFields).toContain('currentRole');
    expect(completenessInfo.missingFields).toContain('goals');
    expect(completenessInfo.missingFields).toContain('interests');
    expect(completenessInfo.missingFields).toContain('struggles');

    // Add missing fields one by one
    profile.personalInfo.currentRole = 'Analyst';
    const afterRole = profileAnalyzer.checkProfileCompleteness(profile);
    expect(afterRole.missingFields).not.toContain('currentRole');

    profile.careerInfo.goals.push({
      id: 'goal-1',
      description: 'Get promoted',
      type: 'short_term',
      priority: 1,
    });
    const afterGoals = profileAnalyzer.checkProfileCompleteness(profile);
    expect(afterGoals.missingFields).not.toContain('goals');

    profile.careerInfo.interests.push('data analysis');
    const afterInterests = profileAnalyzer.checkProfileCompleteness(profile);
    expect(afterInterests.missingFields).not.toContain('interests');

    profile.careerInfo.struggles.push({
      type: 'direction',
      description: 'Unsure about career path',
      severity: 6,
    });
    const afterStruggles = profileAnalyzer.checkProfileCompleteness(profile);
    expect(afterStruggles.missingFields).not.toContain('struggles');

    // Verify profile is now complete
    expect(afterStruggles.isComplete).toBe(true);
    expect(afterStruggles.missingFields).toHaveLength(0);
  });
});
