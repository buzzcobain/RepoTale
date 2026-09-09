import React, { useState, useRef, useEffect } from 'react';
import { useStory } from '../../context/StoryContext';
import { useSettings } from '../../context/SettingsContext';
import { ChatMessage } from './ChatMessage';
import { X, Send, Sparkles, Trash2, Bot, HelpCircle, Loader2 } from 'lucide-react';

export const QASidecarDrawer: React.FC = () => {
  const {
    story,
    activeChapterIndex,
    isSidecarOpen,
    setIsSidecarOpen,
    messages,
    askQuestion,
    clearChat,
    isAskingQuestion,
  } = useStory();
  const { settings } = useSettings();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChapter = story.chapters[activeChapterIndex] || story.chapters[0];

  useEffect(() => {
    if (isSidecarOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSidecarOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAskingQuestion) return;
    const text = input;
    setInput('');
    await askQuestion(text);
  };

  const suggestedQuestions = [
    `How does ${story.meta.entryPoint} initialize the application lifecycle?`,
    `Explain the data flow in Chapter ${currentChapter?.chapterNumber || 1} (${currentChapter?.title || 'Gateway'}).`,
    `What are the security and middleware guards protecting incoming requests?`,
    `How are database models serialized and validated?`,
  ];

  if (!isSidecarOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-base-100 border-l border-base-300 shadow-2xl flex flex-col transition-all duration-200">
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-base-300 flex items-center justify-between bg-base-200/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-base-300 border border-base-300 flex items-center justify-center text-primary">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
              <span>Architectural Copilot</span>
              <span className="badge badge-xs badge-neutral font-mono text-[10px]">
                {settings.selectedModel.split(':').pop() || settings.selectedModel}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Context-grounded repository sidecar</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            className="btn btn-ghost btn-xs h-7 w-7 p-0 text-slate-400 hover:text-white"
            title="Clear chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsSidecarOpen(false)}
            className="btn btn-ghost btn-xs h-7 w-7 p-0 text-slate-400 hover:text-white"
            title="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Focus Pill Indicator */}
      <div className="px-3.5 py-1.5 bg-base-200 border-b border-base-300 flex items-center justify-between text-[11px] text-slate-300 font-mono">
        <div className="flex items-center gap-1.5 truncate">
          <Sparkles className="w-3 h-3 text-primary shrink-0" />
          <span className="font-medium truncate">
            Grounded in: Chapter {currentChapter?.chapterNumber} ({currentChapter?.title})
          </span>
        </div>
        <span className="text-slate-500 text-[10px] shrink-0">
          {currentChapter?.activeNodes.length || 0} AST nodes
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isAskingQuestion && (
          <div className="flex gap-2.5 text-xs justify-start items-center">
            <div className="w-7 h-7 rounded-md bg-base-200 border border-base-300 flex items-center justify-center text-primary shrink-0">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="p-2.5 rounded-lg bg-base-200 border border-base-300 text-slate-400 flex items-center gap-2 text-xs font-mono">
              <span>Retrieving AST symbols & grounding response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length < 3 && !isAskingQuestion && (
        <div className="px-3.5 py-2.5 border-t border-base-300 bg-base-200/50">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-primary" />
            <span>Suggested Inquiries</span>
          </div>
          <div className="flex flex-col gap-1">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => askQuestion(q)}
                className="text-left text-[11px] font-mono px-2.5 py-1.5 rounded bg-base-100 hover:bg-base-300 text-slate-300 hover:text-white border border-base-300 transition-colors line-clamp-1"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Question Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-base-300 bg-base-200/60">
        <div className="relative flex items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={`Ask about ${story.meta.repoName} architecture...`}
            rows={2}
            className="textarea textarea-bordered textarea-sm w-full pl-3 pr-10 py-2 bg-base-100 border-base-300 focus:border-primary text-xs text-white placeholder-slate-500 resize-none font-sans"
          />
          <button
            type="submit"
            disabled={!input.trim() || isAskingQuestion}
            className="btn btn-primary btn-sm h-7 min-h-0 px-2 absolute right-2 bottom-2 font-mono"
            title="Send query"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 px-1">
          <span>Press Enter to send, Shift+Enter for newline</span>
          <span>Zero Hallucination Grounding</span>
        </div>
      </form>
    </div>
  );
};
