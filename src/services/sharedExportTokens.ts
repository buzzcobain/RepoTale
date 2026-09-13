/**
 * Shared Design Tokens & Branding Constants
 * Single source of truth across React application and Standalone Static Exporter.
 */

export const REPOTALE_THEME = {
  colors: {
    base100: '#090b10',
    base200: '#11141c',
    base300: '#181c28',
    borderHairline: '#272a34',
    borderSubtle: '#1e293b',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    accent: '#0ea5e9',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    codeEditorBg: '#07090e',
  },
  nodeTypes: {
    entry: {
      badge: 'badge-primary',
      border: 'border-blue-500/60',
      text: 'text-blue-400',
      label: 'ENTRYPOINT',
    },
    middleware: {
      badge: 'badge-warning',
      border: 'border-amber-500/60',
      text: 'text-amber-400',
      label: 'MIDDLEWARE',
    },
    service: {
      badge: 'badge-info',
      border: 'border-sky-500/60',
      text: 'text-sky-400',
      label: 'SERVICE',
    },
    data: {
      badge: 'badge-success',
      border: 'border-emerald-500/60',
      text: 'text-emerald-400',
      label: 'DATA MODEL',
    },
    utility: {
      badge: 'badge-neutral',
      border: 'border-slate-600/60',
      text: 'text-slate-400',
      label: 'UTILITY',
    },
  },
  clusterColors: [
    { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.04)', text: '#60a5fa' },
    { border: '#10b981', bg: 'rgba(16, 185, 129, 0.04)', text: '#34d399' },
    { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.04)', text: '#fbbf24' },
    { border: '#a855f7', bg: 'rgba(168, 85, 247, 0.04)', text: '#c084fc' },
    { border: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.04)', text: '#38bdf8' },
    { border: '#ec4899', bg: 'rgba(236, 72, 153, 0.04)', text: '#f472b6' },
  ],
};

export const HOW_IT_WORKS_STEPS = [
  {
    step: '01. INGEST',
    title: 'Point to Any Codebase',
    description:
      'Provide a GitHub URL or local repository folder. Tree-sitter extracts functions, call-sites, and imports across TS, Python, Rust, Go, Java, and C#.',
    icon: 'code',
  },
  {
    step: '02. VISUALIZE',
    title: 'Auto-Generate Story',
    description:
      'Generates an interactive chapter-by-chapter guided walkthrough synchronized with an animated React Flow call graph.',
    icon: 'map',
  },
  {
    step: '03. PUBLISH',
    title: 'Host Free Anywhere',
    description:
      'Emits a zero-dependency standalone bundle (/docs/index.html). Host 100% free on GitHub Pages, Netlify, Cloudflare, or custom domain.',
    icon: 'globe',
  },
];

export function getClusterColor(clusterName: string) {
  if (!clusterName || clusterName === 'root') {
    return { border: '#272a34', bg: 'rgba(39, 42, 52, 0.03)', text: '#94a3b8' };
  }
  let hash = 0;
  for (let i = 0; i < clusterName.length; i++) {
    hash = (hash << 5) - hash + clusterName.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % REPOTALE_THEME.clusterColors.length;
  return REPOTALE_THEME.clusterColors[idx];
}
