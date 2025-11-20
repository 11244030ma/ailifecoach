/**
 * WorkLife AI Coach - Main Entry Point
 * Exports the integrated coaching engine and all core components
 */

export { CoachingEngine, CoachingRequest, CoachingResponse } from './coachingEngine.js';
export { ConversationManager, Response } from './conversation/conversationManager.js';
export { ResponseFormatter } from './conversation/responseFormatter.js';
export { recognizeIntent, detectEmotionalContent, shouldPrioritizeMindset } from './intent/intentRecognizer.js';
export { ProfileAnalyzer } from './profile/profileAnalyzer.js';
export { collectProfileData, hasRequiredFields } from './profile/profileCollector.js';
export { DataStore, InMemoryDataStore } from './persistence/dataStore.js';

// Export all models
export * from './models/index.js';

// Export all recommendation engines
export * from './recommendations/index.js';
