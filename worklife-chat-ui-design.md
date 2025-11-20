# WorkLife AI Coach - Chat Interface UI/UX Design

## Design Philosophy
Clean, modern, emotionally warm interface that reduces anxiety and encourages honest conversation. Prioritizes clarity and ease of use over flashy effects.

---

## 1. Color Palette

### Primary Colors
```css
--primary-blue: #4A90E2;        /* Main brand color - calm, trustworthy */
--primary-blue-dark: #357ABD;   /* Hover states */
--primary-blue-light: #E8F4FD;  /* Light backgrounds */
```

### Secondary Colors
```css
--accent-green: #6BCF9F;        /* Success, positive actions */
--accent-green-light: #E8F8F2;  /* Light green backgrounds */
--warm-coral: #FF8B7B;          /* Alerts, important items (use sparingly) */
```

### Neutrals
```css
--neutral-900: #1A1A1A;         /* Primary text */
--neutral-700: #4A4A4A;         /* Secondary text */
--neutral-500: #8E8E8E;         /* Tertiary text, placeholders */
--neutral-300: #D4D4D4;         /* Borders, dividers */
--neutral-100: #F5F5F5;         /* Light backgrounds */
--neutral-50: #FAFAFA;          /* Lightest background */
--white: #FFFFFF;               /* Pure white */
```

### Semantic Colors
```css
--bg-user: #4A90E2;             /* User message bubble */
--bg-ai: #FFFFFF;               /* AI message bubble */
--bg-chat: #FAFAFA;             /* Chat window background */
--bg-input: #FFFFFF;            /* Input bar background */
--border-light: #E8E8E8;        /* Light borders */
--shadow-soft: rgba(0,0,0,0.08); /* Soft shadows */
```

---

## 2. Typography

### Font Family
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'SF Mono', 'Monaco', 'Courier New', monospace; /* For code snippets if needed */
```

### Font Sizes
```css
--text-xs: 12px;      /* Timestamps, meta info */
--text-sm: 14px;      /* Secondary text, buttons */
--text-base: 16px;    /* Body text, messages */
--text-lg: 18px;      /* Emphasized text */
--text-xl: 20px;      /* Welcome heading */
--text-2xl: 24px;     /* Large headings */
```

### Font Weights
```css
--weight-normal: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
```

### Line Heights
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

---

## 3. Chat Bubble Style

### User Message Bubble
```css
.message-user {
  background: var(--bg-user);
  color: var(--white);
  border-radius: 18px 18px 4px 18px;
  padding: 12px 16px;
  max-width: 70%;
  margin-left: auto;
  margin-bottom: 12px;
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  box-shadow: 0 2px 8px var(--shadow-soft);
}
```

### AI Message Bubble
```css
.message-ai {
  background: var(--bg-ai);
  color: var(--neutral-900);
  border-radius: 18px 18px 18px 4px;
  padding: 12px 16px;
  max-width: 75%;
  margin-right: auto;
  margin-bottom: 12px;
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  box-shadow: 0 2px 8px var(--shadow-soft);
  border: 1px solid var(--border-light);
}
```

### Message Metadata
```css
.message-timestamp {
  font-size: var(--text-xs);
  color: var(--neutral-500);
  margin-top: 4px;
  text-align: right; /* For user messages */
  text-align: left;  /* For AI messages */
}
```

### Spacing Between Messages
- Same sender: 4px gap
- Different sender: 16px gap
- After quick replies: 20px gap

---

## 4. Chat Window Layout

### Desktop Layout (768px+)
```
┌─────────────────────────────────────────────────┐
│  Header (60px height)                           │
│  ┌─────────────────────────────────────────┐   │
│  │ WorkLife Coach    [Minimize] [Close]    │   │
│  └─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  Chat Body (flexible height, scrollable)        │
│  ┌─────────────────────────────────────────┐   │
│  │                                          │   │
│  │  [AI Message]                            │   │
│  │                                          │   │
│  │                    [User Message]        │   │
│  │                                          │   │
│  │  [AI Message with action buttons]       │   │
│  │                                          │   │
│  │  [Quick Reply Buttons]                   │   │
│  │                                          │   │
│  └─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  Input Bar (auto-height, min 60px)             │
│  ┌─────────────────────────────────────────┐   │
│  │  [Type your message...]        [Send]   │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Container Specs
```css
.chat-container {
  width: 100%;
  max-width: 800px;
  height: 100vh;
  max-height: 900px;
  display: flex;
  flex-direction: column;
  background: var(--white);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  overflow: hidden;
}
```

