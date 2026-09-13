import { RepoTaleStory } from '../types/story';
import { LLMProvider, ModelOption, SymbolContext } from '../types/api';

export const AVAILABLE_MODELS: ModelOption[] = [
  // Local Tier (Ollama localhost:11434)
  {
    id: 'qwen2.5-coder:14b',
    name: 'Qwen 2.5 Coder (14B) — Balanced (Recommended, 16GB+ RAM)',
    provider: 'ollama',
    tier: 'local',
    contextWindow: 32768,
    recommended: true,
  },
  {
    id: 'qwen2.5-coder:32b',
    name: 'Qwen 2.5 Coder (32B) — High Capacity (32GB+ RAM)',
    provider: 'ollama',
    tier: 'local',
    contextWindow: 32768,
  },
  {
    id: 'deepseek-r1:14b',
    name: 'DeepSeek R1 (14B Reasoning) — Chain-of-Thought (16GB+ RAM)',
    provider: 'ollama',
    tier: 'local',
    contextWindow: 65536,
  },
  {
    id: 'deepseek-r1:32b',
    name: 'DeepSeek R1 (32B Reasoning) — High Capacity (32GB+ RAM)',
    provider: 'ollama',
    tier: 'local',
    contextWindow: 65536,
  },
  {
    id: 'llama3.3:70b',
    name: 'Llama 3.3 (70B) — Frontier Coding & Reasoning (64GB+ RAM)',
    provider: 'ollama',
    tier: 'local',
    contextWindow: 128000,
  },
  {
    id: 'llama3.2:latest',
    name: 'Llama 3.2 (3B) — Lightweight & Fast (8GB+ RAM)',
    provider: 'ollama',
    tier: 'local',
    contextWindow: 128000,
  },
  {
    id: 'qwen2.5-coder:1.5b',
    name: 'Qwen 2.5 Coder (1.5B) — Minimal Footprint (<8GB RAM)',
    provider: 'ollama',
    tier: 'local',
    contextWindow: 32768,
  },
  // Cloud Tier
  {
    id: 'gemini-2.0-flash',
    name: 'Google Gemini 2.0 Flash',
    provider: 'gemini',
    tier: 'cloud',
    contextWindow: 1048576,
    costPer1kInputTokens: 0.0001,
    costPer1kOutputTokens: 0.0004,
    recommended: true,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Google Gemini 1.5 Pro',
    provider: 'gemini',
    tier: 'cloud',
    contextWindow: 2097152,
    costPer1kInputTokens: 0.00125,
    costPer1kOutputTokens: 0.005,
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Anthropic Claude 3.5 Sonnet',
    provider: 'claude',
    tier: 'cloud',
    contextWindow: 200000,
    costPer1kInputTokens: 0.003,
    costPer1kOutputTokens: 0.015,
  },
  {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o',
    provider: 'openai',
    tier: 'cloud',
    contextWindow: 128000,
    costPer1kInputTokens: 0.0025,
    costPer1kOutputTokens: 0.01,
  }
];

export async function checkOllamaHealth(baseUrl = 'http://localhost:11434'): Promise<string[]> {
  try {
    let res: Response | null = null;
    try {
      res = await fetch('/api/ollama/api/tags');
    } catch {
      // fallback to direct baseUrl
    }
    if (!res || !res.ok) {
      res = await fetch(`${baseUrl}/api/tags`);
    }
    if (!res || !res.ok) return [];
    const data = await res.json();
    return (data.models || []).map((m: any) => m.name);
  } catch {
    return [];
  }
}

export function estimateStoryCost(modelId: string, promptChars: number): { tokens: number; costUsd: number } {
  const model = AVAILABLE_MODELS.find(m => m.id === modelId) || AVAILABLE_MODELS[0];
  const tokens = Math.ceil(promptChars / 4);
  const cost = (model.costPer1kInputTokens || 0) * (tokens / 1000);
  return { tokens, costUsd: cost };
}

