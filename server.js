/**
 * WorkLife AI Coach - Simple Node.js Server
 * Serves the chat interface and handles API requests
 */

import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log('✅ OpenAI initialized');
} else {
  console.log('⚠️  OpenAI API key not found. Will try Ollama or use mock responses.');
}

// Check if Ollama is available
let ollamaAvailable = false;
async function checkOllama() {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      ollamaAvailable = true;
      console.log('✅ Ollama detected and ready');
      return true;
    }
  } catch (error) {
    // Ollama not running
  }
  return false;
}

// Check Ollama on startup
checkOllama();

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

// Store active sessions in memory with conversation history
const sessions = new Map();

// System prompt for the AI coach
const COACH_SYSTEM_PROMPT = `You are a WorkLife AI Coach. Your role is to help people with their careers in a direct, honest, and practical way.

Key principles:
- Be direct and honest, not overly cheerful or fake
- Ask clarifying questions to understand their situation deeply
- Give actionable advice, not generic platitudes
- Focus on what they can control right now
- Break down big problems into smaller, manageable steps
- Challenge assumptions when needed, but kindly
- Be empathetic but practical - acknowledge feelings, then move to action
- Remember context from earlier in the conversation

Your style:
- Conversational and warm, but authentic
- Use "you" and "I" naturally, like talking to a friend
- Keep responses concise (2-3 short paragraphs max)
- Ask 1-2 specific questions to move the conversation forward
- Avoid corporate jargon, buzzwords, and clichés
- Be specific with examples when possible
- Don't be afraid to be real - if something is a bad idea, say so (kindly)

Topics you help with:
- Feeling stuck or lost in career
- Career transitions and changes
- Skill development and learning
- Confidence and imposter syndrome
- Job search and interviews
- Salary negotiation
- Workplace relationships
- Burnout and work-life balance
- Career growth and promotions

Remember: You're a coach, not a therapist. Focus on career and professional development.`;

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
    
    // Try OpenAI first
    if (openai) {
      try {
        // Get or create session with conversation history
        if (!sessions.has(sessionId)) {
          sessions.set(sessionId, { messages: [] });
        }
        
        const session = sessions.get(sessionId);
        
        // Add user message to history
        session.messages.push({
          role: 'user',
          content: message
        });
        
        // Call OpenAI - Use GPT-4 for better responses (costs more but higher quality)
        // Change to 'gpt-3.5-turbo' for cheaper/faster responses
        const completion = await openai.chat.completions.create({
          model: process.env.USE_GPT4 === 'true' ? 'gpt-4' : 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: COACH_SYSTEM_PROMPT
            },
            ...session.messages
          ],
          temperature: 0.7,
          max_tokens: 500
        });
        
        const aiResponse = completion.choices[0].message.content;
        
        // Add AI response to history
        session.messages.push({
          role: 'assistant',
          content: aiResponse
        });
        
        // Keep only last 10 messages to avoid token limits
        if (session.messages.length > 20) {
          session.messages = session.messages.slice(-20);
        }
        
        return res.json({
          message: aiResponse,
          timestamp: new Date(),
          source: 'openai'
        });
        
      } catch (openaiError) {
        console.error('OpenAI error:', openaiError.message);
        // Fall through to Ollama or mock responses
      }
    }
    
    // Try Ollama if available
    if (!openai || !sessions.has(sessionId)) {
      try {
        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama2',
            prompt: `You are a WorkLife AI Coach helping people with their careers. Be direct, honest, and practical.

User: ${message}

Coach:`,
            stream: false,
            system: COACH_SYSTEM_PROMPT
          })
        });
        
        if (ollamaResponse.ok) {
          const data = await ollamaResponse.json();
          
          return res.json({
            message: data.response,
            timestamp: new Date(),
            source: 'ollama'
          });
        }
      } catch (ollamaError) {
        // Ollama not available, fall through to mock
        console.log('Ollama not available, using mock responses');
      }
    }
    
    // Fallback to TypeScript coaching engine
    if (CoachingEngine) {
      const response = await CoachingEngine.conversationManager.continueSession(
        sessionId,
        message
      );
      
      res.json({
        message: response.content,
        timestamp: response.timestamp,
        source: 'coaching-engine'
      });
    } else {
      // Enhanced mock responses with better context awareness
      const lowerMessage = message.toLowerCase();
      let responseText = '';
      
      // Check for specific career-related keywords
      if (lowerMessage.includes('stuck') || lowerMessage.includes('lost') || lowerMessage.includes('confused')) {
        responseText = "That feeling of being stuck is really common, and it doesn't mean you're behind—it means you're being honest with yourself.\n\nLet me ask: what's making you feel this way? Is it the work itself, the environment, the growth opportunities, or something else?";
      } 
      else if (lowerMessage.includes('skill') || lowerMessage.includes('learn') || lowerMessage.includes('training')) {
        responseText = "Good instinct to question that. \"Everyone says\" is usually a red flag—what works for others might not fit your goals.\n\nLet me ask: what are you hoping a new skill will do for you? Are you trying to switch into a different field, make yourself more valuable in your current role, or open up freelance opportunities?";
      } 
      else if (lowerMessage.includes('confidence') || lowerMessage.includes('not good enough') || lowerMessage.includes('imposter')) {
        responseText = "I hear this a lot, and here's the thing: confidence doesn't come before you do the thing—it comes after.\n\nYou're comparing your behind-the-scenes to everyone else's highlight reel. They're not more qualified—they're just better at talking about what they've done.\n\nWhat's a project or accomplishment you're proud of from the last year?";
      } 
      else if (lowerMessage.includes('career') || lowerMessage.includes('path') || lowerMessage.includes('direction')) {
        responseText = "Let's break this down together.\n\nCould you tell me a bit about yourself? Things like:\n• What you're currently doing (job, field, or studying)\n• What's been on your mind lately about your career\n• What you're hoping to figure out";
      }
      else if (lowerMessage.includes('job') || lowerMessage.includes('work') || lowerMessage.includes('role')) {
        responseText = "Let's talk about your current situation.\n\nWhat's your current role, and what's been on your mind about it? Are you looking to grow where you are, or are you thinking about making a change?";
      }
      else if (lowerMessage.includes('switch') || lowerMessage.includes('change') || lowerMessage.includes('transition')) {
        responseText = "Career transitions can feel overwhelming, but they're more common than you think.\n\nWhat field are you in now, and what are you considering moving into? Or are you still exploring options?";
      }
      else if (lowerMessage.includes('salary') || lowerMessage.includes('money') || lowerMessage.includes('pay')) {
        responseText = "Money conversations are important, and you're right to think about this.\n\nAre you looking to negotiate in your current role, or are you exploring opportunities that pay better? What's your current situation?";
      }
      else if (lowerMessage.includes('interview') || lowerMessage.includes('resume') || lowerMessage.includes('cv')) {
        responseText = "Job search prep is crucial. Let's make sure you're set up for success.\n\nWhat stage are you at? Are you updating your materials, preparing for interviews, or just starting to think about applying?";
      }
      else if (lowerMessage.includes('manager') || lowerMessage.includes('boss') || lowerMessage.includes('team')) {
        responseText = "Workplace relationships can make or break your experience.\n\nWhat's going on with your manager or team? Is it affecting your day-to-day work, or are you thinking about how it impacts your long-term growth?";
      }
      else if (lowerMessage.includes('burnout') || lowerMessage.includes('tired') || lowerMessage.includes('exhausted')) {
        responseText = "Burnout is real, and it's a sign you need to make a change—not that you're weak.\n\nHow long have you been feeling this way? And what do you think is the main cause—workload, lack of purpose, or something else?";
      }
      else if (lowerMessage.includes('promotion') || lowerMessage.includes('advance') || lowerMessage.includes('grow')) {
        responseText = "Growth is important, and it's good that you're thinking about it proactively.\n\nWhat does advancement look like for you? Are you looking for a title change, more responsibility, or something else? And what's been holding you back so far?";
      }
      else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        responseText = "Hey! I'm here to help you figure out your next career move.\n\nWhat's been on your mind lately? Whether it's feeling stuck, thinking about a change, or just wanting to level up—I'm here for it.";
      }
      else if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
        responseText = "You're welcome! I'm here whenever you need to talk through career stuff.\n\nIs there anything else on your mind right now?";
      }
      else {
        // More engaging default response
        responseText = "I'm listening. Tell me more about what's going on.\n\nThe more context you share—like what you're currently doing, what's frustrating you, or what you're hoping to achieve—the better I can help you figure out your next steps.";
      }
      
      // Simulate thinking delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      res.json({
        message: responseText,
        timestamp: new Date(),
        source: 'mock'
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