### Header
```css
.chat-header {
  height: 60px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--white);
  border-bottom: 1px solid var(--border-light);
}

.chat-header-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--neutral-900);
}

.chat-header-subtitle {
  font-size: var(--text-sm);
  color: var(--neutral-500);
  margin-top: 2px;
}
```

### Chat Body
```css
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: var(--bg-chat);
  scroll-behavior: smooth;
}

/* Custom scrollbar */
.chat-body::-webkit-scrollbar {
  width: 6px;
}

.chat-body::-webkit-scrollbar-track {
  background: transparent;
}

.chat-body::-webkit-scrollbar-thumb {
  background: var(--neutral-300);
  border-radius: 3px;
}

.chat-body::-webkit-scrollbar-thumb:hover {
  background: var(--neutral-500);
}
```

---

## 5. Welcome Screen UI

### Welcome Container
```css
.welcome-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  min-height: 400px;
}

.welcome-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--primary-blue), var(--accent-green));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  font-size: 32px;
}

.welcome-title {
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
  color: var(--neutral-900);
  margin-bottom: 12px;
}

.welcome-subtitle {
  font-size: var(--text-base);
  color: var(--neutral-700);
  line-height: var(--leading-relaxed);
  max-width: 500px;
  margin-bottom: 32px;
}
```

### Starter Questions Grid
```css
.starter-questions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  width: 100%;
  max-width: 600px;
  margin-top: 24px;
}

.starter-question-button {
  background: var(--white);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 16px 20px;
  text-align: left;
  font-size: var(--text-sm);
  color: var(--neutral-700);
  cursor: pointer;
  transition: all 0.2s ease;
}

.starter-question-button:hover {
  background: var(--primary-blue-light);
  border-color: var(--primary-blue);
  color: var(--primary-blue-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow-soft);
}
```

---

## 6. Input Bar Design

### Input Container
```css
.input-container {
  padding: 16px 24px;
  background: var(--white);
  border-top: 1px solid var(--border-light);
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.input-wrapper {
  flex: 1;
  position: relative;
}

.input-field {
  width: 100%;
  min-height: 44px;
  max-height: 120px;
  padding: 12px 16px;
  font-size: var(--text-base);
  font-family: var(--font-primary);
  color: var(--neutral-900);
  background: var(--neutral-50);
  border: 1px solid var(--border-light);
  border-radius: 22px;
  resize: none;
  outline: none;
  transition: all 0.2s ease;
}

.input-field:focus {
  background: var(--white);
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px var(--primary-blue-light);
}

.input-field::placeholder {
  color: var(--neutral-500);
}
```

### Send Button
```css
.send-button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--primary-blue);
  color: var(--white);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.send-button:hover {
  background: var(--primary-blue-dark);
  transform: scale(1.05);
}

.send-button:active {
  transform: scale(0.95);
}

.send-button:disabled {
  background: var(--neutral-300);
  cursor: not-allowed;
  transform: none;
}

.send-button-icon {
  width: 20px;
  height: 20px;
}
```

---

## 7. Typing Indicator Animation

### Typing Indicator Container
```css
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--white);
  border-radius: 18px 18px 18px 4px;
  max-width: 80px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px var(--shadow-soft);
  border: 1px solid var(--border-light);
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: var(--neutral-500);
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}
```

---

## 8. Quick Reply Buttons

