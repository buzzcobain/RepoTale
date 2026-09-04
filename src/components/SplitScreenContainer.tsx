import React from 'react';
import { NarrativePane } from './narrative/NarrativePane';
import { CodeGraphCanvas } from './graph/CodeGraphCanvas';

export const SplitScreenContainer: React.FC = () => {
  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-[calc(100vh-64px)]">
      {/* Left Pane: Scroll-driven Narrative Walkthrough (5 cols on large screens) */}
      <div className="lg:col-span-6 xl:col-span-5 h-full overflow-hidden border-r border-slate-800/80 bg-slate-950/80">
        <NarrativePane />
      </div>

      {/* Right Pane: Interactive React Flow Graph Canvas (7 cols on large screens) */}
      <div className="lg:col-span-6 xl:col-span-7 h-full relative overflow-hidden bg-slate-950">
        <CodeGraphCanvas />
      </div>
    </div>
  );
};
