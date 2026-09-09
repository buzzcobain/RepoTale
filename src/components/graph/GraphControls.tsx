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
    <div className="absolute top-4 right-4 z-10 flex items-center gap-1 p-1 rounded-lg bg-base-200/90 backdrop-blur-md border border-base-300 shadow-sm">
      <button
        onClick={() => zoomIn()}
        title="Zoom In"
        className="btn btn-ghost btn-xs h-7 w-7 p-0 text-slate-400 hover:text-white"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => zoomOut()}
        title="Zoom Out"
        className="btn btn-ghost btn-xs h-7 w-7 p-0 text-slate-400 hover:text-white"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => fitView({ duration: 500, padding: 0.2 })}
        title="Fit All Nodes"
        className="btn btn-ghost btn-xs h-7 w-7 p-0 text-slate-400 hover:text-white"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
      <div className="w-[1px] h-3.5 bg-base-300 mx-0.5" />
      <button
        onClick={onToggleDirection}
        title={`Switch layout direction (current: ${direction === 'TB' ? 'Top-Bottom' : 'Left-Right'})`}
        className="btn btn-ghost btn-xs h-7 w-7 p-0 text-slate-400 hover:text-white"
      >
        {direction === 'TB' ? <ArrowDownUp className="w-3.5 h-3.5" /> : <ArrowLeftRight className="w-3.5 h-3.5" />}
      </button>
      <button
        onClick={onResetFocus}
        title="Re-focus Active Chapter Subgraph"
        className="btn btn-ghost btn-xs h-7 w-7 p-0 text-slate-400 hover:text-primary"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
