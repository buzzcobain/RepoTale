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
        <section className="p-6 lg:p-7 rounded-xl bg-base-200 border border-base-300 shadow-sm relative overflow-hidden">
          {/* Headline & Logo Lockup */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
            <div className="flex-1">
              <div className="badge badge-sm badge-neutral gap-1.5 font-mono text-[11px] text-slate-300 mb-3 border border-base-300">
                <Sparkles className="w-3 h-3 text-primary" />
                <span>Open-Source Codebase Storytelling</span>
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight leading-tight">
                Turn complex codebases into{' '}
                <span className="text-primary font-extrabold">
                  interactive visual stories
                </span>.
              </h1>

              <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-2xl">
                RepoTale extracts the AST call graph of any repository and generates an interactive, chapter-driven walkthrough synchronized with a visual architectural diagram.
              </p>
            </div>

            {/* Official Logo Lockup */}
            <div className="hidden md:flex shrink-0 p-1.5 rounded-xl bg-base-100 border border-base-300 shadow-sm">
              <RepoTaleLogoLockup size={105} showTagline={true} />
            </div>
          </div>

          {/* 3-Step Lifecycle: How It Works on Any Repo */}
          <div className="mt-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge badge-xs badge-outline badge-primary font-mono font-semibold uppercase tracking-wider">
                How It Works
              </span>
              <span className="text-xs text-slate-400">From code to hosted interactive tour in 3 steps:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-lg bg-base-100 border border-base-300 shadow-none">
                <div className="text-[10px] font-mono font-semibold text-primary mb-1 flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>01. INGEST</span>
                </div>
                <h3 className="text-xs font-semibold text-slate-200 mb-1">Point to Any Codebase</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Provide a GitHub URL or local repository folder. Tree-sitter extracts functions, call-sites, and imports across TS, Python, Rust, and Go.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-base-100 border border-base-300 shadow-none">
                <div className="text-[10px] font-mono font-semibold text-primary mb-1 flex items-center gap-1.5">
                  <Map className="w-3.5 h-3.5" />
                  <span>02. VISUALIZE</span>
                </div>
                <h3 className="text-xs font-semibold text-slate-200 mb-1">Auto-Generate Story</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Generates an interactive chapter-by-chapter guided walkthrough synchronized with an animated React Flow call graph.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-base-100 border border-base-300 shadow-none">
                <div className="text-[10px] font-mono font-semibold text-primary mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>03. PUBLISH</span>
                </div>
                <h3 className="text-xs font-semibold text-slate-200 mb-1">Host Free Anywhere</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Emits a zero-dependency <code className="px-1 py-0.5 rounded bg-base-200 text-slate-300 font-mono text-[10px]">/docs/index.html</code>. Host 100% free on GitHub Pages, Netlify, Cloudflare, or your custom domain.
                </p>
              </div>
            </div>
          </div>

          {/* Dual-Layer Connection Showcase */}
          <div className="p-4 rounded-lg bg-base-100 border border-base-300 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <span>🔗</span>
                <span>The Dual-Layer Connection: README to Hosted Web Tour</span>
              </span>
              <span className="badge badge-xs badge-success font-mono font-medium">
                1-Click Navigation
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              RepoTale adds an interactive badge to your repository's <code className="text-slate-300 font-mono">README.md</code>. When anyone clicks it, it launches your hosted visual walkthrough on <strong>GitHub Pages</strong>, <strong>Netlify</strong>, or your own <strong>custom domain</strong>:
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-md bg-base-200/80 border border-base-300 text-xs font-mono">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-slate-400 font-sans text-[11px]">README.md badge:</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-primary text-primary-content font-bold text-[11px]">
                  🧭 RepoTale | Interactive Tour
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 hidden sm:block shrink-0" />
              <div className="flex items-center gap-1.5 text-slate-300 truncate">
                <span className="text-slate-400 font-sans text-[11px]">Opens web tour:</span>
                <span className="underline decoration-slate-600 underline-offset-2 truncate">
                  https://yourname.github.io/your-repo/
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons & Live Demo Switcher */}
          <div className="pt-4 border-t border-base-300 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span className="font-semibold text-slate-200">Live Demo:</span>
                <span className="text-slate-400">RepoTale analyzing its own architecture</span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://github.com/buzzcobain/RepoTale#quickstart"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm normal-case font-medium gap-1.5"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Use on Your Repo (Free)</span>
                </a>

                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-neutral btn-sm normal-case font-medium border border-base-300 gap-1.5 text-slate-300 hover:text-white"
                >
                  <span>View Source</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Multi-Repo Live Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-base-100 border border-base-300">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Switch Demo:</span>
                <span className="text-slate-400 hidden sm:inline text-xs">Explore how RepoTale visualizes different architectures:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <button
                  onClick={() => loadStory(SAMPLE_STORIES['repotale'])}
                  className={`btn btn-xs font-mono font-medium ${
                    story.meta.repoName === 'buzzcobain/RepoTale'
                      ? 'btn-primary'
                      : 'btn-ghost text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🧭</span>
                  <span>RepoTale (Tauri/React)</span>
                </button>
                <button
                  onClick={() => loadStory(SAMPLE_STORIES['fastapi'])}
                  className={`btn btn-xs font-mono font-medium ${
                    story.meta.repoName === 'tiangolo/fastapi'
                      ? 'btn-primary'
                      : 'btn-ghost text-slate-400 hover:text-white'
                  }`}
                >
                  <span>⚡</span>
                  <span>FastAPI (Python)</span>
                </button>
                <button
                  onClick={() => loadStory(SAMPLE_STORIES['trpc'])}
                  className={`btn btn-xs font-mono font-medium ${
                    story.meta.repoName === 'trpc/trpc'
                      ? 'btn-primary'
                      : 'btn-ghost text-slate-400 hover:text-white'
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
        <div className="rounded-xl p-6 bg-base-200 border border-base-300 shadow-sm relative">
          <div>
            {/* Quick Switcher Back to RepoTale */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-base-300">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Sample Switcher:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <button
                  onClick={() => loadStory(SAMPLE_STORIES['repotale'])}
                  className="btn btn-ghost btn-xs font-mono text-slate-400 hover:text-white border border-base-300"
                >
                  🧭 Back to RepoTale
                </button>
                <button
                  onClick={() => loadStory(SAMPLE_STORIES['fastapi'])}
                  className={`btn btn-xs font-mono font-medium ${
                    story.meta.repoName === 'tiangolo/fastapi'
                      ? 'btn-primary'
                      : 'btn-ghost text-slate-400 hover:text-white'
                  }`}
                >
                  ⚡ FastAPI
                </button>
                <button
                  onClick={() => loadStory(SAMPLE_STORIES['trpc'])}
                  className={`btn btn-xs font-mono font-medium ${
                    story.meta.repoName === 'trpc/trpc'
                      ? 'btn-primary'
                      : 'btn-ghost text-slate-400 hover:text-white'
                  }`}
                >
                  🔗 tRPC
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-primary mb-2">
              <GitBranch className="w-3.5 h-3.5" />
              <span>Architecture Walkthrough</span>
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
              {story.meta.repoName}
            </h1>

            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              {story.meta.description || 'Interactive code story and system call graph.'}
            </p>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="badge badge-sm badge-neutral font-mono text-slate-300 border border-base-300 gap-1.5 py-2.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>{story.meta.primaryLanguage}</span>
              </div>

              <div className="badge badge-sm badge-neutral font-mono text-slate-300 border border-base-300 gap-1.5 py-2.5">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                <span>Entry: {story.meta.entryPoint}</span>
              </div>

              {(story.meta.frameworks || []).map((framework, fIdx) => (
                <span
                  key={fIdx}
                  className="badge badge-sm badge-outline badge-neutral font-mono text-slate-300 py-2.5"
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
