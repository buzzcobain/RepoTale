import React, { useEffect, useRef } from 'react';
import { useStory } from '../../context/StoryContext';
import { ChapterCard } from './ChapterCard';
import { ProgressBar } from './ProgressBar';
import { GitBranch, Layers, Terminal } from 'lucide-react';

export const NarrativePane: React.FC = () => {
  const { story, activeChapterIndex, setActiveChapterIndex } = useStory();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = container.querySelectorAll('[id^="chapter-card-"]');
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const idx = parseInt(id.replace('chapter-card-', ''), 10);
            if (!isNaN(idx)) {
              setActiveChapterIndex(idx);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.4,
        rootMargin: '-5% 0px -40% 0px',
      }
    );

    cards.forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();
    };
  }, [story.chapters, setActiveChapterIndex]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto p-6 lg:p-8 space-y-8 scroll-smooth"
    >
      {/* Fixed Sticky Progress Tracker */}
      <ProgressBar />

      {/* Repository Overview Hero Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-950/50 via-slate-900/80 to-slate-950 border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-2">
            <GitBranch className="w-3.5 h-3.5" />
            <span>Architecture Walkthrough</span>
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
            {story.meta.repoName}
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            {story.meta.description || 'Interactive code story and system call graph.'}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 font-medium">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>{story.meta.primaryLanguage}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <span>Entry: {story.meta.entryPoint}</span>
            </div>

            {(story.meta.frameworks || []).map((framework, fIdx) => (
              <span
                key={fIdx}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700 font-medium"
              >
                {framework}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Chapters Sequential Feed */}
      <div className="space-y-8 pb-16">
        {story.chapters.map((chapter, idx) => (
          <ChapterCard
            key={chapter.id || idx}
            chapter={chapter}
            index={idx}
            isActive={idx === activeChapterIndex}
          />
        ))}
      </div>
    </div>
  );
};
