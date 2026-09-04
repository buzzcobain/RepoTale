import React, { useState, useMemo } from 'react';
import { useStory } from '../../context/StoryContext';
import { exportRepoTaleDocs } from '../../services/tauriBridge';
import { generateMarkdownReadme, generateStandaloneHtml } from '../../services/exportService';
import { ExportOptions } from '../../types/api';
import { X, Download, Copy, Check, FileCode, Globe, GitBranch } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { story } = useStory();

  const [activeTab, setActiveTab] = useState<'markdown' | 'static_html' | 'branch'>('markdown');
  const [githubUser, setGithubUser] = useState('username');
  const [repoName, setRepoName] = useState(story.meta.repoName.split('/').pop() || 'repo');
  const [includeBadge, setIncludeBadge] = useState(true);
  const [includeMermaid, setIncludeMermaid] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [copied, setCopied] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const exportOptions: ExportOptions = useMemo(() => ({
    includeBadge,
    includeMermaid,
    includeCollapsibleDetails: includeDetails,
    generateStaticHtml: true,
    githubUsername: githubUser,
    repositoryName: repoName,
  }), [includeBadge, includeMermaid, includeDetails, githubUser, repoName]);

  const markdownPreview = useMemo(() => {
    return generateMarkdownReadme(story, exportOptions);
  }, [story, exportOptions]);

  const htmlPreview = useMemo(() => {
    return generateStandaloneHtml(story);
  }, [story]);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownPreview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([htmlPreview], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${repoName}-repotale-guide.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportStatus('Downloaded standalone static HTML viewer bundle!');
    setTimeout(() => setExportStatus(null), 3000);
  };

  const handleExportToBranch = async () => {
    try {
      const res = await exportRepoTaleDocs(story, exportOptions);
      setExportStatus(`Exported successfully! Generated REPOTALE.md and /docs/index.html (branch: ${res.branchName || 'docs/repotale-guide'}).`);
    } catch (e: any) {
      setExportStatus(`Export failed: ${e?.message || 'Error writing files'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export RepoTale Documentation</h2>
              <p className="text-xs text-slate-400">Dual-layer export: GitHub README additions + Standalone `/docs` GitHub Pages bundle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast */}
        {exportStatus && (
          <div className="px-6 py-2 bg-emerald-950/80 border-b border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2 font-medium">
            <Check className="w-4 h-4" />
            <span>{exportStatus}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-800 flex gap-4 text-xs font-semibold bg-slate-900/50 shrink-0">
          <button
            onClick={() => setActiveTab('markdown')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'markdown'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Layer 1: GitHub README.md (Markdown + Mermaid)</span>
          </button>

          <button
            onClick={() => setActiveTab('static_html')}
            className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'static_html'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Layer 2: Standalone Static Viewer (/docs/index.html)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Metadata inputs */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <div>
              <label className="text-slate-400 font-medium block mb-1">GitHub Username / Org</label>
              <input
                type="text"
                value={githubUser}
                onChange={(e) => setGithubUser(e.target.value)}
                placeholder="e.g. tiangolo"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 font-medium block mb-1">Repository Name</label>
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="e.g. fastapi"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
          </div>

          {activeTab === 'markdown' && (
            <div className="space-y-4">
              {/* Toggles */}
              <div className="flex flex-wrap gap-4 text-xs text-slate-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBadge}
                    onChange={(e) => setIncludeBadge(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600 bg-slate-950 border-slate-700"
                  />
                  <span>Official shields.io badge</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMermaid}
                    onChange={(e) => setIncludeMermaid(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600 bg-slate-950 border-slate-700"
                  />
                  <span>Mermaid Call Graph</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDetails}
                    onChange={(e) => setIncludeDetails(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600 bg-slate-950 border-slate-700"
                  />
                  <span>Collapsible &lt;details&gt; chapters</span>
                </label>
              </div>

              {/* Preview Box */}
              <div className="relative rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
                  <span className="font-mono">REPOTALE.md preview</span>
                  <button
                    onClick={handleCopyMarkdown}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-all shadow-sm"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Markdown'}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-indigo-200 overflow-x-auto max-h-72 leading-relaxed">
                  <code>{markdownPreview}</code>
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'static_html' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-200 leading-relaxed">
                <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span>GitHub Pages Zero-Config Static Viewer</span>
                </div>
                Emits a self-contained, single-file HTML/JS/CSS bundle with pre-baked JSON state. You can commit this file into your repository's <code>/docs/index.html</code> and instantly enable GitHub Pages hosting!
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDownloadHtml}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download /docs/index.html</span>
                </button>
              </div>

              <div className="relative rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                <div className="px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400 font-mono">
                  Static HTML Bundle Preview ({Math.round(htmlPreview.length / 1024)} KB)
                </div>
                <pre className="p-4 text-xs font-mono text-slate-400 overflow-x-auto max-h-60 leading-relaxed">
                  <code>{htmlPreview.slice(0, 800)}...</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between shrink-0">
          <button
            onClick={handleExportToBranch}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <GitBranch className="w-4 h-4 text-indigo-400" />
            <span>Commit to branch: docs/repotale-guide</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
