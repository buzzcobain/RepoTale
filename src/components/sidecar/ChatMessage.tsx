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
    <div className={`chat ${isUser ? 'chat-end' : 'chat-start'} text-xs leading-relaxed`}>
      <div className="chat-image avatar">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
          isUser ? 'bg-primary text-primary-content' : 'bg-base-200 border border-base-300 text-primary'
        }`}>
          {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
        </div>
      </div>

      <div
        className={`chat-bubble max-w-[85%] p-3.5 space-y-2.5 rounded-lg shadow-none ${
          isUser
            ? 'chat-bubble-primary text-primary-content'
            : 'bg-base-200 text-slate-200 border border-base-300'
        }`}
      >
        {/* Message Content */}
        <div className="whitespace-pre-wrap font-sans text-xs">
          {message.content}
        </div>

        {/* Grounded Symbols Context */}
        {message.referencedSymbols && message.referencedSymbols.length > 0 && (
          <div className="pt-2 border-t border-base-300/80 space-y-1">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Code className="w-3 h-3 text-primary" />
              <span>Grounded AST Symbols</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {message.referencedSymbols.map((sym, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => selectNode(`${sym.filePath}:${sym.name}`)}
                  className="badge badge-xs badge-outline badge-primary font-mono text-[10px] gap-1 hover:bg-primary/20 transition-colors"
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
              <span key={fIdx} className="flex items-center gap-1 bg-base-300/60 px-1.5 py-0.5 rounded border border-base-300">
                <FileText className="w-2.5 h-2.5 text-slate-400" />
                <span>{file.filePath.split('/').pop()}</span>
                {file.lineRange && <span className="text-slate-500">L{file.lineRange[0]}-{file.lineRange[1]}</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="chat-footer opacity-50 text-[10px] font-mono mt-1">
        {message.timestamp}
      </div>
    </div>
  );
};
