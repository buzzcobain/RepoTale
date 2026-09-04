export type LLMProvider = 'ollama' | 'gemini' | 'claude' | 'openai';

export interface ModelOption {
  id: string;
  name: string;
  provider: LLMProvider;
  tier: 'local' | 'cloud';
  contextWindow: number;
  costPer1kInputTokens?: number; // USD
  costPer1kOutputTokens?: number; // USD
  recommended?: boolean;
}

export interface AppSettings {
  defaultProvider: LLMProvider;
  selectedModel: string;
  ollamaBaseUrl: string;
  apiKeys: {
    gemini?: string;
    claude?: string;
    openai?: string;
  };
  theme: 'dark' | 'light' | 'cyberpunk';
  autoPanGraph: boolean;
  codeFontSize: number;
}

export interface SymbolContext {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'variable' | 'module';
  filePath: string;
  lineRange: [number, number];
  content: string;
}

export interface QAMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  referencedSymbols?: SymbolContext[];
  referencedFiles?: Array<{ filePath: string; lineRange?: [number, number] }>;
}

export interface ExportOptions {
  includeMermaid: boolean;
  includeBadge: boolean;
  includeCollapsibleDetails: boolean;
  generateStaticHtml: boolean;
  githubUsername?: string;
  repositoryName?: string;
}

export interface ExportResult {
  markdownContent: string;
  staticHtmlContent?: string;
  savedPath?: string;
  branchName?: string;
}

export interface IngestionProgress {
  stage: 'idle' | 'cloning' | 'sniffing' | 'ast_parsing' | 'prompting_llm' | 'validating_story' | 'done' | 'error';
  percent: number;
  message: string;
  detail?: string;
}
