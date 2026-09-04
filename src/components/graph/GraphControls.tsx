import React from 'react';
import { useReactFlow } from '@xyflow/react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, ArrowDownUp, ArrowLeftRight } from 'lucide-react';

interface GraphControlsProps {
  direction: 'TB' | 'LR';
  onToggleDirection: () => void;
  onResetFocus: () => void;
}

export const GraphControls: React.FC<GraphControlsProps> = ({
  direction,
  onToggleDirection,
  onResetFocus,
}) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl">
      <button
        onClick={() => zoomIn()}
        title="Zoom In"
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        onClick={() => zoomOut()}
        title="Zoom Out"
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        onClick={() => fitView({ duration: 500, padding: 0.2 })}
        title="Fit All Nodes"
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
      <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />
      <button
        onClick={onToggleDirection}
        title={`Switch layout direction (current: ${direction === 'TB' ? 'Top-Bottom' : 'Left-Right'})`}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        {direction === 'TB' ? <ArrowDownUp className="w-4 h-4" /> : <ArrowLeftRight className="w-4 h-4" />}
      </button>
      <button
        onClick={onResetFocus}
        title="Re-focus Active Chapter Subgraph"
        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
};
