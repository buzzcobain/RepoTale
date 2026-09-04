import React, { useState } from 'react';
import { CodeSnippet } from '../../types/story';
import { Copy, Check, FileCode, Tag } from 'lucide-react';

interface CodeSnippetBlockProps {
  snippet: CodeSnippet;
}

export const CodeSnippetBlock: React.FC<CodeSnippetBlockProps> = ({ snippet }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fileName = snippet.filePath.split('/').pop() || snippet.filePath;

  return (
    <div className="mt-4 rounded-xl bg-slate-950 border border-slate-800/90 overflow-hidden shadow-xl">
      {/* File Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 font-mono text-slate-300">
          <FileCode className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-slate-200">{fileName}</span>
          <span className="text-slate-500 font-normal">
            ({snippet.filePath}) • L{snippet.startLine}-{snippet.endLine}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-[11px]"
          title="Copy code snippet"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
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
        <div className="flex items-start gap-2 px-3.5 py-2 bg-indigo-950/30 border-b border-indigo-900/30 text-xs text-indigo-300">
          <Tag className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
          <span className="italic font-sans">{snippet.annotation}</span>
        </div>
      )}

      {/* Code contents with line numbering */}
      <div className="p-4 overflow-x-auto text-xs font-mono text-indigo-100/90 leading-relaxed">
        <pre className="selection:bg-indigo-600 selection:text-white">
          <code>{snippet.code}</code>
        </pre>
      </div>
    </div>
  );
};
