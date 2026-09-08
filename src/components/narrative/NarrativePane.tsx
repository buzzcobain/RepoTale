import React, { useEffect, useRef } from 'react';
import { useStory } from '../../context/StoryContext';
import { ChapterCard } from './ChapterCard';
import { ProgressBar } from './ProgressBar';
import { GitBranch, Layers, Terminal, Sparkles, Map, BookOpen, ShieldCheck, ExternalLink } from 'lucide-react';
import { RepoTaleLogoLockup } from '../common/RepoTaleLogo';

export const NarrativePane: React.FC = () => {
  const { story, activeChapterIndex, setActiveChapterIndex } = useStory();
  const containerRef = useRef<HTMLDivElement>(null);
  const isRepoTale = story.meta.repoName === 'buzzcobain/RepoTale' || !story.meta.repoName;
  const githubUrl = story.meta.githubUrl || 'https://github.com/buzzcobain/RepoTale';

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

      {/* Hero Explainer Banner for RepoTale */}
      {isRepoTale ? (
        <section className="p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-[11px] font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Open-Source Codebase Storytelling</span>
              </div>

              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
                Turn complex codebases into{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
                  interactive visual stories
                </span>.
              </h1>

              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                RepoTale solves the cognitive overload of onboarding into unfamiliar repositories. It ingests your project, extracts the AST call graph, and generates an interactive, chapter-driven walkthrough synchronized with a visual architectural diagram.
              </p>
            </div>

            {/* Official Logo Lockup */}
            <div className="hidden md:flex shrink-0 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-2xl">
              <RepoTaleLogoLockup size={110} showTagline={true} />
            </div>
          </div>

          {/* 3 Feature Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-sm">
              <div className="flex items-center gap-2 mb-1.5 text-indigo-400">
                <Map className="w-4 h-4" />
                <h3 className="text-xs font-bold text-slate-200">Interactive Call Graph</h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">Dynamic visual canvas tracking entrypoints, classes, and service dependencies.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-sm">
              <div className="flex items-center gap-2 mb-1.5 text-indigo-400">
                <BookOpen className="w-4 h-4" />
                <h3 className="text-xs font-bold text-slate-200">Parallax Narrative</h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">Scroll chapters as the camera choreographs to highlight active subgraphs.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-sm">
              <div className="flex items-center gap-2 mb-1.5 text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
                <h3 className="text-xs font-bold text-slate-200">100% Local-First</h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">Tree-sitter AST parsing with sandboxed git clones and optional Ollama support.</p>
            </div>
          </div>

          {/* Live Demo Notice & Action Button */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-indigo-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-emerald-300">Live Demo Below:</span>
              <span className="text-slate-300">RepoTale exploring its own codebase</span>
            </div>

            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/25 flex items-center gap-1.5"
            >
              <span>View on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </section>
      ) : (
        /* Repository Overview Banner for Other Projects */
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
      )}

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
