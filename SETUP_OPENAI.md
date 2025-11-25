# 🤖 Setup OpenAI for Real AI Responses

## Quick Setup (5 minutes)

### Step 1: Get Your OpenAI API Key

1. Go to: **https://platform.openai.com/**
2. Click "Sign up" (or "Log in" if you have an account)
3. Once logged in, go to: **https://platform.openai.com/api-keys**
4. Click "Create new secret key"
5. Give it a name like "WorkLife Coach"
6. **Copy the key** (it starts with `sk-`)
   - ⚠️ You can only see it once! Save it now.

### Step 2: Add Key to .env File

Open the `.env` file in your project and replace the placeholder:

```bash
# Before:
OPENAI_API_KEY=your-api-key-here

# After (with your actual key):
OPENAI_API_KEY=sk-proj-abc123...your-actual-key
```

### Step 3: Restart the Server

```bash
# Stop the current server (Ctrl+C)
# Then start it again:
npm start
```

You should see:
```
✅ OpenAI initialized
🚀 WorkLife AI Coach Server Started!
```

### Step 4: Test It!

Open: `http://localhost:3000/working-demo.html`

Try asking:
- "I feel stuck in my career"
- "Should I switch jobs?"
- "How do I ask for a raise?"

You'll get **real AI responses** that:
- ✅ Remember conversation context
- ✅ Ask follow-up questions
- ✅ Give personalized advice
- ✅ Adapt to your situation

## 💰 Cost

OpenAI charges per token (words):
- **Model:** GPT-3.5-turbo (fast and cheap)
- **Cost:** ~$0.002 per 1,000 tokens
- **Typical message:** ~250 tokens
- **Cost per message:** ~$0.0005 (half a cent!)

**Example:** 100 messages = $0.05 (5 cents)

### Free Credits

New OpenAI accounts get **$5 in free credits** - that's about **10,000 messages**!

## 🔍 Verify It's Working

The AI response will include a source indicator:
- `"source": "openai"` = Real AI ✅
- `"source": "mock"` = Keyword-based fallback ⚠️

Check the browser console (F12) to see which source is being used.

## ❌ Troubleshooting

### "OpenAI API key not found"
- Check your `.env` file exists
- Make sure the key starts with `sk-`
- Restart the server after adding the key

### "Invalid API key"
- The key might be wrong - copy it again from OpenAI
- Make sure there are no extra spaces
- The key should be one long string

### "Rate limit exceeded"
- You've used too many requests
- Wait a few minutes
- Check your usage at: https://platform.openai.com/usage

### "Insufficient quota"
- You've used all your free credits
- Add a payment method at: https://platform.openai.com/account/billing
- Or wait until next month for quota reset

### Still using mock responses?
1. Check server logs - should say "✅ OpenAI initialized"
2. If it says "⚠️ OpenAI API key not found":
   - Your .env file isn't being read
   - Make sure it's in the project root
   - Restart the server

## 🎯 What You Get

### Before (Mock Responses):
```
User: "I feel stuck"
AI: "That feeling of being stuck is really common..."
```
Generic, keyword-based response.

### After (Real AI):
```
User: "I feel stuck"
AI: "I hear you. Let's figure out what's actually making you feel stuck. 

Is it that you're not learning anything new? That you don't see a path forward? Or is it more about the work environment itself?

And how long have you been feeling this way?"
```
Contextual, conversational, asks specific follow-up questions.

## 🚀 Next Steps

Once OpenAI is working:
1. The AI will remember your conversation
2. It will ask better follow-up questions
3. It will give personalized advice
4. No more generic responses!

## 💡 Alternative: Use Local AI (Free!)

Don't want to pay for OpenAI? Use Ollama (runs on your computer):

```bash
# Install Ollama
brew install ollama

# Download a model
ollama pull llama2

# Start Ollama
ollama serve
```

Then update `server.js` to use Ollama instead (see `AI_ENGINE_SETUP.md` for details).

---

**Need help?** Check the server logs for error messages or open an issue!
