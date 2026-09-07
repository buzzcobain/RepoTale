import React, { useState, useEffect } from 'react';
import { useStory } from '../context/StoryContext';
import { useSettings } from '../context/SettingsContext';
import { AVAILABLE_MODELS, checkOllamaHealth, estimateStoryCost } from '../services/llmService';
import { LLMProvider } from '../types/api';
import { X, GitBranch, Folder, Cpu, Cloud, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface RepoIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RepoIngestionModal: React.FC<RepoIngestionModalProps> = ({ isOpen, onClose }) => {
  const { story, ingestRepo, isIngesting, ingestionProgress } = useStory();
  const { settings, getKey } = useSettings();

  const [sourceType, setSourceType] = useState<'github' | 'local'>('github');
  const [urlOrPath, setUrlOrPath] = useState(story?.meta?.repoName || 'buzzcobain/RepoTale');
  const [provider, setProvider] = useState<LLMProvider>(settings.defaultProvider);
  const [selectedModelId, setSelectedModelId] = useState<string>(settings.selectedModel);
  const [ollamaStatus, setOllamaStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync with active story on modal open
  useEffect(() => {
    if (isOpen && story?.meta?.repoName) {
      setUrlOrPath(story.meta.repoName);
    }
  }, [isOpen, story?.meta?.repoName]);

  // Check Ollama status and auto-suggest if available
  useEffect(() => {
    checkOllamaHealth(settings.ollamaBaseUrl)
      .then((models) => {
        if (models.length > 0) {
          setOllamaStatus(`Found ${models.length} local models`);
          getKey('gemini').then(key => {
            if (!key) {
              setProvider('ollama');
              if (models.includes('qwen2.5-coder:14b')) {
                setSelectedModelId('qwen2.5-coder:14b');
              } else if (models.includes('llama3.2:latest')) {
                setSelectedModelId('llama3.2:latest');
              } else if (models.includes('qwen2.5-coder:1.5b')) {
                setSelectedModelId('qwen2.5-coder:1.5b');
              }
            }
          });
        } else {
          setOllamaStatus('No local models found');
        }
      })
      .catch(() => setOllamaStatus('Ollama not running'));
  }, [settings.ollamaBaseUrl]);

  // Cost estimation (approx 12,000 chars AST context)
  const costEstimate = estimateStoryCost(selectedModelId, 12000);

  const presets = [
    { label: 'buzzcobain/RepoTale', desc: 'Tauri v2 + React TypeScript' },
    { label: 'tiangolo/fastapi', desc: 'Python ASGI & Pydantic' },
    { label: 'tauri-apps/tauri', desc: 'Rust Desktop & Wry' },
    { label: 'expressjs/express', desc: 'Node.js Web Router' },
    { label: 'trpc/trpc', desc: 'End-to-end TypeScript' },
  ];

  const executeIngest = async (targetRepo: string) => {
    if (!targetRepo.trim()) return;
    setErrorMsg(null);

    try {
      const apiKey = await getKey(provider);
      if (provider !== 'ollama' && !apiKey) {
        setErrorMsg(`API Key required for ${provider.toUpperCase()}. Please configure it in Settings or select Local Tier (Ollama).`);
        return;
      }

      await ingestRepo({
        sourceType,
        urlOrPath: targetRepo.trim(),
        provider,
        modelName: selectedModelId,
        apiKey,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Ingestion failed');
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeIngest(urlOrPath);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Ingest Repository</h2>
              <p className="text-xs text-slate-400">Parse AST and build interactive parallax walkthrough</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isIngesting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ingestion In-Progress Screen */}
        {isIngesting ? (
          <div className="p-8 space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                {ingestionProgress.message}
              </h3>
              {ingestionProgress.detail && (
                <p className="text-xs text-slate-400 font-mono">{ingestionProgress.detail}</p>
              )}
            </div>

            {/* Progress Track */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${ingestionProgress.percent}%` }}
              />
            </div>

            {/* Stage Steps */}
            <div className="grid grid-cols-4 gap-2 text-[10px] font-medium text-slate-400">
              <div className={ingestionProgress.percent >= 25 ? 'text-indigo-400 font-bold' : ''}>1. Sandbox Clone</div>
              <div className={ingestionProgress.percent >= 50 ? 'text-indigo-400 font-bold' : ''}>2. Manifest Sniff</div>
              <div className={ingestionProgress.percent >= 75 ? 'text-indigo-400 font-bold' : ''}>3. Tree-sitter AST</div>
              <div className={ingestionProgress.percent >= 90 ? 'text-indigo-400 font-bold' : ''}>4. LLM Story</div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleIngest} className="p-6 space-y-6">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Source Type Selector */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSourceType('github')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  sourceType === 'github'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>GitHub Repository</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceType('local')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  sourceType === 'local'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Local Directory</span>
              </button>
            </div>

            {/* Target Path / URL Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                {sourceType === 'github' ? 'GitHub URL or owner/repo' : 'Local Project Path'}
              </label>
              <input
                type="text"
                value={urlOrPath}
                onChange={(e) => setUrlOrPath(e.target.value)}
                placeholder={sourceType === 'github' ? 'e.g. tiangolo/fastapi or https://github.com/...' : '/Users/name/projects/my-app'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
              />

              {/* Presets */}
              {sourceType === 'github' && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Popular Repositories & Presets</span>
                    <span className="text-[10px] text-slate-500 font-mono">Click to choose</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {presets.map((preset) => {
                      const isSelected =
                        urlOrPath.toLowerCase() === preset.label.toLowerCase() ||
                        urlOrPath.toLowerCase().includes(preset.label.toLowerCase().split('/')[1]);
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setUrlOrPath(preset.label)}
                          onDoubleClick={() => executeIngest(preset.label)}
                          title="Click to select, double-click to ingest immediately"
                          className={`p-2 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-indigo-600/25 border-indigo-500 ring-1 ring-indigo-500/50 text-white shadow-sm'
                              : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="text-[11px] font-bold font-mono truncate">{preset.label}</div>
                          <div className="text-[10px] text-slate-400 truncate">{preset.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Dual-Tier Inference Orchestrator */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Inference Engine Tier</span>
                <span className="text-[10px] text-indigo-400 font-mono">Structured JSON Output</span>
              </div>

              {/* Provider Tiers */}
              <div className="grid grid-cols-2 gap-2">
                {/* Local Tier */}
                <button
                  type="button"
                  onClick={() => {
                    setProvider('ollama');
                    setSelectedModelId('qwen2.5-coder:1.5b');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    provider === 'ollama'
                      ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Local Tier</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Free & Offline
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Ollama / Embedded quantized coder models</p>
                  {ollamaStatus && provider === 'ollama' && (
                    <p className="text-[10px] text-emerald-400 font-mono mt-1">{ollamaStatus}</p>
                  )}
                </button>

                {/* Cloud Tier */}
                <button
                  type="button"
                  onClick={() => {
                    setProvider('gemini');
                    setSelectedModelId('gemini-2.0-flash');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    provider !== 'ollama'
                      ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Cloud className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Cloud Tier (BYOK)</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                      High Accuracy
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Gemini 2.0, Claude 3.5, GPT-4o</p>
                </button>
              </div>

              {/* Apple Silicon Hardware Detection Banner */}
              {provider === 'ollama' && (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-indigo-500/30 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 text-indigo-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Apple M5 Pro • 48 GB Unified Memory</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Max: 32B Q8 / 70B Q3
                  </span>
                </div>
              )}

              {/* Model Dropdown */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <label>Selected Model</label>
                  {provider === 'ollama' && selectedModelId === 'qwen2.5-coder:32b' && (
                    <span className="text-indigo-400 text-[10px] font-mono">
                      Pull with: ollama pull qwen2.5-coder:32b
                    </span>
                  )}
                </div>
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-indigo-500"
                >
                  {AVAILABLE_MODELS.filter((m) =>
                    provider === 'ollama' ? m.tier === 'local' : m.tier === 'cloud'
                  ).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.recommended ? '★' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Token & Cost Preview */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="text-slate-400">
                  <span>Est. Tokens: </span>
                  <span className="text-slate-200 font-semibold">{costEstimate.tokens.toLocaleString()}</span>
                </div>
                <div className="text-slate-400">
                  <span>Est. Cost: </span>
                  <span className="text-emerald-400 font-semibold">
                    {costEstimate.costUsd === 0 ? '$0.00 (Local/Free)' : `$${costEstimate.costUsd.toFixed(4)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch AST Parsing & Storytelling for <span className="font-mono underline decoration-indigo-300 underline-offset-2">{urlOrPath.trim() || 'Repository'}</span></span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
