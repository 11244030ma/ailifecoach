/**
 * WorkLife AI Coach - Chat Interface Components
 * Complete React implementation with TypeScript
 */

import React, { useState, useRef, useEffect } from 'react';
import './ChatInterface.css';

// ============================================================================
// Types
// ============================================================================

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface QuickReply {
  text: string;
  action: string;
}

// ============================================================================
// Main Chat Container
// ============================================================================

export const ChatContainer: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isWelcome, setIsWelcome] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsWelcome(false);

    // Simulate AI response
    setIsTyping(true);
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'I understand where you\'re coming from. Let me help you work through this.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickReply = (text: string) => {
    handleSendMessage(text);
  };

  return (
    <div className="chat-container">
      <ChatHeader />
      <ChatBody
        messages={messages}
        isWelcome={isWelcome}
        isTyping={isTyping}
        onQuickReply={handleQuickReply}
      />
      <InputBar
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSendMessage}
      />
    </div>
  );
};

// ============================================================================
// Chat Header
// ============================================================================

const ChatHeader: React.FC = () => {
  return (
    <div className="chat-header">
      <div>
        <div className="chat-header-title">WorkLife Coach</div>
        <div className="chat-header-subtitle">Here to help you get unstuck</div>
      </div>
      <div className="chat-header-actions">
        <button className="header-button" aria-label="Minimize">
          <MinimizeIcon />
        </button>
        <button className="header-button" aria-label="Close">
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Chat Body
// ============================================================================

interface ChatBodyProps {
  messages: Message[];
  isWelcome: boolean;
  isTyping: boolean;
  onQuickReply: (text: string) => void;
}

const ChatBody: React.FC<ChatBodyProps> = ({
  messages,
  isWelcome,
  isTyping,
  onQuickReply
}) => {
  const chatBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  return (
    <div className="chat-body" ref={chatBodyRef}>
      {isWelcome ? (
        <WelcomeScreen onQuickReply={onQuickReply} />
      ) : (
        <>
          <MessageList messages={messages} />
          {isTyping && <TypingIndicator />}
          {messages.length > 0 && messages[messages.length - 1].type === 'ai' && (
            <QuickReplies onSelect={onQuickReply} />
          )}
        </>
      )}
    </div>
  );
};

// ============================================================================
// Welcome Screen
// ============================================================================

interface WelcomeScreenProps {
  onQuickReply: (text: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onQuickReply }) => {
  const starterQuestions = [
    "I'm not sure what career path is right for me",
    "I feel stuck in my current job",
    "What skills should I learn next?",
    "I want to switch careers but don't know how",
    "How do I grow in my current role?",
    "I'm overwhelmed with too many goals"
  ];

  return (
    <div className="welcome-screen">
      <div className="welcome-icon">💼</div>
      <h1 className="welcome-title">Hi! I'm your WorkLife coach</h1>
      <p className="welcome-subtitle">
        I'm here to help you get unstuck in your career—whether you're figuring out 
        what to learn next, thinking about switching fields, or just feeling lost 
        about where you're headed. Let's talk through it together.
      </p>
      <div className="starter-questions">
        {starterQuestions.map((question, index) => (
          <button
            key={index}
            className="starter-question-button"
            onClick={() => onQuickReply(question)}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Message List
// ============================================================================

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="message-list">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
};

// ============================================================================
// Message Bubble
// ============================================================================

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className={`message message-${message.type}`}>
      <div className="message-content">{message.content}</div>
      <div className="message-timestamp">{formatTime(message.timestamp)}</div>
    </div>
  );
};

// ============================================================================
// Typing Indicator
// ============================================================================

const TypingIndicator: React.FC = () => {
  return (
    <div className="typing-indicator">
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
    </div>
  );
};

// ============================================================================
// Quick Replies
// ============================================================================

interface QuickRepliesProps {
  onSelect: (text: string) => void;
}

const QuickReplies: React.FC<QuickRepliesProps> = ({ onSelect }) => {
  const replies = [
    "Tell me more",
    "What should I do first?",
    "I need help with skills",
    "Career change advice"
  ];

  return (
    <div className="quick-replies">
      {replies.map((reply, index) => (
        <button
          key={index}
          className="quick-reply-button"
          onClick={() => onSelect(reply)}
        >
          {reply}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// Input Bar
// ============================================================================

interface InputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
}

const InputBar: React.FC<InputBarProps> = ({ value, onChange, onSend }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend(value);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSend = () => {
    onSend(value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="input-container">
      <div className="input-wrapper">
        <textarea
          ref={textareaRef}
          className="input-field"
          placeholder="Type your message..."
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          aria-label="Type your message"
        />
      </div>
      <button
        className="send-button"
        onClick={handleSend}
        disabled={!value.trim()}
        aria-label="Send message"
      >
        <SendIcon />
      </button>
    </div>
  );
};

// ============================================================================
// Icons
// ============================================================================

const SendIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M2 10L18 2L10 18L8 11L2 10Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="currentColor"
    />
  </svg>
);

const MinimizeIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M4 10H16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M4 4L16 16M16 4L4 16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default ChatContainer;
