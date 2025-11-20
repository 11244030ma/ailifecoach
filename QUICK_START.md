# WorkLife AI Coach - Quick Start Guide

## 🚀 How to Run the Chat Interface

### Option 1: Simple HTML (No Server)

The easiest way to see the UI:

1. **Open the demo file directly in Safari:**
   ```bash
   open -a Safari ui-components/demo.html
   ```

   Or manually:
   - Open Safari
   - Press `Cmd + O` (or File → Open File)
   - Navigate to `ui-components/demo.html`
   - Click Open

   **Note**: This runs with mock responses (no backend connection)

---

### Option 2: With Node.js Server (Recommended)

For the full experience with API integration:

#### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `express` - Web server
- `cors` - Cross-origin support
- Other dependencies

#### Step 2: Start the Server

```bash
npm start
```

Or:

```bash
npm run server
```

You should see:

```
🚀 WorkLife AI Coach Server Started!

   Local:   http://localhost:3000
   Network: http://127.0.0.1:3000

📱 To open in Safari:
   1. Open Safari
   2. Go to: http://localhost:3000

💡 Press Ctrl+C to stop the server
```

#### Step 3: Open in Safari

**Method 1 - Command Line:**
```bash
open -a Safari http://localhost:3000
```

**Method 2 - Manual:**
1. Open Safari
2. In the address bar, type: `localhost:3000`
3. Press Enter

#### Step 4: Start Chatting!

The interface will load with:
- Welcome message from the AI coach
- Sample conversation
- Working input field
- Quick reply buttons

Try typing a message like:
- "I feel stuck in my career"
- "What skills should I learn?"
- "I need help with confidence"

---

## 🔧 Troubleshooting

### Port Already in Use

If you see `Error: listen EADDRINUSE: address already in use :::3000`:

**Solution 1 - Use a different port:**
```bash
PORT=3001 npm start
```

Then open: `http://localhost:3001`

**Solution 2 - Kill the process using port 3000:**
```bash
lsof -ti:3000 | xargs kill -9
npm start
```

### Dependencies Not Installed

If you see `Cannot find module 'express'`:

```bash
npm install
```

### Server Won't Start

Make sure you're in the project directory:

```bash
cd "test 3"  # or your project folder name
npm start
```

---

## 📱 Mobile Testing

### Test on iPhone/iPad

1. **Find your computer's IP address:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **On your iPhone/iPad:**
   - Open Safari
   - Go to: `http://YOUR_IP_ADDRESS:3000`
   - Example: `http://192.168.1.100:3000`

**Note**: Your phone and computer must be on the same WiFi network

---

## 🎨 Customization

### Change Colors

Edit `ui-components/demo.html` and modify the CSS variables:

```css
:root {
  --primary-blue: #4A90E2;     /* Change to your color */
  --accent-green: #6BCF9F;     /* Change to your color */
}
```

### Change Port

```bash
PORT=8080 npm start
```

### Add Your Own Responses

Edit `server.js` and modify the mock responses in the `/api/chat/message` endpoint.

---

## 📂 Project Structure

```
test 3/
├── server.js                      # Node.js server
├── package.json                   # Dependencies
├── ui-components/
│   ├── demo.html                  # Chat interface (standalone)
│   ├── ChatInterface.tsx          # React component
│   └── ChatInterface.css          # Styles
├── src/                           # Backend code
│   ├── conversation/              # Conversation management
│   ├── recommendations/           # Recommendation engines
│   └── ...
└── worklife-chat-ui-design.md    # Complete design spec
```

---

## 🔗 API Endpoints

When the server is running, these endpoints are available:

### Start a Session
```bash
POST http://localhost:3000/api/chat/start
```

### Send a Message
```bash
POST http://localhost:3000/api/chat/message
Body: { "sessionId": "...", "message": "..." }
```

### Get Chat History
```bash
GET http://localhost:3000/api/chat/history/:sessionId
```

### Health Check
```bash
GET http://localhost:3000/health
```

---

## 🚀 Next Steps

### 1. Connect to Real AI Backend

Replace the mock responses in `server.js` with calls to:
- OpenAI API
- Anthropic Claude
- Your custom AI model

### 2. Add Database

Replace in-memory storage with:
- MongoDB
- PostgreSQL
- Firebase

### 3. Deploy

Deploy to:
- Vercel
- Netlify
- Heroku
- AWS

### 4. Add Features

- User authentication
- Save conversation history
- Export chat transcripts
- Voice input
- Multi-language support

---

## 💡 Tips

### Keep Server Running

Use `nodemon` for auto-restart on file changes:

```bash
npm install -g nodemon
nodemon server.js
```

### View Logs

The server logs all requests. Watch the terminal for:
- Session starts
- Messages sent
- Errors

### Test API with curl

```bash
# Start session
curl -X POST http://localhost:3000/api/chat/start \
  -H "Content-Type: application/json" \
  -d '{"userId":"test123"}'

# Send message
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"session_123","message":"Hello"}'
```

---

## 📞 Need Help?

1. Check the console for errors (Safari → Develop → Show JavaScript Console)
2. Check the server logs in your terminal
3. Make sure all dependencies are installed: `npm install`
4. Try restarting the server: `Ctrl+C` then `npm start`

---

## ✅ Quick Commands Reference

```bash
# Install dependencies
npm install

# Start server
npm start

# Open in Safari (after server is running)
open -a Safari http://localhost:3000

# Run tests
npm test

# Build TypeScript
npm run build

# Stop server
Ctrl + C
```

---

**Enjoy your WorkLife AI Coach! 🎉**
