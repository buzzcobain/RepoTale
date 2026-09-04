export type NodeType = "entry" | "middleware" | "service" | "data" | "utility";

export interface CallGraphNode {
  id: string;
  label: string;
  type: NodeType;
  filePath: string;
  lineRange: [number, number];
  description?: string;
}

export interface CallGraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface CodeSnippet {
  filePath: string;
  startLine: number;
  endLine: number;
  code: string;
  annotation: string;
  language?: string;
}

export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  summary: string;
  narrative: string;
  activeNodes: string[]; // Node IDs to highlight/focus on canvas during scroll
  codeSnippets: CodeSnippet[];
}

export interface RepoTaleStory {
  meta: {
    repoName: string;
    description: string;
    primaryLanguage: string;
    frameworks: string[];
    entryPoint: string;
    githubUrl?: string;
    analyzedAt?: string;
  };
  callGraph: {
    nodes: CallGraphNode[];
    edges: CallGraphEdge[];
  };
  chapters: Chapter[];
}

export interface IngestionOptions {
  sourceType: 'github' | 'local';
  urlOrPath: string;
  branch?: string;
  provider: 'ollama' | 'gemini' | 'claude' | 'openai';
  modelName: string;
  apiKey?: string;
  maxChapters?: number;
}
