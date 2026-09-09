import React, { useState } from 'react';
import { CodeSnippet } from '../../types/story';
import { Copy, Check, FileCode, Tag } from 'lucide-react';

interface CodeSnippetBlockProps {
  snippet: CodeSnippet;
  isHighlighted?: boolean;
}

export const CodeSnippetBlock: React.FC<CodeSnippetBlockProps> = ({ snippet, isHighlighted }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fileName = snippet.filePath.split('/').pop() || snippet.filePath;

  return (
    <div
      className={`mt-4 rounded-lg bg-[#07090e] overflow-hidden transition-all duration-200 ${
        isHighlighted
          ? 'border border-primary ring-1 ring-primary/40 shadow-sm'
          : 'border border-base-300'
      }`}
    >
      {/* File Header bar with macOS window dots */}
      <div
        className={`flex items-center justify-between px-3.5 py-2 border-b text-xs ${
          isHighlighted
            ? 'bg-base-200/90 border-primary/40'
            : 'bg-base-200/70 border-base-300'
        }`}
      >
        <div className="flex items-center gap-3 font-mono text-slate-300 min-w-0">
          {/* macOS window dots */}
          <div className="flex items-center gap-1.5 shrink-0 opacity-75">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
          </div>

          <div className="flex items-center gap-2 truncate">
            <FileCode className={`w-3.5 h-3.5 shrink-0 ${isHighlighted ? 'text-primary' : 'text-slate-400'}`} />
            <span className={`font-semibold truncate ${isHighlighted ? 'text-white' : 'text-slate-200'}`}>
              {fileName}
            </span>
            <span className="text-slate-500 font-normal truncate hidden sm:inline">
              ({snippet.filePath}) • L{snippet.startLine}-{snippet.endLine}
            </span>
            {isHighlighted && (
              <span className="badge badge-xs badge-primary font-mono shrink-0">
                Selected
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="btn btn-ghost btn-xs h-7 min-h-0 px-2 font-mono text-[11px] text-slate-400 hover:text-white border border-base-300 hover:border-slate-600 shrink-0"
          title="Copy code snippet"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-success" />
              <span className="text-success font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Optional annotation */}
      {snippet.annotation && (
        <div className="flex items-start gap-2 px-3.5 py-2 bg-base-200/40 border-b border-base-300 text-xs text-slate-300">
          <Tag className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <span className="font-sans">{snippet.annotation}</span>
        </div>
      )}

      {/* Code contents */}
      <div className="p-4 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed bg-[#07090e]">
        <pre className="selection:bg-primary/30 selection:text-white">
          <code>{snippet.code}</code>
        </pre>
      </div>
    </div>
  );
};
