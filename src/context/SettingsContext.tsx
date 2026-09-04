import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings, LLMProvider } from '../types/api';
import { saveApiKey as bridgeSaveKey, getApiKey as bridgeGetKey, deleteApiKey as bridgeDeleteKey } from '../services/tauriBridge';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  saveKey: (provider: LLMProvider, key: string) => Promise<void>;
  deleteKey: (provider: LLMProvider) => Promise<void>;
  getKey: (provider: LLMProvider) => Promise<string>;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultProvider: 'gemini',
  selectedModel: 'gemini-2.0-flash',
  ollamaBaseUrl: 'http://localhost:11434',
  apiKeys: {},
  theme: 'dark',
  autoPanGraph: true,
  codeFontSize: 13,
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('repotale_settings');
    if (saved) {
      try { return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }; } catch {}
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('repotale_settings', JSON.stringify(settings));
  }, [settings]);

  // Load API keys on mount
  useEffect(() => {
    const loadKeys = async () => {
      const gemini = await bridgeGetKey('gemini');
      const claude = await bridgeGetKey('claude');
      const openai = await bridgeGetKey('openai');
      setSettings(prev => ({
        ...prev,
        apiKeys: {
          gemini: gemini || prev.apiKeys.gemini,
          claude: claude || prev.apiKeys.claude,
          openai: openai || prev.apiKeys.openai,
        }
      }));
    };
    loadKeys();
  }, []);

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  const saveKey = async (provider: LLMProvider, key: string) => {
    await bridgeSaveKey(provider, key);
    setSettings(prev => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [provider]: key }
    }));
  };

  const deleteKey = async (provider: LLMProvider) => {
    await bridgeDeleteKey(provider);
    setSettings(prev => {
      const copy = { ...prev.apiKeys };
      delete copy[provider as keyof typeof copy];
      return { ...prev, apiKeys: copy };
    });
  };

  const getKey = async (provider: LLMProvider): Promise<string> => {
    return settings.apiKeys[provider as keyof typeof settings.apiKeys] || await bridgeGetKey(provider);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, saveKey, deleteKey, getKey }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
};
