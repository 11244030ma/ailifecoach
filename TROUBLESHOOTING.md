# Troubleshooting Guide

## Chat Not Working

### Issue: "Can't send messages"

**Check 1: Is the server running?**
```bash
# Check if server is running
curl http://localhost:3000/health

# If not running, start it:
npm start
```

**Check 2: Are you accessing the correct URL?**
- ✅ Correct: `http://localhost:3000/demo.html`
- ❌ Wrong: Opening the file directly (file:///...)

**Check 3: Check browser console**
1. Open DevTools (F12 or Right-click → Inspect)
2. Go to Console tab
3. Look for error messages
4. You should see:
   - 🔄 Initializing session with API: http://localhost:3000
   - ✅ Session initialized: session_xxxxx

**Check 4: Clear localStorage**
```javascript
// In browser console, run:
localStorage.clear();
location.reload();
```

### Issue: "Getting redirected to auth.html"

**Solution:** The latest version of demo.html automatically enables guest mode. If you're still being redirected:

1. Clear your browser cache
2. Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. Or manually set guest mode in console:
```javascript
localStorage.setItem('guestMode', 'true');
location.reload();
```

### Issue: "Generic/repetitive responses"

This is expected! The coaching engine isn't compiled yet, so the server uses keyword-based mock responses. They're contextual but limited.

**To get better responses:**
1. Fix TypeScript errors (see CHAT_FIXES.md)
2. Run `npm run build`
3. Restart server

### Issue: "Chat history items not working"

**Expected behavior:**
- Clicking a chat item should highlight it
- Currently starts a new session (history loading not implemented yet)

**To implement full history:**
- Need to add database storage
- Add API endpoint for retrieving conversations
- Modify loadChat() function to fetch and display history

## Testing Steps

### Quick Test
1. Open: `http://localhost:3000/test-chat.html`
2. Type "I feel stuck" and press Enter
3. You should get a response about feeling stuck

### Full Test
1. Open: `http://localhost:3000/demo.html`
2. Open browser console (F12)
3. Type a message and click send
4. Check console for logs
5. Verify you get a response

### API Test
```bash
# Test session start
curl -X POST http://localhost:3000/api/chat/start \
  -H "Content-Type: application/json" \
  -d '{"userId": "test"}'

# Test message (use sessionId from above)
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "session_xxxxx", "message": "I feel stuck"}'
```

## Common Errors

### "Failed to fetch"
- Server is not running
- Wrong URL (using file:// instead of http://)
- CORS issue (shouldn't happen with our setup)

### "Session ID and message are required"
- Session not initialized
- Check console for initialization errors

### "Cannot read property of undefined"
- JavaScript error in code
- Check browser console for stack trace
- Report the error with console output

## Browser Compatibility

Tested and working on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Port Already in Use

If you see "Port 3000 is already in use":

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm start
```

Then access at `http://localhost:3001/demo.html`

## Still Not Working?

1. Check `CHAT_FIXES.md` for detailed fix information
2. Look at `test-chat.html` source code for a minimal working example
3. Check server logs for errors
4. Verify all files are saved and server is restarted
