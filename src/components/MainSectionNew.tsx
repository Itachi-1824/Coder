'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Settings, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useBranchStore } from '@/store/branchStore';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'status';
  content: string;
  timestamp: Date;
  status?: 'analyzing' | 'generating' | 'completed' | 'error';
}

export default function MainSection() {
  const { getCurrentBranch, updateBranchChat } = useBranchStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isInitialLoadRef = useRef(true);
  
  const currentBranch = getCurrentBranch();

  // Load messages from current branch on mount/branch change
  useEffect(() => {
    if (currentBranch) {
      isInitialLoadRef.current = true;
      
      if (currentBranch.chatHistory.length > 0) {
        setMessages(currentBranch.chatHistory);
      } else {
        const welcomeMessage: Message = {
          id: 'welcome',
          type: 'ai',
          content: `# Welcome! 👋

I'm your AI coding assistant. I can help you:

- **Build projects** from descriptions
- **Fix errors** and debug code  
- **Explain code** and answer questions
- **Generate files** directly in your project

**Current Branch:** ${currentBranch.name}

What would you like to build today?`,
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
      
      // Mark initial load as complete
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 100);
    }
  }, [currentBranch?.id]);

  // Save messages to store (with proper debouncing to prevent infinite loops)
  const saveMessagesToStore = useCallback((messagesToSave: Message[]) => {
    if (!isInitialLoadRef.current && currentBranch?.id && messagesToSave.length > 0) {
      updateBranchChat(currentBranch.id, messagesToSave);
    }
  }, [currentBranch?.id, updateBranchChat]);

  // Auto-save messages with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveMessagesToStore(messages);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [messages, saveMessagesToStore]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simple AI response simulation
  const simulateAIResponse = async (userInput: string): Promise<string> => {
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simple responses based on input
    if (userInput.toLowerCase().includes('hello') || userInput.toLowerCase().includes('hi')) {
      return "Hello! I'm here to help you with your coding projects. What would you like to build?";
    }
    
    if (userInput.toLowerCase().includes('create') || userInput.toLowerCase().includes('build') || userInput.toLowerCase().includes('make')) {
      return `I'd be happy to help you create that! Here's what I can do:

## 🔧 Development Capabilities
- Generate complete project structures
- Create individual files with proper syntax
- Fix bugs and optimize code
- Explain complex concepts

To get started, please provide more details about what you'd like to build. For example:
- "Create a calculator app"
- "Build a todo list with React"
- "Make a simple landing page"

The more specific you are, the better I can help!`;
    }
    
    if (userInput.toLowerCase().includes('fix') || userInput.toLowerCase().includes('error') || userInput.toLowerCase().includes('bug')) {
      return `I can help you fix that issue! Here's my approach:

## 🔍 Debugging Process
1. **Analyze** the error message and code context
2. **Identify** the root cause
3. **Provide** a clear solution with explanations
4. **Test** to ensure the fix works

Please share:
- The error message you're seeing
- The relevant code snippet
- What you were trying to accomplish

I'll help you get it working!`;
    }
    
    return `I understand you want help with: "${userInput}"

I'm an AI coding assistant that can help you with:
- **Building projects** from scratch
- **Fixing errors** and debugging
- **Explaining code** concepts
- **Optimizing performance**

Could you provide more specific details about what you're looking for? The more context you give me, the better I can assist you!`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      type: 'user', 
      content: inputMessage,
      timestamp: new Date()
    };

    const currentInput = inputMessage;
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Add status message
      const statusMessage: Message = {
        id: `${Date.now()}-status`,
        type: 'status',
        content: '🤔 Thinking...',
        timestamp: new Date(),
        status: 'analyzing'
      };
      setMessages(prev => [...prev, statusMessage]);

      // Get AI response
      const aiResponse = await simulateAIResponse(currentInput);

      // Remove status message and add AI response
      setMessages(prev => {
        const withoutStatus = prev.filter(msg => msg.id !== statusMessage.id);
        return [...withoutStatus, {
          id: `${Date.now()}-ai`,
          type: 'ai',
          content: aiResponse,
          timestamp: new Date()
        }];
      });

    } catch (error) {
      setMessages(prev => [...prev, {
        id: `${Date.now()}-error`,
        type: 'ai',
        content: '❌ Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        status: 'error'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-lg font-semibold text-white">AI Assistant</h1>
              <p className="text-sm text-gray-400">
                Branch: {currentBranch?.name || 'main'}
              </p>
            </div>
          </div>
          <button className="btn-ghost btn-sm">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <div className="flex-shrink-0">
                {message.type === 'user' ? (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                ) : message.type === 'status' ? (
                  <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="card-glass p-4 rounded-lg">
                  {message.type === 'status' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400">{message.content}</span>
                      {message.status && (
                        <span className="text-xs text-gray-400 capitalize">
                          {message.status}
                        </span>
                      )}
                    </div>
                  ) : (
                    <ReactMarkdown 
                      className="prose prose-sm prose-invert max-w-none"
                      components={{
                        code: ({ children, className }) => (
                          <code className={`${className} bg-gray-800 px-2 py-1 rounded text-blue-300`}>
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-gray-900 p-3 rounded-lg overflow-x-auto text-sm">
                            {children}
                          </pre>
                        ),
                        h1: ({ children }) => (
                          <h1 className="text-xl font-bold text-white mb-3">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg font-semibold text-white mb-2">{children}</h2>
                        ),
                        p: ({ children }) => (
                          <p className="text-gray-200 mb-2">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside space-y-1 text-gray-200">{children}</ul>
                        ),
                        li: ({ children }) => (
                          <li className="text-gray-200">{children}</li>
                        )
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-white/10 bg-black/20 backdrop-blur-md">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about coding..."
            className="input-premium flex-1 min-h-[44px] max-h-32 resize-none"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="btn-primary btn-sm px-4 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
