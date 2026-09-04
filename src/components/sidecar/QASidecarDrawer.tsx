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
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-300">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>Architectural Copilot</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                {settings.selectedModel.split(':').pop() || settings.selectedModel}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Context-grounded repository sidecar</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsSidecarOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Active Focus Pill Indicator */}
      <div className="px-4 py-2 bg-indigo-950/40 border-b border-indigo-900/30 flex items-center justify-between text-[11px] text-indigo-300">
        <div className="flex items-center gap-1.5 truncate">
          <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
          <span className="font-medium truncate">
            Grounded in: Chapter {currentChapter?.chapterNumber} ({currentChapter?.title})
          </span>
        </div>
        <span className="text-slate-400 text-[10px] shrink-0">
          {currentChapter?.activeNodes.length || 0} AST nodes
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isAskingQuestion && (
          <div className="flex gap-3 text-xs justify-start items-center">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-2">
              <span className="animate-pulse">Retrieving AST symbols & grounding response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length < 3 && !isAskingQuestion && (
        <div className="px-4 py-2 border-t border-slate-900 bg-slate-950/40">
          <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-indigo-400" />
            <span>Suggested Inquiries</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => askQuestion(q)}
                className="text-left text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-indigo-950/50 text-slate-300 hover:text-indigo-200 border border-slate-800 hover:border-indigo-700/50 transition-all line-clamp-1"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Question Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-900/80">
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
            className="w-full pl-3 pr-12 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-white placeholder-slate-500 resize-none font-sans"
          />
          <button
            type="submit"
            disabled={!input.trim() || isAskingQuestion}
            className="absolute right-2.5 bottom-2.5 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all shadow-md shadow-indigo-600/20"
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
