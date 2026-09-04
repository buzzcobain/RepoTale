import React from 'react';
import { Chapter } from '../../types/story';
import { useStory } from '../../context/StoryContext';
import { CodeSnippetBlock } from './CodeSnippetBlock';
import { Compass, Sparkles, Box } from 'lucide-react';

interface ChapterCardProps {
  chapter: Chapter;
  index: number;
  isActive: boolean;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({ chapter, index, isActive }) => {
  const { selectNode, selectedNodeId } = useStory();

  return (
    <div
      id={`chapter-card-${index}`}
      className={`relative rounded-2xl p-6 transition-all duration-500 border ${
        isActive
          ? 'bg-slate-900/80 border-indigo-500/60 shadow-2xl shadow-indigo-500/10 ring-1 ring-indigo-500/30'
          : 'bg-slate-900/40 border-slate-800/80 opacity-75 hover:opacity-100 hover:border-slate-700'
      }`}
    >
      {/* Chapter Number & Badges */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${
              isActive
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Chapter {chapter.chapterNumber}
          </span>
          {isActive && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-800/50">
              <Sparkles className="w-3 h-3" />
              Active Focus
            </span>
          )}
        </div>
      </div>

      {/* Chapter Title */}
      <h3 className="text-xl font-bold text-white tracking-tight mb-2">
        {chapter.title}
      </h3>

      {/* Summary */}
      <p className="text-sm font-medium text-slate-300 mb-4 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-850">
        {chapter.summary}
      </p>

      {/* Narrative Body */}
      <div className="text-sm text-slate-300/90 leading-relaxed space-y-3 font-normal mb-5">
        {chapter.narrative.split('\n\n').map((paragraph, pIdx) => (
          <p key={pIdx}>{paragraph}</p>
        ))}
      </div>

      {/* Active Symbols / Nodes Pills */}
      {chapter.activeNodes.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-indigo-400" />
            <span>Active Graph Symbols:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {chapter.activeNodes.map((nodeId) => {
              const label = nodeId.split(':').pop() || nodeId;
              const isSelected = selectedNodeId === nodeId;
              return (
                <button
                  key={nodeId}
                  onClick={() => selectNode(isSelected ? null : nodeId)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border flex items-center gap-1 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-400/50'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-indigo-300 border-slate-700 hover:border-indigo-500/50'
                  }`}
                  title="Click to highlight on canvas"
                >
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Code Snippets List */}
      {chapter.codeSnippets.length > 0 && (
        <div className="space-y-4 pt-2">
          {chapter.codeSnippets.map((snip, sIdx) => (
            <CodeSnippetBlock key={sIdx} snippet={snip} />
          ))}
        </div>
      )}
    </div>
  );
};
