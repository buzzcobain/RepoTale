import React from 'react';
import { useStory } from '../../context/StoryContext';

export const ProgressBar: React.FC = () => {
  const { story, activeChapterIndex, setActiveChapterIndex } = useStory();
  const totalChapters = story.chapters.length;
  const progressPercent = totalChapters > 1 ? (activeChapterIndex / (totalChapters - 1)) * 100 : 100;

  return (
    <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md pb-4 pt-1 border-b border-slate-900">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
        <span className="text-indigo-400 font-semibold">
          Chapter {activeChapterIndex + 1} of {totalChapters}
        </span>
        <span>{Math.round(progressPercent)}% Read</span>
      </div>

      {/* Track */}
      <div className="relative h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Chapter Step Dots */}
      <div className="flex justify-between mt-2.5 px-0.5">
        {story.chapters.map((chap, idx) => {
          const isActive = idx === activeChapterIndex;
          const isPassed = idx < activeChapterIndex;
          return (
            <button
              key={chap.id}
              onClick={() => {
                setActiveChapterIndex(idx);
                const el = document.getElementById(`chapter-card-${idx}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`group relative flex flex-col items-center focus:outline-none`}
              title={`Jump to Chapter ${chap.chapterNumber}: ${chap.title}`}
            >
              <span
                className={`w-3 h-3 rounded-full transition-all duration-200 border ${
                  isActive
                    ? 'bg-indigo-500 border-indigo-400 ring-4 ring-indigo-500/20 scale-125'
                    : isPassed
                    ? 'bg-indigo-900 border-indigo-700'
                    : 'bg-slate-800 border-slate-700 group-hover:border-slate-500'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
