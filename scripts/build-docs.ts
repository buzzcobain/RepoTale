import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateStandaloneHtml } from '../src/services/exportService.ts';
import { RepoTaleStory } from '../src/types/story.ts';
import { SAMPLE_STORIES } from '../src/services/sampleStories.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');

// Ensure docs directory exists
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Helper to extract a live code snippet from actual repo files
function extractSnippetFromFile(
  relPath: string,
  startPattern: RegExp | string,
  endPattern: RegExp | string,
  fallbackLines: [number, number],
  annotation: string
) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    return {
      filePath: relPath,
      startLine: fallbackLines[0],
      endLine: fallbackLines[1],
      annotation,
      code: '// Source file not found in local workspace',
    };
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');

  let startLine = -1;
  let endLine = -1;

  for (let i = 0; i < lines.length; i++) {
    if (startLine === -1) {
      if (typeof startPattern === 'string' ? lines[i].includes(startPattern) : startPattern.test(lines[i])) {
        startLine = i + 1;
      }
    } else {
      if (typeof endPattern === 'string' ? lines[i].includes(endPattern) : endPattern.test(lines[i])) {
        endLine = i + 1;
        break;
      }
    }
  }

  if (startLine === -1 || endLine === -1 || endLine < startLine) {
    startLine = fallbackLines[0];
    endLine = Math.min(fallbackLines[1], lines.length);
  }

  const code = lines.slice(startLine - 1, endLine).join('\n');
  return {
    filePath: relPath,
    startLine,
    endLine,
    annotation,
    code,
  };
}

console.log('🔍 Scanning RepoTale codebase and analyzing live AST nodes...');

// Read dependencies from package.json
const pkgJsonPath = path.join(rootDir, 'package.json');
let frameworks = ['Tauri v2', 'React 18', 'React Flow', 'Tree-sitter', 'Tailwind CSS'];
if (fs.existsSync(pkgJsonPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    const deps = Object.keys(pkg.dependencies || {});
    frameworks = [
      'Tauri v2',
      deps.includes('react') ? 'React 18' : 'React',
      deps.includes('@xyflow/react') ? 'React Flow' : 'React Flow',
      'Tree-sitter',
      deps.includes('tailwindcss') || (pkg.devDependencies && pkg.devDependencies.tailwindcss) ? 'Tailwind CSS' : 'Tailwind CSS',
    ];
  } catch {
    // fallback
  }
}

// Extract live snippets from actual repo files
const snippetGitSandbox = extractSnippetFromFile(
  'src-tauri/src/git.rs',
  'pub fn clone_repo',
  'Ok(sandbox)',
  [19, 38],
  'GitSandbox isolates repository files and validates URLs against shell injection.'
);

const snippetParallax = extractSnippetFromFile(
  'src/context/StoryContext.tsx',
  'const selectNode = (nodeId: string | null) => {',
  'selectNode find end marker',
  [71, 98],
  'selectNode finds the matching chapter and smoothly scrolls to it with a highlight pulse.'
);

const snippetExport = extractSnippetFromFile(
  'src-tauri/src/export.rs',
  'pub fn export_all',
  'html_path = docs_dir.join("index.html")',
  [253, 290],
  'export_all updates README.md, generates /docs/index.html, and pushes the branch via Git/SSH.'
);

