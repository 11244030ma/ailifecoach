# 🚀 Ollama Quick Start - 3 Steps

## Step 1: Install Ollama (2 minutes)

**Download:** https://ollama.ai/download

1. Click the download link
2. Open the downloaded file
3. Drag to Applications
4. Done!

## Step 2: Download AI Model (5 minutes)

Open Terminal and run:
```bash
ollama pull llama2
```

This downloads the AI model (~4GB). Wait for it to finish.

## Step 3: Start Ollama

In Terminal, run:
```bash
ollama serve
```

**Keep this terminal window open!** Ollama needs to stay running.

## ✅ Test It

Open a NEW terminal and run:
```bash
ollama run llama2 "Hello!"
```

You should get an AI response!

## 🎯 Use It in Your Chat

Once Ollama is running:

1. **Restart your chat server** (it will auto-detect Ollama)
2. **Open:** `http://localhost:3000/working-demo.html`
3. **Start chatting!** You'll get real AI responses for free!

## 🔍 How to Know It's Working

Check the server logs when you start `npm start`:
```
✅ Ollama detected and ready
```

When you send a message, the response will include:
```json
{
  "source": "ollama"  // Not "mock"!
}
```

## 💡 Tips

- **Keep Ollama running** - Don't close the `ollama serve` terminal
- **First response is slow** - Ollama loads the model on first use
- **After that, it's fast!** - Subsequent responses are quick
- **Completely free** - No API keys, no costs, ever!

## 🆘 Troubleshooting

### "ollama: command not found"
- You haven't installed Ollama yet
- Download from: https://ollama.ai/download

### "connection refused"
- Ollama isn't running
- Run: `ollama serve` in a terminal

### Still getting mock responses?
- Make sure Ollama is running (`ollama serve`)
- Restart your chat server (`npm start`)
- Check server logs for "✅ Ollama detected"

## 📊 What You Get

**Quality:** ⭐⭐⭐⭐ (Very good, close to GPT-3.5)
**Speed:** Fast (after first load)
**Cost:** $0 (completely free!)
**Privacy:** 100% (runs on your computer)

---

**Ready? Download Ollama now:** https://ollama.ai/download

Then run:
```bash
ollama pull llama2
ollama serve
```

And your chat will have real AI responses for free!
