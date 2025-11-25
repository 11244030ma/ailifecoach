# 🦙 Install Ollama - Free Local AI

## What is Ollama?
Ollama lets you run AI models on your own computer - completely free, no API keys needed!

## Installation Steps

### Step 1: Download Ollama

**Go to:** https://ollama.ai/download

**Or direct download for macOS:**
https://ollama.ai/download/Ollama-darwin.zip

### Step 2: Install
1. Open the downloaded file
2. Drag Ollama to Applications folder
3. Open Ollama from Applications

### Step 3: Verify Installation
Open Terminal and run:
```bash
ollama --version
```

You should see something like: `ollama version 0.x.x`

### Step 4: Download a Model
```bash
ollama pull llama2
```

This downloads the Llama 2 model (~4GB). It will take a few minutes.

**Alternative models:**
```bash
# Smaller, faster (recommended for testing)
ollama pull llama2:7b

# Larger, better quality
ollama pull llama2:13b

# Or try Mistral (also good)
ollama pull mistral
```

### Step 5: Start Ollama
```bash
ollama serve
```

Keep this terminal window open! Ollama needs to be running.

### Step 6: Test It
Open a new terminal and run:
```bash
ollama run llama2 "Hello, how are you?"
```

You should get an AI response!

## ✅ Once Ollama is Running

Come back and tell me, then I'll:
1. Update server.js to use Ollama
2. Restart the server
3. Your chat will use free local AI!

## 🎯 What You Get

**Pros:**
- ✅ Completely free
- ✅ No API keys needed
- ✅ Privacy - runs on your computer
- ✅ No internet required (after download)
- ✅ Good quality responses

**Cons:**
- ⚠️ Slower than OpenAI (but still fast)
- ⚠️ Requires ~4GB disk space
- ⚠️ Not quite as good as GPT-4 (but close!)

## 🔧 Troubleshooting

### "ollama: command not found"
- Ollama isn't installed yet
- Download from: https://ollama.ai/download
- Make sure to drag it to Applications

### "connection refused"
- Ollama isn't running
- Run: `ollama serve` in a terminal
- Keep that terminal open

### Download is slow
- The model is ~4GB
- Be patient, it's a one-time download
- Once downloaded, it's instant to use

## 📊 Model Comparison

| Model | Size | Speed | Quality |
|-------|------|-------|---------|
| llama2:7b | 4GB | Fast | ⭐⭐⭐⭐ |
| llama2:13b | 7GB | Medium | ⭐⭐⭐⭐⭐ |
| mistral | 4GB | Fast | ⭐⭐⭐⭐ |

**Recommendation:** Start with `llama2:7b` (good balance)

## 🚀 Quick Start Commands

```bash
# Install (download from website first)
# Then in terminal:

# Download model
ollama pull llama2

# Start Ollama (keep running)
ollama serve

# Test it (in another terminal)
ollama run llama2 "Tell me a joke"
```

## ⏭️ Next Steps

After Ollama is installed and running:
1. Tell me "Ollama is running"
2. I'll update the server code
3. Your chat will use free local AI!

---

**Download now:** https://ollama.ai/download