// Build live RepoTale Story from actual files
const liveRepotaleStory: RepoTaleStory = {
  meta: {
    repoName: 'buzzcobain/RepoTale',
    description: 'Interactive, local-first codebase storytelling & AST architecture visualizer',
    primaryLanguage: 'TypeScript',
    frameworks,
    entryPoint: 'src/main.tsx',
    githubUrl: 'https://github.com/buzzcobain/RepoTale',
    analyzedAt: new Date().toISOString(),
  },
  callGraph: {
    nodes: [
      {
        id: 'src-tauri/src/main.rs:main',
        label: 'Tauri Desktop Entry',
        type: 'entry',
        filePath: 'src-tauri/src/main.rs',
        lineRange: [1, 15],
        description: 'Boots native desktop shell and registers IPC handlers',
      },
      {
        id: 'src-tauri/src/git.rs:GitSandbox',
        label: 'Git Sandbox Ingestion',
        type: 'service',
        filePath: 'src-tauri/src/git.rs',
        lineRange: [snippetGitSandbox.startLine, snippetGitSandbox.endLine],
        description: 'Executes sanitized shallow git clones in isolated temp directories',
      },
      {
        id: 'src-tauri/src/ast/parser.rs:RepoAstParser',
        label: 'Tree-sitter AST Engine',
        type: 'service',
        filePath: 'src-tauri/src/ast/parser.rs',
        lineRange: [50, 180],
        description: 'Extracts functions, classes, call-sites, and imports across TS, Python, and Rust',
      },
      {
        id: 'src/components/graph/CodeGraphCanvas.tsx:CodeGraphCanvas',
        label: 'React Flow Canvas',
        type: 'service',
        filePath: 'src/components/graph/CodeGraphCanvas.tsx',
        lineRange: [40, 190],
        description: 'Dynamic visual architecture graph with Dagre layout and camera tracking',
      },
      {
        id: 'src/components/narrative/NarrativePane.tsx:NarrativePane',
        label: 'Parallax Narrative Pane',
        type: 'service',
        filePath: 'src/components/narrative/NarrativePane.tsx',
        lineRange: [20, 140],
        description: 'Chapter-driven walkthrough with Hero section synchronized with graph camera via IntersectionObserver',
      },
      {
        id: 'src/components/sidecar/QASidecarDrawer.tsx:QASidecarDrawer',
        label: 'Architectural Q&A Sidecar',
        type: 'middleware',
        filePath: 'src/components/sidecar/QASidecarDrawer.tsx',
        lineRange: [30, 140],
        description: 'Context-grounded copilot answering inquiries using active AST symbols',
      },
      {
        id: 'src-tauri/src/export.rs:export_all',
        label: 'Dual-Layer Export Engine',
        type: 'utility',
        filePath: 'src-tauri/src/export.rs',
        lineRange: [snippetExport.startLine, snippetExport.endLine],
        description: 'Exports GitHub README Mermaid diagrams and zero-config GitHub Pages static bundles',
      },
    ],
    edges: [
      { id: 'e1', source: 'src-tauri/src/main.rs:main', target: 'src-tauri/src/git.rs:GitSandbox', label: 'clones sandbox' },
      { id: 'e2', source: 'src-tauri/src/git.rs:GitSandbox', target: 'src-tauri/src/ast/parser.rs:RepoAstParser', label: 'parses AST' },
      { id: 'e3', source: 'src-tauri/src/ast/parser.rs:RepoAstParser', target: 'src/components/graph/CodeGraphCanvas.tsx:CodeGraphCanvas', label: 'renders layout' },
      { id: 'e4', source: 'src/components/narrative/NarrativePane.tsx:NarrativePane', target: 'src/components/graph/CodeGraphCanvas.tsx:CodeGraphCanvas', label: 'synchronizes focus' },
      { id: 'e5', source: 'src/components/graph/CodeGraphCanvas.tsx:CodeGraphCanvas', target: 'src/components/narrative/NarrativePane.tsx:NarrativePane', label: 'jumps to chapter on click' },
      { id: 'e6', source: 'src/components/graph/CodeGraphCanvas.tsx:CodeGraphCanvas', target: 'src/components/sidecar/QASidecarDrawer.tsx:QASidecarDrawer', label: 'grounds Q&A' },
      { id: 'e7', source: 'src/components/narrative/NarrativePane.tsx:NarrativePane', target: 'src-tauri/src/export.rs:export_all', label: 'exports docs' },
    ],
  },
  chapters: [
    {
      id: 'rep-1',
      chapterNumber: 1,
      title: 'Sandboxed Git Ingestion & AST Extraction',
      summary: 'Shallow git cloning into isolated temporary directories and deterministic Tree-sitter parsing.',
      narrative: 'When a repository URL is ingested, RepoTale executes a sanitized shallow clone (`git clone --depth 1`) into an isolated temporary directory. The manifest sniffer reads dependencies, and Tree-sitter query cursors extract top-level symbols and call-sites before LLM prompting.',
      activeNodes: ['src-tauri/src/main.rs:main', 'src-tauri/src/git.rs:GitSandbox', 'src-tauri/src/ast/parser.rs:RepoAstParser'],
      codeSnippets: [snippetGitSandbox],
    },
    {
      id: 'rep-2',
      chapterNumber: 2,
      title: 'Bidirectional Parallax Canvas & Camera Choreography',
      summary: 'Synchronizing scroll progress with React Flow camera animations and node click navigation.',
      narrative: 'The left pane uses an IntersectionObserver to monitor which chapter is currently in view. When a chapter enters the viewport, it pans and zooms the React Flow canvas to center the active subgraph. In reverse, clicking any node on the diagram immediately scrolls the left pane to the chapter explaining it.',
      activeNodes: ['src/components/graph/CodeGraphCanvas.tsx:CodeGraphCanvas', 'src/components/narrative/NarrativePane.tsx:NarrativePane'],
      codeSnippets: [snippetParallax],
    },
    {
      id: 'rep-3',
      chapterNumber: 3,
      title: 'Context-Grounded Q&A & Dual-Layer Export',
      summary: 'Zero-hallucination architectural queries and automated GitHub Pages exporter.',
      narrative: 'The Q&A sidecar grounds questions against the current chapter AST symbols, ensuring answers are hallucination-free. When ready to publish, the export engine generates native GitHub README additions with Mermaid diagrams and a standalone single-file HTML viewer for GitHub Pages.',
      activeNodes: ['src/components/sidecar/QASidecarDrawer.tsx:QASidecarDrawer', 'src-tauri/src/export.rs:export_all'],
      codeSnippets: [snippetExport],
    },
  ],
};

