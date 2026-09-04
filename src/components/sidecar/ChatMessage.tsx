import React from 'react';
import { QAMessage } from '../../types/api';
import { useStory } from '../../context/StoryContext';
import { Bot, User, Code, FileText, ArrowRight } from 'lucide-react';

interface ChatMessageProps {
  message: QAMessage;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { selectNode } = useStory();
  const isUser = message.sender === 'user';

  return (
    <div className={`flex gap-3 text-xs leading-relaxed ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div className={`max-w-[85%] rounded-2xl p-4 space-y-3 ${
        isUser
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
          : 'bg-slate-900/90 border border-slate-800 text-slate-200 shadow-xl'
      }`}>
        {/* Message Content */}
        <div className="whitespace-pre-wrap font-sans">
          {message.content}
        </div>

        {/* Grounded Symbols Context */}
        {message.referencedSymbols && message.referencedSymbols.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
              <Code className="w-3 h-3" />
              <span>Grounded AST Symbols</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {message.referencedSymbols.map((sym, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => selectNode(`${sym.filePath}:${sym.name}`)}
                  className="px-2 py-1 rounded bg-slate-950 border border-indigo-900/40 hover:border-indigo-500 text-indigo-300 font-mono text-[11px] flex items-center gap-1 transition-all"
                  title={`Inspect ${sym.name} in ${sym.filePath}`}
                >
                  <span>{sym.name}</span>
                  <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grounded Files Context */}
        {message.referencedFiles && message.referencedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1 text-[10px] font-mono text-slate-400 pt-1">
            {message.referencedFiles.map((file, fIdx) => (
              <span key={fIdx} className="flex items-center gap-1 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                <FileText className="w-2.5 h-2.5 text-slate-500" />
                <span>{file.filePath.split('/').pop()}</span>
                {file.lineRange && <span className="text-slate-500">L{file.lineRange[0]}-{file.lineRange[1]}</span>}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-[10px] ${isUser ? 'text-indigo-200' : 'text-slate-500'} text-right`}>
          {message.timestamp}
        </div>
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
