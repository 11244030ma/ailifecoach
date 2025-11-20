/**
 * WorkLife AI Coach - Simple Node.js Server
 * Serves the chat interface and handles API requests
 */

import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('ui-components'));
app.use(express.static('public'));

// Import the coaching engine (if available)
let CoachingEngine;
try {
  // Try to import the TypeScript modules (if compiled)
  const { InMemoryDataStore } = require('./dist/persistence/dataStore.js');
  const { ConversationManager } = require('./dist/conversation/conversationManager.js');
  
  // Initialize the coaching system
  const dataStore = new InMemoryDataStore();
  const conversationManager = new ConversationManager(dataStore);
  
  CoachingEngine = {
    dataStore,
    conversationManager
  };
  
  console.log('✅ Coaching engine loaded successfully');
} catch (error) {
  console.log('⚠️  Coaching engine not available, using mock responses');
  CoachingEngine = null;
}

// Store active sessions in memory
const sessions = new Map();

// API Routes

/**
 * POST /api/chat/start
 * Start a new chat session
 */
app.post('/api/chat/start', async (req, res) => {
  try {
    const userId = req.body.userId || `user_${Date.now()}`;
    
    if (CoachingEngine) {
      const session = CoachingEngine.conversationManager.startSession(userId);
      sessions.set(session.id, { userId, sessionId: session.id });
      
      res.json({
        sessionId: session.id,
        userId,
        message: "Hi! I'm your WorkLife coach. I'm here to help you get unstuck in your career—whether you're figuring out what to learn next, thinking about switching fields, or just feeling lost about where you're headed. Let's talk through it together."
      });
    } else {
      // Mock response
      const sessionId = `session_${Date.now()}`;
      sessions.set(sessionId, { userId, sessionId });
      
      res.json({
        sessionId,
        userId,
        message: "Hi! I'm your WorkLife coach. I'm here to help you get unstuck in your career—whether you're figuring out what to learn next, thinking about switching fields, or just feeling lost about where you're headed. Let's talk through it together."
      });
    }
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

/**
 * POST /api/chat/message
 * Send a message and get a response
 */
app.post('/api/chat/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'Session ID and message are required' });
    }
    
    if (CoachingEngine) {
      const response = await CoachingEngine.conversationManager.continueSession(
        sessionId,
        message
      );
      
      res.json({
        message: response.content,
        timestamp: response.timestamp
      });
    } else {
      // Mock responses based on keywords
      const lowerMessage = message.toLowerCase();
      let responseText = '';
      
      if (lowerMessage.includes('stuck') || lowerMessage.includes('lost')) {
        responseText = "That feeling of being stuck is really common, and it doesn't mean you're behind—it means you're being honest with yourself.\n\nLet me ask: what's making you feel this way? Is it the work itself, the environment, the growth opportunities, or something else?";
      } else if (lowerMessage.includes('skill') || lowerMessage.includes('learn')) {
        responseText = "Good instinct to question that. \"Everyone says\" is usually a red flag—what works for others might not fit your goals.\n\nLet me ask: what are you hoping a new skill will do for you? Are you trying to switch into a different field, make yourself more valuable in your current role, or open up freelance opportunities?";
      } else if (lowerMessage.includes('confidence') || lowerMessage.includes('not good enough')) {
        responseText = "I hear this a lot, and here's the thing: confidence doesn't come before you do the thing—it comes after.\n\nYou're comparing your behind-the-scenes to everyone else's highlight reel. They're not more qualified—they're just better at talking about what they've done.\n\nWhat's a project or accomplishment you're proud of from the last year?";
      } else if (lowerMessage.includes('career') || lowerMessage.includes('path')) {
        responseText = "Let's break this down together.\n\nCould you tell me a bit about yourself? Things like:\n• What you're currently doing (job, field, or studying)\n• What's been on your mind lately about your career\n• What you're hoping to figure out";
      } else {
        responseText = "I understand where you're coming from. Let me help you work through this.\n\nCould you tell me more about your situation? The more context you share, the better I can help.";
      }
      
      // Simulate thinking delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      res.json({
        message: responseText,
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * GET /api/chat/history/:sessionId
 * Get chat history for a session
 */
app.get('/api/chat/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (CoachingEngine) {
      const context = CoachingEngine.conversationManager.getSessionContext(sessionId);
      
      if (context) {
        res.json({
          messages: context.conversationHistory
        });
      } else {
        res.status(404).json({ error: 'Session not found' });
      }
    } else {
      res.json({ messages: [] });
    }
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * GET /
 * Serve the landing page
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'ui-components', 'index.html'));
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    coachingEngine: CoachingEngine ? 'loaded' : 'mock',
    timestamp: new Date()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 WorkLife AI Coach Server Started!\n');
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://127.0.0.1:${PORT}\n`);
  console.log('📱 To open in Safari:');
  console.log(`   1. Open Safari`);
  console.log(`   2. Go to: http://localhost:${PORT}\n`);
  console.log('💡 Press Ctrl+C to stop the server\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
