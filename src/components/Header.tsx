import React, { useState } from 'react';
import { useStory } from '../context/StoryContext';
import { Compass, GitBranch, Download, Settings, Plus, Sparkles } from 'lucide-react';
import { RepoIngestionModal } from './RepoIngestionModal';
import { SettingsModal } from './SettingsModal';
import { ExportModal } from './export/ExportModal';

export const Header: React.FC = () => {
  const { story, isSidecarOpen, setIsSidecarOpen, messages } = useStory();
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between z-30 shrink-0 select-none">
        {/* Left: Brand & Active Repo */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-white tracking-tight">RepoTale</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Interactive Architecture Storyteller</p>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

          {/* Active Repo Indicator */}
          <button
            onClick={() => setIsIngestOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 hover:border-indigo-500/50 text-xs transition-all group"
            title="Switch or Ingest New Repository"
          >
            <GitBranch className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-slate-200">{story.meta.repoName}</span>
            <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">
              {story.meta.primaryLanguage}
            </span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Ingest Repo Button */}
          <button
            onClick={() => setIsIngestOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-slate-600 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ingest Repo</span>
          </button>

          {/* Export Docs Button */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-slate-600 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Export Guide</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            title="App Settings & API Keys"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Q&A Sidecar Toggle */}
          <button
            onClick={() => setIsSidecarOpen(!isSidecarOpen)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md ${
              isSidecarOpen
                ? 'bg-indigo-600 text-white shadow-indigo-600/30 ring-2 ring-indigo-400'
                : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Ask Codebase</span>
            <div className="w-4 h-4 rounded-full bg-indigo-500 text-[10px] font-bold text-white flex items-center justify-center">
              {messages.length}
            </div>
          </button>
        </div>
      </header>

      {/* Modals */}
      <RepoIngestionModal isOpen={isIngestOpen} onClose={() => setIsIngestOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </>
  );
};
