# How to Add a Real AI Engine

Currently, the chat uses keyword-based mock responses. Here's how to integrate a real AI engine.

## Option 1: OpenAI GPT (Recommended)

### Step 1: Install OpenAI SDK
```bash
npm install openai
```

### Step 2: Get API Key
1. Go to https://platform.openai.com/
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### Step 3: Add to Environment
Create a `.env` file in the project root:
```bash
OPENAI_API_KEY=sk-your-key-here
```

Install dotenv:
```bash
npm install dotenv
```

### Step 4: Update server.js

Add at the top of `server.js`:
```javascript
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

Replace the mock response section with:
```javascript
app.post('/api/chat/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'Session ID and message are required' });
    }
    
    // Get or create conversation history
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, { messages: [] });
    }
    
    const session = sessions.get(sessionId);
    
    // Add user message to history
    session.messages.push({
      role: 'user',
      content: message
    });
    
    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a WorkLife AI Coach. Your role is to help people with their careers.

Key principles:
- Be direct and honest, not overly cheerful
- Ask clarifying questions to understand their situation
- Give actionable advice, not generic platitudes
- Focus on what they can control
- Break down big problems into smaller steps
- Challenge assumptions when needed
- Be empathetic but practical

Style:
- Conversational and warm, but not fake
- Use "you" and "I" naturally
- Keep responses concise (2-3 short paragraphs max)
- Ask 1-2 specific questions to move the conversation forward
- Avoid corporate jargon and buzzwords`
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
    
    res.json({
      message: aiResponse,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});
```

### Step 5: Restart Server
```bash
npm start
```

## Option 2: Anthropic Claude

### Step 1: Install Anthropic SDK
```bash
npm install @anthropic-ai/sdk
```

### Step 2: Get API Key
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Get your API key

### Step 3: Add to .env
```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Step 4: Update server.js
```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// In the message endpoint:
const message = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 500,
  system: 'You are a WorkLife AI Coach...',
  messages: session.messages
});

const aiResponse = message.content[0].text;
```

## Option 3: Local AI (Ollama - Free!)

### Step 1: Install Ollama
```bash
# macOS
brew install ollama

# Or download from https://ollama.ai
```

### Step 2: Pull a Model
```bash
ollama pull llama2
# or
ollama pull mistral
```

### Step 3: Start Ollama
```bash
ollama serve
```

### Step 4: Update server.js
```javascript
app.post('/api/chat/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama2',
        prompt: `You are a WorkLife AI Coach. Help with career advice.

User: ${message}

Coach:`,
        stream: false
      })
    });
    
    const data = await response.json();
    
    res.json({
      message: data.response,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});
```

## Comparison

| Option | Cost | Quality | Speed | Privacy |
|--------|------|---------|-------|---------|
| OpenAI GPT-4 | $$ | ⭐⭐⭐⭐⭐ | Fast | Cloud |
| OpenAI GPT-3.5 | $ | ⭐⭐⭐⭐ | Very Fast | Cloud |
| Claude | $$ | ⭐⭐⭐⭐⭐ | Fast | Cloud |
| Ollama (Local) | Free | ⭐⭐⭐ | Medium | Local |

## Recommended: Start with OpenAI GPT-3.5-turbo

It's the best balance of cost, quality, and speed:

```javascript
const completion = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',  // Cheaper and faster than GPT-4
  messages: [...],
  temperature: 0.7,
  max_tokens: 500
});
```

**Costs:**
- GPT-3.5-turbo: ~$0.002 per 1K tokens (very cheap)
- GPT-4: ~$0.03 per 1K tokens (10x more expensive)

For a typical conversation:
- User message: ~50 tokens
- AI response: ~200 tokens
- Cost per message: ~$0.0005 (half a cent)

## Testing

After setup, test with the debug tool:
```
http://localhost:3000/debug.html
```

1. Click "Test Server"
2. Click "Start Session"
3. Type a message and click "Send Test Message"
4. You should see a real AI response!

## Troubleshooting

### "Invalid API key"
- Check your `.env` file
- Make sure the key starts with `sk-`
- Restart the server after adding the key

### "Rate limit exceeded"
- You've hit the API limit
- Wait a few minutes
- Consider upgrading your OpenAI plan

### "Model not found"
- Check the model name spelling
- Make sure you have access to that model
- Try `gpt-3.5-turbo` instead

### Ollama not responding
- Make sure Ollama is running: `ollama serve`
- Check if the model is downloaded: `ollama list`
- Try pulling the model again: `ollama pull llama2`

## Next Steps

Once you have a real AI engine:
1. Add conversation memory (store chat history)
2. Add user profiles (remember user info across sessions)
3. Add specialized prompts for different career topics
4. Add function calling for structured responses
5. Add streaming responses for better UX
