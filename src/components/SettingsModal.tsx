import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { checkOllamaHealth } from '../services/llmService';
import { X, Key, ShieldCheck, Server, Sliders, Check, Eye, EyeOff, Loader2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, saveKey, deleteKey } = useSettings();

  const [geminiKey, setGeminiKey] = useState(settings.apiKeys.gemini || '');
  const [claudeKey, setClaudeKey] = useState(settings.apiKeys.claude || '');
  const [openaiKey, setOpenaiKey] = useState(settings.apiKeys.openai || '');
  const [ollamaUrl, setOllamaUrl] = useState(settings.ollamaBaseUrl);
  const [ollamaStatus, setOllamaStatus] = useState<string | null>(null);
  const [isTestingOllama, setIsTestingOllama] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (geminiKey) await saveKey('gemini', geminiKey);
    else await deleteKey('gemini');

    if (claudeKey) await saveKey('claude', claudeKey);
    else await deleteKey('claude');

    if (openaiKey) await saveKey('openai', openaiKey);
    else await deleteKey('openai');

    updateSettings({ ollamaBaseUrl: ollamaUrl });
    setSavedFeedback('Settings & Credentials saved securely!');
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  const handleTestOllama = async () => {
    setIsTestingOllama(true);
    try {
      const models = await checkOllamaHealth(ollamaUrl);
      if (models.length > 0) {
        setOllamaStatus(`✅ Connected! Found ${models.length} models (${models.slice(0, 3).join(', ')})`);
      } else {
        setOllamaStatus('⚠️ Connected, but no models found. Run `ollama pull qwen2.5-coder:1.5b`');
      }
    } catch {
      setOllamaStatus('❌ Could not connect to Ollama at ' + ollamaUrl);
    } finally {
      setIsTestingOllama(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">App Settings & Keys</h2>
              <p className="text-xs text-slate-400">Manage OS Keychain credentials and inference tiers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveKeys} className="p-6 space-y-6">
          {savedFeedback && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{savedFeedback}</span>
            </div>
          )}

          {/* Secure Storage Note */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-900/30 flex items-start gap-2.5 text-xs text-indigo-200">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              API Keys are stored securely in your operating system's native keychain (`keyring`) and never transmitted to external servers.
            </span>
          </div>

          {/* Cloud API Keys (BYOK) */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Cloud Provider Keys (BYOK)
            </h3>

            {/* Google Gemini */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <label className="text-slate-300 font-medium">Google Gemini API Key</label>
                <a href="https://aistudio.google.com/apikey" target="_blank" className="text-indigo-400 hover:underline text-[11px]">
                  Get Key ↗
                </a>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showKey['gemini'] ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-600 focus:border-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(p => ({ ...p, gemini: !p.gemini }))}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-white"
                >
                  {showKey['gemini'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Anthropic Claude */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <label className="text-slate-300 font-medium">Anthropic Claude API Key</label>
                <a href="https://console.anthropic.com/settings/keys" target="_blank" className="text-indigo-400 hover:underline text-[11px]">
                  Get Key ↗
                </a>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showKey['claude'] ? 'text' : 'password'}
                  value={claudeKey}
                  onChange={(e) => setClaudeKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-600 focus:border-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(p => ({ ...p, claude: !p.claude }))}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-white"
                >
                  {showKey['claude'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* OpenAI */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <label className="text-slate-300 font-medium">OpenAI API Key</label>
                <a href="https://platform.openai.com/api-keys" target="_blank" className="text-indigo-400 hover:underline text-[11px]">
                  Get Key ↗
                </a>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showKey['openai'] ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-600 focus:border-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(p => ({ ...p, openai: !p.openai }))}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-white"
                >
                  {showKey['openai'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Local Ollama Server */}
          <div className="space-y-2 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>Local Ollama Endpoint</span>
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
              />
              <button
                type="button"
                onClick={handleTestOllama}
                disabled={isTestingOllama}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
              >
                {isTestingOllama ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
              </button>
            </div>
            {ollamaStatus && (
              <p className="text-[11px] text-slate-400 font-mono">{ollamaStatus}</p>
            )}
          </div>

          {/* Preferences */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Viewer Preferences</span>
            </h3>
            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
              <span>Auto-pan code graph during chapter scroll</span>
              <input
                type="checkbox"
                checked={settings.autoPanGraph}
                onChange={(e) => updateSettings({ autoPanGraph: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-indigo-500"
              />
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
          >
            Save All Settings
          </button>
        </form>
      </div>
    </div>
  );
};
