import React, { useEffect, useRef } from 'react';
import { useStory } from '../../context/StoryContext';
import { SAMPLE_STORIES } from '../../services/sampleStories';
import { ChapterCard } from './ChapterCard';
import { ProgressBar } from './ProgressBar';
import { 
  GitBranch, Layers, Terminal, Sparkles, Map, 
  ExternalLink, ArrowRight, Rocket, Globe, FileCode2
} from 'lucide-react';
import { RepoTaleLogoLockup } from '../common/RepoTaleLogo';

export const NarrativePane: React.FC = () => {
  const { story, activeChapterIndex, setActiveChapterIndex, loadStory } = useStory();
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

          {/* Headline & Logo Lockup */}
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
                RepoTale extracts the AST call graph of any repository and generates an interactive, chapter-driven walkthrough synchronized with a visual architectural diagram.
              </p>
            </div>

            {/* Official Logo Lockup */}
            <div className="hidden md:flex shrink-0 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-2xl">
              <RepoTaleLogoLockup size={110} showTagline={true} />
            </div>
          </div>

          {/* 3-Step Lifecycle: How It Works on Any Repo */}
          <div className="mt-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/50">
                How It Works for Your Repo
              </span>
              <span className="text-xs text-slate-400">From code to hosted interactive tour in 3 steps:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-sm relative overflow-hidden">
                <div className="text-[10px] font-mono font-bold text-indigo-400 mb-1 flex items-center gap-1">
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>01. INGEST</span>
                </div>
                <h3 className="text-xs font-bold text-slate-200 mb-1">Point to Any Codebase</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Provide a GitHub URL or local repository folder. Tree-sitter extracts functions, call-sites, and imports across TS, Python, Rust, and Go.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-sm relative overflow-hidden">
                <div className="text-[10px] font-mono font-bold text-indigo-400 mb-1 flex items-center gap-1">
                  <Map className="w-3.5 h-3.5" />
                  <span>02. VISUALIZE</span>
                </div>
                <h3 className="text-xs font-bold text-slate-200 mb-1">Auto-Generate Story</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Generates an interactive chapter-by-chapter guided walkthrough synchronized with an animated React Flow call graph.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-sm relative overflow-hidden">
                <div className="text-[10px] font-mono font-bold text-indigo-400 mb-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  <span>03. PUBLISH</span>
                </div>
                <h3 className="text-xs font-bold text-slate-200 mb-1">Host Free Anywhere</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Emits a zero-dependency <code className="text-indigo-300">/docs/index.html</code>. Host 100% free on GitHub Pages, Netlify, Cloudflare, or your custom domain.
                </p>
              </div>
            </div>
          </div>

          {/* Dual-Layer Connection Showcase */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/25 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span>🔗</span>
                <span>The Dual-Layer Connection: README to Hosted Web Tour</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                1-Click Navigation
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              RepoTale adds an interactive badge to your repository's <code className="text-indigo-300 font-mono">README.md</code>. When anyone clicks it, it launches your hosted visual walkthrough on <strong>GitHub Pages</strong>, <strong>Netlify</strong>, or your own <strong>custom domain</strong> (just like this site!):
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-slate-400 font-sans text-[11px]">README.md badge:</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 text-white font-bold text-[11px] shadow-sm">
                  🧭 RepoTale | Interactive Tour
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-400 hidden sm:block shrink-0" />
              <div className="flex items-center gap-1.5 text-indigo-300 truncate">
                <span className="text-slate-400 font-sans text-[11px]">Opens web tour:</span>
                <span className="underline decoration-indigo-500/60 underline-offset-2 truncate">
                  https://yourname.github.io/your-repo/
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons & Live Demo Switcher */}
          <div className="pt-5 border-t border-slate-800/80 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-indigo-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-medium text-emerald-300">Live Demo Below:</span>
                <span className="text-slate-300">RepoTale analyzing its own architecture</span>
              </div>

              <div className="flex items-center gap-2.5">
                <a
                  href="https://github.com/buzzcobain/RepoTale#quickstart"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/25 flex items-center gap-1.5"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Use on Your Repo (Free)</span>
                </a>

                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <span>View Source</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Multi-Repo Live Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/90">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Switch Live Demo:</span>
                <span className="text-slate-400 hidden sm:inline text-xs">Explore how RepoTale visualizes different architectures:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => loadStory(SAMPLE_STORIES['repotale'])}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    story.meta.repoName === 'buzzcobain/RepoTale'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span>🧭</span>
                  <span>RepoTale (Tauri/React)</span>
                </button>
                <button
                  onClick={() => loadStory(SAMPLE_STORIES['fastapi'])}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    story.meta.repoName === 'tiangolo/fastapi'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span>⚡</span>
                  <span>FastAPI (Python)</span>
                </button>
                <button
                  onClick={() => loadStory(SAMPLE_STORIES['trpc'])}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                    story.meta.repoName === 'trpc/trpc'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span>🔗</span>
                  <span>tRPC (TypeScript)</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* Repository Overview Banner for Other Projects */
        <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-950/50 via-slate-900/80 to-slate-950 border border-indigo-500/20 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Quick Switcher Back to RepoTale */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Sample Switcher:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => loadStory(SAMPLE_STORIES['repotale'])}
                  className="px-2 py-0.5 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium transition-colors"
                >
                  🧭 Back to RepoTale
                </button>
                <button
                  onClick={() => loadStory(SAMPLE_STORIES['fastapi'])}
                  className={`px-2 py-0.5 text-xs rounded-md font-medium transition-colors ${
                    story.meta.repoName === 'tiangolo/fastapi'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  ⚡ FastAPI
                </button>
                <button
                  onClick={() => loadStory(SAMPLE_STORIES['trpc'])}
                  className={`px-2 py-0.5 text-xs rounded-md font-medium transition-colors ${
                    story.meta.repoName === 'trpc/trpc'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  🔗 tRPC
                </button>
              </div>
            </div>

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
