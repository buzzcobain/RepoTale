import React from 'react';
import { Chapter } from '../../types/story';
import { useStory } from '../../context/StoryContext';
import { CodeSnippetBlock } from './CodeSnippetBlock';
import { Compass, Box } from 'lucide-react';

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
      className={`relative rounded-xl p-5 transition-all duration-300 border ${
        isActive
          ? 'bg-base-200 border-primary/70 shadow-md ring-1 ring-primary/30'
          : 'bg-base-200/50 border-base-300 opacity-75 hover:opacity-100 hover:border-slate-700'
      }`}
    >
      {/* Chapter Number & Badges */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`badge badge-sm font-mono font-semibold gap-1.5 py-2.5 px-3 ${
              isActive
                ? 'badge-primary shadow-sm'
                : 'badge-neutral text-slate-300'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Chapter {chapter.chapterNumber}
          </span>
          {isActive && (
            <span className="badge badge-xs badge-outline border-primary/50 text-primary font-mono gap-1 py-1">
              Active Focus
            </span>
          )}
        </div>
      </div>

      {/* Chapter Title */}
      <h3 className="text-lg font-bold text-slate-100 tracking-tight mb-2">
        {chapter.title}
      </h3>

      {/* Summary */}
      <p className="text-xs text-slate-300 mb-4 leading-relaxed bg-base-100/70 p-3 rounded-lg border border-base-300">
        {chapter.summary}
      </p>

      {/* Narrative Body */}
      <div className="text-xs text-slate-300/90 leading-relaxed space-y-2.5 font-normal mb-5">
        {chapter.narrative.split('\n\n').map((paragraph, pIdx) => (
          <p key={pIdx}>{paragraph}</p>
        ))}
      </div>

      {/* Focused Node Banner if selected from diagram */}
      {selectedNodeId && (chapter.activeNodes.includes(selectedNodeId) || chapter.codeSnippets.some(s => selectedNodeId.includes(s.filePath))) && (
        <div className="mb-4 p-2.5 rounded-lg bg-base-300/80 border border-primary/40 flex items-center justify-between text-xs text-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>
              Explaining diagram symbol: <strong className="font-mono text-white">{selectedNodeId.split(':').pop()}</strong>
            </span>
          </div>
          <button
            onClick={() => selectNode(null)}
            className="btn btn-xs bg-base-200 hover:bg-base-100 text-slate-300 border-base-300 font-mono"
          >
            Reset focus
          </button>
        </div>
      )}

      {/* Active Symbols / Nodes Pills */}
      {chapter.activeNodes.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-slate-400" />
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
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors border flex items-center gap-1 ${
                    isSelected
                      ? 'bg-primary text-primary-content border-primary shadow-sm font-semibold'
                      : 'bg-base-100 hover:bg-base-300 text-slate-300 border-base-300 hover:border-slate-600'
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
          {chapter.codeSnippets.map((snip, sIdx) => {
            const isSnippetHighlighted = !!selectedNodeId && (
              selectedNodeId.includes(snip.filePath) ||
              snip.code.includes(selectedNodeId.split(':').pop() || '')
            );
            return (
              <CodeSnippetBlock
                key={sIdx}
                snippet={snip}
                isHighlighted={isSnippetHighlighted}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