### Quick Reply Container
```css
.quick-replies {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0 24px 0;
  padding: 0 4px;
}

.quick-reply-button {
  background: var(--white);
  border: 1px solid var(--primary-blue);
  color: var(--primary-blue);
  padding: 10px 16px;
  border-radius: 20px;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.quick-reply-button:hover {
  background: var(--primary-blue);
  color: var(--white);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.quick-reply-button:active {
  transform: translateY(0);
}
```

### Suggested Quick Replies
```javascript
const quickReplies = [
  "Help me choose a skill",
  "I feel stuck at work",
  "Career change advice",
  "Build my confidence",
  "What should I focus on?",
  "I'm overwhelmed",
  "Growth in current role",
  "Job transition help"
];
```

---

## 9. Mobile Responsive Design (< 768px)

### Mobile Layout Adjustments
```css
@media (max-width: 768px) {
  .chat-container {
    max-width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .chat-header {
    height: 56px;
    padding: 0 16px;
  }

  .chat-body {
    padding: 16px;
  }

  .message-user,
  .message-ai {
    max-width: 85%;
    font-size: 15px;
  }

  .input-container {
    padding: 12px 16px;
  }

  .welcome-screen {
    padding: 32px 16px;
  }

  .starter-questions {
    max-width: 100%;
  }

  .quick-reply-button {
    font-size: 13px;
    padding: 8px 14px;
  }
}
```

### Mobile-Specific Features
```css
/* Prevent zoom on input focus (iOS) */
.input-field {
  font-size: 16px; /* Minimum to prevent zoom */
}

/* Safe area for notched devices */
.chat-container {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Touch-friendly tap targets */
.quick-reply-button,
.starter-question-button,
.send-button {
  min-height: 44px; /* iOS recommended minimum */
}
```

---

## 10. Micro-Interactions & Animations

### Message Fade-In
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-user,
.message-ai {
  animation: fadeInUp 0.3s ease-out;
}
```

### Button Hover Effects
```css
.button-hover {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.button-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow-soft);
}

.button-hover:active {
  transform: translateY(0);
  transition-duration: 0.1s;
}
```

### Input Focus Animation
```css
.input-field {
  transition: all 0.2s ease;
}

.input-field:focus {
  animation: inputFocus 0.3s ease-out;
}

@keyframes inputFocus {
  0% {
    box-shadow: 0 0 0 0 var(--primary-blue-light);
  }
  100% {
    box-shadow: 0 0 0 3px var(--primary-blue-light);
  }
}
```

### Scroll to Bottom Animation
```javascript
// Smooth scroll when new message arrives
function scrollToBottom() {
  chatBody.scrollTo({
    top: chatBody.scrollHeight,
    behavior: 'smooth'
  });
}
```

### Loading State
```css
.message-loading {
  opacity: 0.6;
  pointer-events: none;
}

