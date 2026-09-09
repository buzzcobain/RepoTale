import React from 'react';
import { useStory } from '../../context/StoryContext';

export const ProgressBar: React.FC = () => {
  const { story, activeChapterIndex, setActiveChapterIndex } = useStory();
  const totalChapters = story.chapters.length;
  const progressPercent = totalChapters > 1 ? (activeChapterIndex / (totalChapters - 1)) * 100 : 100;

  return (
    <div className="sticky top-0 z-20 bg-base-100/95 backdrop-blur-md pb-3 pt-1 border-b border-base-300">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-mono">
        <span className="text-primary font-semibold">
          Chapter {activeChapterIndex + 1} of {totalChapters}
        </span>
        <span>{Math.round(progressPercent)}% Read</span>
      </div>

      {/* Track */}
      <div className="relative h-1 w-full bg-base-300 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Chapter Step Dots */}
      <div className="flex justify-between mt-2 px-0.5">
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
                className={`w-2.5 h-2.5 rounded-full transition-all duration-150 border ${
                  isActive
                    ? 'bg-primary border-primary scale-125'
                    : isPassed
                    ? 'bg-primary/50 border-primary/60'
                    : 'bg-base-300 border-base-300 group-hover:border-slate-500'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