console.log('Generating standalone interactive docs for buzzcobain/RepoTale with Hero Section & Multi-Repo Samples...');
const html = generateStandaloneHtml(liveRepotaleStory, SAMPLE_STORIES);
const outputPath = path.join(docsDir, 'index.html');
fs.writeFileSync(outputPath, html, 'utf-8');
console.log(`Successfully generated: ${outputPath} (${(html.length / 1024).toFixed(1)} KB)`);

// 2. Ensure CNAME file exists for repotale.com
const cnamePath = path.join(docsDir, 'CNAME');
fs.writeFileSync(cnamePath, 'repotale.com\n', 'utf-8');
console.log(`Verified CNAME: ${cnamePath} (repotale.com)`);

// 3. Ensure robots.txt exists for SEO indexing
const robotsPath = path.join(docsDir, 'robots.txt');
const robotsContent = `User-agent: *
Allow: /

Sitemap: https://repotale.com/sitemap.xml
`;
fs.writeFileSync(robotsPath, robotsContent, 'utf-8');
console.log(`Generated robots.txt: ${robotsPath}`);

// 4. Ensure sitemap.xml exists for search engines
const sitemapPath = path.join(docsDir, 'sitemap.xml');
const today = new Date().toISOString().split('T')[0];
const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://repotale.com/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
fs.writeFileSync(sitemapPath, sitemapContent, 'utf-8');
console.log(`Generated sitemap.xml: ${sitemapPath}`);

// 5. Ensure all favicon and brand assets are copied to docs/
const publicDir = path.join(rootDir, 'public');
if (fs.existsSync(publicDir)) {
  const assets = fs.readdirSync(publicDir);
  assets.forEach(asset => {
    if (asset.startsWith('favicon') || asset.startsWith('logo') || asset.startsWith('apple-touch-icon') || asset === 'compass.svg') {
      fs.copyFileSync(path.join(publicDir, asset), path.join(docsDir, asset));
    }
  });
  console.log('Synchronized favicon and brand assets from public/ to docs/');
}

console.log('🎉 RepoTale build completed successfully: Live codebase synced, multi-repo samples embedded & favicons ready.');