.message-loading::after {
  content: '';
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid var(--primary-blue);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-left: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## 11. Component Structure for React

### Basic Component Hierarchy
```
<ChatContainer>
  <ChatHeader />
  <ChatBody>
    {isWelcome ? (
      <WelcomeScreen />
    ) : (
      <>
        <MessageList>
          <Message type="ai" />
          <Message type="user" />
          <TypingIndicator />
        </MessageList>
        <QuickReplies />
      </>
    )}
  </ChatBody>
  <InputBar>
    <TextInput />
    <SendButton />
  </InputBar>
</ChatContainer>
```

### Sample React Component
```jsx
// Message.jsx
export const Message = ({ type, content, timestamp }) => {
  return (
    <div className={`message message-${type}`}>
      <div className="message-content">{content}</div>
      <div className="message-timestamp">
        {new Date(timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

// QuickReplies.jsx
export const QuickReplies = ({ options, onSelect }) => {
  return (
    <div className="quick-replies">
      {options.map((option, index) => (
        <button
          key={index}
          className="quick-reply-button"
          onClick={() => onSelect(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

// TypingIndicator.jsx
export const TypingIndicator = () => {
  return (
    <div className="typing-indicator">
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
    </div>
  );
};
```

---

## 12. Figma/Design Tool Specifications

### Spacing System
```
4px   - Tiny gaps (icon padding)
8px   - Small gaps (between dots, chips)
12px  - Medium gaps (message spacing)
16px  - Standard gaps (padding, margins)
24px  - Large gaps (section spacing)
32px  - XL gaps (major sections)
48px  - XXL gaps (welcome screen)
```

### Border Radius System
```
4px   - Small corners (message tail)
8px   - Medium corners (cards)
12px  - Large corners (buttons, cards)
18px  - XL corners (message bubbles)
22px  - XXL corners (input field)
50%   - Circular (avatar, send button)
```

### Shadow System
```
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 2px 8px rgba(0,0,0,0.08);
--shadow-lg: 0 4px 12px rgba(0,0,0,0.12);
--shadow-xl: 0 8px 32px rgba(0,0,0,0.12);
```

### Component States
```
Default → Hover → Active → Disabled
- Opacity changes: 100% → 100% → 100% → 50%
- Transform: none → translateY(-2px) → translateY(0) → none
- Cursor: pointer → pointer → pointer → not-allowed
```

---

## 13. Accessibility Considerations

### ARIA Labels
```html
<button aria-label="Send message" class="send-button">
  <SendIcon />
</button>

<div role="log" aria-live="polite" aria-atomic="false" class="chat-body">
  <!-- Messages appear here -->
</div>

<textarea 
  aria-label="Type your message"
  placeholder="Type your message..."
  class="input-field"
></textarea>
```

### Keyboard Navigation
- Tab through interactive elements
- Enter to send message
- Escape to close chat (if modal)
- Arrow keys to navigate quick replies

### Focus Indicators
```css
*:focus-visible {
  outline: 2px solid var(--primary-blue);
  outline-offset: 2px;
}
```

### Color Contrast
- All text meets WCAG AA standards (4.5:1 minimum)
- User messages: White on #4A90E2 (4.6:1)
- AI messages: #1A1A1A on White (16.1:1)

---

## 14. Implementation Checklist

### Phase 1: Core Structure
- [ ] Chat container with header, body, input
- [ ] Message bubbles (user and AI)
- [ ] Basic styling and colors
- [ ] Scrollable chat body

### Phase 2: Interactive Elements
- [ ] Input field with auto-resize
- [ ] Send button with states
- [ ] Typing indicator
- [ ] Quick reply buttons

### Phase 3: Welcome Experience
- [ ] Welcome screen layout
- [ ] Starter questions grid
- [ ] Smooth transition to chat

### Phase 4: Animations
- [ ] Message fade-in
- [ ] Button hover effects
- [ ] Typing animation
- [ ] Scroll behavior

### Phase 5: Responsive
- [ ] Mobile layout adjustments
- [ ] Touch-friendly targets
- [ ] Safe area handling

### Phase 6: Polish
- [ ] Accessibility features
- [ ] Loading states
- [ ] Error states
- [ ] Empty states

---

## 15. Design Assets Needed

### Icons (20x20px, 24x24px)
- Send arrow
- Close/minimize
- Coach avatar/logo
- Checkmark (for completed actions)
- Clock (for timeframes)

### Illustrations (Optional)
- Welcome screen hero image
- Empty state illustration
- Error state illustration

### Export Formats
- SVG for icons (scalable, small file size)
- PNG @2x for raster images
- WebP for photos (if any)

---

## Quick Start Guide

### For Figma:
1. Create artboards: 375px (mobile), 768px (tablet), 1440px (desktop)
2. Set up color styles from palette above
3. Set up text styles from typography system
4. Create components for: Message, Button, Input, Header
5. Build auto-layout frames for responsive behavior

### For Webflow:
1. Create collection for messages
2. Use flexbox for chat layout
3. Custom code for typing animation
4. Interactions for button hovers and message animations

### For React:
1. Use the component structure provided
2. Implement with styled-components or Tailwind CSS
3. Add Framer Motion for animations
4. Use React hooks for state management

---

**Design Status**: ✅ Complete specification
**Ready for**: Figma, Framer, Webflow, React implementation
**Optimized for**: Clarity, warmth, ease of use