export function cleanJsonString(raw: string): string {
  let str = (raw || '').trim();
  if (str.startsWith('```json')) {
    str = str.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (str.startsWith('```')) {
    str = str.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return str.trim();
}

export function normalizeStory(raw: any, fallbackRepoName: string): RepoTaleStory {
  const meta = {
    repoName: raw?.meta?.repoName || fallbackRepoName,
    description: raw?.meta?.description || `Interactive architectural walkthrough for ${fallbackRepoName}`,
    primaryLanguage: raw?.meta?.primaryLanguage || 'TypeScript',
    frameworks: Array.isArray(raw?.meta?.frameworks) && raw.meta.frameworks.length > 0 ? raw.meta.frameworks : ['React', 'Tauri'],
    entryPoint: raw?.meta?.entryPoint || 'src/main.tsx',
    githubUrl: raw?.meta?.githubUrl || `https://github.com/${fallbackRepoName}`,
    analyzedAt: new Date().toISOString()
  };

  const rawNodes = Array.isArray(raw?.callGraph?.nodes) ? raw.callGraph.nodes : [];
  const nodes = rawNodes.map((n: any, idx: number) => ({
    id: String(n.id || `node-${idx + 1}`),
    label: String(n.label || n.name || `Module ${idx + 1}`),
    type: (['entry', 'middleware', 'service', 'data', 'utility'].includes(n.type || n.node_type) ? (n.type || n.node_type) : 'service') as any,
    filePath: String(n.filePath || n.file_path || meta.entryPoint),
    lineRange: (Array.isArray(n.lineRange || n.line_range) && (n.lineRange || n.line_range).length === 2 ? [Number((n.lineRange || n.line_range)[0]), Number((n.lineRange || n.line_range)[1])] : [1, 50]) as [number, number],
    description: String(n.description || ''),
    cluster: n.cluster ? String(n.cluster) : undefined,
  }));

  // Ensure at least a minimal fallback node exists if LLM omitted nodes
  if (nodes.length === 0) {
    nodes.push(
      { id: `${meta.entryPoint}:App`, label: 'Main Application', type: 'entry' as const, filePath: meta.entryPoint, lineRange: [1, 30] as [number, number], description: 'System Entrypoint' },
      { id: 'src/services/core.ts:Service', label: 'Core Service', type: 'service' as const, filePath: 'src/services/core.ts', lineRange: [1, 40] as [number, number], description: 'Main Business Logic' }
    );
  }

  const rawEdges = Array.isArray(raw?.callGraph?.edges) ? raw.callGraph.edges : [];
  const edges = rawEdges.map((e: any, idx: number) => ({
    id: String(e.id || `e${idx + 1}`),
    source: String(e.source || e.sourceId || nodes[0]?.id || 'node-1'),
    target: String(e.target || e.targetId || nodes[Math.min(idx + 1, nodes.length - 1)]?.id || 'node-2'),
    label: e.label || e.description ? String(e.label || e.description) : undefined
  }));

  if (edges.length === 0 && nodes.length > 1) {
    edges.push({ id: 'e1', source: nodes[0].id, target: nodes[1].id, label: 'invokes' });
  }

  const rawChapters = Array.isArray(raw?.chapters) ? raw.chapters : [];
  const chapters = rawChapters.map((c: any, idx: number) => {
    const rawActive = Array.isArray(c.activeNodes) ? c.activeNodes.map(String) : [];
    const activeNodes = rawActive.length > 0 ? rawActive : nodes.slice(idx, idx + 2).map((n: { id: string }) => n.id);

    const rawSnippets = Array.isArray(c.codeSnippets) ? c.codeSnippets : (Array.isArray(c.methods) ? c.methods : []);
    const codeSnippets = rawSnippets.map((s: any) => ({
      filePath: String(s.filePath || s.file_path || meta.entryPoint),
      startLine: Number(s.startLine || s.start_line || 1),
      endLine: Number(s.endLine || s.end_line || 30),
      code: String(s.code || s.snippet || `// Code snippet for ${c.title || `Chapter ${idx + 1}`}`),
      annotation: String(s.annotation || s.description || '')
    }));

    return {
      id: String(c.id || `chap-${idx + 1}`),
      chapterNumber: Number(c.chapterNumber || idx + 1),
      title: String(c.title || `Chapter ${idx + 1}`),
      summary: String(c.summary || c.description || 'Architectural flow overview'),
      narrative: String(c.narrative || c.description || c.summary || 'Detailed functional walkthrough of this component.'),
      activeNodes,
      codeSnippets: codeSnippets.length > 0 ? codeSnippets : [{
        filePath: meta.entryPoint,
        startLine: 1,
        endLine: 25,
        code: `// ${c.title || 'Implementation'}\nexport function execute() {\n  // Orchestrates active nodes\n}`,
        annotation: 'Primary component execution'
      }]
    };
  });

  // Ensure at least 1 chapter exists
  if (chapters.length === 0) {
    chapters.push({
      id: 'chap-1',
      chapterNumber: 1,
      title: 'System Bootstrap & Architectural Flow',
      summary: `How ${meta.repoName} initializes and coordinates its primary components.`,
      narrative: `This chapter covers the entry point and foundational architecture of ${meta.repoName}.`,
      activeNodes: nodes.map((n: { id: string }) => n.id),
      codeSnippets: [{
        filePath: meta.entryPoint,
        startLine: 1,
        endLine: 35,
        code: `// Application entrypoint: ${meta.entryPoint}\nexport function main() {\n  console.log("Starting ${meta.repoName}");\n}`,
        annotation: 'Bootstrap initialization sequence'
      }]
    });
  }

  return {
    meta,
    callGraph: { nodes, edges },
    chapters
  };
}

export function synthesizeStoryFromScaffold(
  urlOrPath: string,
  manifest?: any,
  scaffold?: any
): RepoTaleStory {
  const clean = urlOrPath.replace(/^https?:\/\/github.com\//, '').replace(/\.git$/, '').trim();
  const repoName = manifest?.repo_name || clean.split('/').pop() || 'Codebase';
  const lang = manifest?.primary_language || 'TypeScript';
  const frameworks = manifest?.frameworks?.length ? manifest.frameworks : ['Application Framework'];
  const entryPoint = manifest?.entry_point || 'src/main.ts';

  const rawNodes = Array.isArray(scaffold?.nodes) ? scaffold.nodes : [];
  const rawEdges = Array.isArray(scaffold?.edges) ? scaffold.edges : [];
  const rawSymbols = Array.isArray(scaffold?.file_symbols) ? scaffold.file_symbols : [];

  const nodes = rawNodes.map((n: any, idx: number) => ({
    id: String(n.id || `node-${idx + 1}`),
    label: String(n.label || n.name || `Symbol ${idx + 1}`),
    type: (['entry', 'middleware', 'service', 'data', 'utility'].includes(n.node_type || n.type) ? (n.node_type || n.type) : 'service') as any,
    filePath: String(n.file_path || n.filePath || entryPoint),
    lineRange: (Array.isArray(n.line_range || n.lineRange) ? (n.line_range || n.lineRange) : [1, 50]) as [number, number],
    description: String(n.description || `${n.label || n.name} architectural module`),
    cluster: n.cluster ? String(n.cluster) : undefined,
  }));

  const edges = rawEdges.map((e: any, idx: number) => ({
    id: String(e.id || `e-${idx + 1}`),
    source: String(e.source),
    target: String(e.target),
    label: e.label ? String(e.label) : undefined,
  }));

  const entryNodes = nodes.filter((n: any) => n.type === 'entry');
  const serviceNodes = nodes.filter((n: any) => n.type === 'service');
  const otherNodes = nodes.filter((n: any) => n.type !== 'entry' && n.type !== 'service');

  const chapters = [];
  
  // Chapter 1: Ingestion & System Entrypoint
  const ch1Nodes = entryNodes.length ? entryNodes : nodes.slice(0, 2);
  const ch1Snippets = rawSymbols
    .filter((s: any) => ch1Nodes.some((n: any) => n.id.includes(s.name) || n.filePath === s.file_path))
    .slice(0, 2)
    .map((s: any) => ({
      filePath: s.file_path,
      startLine: s.start_line,
      endLine: s.end_line,
      code: s.snippet || `// Entrypoint implementation: ${s.name}`,
      annotation: `Primary initialization routine: ${s.name}`,
    }));

  chapters.push({
    id: 'chap-1',
    chapterNumber: 1,
    title: 'System Bootstrap & Primary Entrypoints',
    summary: `How ${repoName} initializes and routes inbound requests or command lifecycle loops.`,
    narrative: `Execution begins at \`${entryPoint}\`. The system sets up runtime context, registers service handlers, and prepares the operational pipeline for execution.`,
    activeNodes: ch1Nodes.map((n: any) => n.id),
    codeSnippets: ch1Snippets.length ? ch1Snippets : [{
      filePath: entryPoint,
      startLine: 1,
      endLine: 35,
      code: `// Primary application bootstrap\nexport function bootstrap() {\n  // Initializes foundational modules\n}`,
      annotation: 'Application runtime initialization',
    }],
  });

  // Chapter 2: Core Domain & Business Logic
  const ch2Nodes = serviceNodes.length ? serviceNodes.slice(0, 4) : nodes.slice(2, 6);
  if (ch2Nodes.length > 0) {
    const ch2Snippets = rawSymbols
      .filter((s: any) => ch2Nodes.some((n: any) => n.id.includes(s.name) || n.filePath === s.file_path))
      .slice(0, 3)
      .map((s: any) => ({
        filePath: s.file_path,
        startLine: s.start_line,
        endLine: s.end_line,
        code: s.snippet || `// Service logic for ${s.name}`,
        annotation: `Core service routine: ${s.name}`,
      }));

    chapters.push({
      id: 'chap-2',
      chapterNumber: 2,
      title: 'Domain Services & Core Business Logic',
      summary: `How ${repoName} coordinates data transformations and business rules.`,
      narrative: `After initialization, execution routes through the domain service layer. These components encapsulate business invariants, orchestrate data flow, and interface between entry points and data storage.`,
      activeNodes: ch2Nodes.map((n: any) => n.id),
      codeSnippets: ch2Snippets.length ? ch2Snippets : [{
        filePath: ch2Nodes[0]?.filePath || entryPoint,
        startLine: 1,
        endLine: 40,
        code: `// Domain service operations\nexport class CoreService {\n  // Handles business transactions\n}`,
        annotation: 'Business logic coordinator',
      }],
    });
  }

  // Chapter 3: Supporting Infrastructure & Data Pipeline
  const ch3Nodes = otherNodes.length ? otherNodes.slice(0, 4) : nodes.slice(6, 10);
  if (ch3Nodes.length > 0) {
    const ch3Snippets = rawSymbols
      .filter((s: any) => ch3Nodes.some((n: any) => n.id.includes(s.name) || n.filePath === s.file_path))
      .slice(0, 2)
      .map((s: any) => ({
        filePath: s.file_path,
        startLine: s.start_line,
        endLine: s.end_line,
        code: s.snippet || `// Infrastructure component ${s.name}`,
        annotation: `Supporting infrastructure: ${s.name}`,
      }));

    chapters.push({
      id: 'chap-3',
      chapterNumber: chapters.length + 1,
      title: 'Data Flow, Persistence & Infrastructure',
      summary: `How ${repoName} manages state persistence, utilities, and infrastructure adapters.`,
      narrative: `Supporting utilities and storage adapters handle data persistence, external communication, and structured error propagation across the application lifecycle.`,
      activeNodes: ch3Nodes.map((n: any) => n.id),
      codeSnippets: ch3Snippets.length ? ch3Snippets : [{
        filePath: ch3Nodes[0]?.filePath || entryPoint,
        startLine: 1,
        endLine: 30,
        code: `// Storage & utility adapter\nexport function executeTask() {\n  // Interacts with persistence layer\n}`,
        annotation: 'Persistence & utility handler',
      }],
    });
  }

  return normalizeStory({
    meta: {
      repoName,
      description: `Interactive architectural walkthrough and AST call graph for ${repoName}`,
      primaryLanguage: lang,
      frameworks,
      entryPoint,
      githubUrl: urlOrPath.startsWith('http') ? urlOrPath : `https://github.com/${clean}`,
    },
    callGraph: { nodes, edges },
    chapters,
  }, repoName);
}

export async function generateStoryWithLLM(params: {
  repoUrl: string;
  provider: LLMProvider;
  model: string;
  apiKey?: string;
}): Promise<RepoTaleStory> {
  const repoName = params.repoUrl.replace(/^https?:\/\/github.com\//, '').replace(/\.git$/, '');
  const systemPrompt = `You are RepoTale AI. Analyze this repository: "${repoName}".
Return ONLY a valid JSON object strictly adhering to the RepoTaleStory schema without any conversational text:
{
  "meta": {
    "repoName": "${repoName}",
    "description": "Clear high-level purpose of the project",
    "primaryLanguage": "Primary programming language",
    "frameworks": ["Framework1", "Framework2"],
    "entryPoint": "path/to/main/entrypoint"
  },
  "callGraph": {
    "nodes": [
      {
        "id": "path/file:Identifier",
        "label": "Human-readable label",
        "type": "entry|middleware|service|data|utility",
        "filePath": "path/to/file",
        "lineRange": [1, 50],
        "description": "Role in the system"
      }
    ],
    "edges": [
      { "id": "e1", "source": "path/file:Source", "target": "path/file:Target", "label": "action" }
    ]
  },
  "chapters": [
    {
      "id": "chap-1",
      "chapterNumber": 1,
      "title": "Clear Chapter Title",
      "summary": "1-2 sentence chapter summary",
      "narrative": "Paragraph explaining architectural purpose and control flow",
      "activeNodes": ["path/file:Identifier"],
      "codeSnippets": [
        {
          "filePath": "path/to/file",
          "startLine": 1,
          "endLine": 25,
          "code": "annotated code snippet",
          "annotation": "what this code does"
        }
      ]
    }
  ]
}`;

  const cleanJsonText = (raw: string): string => {
    let text = raw.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/```$/, '').trim();
    }
    return text;
  };

  if (params.provider === 'ollama') {
    let res: Response | null = null;
    const reqBody = JSON.stringify({
      model: params.model || 'qwen2.5-coder:1.5b',
      prompt: systemPrompt,
      format: 'json',
      stream: false,
    });

    try {
      res = await fetch('/api/ollama/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: reqBody,
      });
    } catch {
      // proxy fallback
    }

    if (!res || !res.ok) {
      res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: reqBody,
      });
    }

    if (!res || !res.ok) {
      throw new Error(`Ollama API error: ${res ? await res.text() : 'Connection refused'}`);
    }

    const data = await res.json();
    const rawParsed = JSON.parse(cleanJsonText(data.response));
    return normalizeStory(rawParsed, repoName);
  }

  if (params.provider === 'gemini') {
    const key = params.apiKey;
    if (!key) throw new Error('Gemini API key is required');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${params.model || 'gemini-2.0-flash'}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { response_mime_type: 'application/json' }
      })
    });
    if (!res.ok) throw new Error(`Gemini API returned ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const rawParsed = JSON.parse(cleanJsonText(text));
    return normalizeStory(rawParsed, repoName);
  }

  if (params.provider === 'openai') {
    const key = params.apiKey;
    if (!key) throw new Error('OpenAI API key is required');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: params.model || 'gpt-4o',
        messages: [{ role: 'user', content: systemPrompt }],
        response_format: { type: 'json_object' }
      })
    });
    if (!res.ok) throw new Error(`OpenAI API returned ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const rawParsed = JSON.parse(cleanJsonText(data.choices?.[0]?.message?.content || '{}'));
    return normalizeStory(rawParsed, repoName);
  }

  if (params.provider === 'claude') {
    const key = params.apiKey;
    if (!key) throw new Error('Claude API key is required');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: params.model || 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [{ role: 'user', content: systemPrompt }]
      })
    });
    if (!res.ok) throw new Error(`Claude API error: ${await res.text()}`);
    const data = await res.json();
    const rawParsed = JSON.parse(cleanJsonText(data.content?.[0]?.text || '{}'));
    return normalizeStory(rawParsed, repoName);
  }

  throw new Error(`Unsupported provider: ${params.provider}`);
}

export async function askCodebaseQuestion(params: {
  question: string;
  story: RepoTaleStory;
  provider: LLMProvider;
  model: string;
  apiKey?: string;
  currentChapterId?: string;
}): Promise<{
  answer: string;
  referencedSymbols: SymbolContext[];
  referencedFiles: Array<{ filePath: string; lineRange?: [number, number] }>;
}> {
  const currentChapter = params.story.chapters.find(c => c.id === params.currentChapterId) || params.story.chapters[0];
  const activeNodes = params.story.callGraph.nodes.filter(n => currentChapter?.activeNodes.includes(n.id));

  const promptContext = `
Repository: ${params.story.meta.repoName} (${params.story.meta.primaryLanguage})
Current Chapter Focus: Chapter ${currentChapter?.chapterNumber}: ${currentChapter?.title}
Active Symbols in Context:
${activeNodes.map(n => `- ${n.label} (${n.type}) at ${n.filePath}:${n.lineRange[0]}-${n.lineRange[1]}: ${n.description || ''}`).join('\n')}

Snippets:
${(currentChapter?.codeSnippets || []).map(s => `[${s.filePath}:${s.startLine}-${s.endLine}]\n${s.code}`).join('\n\n')}

Question: ${params.question}
Please answer clearly, grounding your answer directly in these symbols, architectural flows, and exact file paths.`;

  let answer = '';

  // 1. Ollama local LLM
  if (params.provider === 'ollama') {
    try {
      let res: Response | null = null;
      const reqBody = JSON.stringify({
        model: params.model || 'qwen2.5-coder:1.5b',
        prompt: promptContext,
        stream: false,
      });

      try {
        res = await fetch('/api/ollama/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: reqBody,
        });
      } catch {
        // fallback
      }

      if (!res || !res.ok) {
        res = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: reqBody,
        });
      }

      if (res && res.ok) {
        const data = await res.json();
        answer = data.response;
      }
    } catch (e) {
      console.warn('Ollama Q&A query failed, using grounded fallback:', e);
    }
  }

  // 2. Gemini
  if (!answer && params.provider === 'gemini' && params.apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${params.model || 'gemini-2.0-flash'}:generateContent?key=${params.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptContext }] }]
        })
      });
      if (res.ok) {
        const data = await res.json();
        answer = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
    } catch (e) {
      console.warn('Gemini Q&A failed:', e);
    }
  }

  // 3. OpenAI
  if (!answer && params.provider === 'openai' && params.apiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${params.apiKey}`
        },
        body: JSON.stringify({
          model: params.model || 'gpt-4o',
          messages: [{ role: 'user', content: promptContext }]
        })
      });
      if (res.ok) {
        const data = await res.json();
        answer = data.choices?.[0]?.message?.content || '';
      }
    } catch (e) {
      console.warn('OpenAI Q&A failed:', e);
    }
  }

  // 4. Claude
  if (!answer && params.provider === 'claude' && params.apiKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': params.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: params.model || 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{ role: 'user', content: promptContext }]
        })
      });
      if (res.ok) {
        const data = await res.json();
        answer = data.content?.[0]?.text || '';
      }
    } catch (e) {
      console.warn('Claude Q&A failed:', e);
    }
  }

  // 5. Intelligent fallback grounded in story AST symbols
  if (!answer) {
    answer = `Based on the architectural analysis of **${params.story.meta.repoName}**:\n\n` +
      `In **${currentChapter.title}**, the data flow revolves around \`${activeNodes.map(n => n.label).join('` and `')}\`.\n\n` +
      `When processing this phase, the system executes **${params.story.meta.entryPoint}** which orchestrates calls to the \`${activeNodes[0]?.label || 'Handler'}\` module at \`${activeNodes[0]?.filePath || 'src/'}\` (lines ${activeNodes[0]?.lineRange[0] || 1}-${activeNodes[0]?.lineRange[1] || 50}).\n\n` +
      `Key architectural highlights:\n` +
      `- **Type & Role**: Categorized as \`${activeNodes[0]?.type || 'service'}\` to isolate business logic.\n` +
      `- **Edge Connections**: Communicates directly with downstream dependencies: ${params.story.callGraph.edges.filter(e => e.source === activeNodes[0]?.id).map(e => `\`${e.target.split(':').pop()}\``).join(', ') || 'internal state handles'}.\n` +
      `\nYou can inspect the exact code snippet in the left narrative pane or click the highlighted node on the graph canvas to trace calls.`;
  }

  const referencedSymbols: SymbolContext[] = activeNodes.map(n => ({
    name: n.label,
    kind: n.type === 'service' ? 'function' : n.type === 'data' ? 'class' : 'module',
    filePath: n.filePath,
    lineRange: n.lineRange,
    content: n.description || '',
  }));

  const referencedFiles = activeNodes.map(n => ({
    filePath: n.filePath,
    lineRange: n.lineRange,
  }));

  return { answer, referencedSymbols, referencedFiles };
}
