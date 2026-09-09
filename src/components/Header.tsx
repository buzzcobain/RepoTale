import React, { useState } from 'react';
import { useStory } from '../context/StoryContext';
import { GitBranch, Download, Settings, Plus, Sparkles } from 'lucide-react';
import { RepoTaleLogoIcon } from './common/RepoTaleLogo';
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
      <header className="h-14 border-b border-base-300 bg-base-100/95 backdrop-blur-md px-5 flex items-center justify-between z-30 shrink-0 select-none">
        {/* Left: Brand & Active Repo */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2.5">
            <RepoTaleLogoIcon size={32} className="shrink-0 rounded-lg border border-base-300" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-100 tracking-tight">RepoTale</span>
                <span className="badge badge-neutral badge-xs font-mono text-[10px] px-1.5 py-0.5">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Interactive Architecture Storyteller</p>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-base-300 mx-1 hidden sm:block" />

          {/* Active Repo Indicator */}
          <button
            onClick={() => setIsIngestOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-base-200 hover:bg-base-300 border border-base-300 text-xs transition-colors group"
            title="Switch or Ingest New Repository"
          >
            <GitBranch className="w-3.5 h-3.5 text-primary group-hover:text-blue-400 transition-colors" />
            <span className="font-medium text-slate-200">{story.meta.repoName}</span>
            <span className="badge badge-neutral badge-xs font-mono text-[10px]">
              {story.meta.primaryLanguage}
            </span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Ingest Repo Button */}
          <button
            onClick={() => setIsIngestOpen(true)}
            className="btn btn-sm bg-base-200 hover:bg-base-300 text-slate-200 border-base-300 font-medium text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span>Ingest Repo</span>
          </button>

          {/* Export Docs Button */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="btn btn-sm bg-base-200 hover:bg-base-300 text-slate-200 border-base-300 font-medium text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export Guide</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="btn btn-sm btn-square bg-base-200 hover:bg-base-300 text-slate-400 hover:text-slate-100 border-base-300"
            title="App Settings & API Keys"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Q&A Sidecar Toggle */}
          <button
            onClick={() => setIsSidecarOpen(!isSidecarOpen)}
            className={`btn btn-sm gap-2 font-medium text-xs ${
              isSidecarOpen
                ? 'btn-primary shadow-sm'
                : 'bg-base-200 hover:bg-base-300 text-slate-200 border-base-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Ask Codebase</span>
            <span className="badge badge-xs badge-neutral font-mono">
              {messages.length}
            </span>
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
