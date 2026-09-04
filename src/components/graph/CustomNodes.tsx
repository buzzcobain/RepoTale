import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeType } from '../../types/story';
import { Play, Shield, Cpu, Database, Wrench } from 'lucide-react';

interface CustomNodeData {
  id: string;
  label: string;
  type: NodeType;
  filePath: string;
  lineRange: [number, number];
  description?: string;
  isActive?: boolean;
  isSelected?: boolean;
}

const typeStyles: Record<NodeType, {
  bg: string;
  border: string;
  activeBorder: string;
  badgeBg: string;
  badgeText: string;
  icon: React.ReactNode;
}> = {
  entry: {
    bg: 'bg-sky-950/70',
    border: 'border-sky-500/40',
    activeBorder: 'border-sky-400 ring-2 ring-sky-400 shadow-sky-500/40',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    badgeText: 'Entrypoint',
    icon: <Play className="w-3.5 h-3.5 text-sky-400 fill-sky-400/30" />,
  },
  middleware: {
    bg: 'bg-amber-950/70',
    border: 'border-amber-500/40',
    activeBorder: 'border-amber-400 ring-2 ring-amber-400 shadow-amber-500/40',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    badgeText: 'Middleware',
    icon: <Shield className="w-3.5 h-3.5 text-amber-400" />,
  },
  service: {
    bg: 'bg-indigo-950/70',
    border: 'border-indigo-500/40',
    activeBorder: 'border-indigo-400 ring-2 ring-indigo-400 shadow-indigo-500/40',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    badgeText: 'Service',
    icon: <Cpu className="w-3.5 h-3.5 text-indigo-400" />,
  },
  data: {
    bg: 'bg-emerald-950/70',
    border: 'border-emerald-500/40',
    activeBorder: 'border-emerald-400 ring-2 ring-emerald-400 shadow-emerald-500/40',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    badgeText: 'Data/Store',
    icon: <Database className="w-3.5 h-3.5 text-emerald-400" />,
  },
  utility: {
    bg: 'bg-slate-900/80',
    border: 'border-slate-700/60',
    activeBorder: 'border-slate-400 ring-2 ring-slate-400 shadow-slate-500/30',
    badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
    badgeText: 'Utility',
    icon: <Wrench className="w-3.5 h-3.5 text-slate-400" />,
  },
};

export const CodeSymbolNode: React.FC<NodeProps> = memo(({ data }) => {
  const nodeData = data as unknown as CustomNodeData;
  const style = typeStyles[nodeData.type] || typeStyles.utility;
  const isActive = nodeData.isActive;
  const isSelected = nodeData.isSelected;

  return (
    <div
      className={`relative w-[240px] rounded-xl p-3.5 backdrop-blur-md transition-all duration-300 cursor-pointer shadow-lg ${style.bg} border ${
        isSelected
          ? 'border-indigo-400 ring-2 ring-indigo-400 shadow-indigo-500/50 scale-[1.03]'
          : isActive
          ? `${style.activeBorder} shadow-xl scale-[1.02]`
          : `${style.border} opacity-60 hover:opacity-100 hover:scale-[1.01]`
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-indigo-400 !w-2.5 !h-2.5 !border-slate-950"
      />

      {/* Top row: Icon & Type Badge */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {style.icon}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.badgeBg}`}>
            {style.badgeText}
          </span>
        </div>
        {isActive && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
        )}
      </div>

      {/* Label / Symbol Name */}
      <h4 className="font-mono font-bold text-sm text-slate-100 truncate mb-1">
        {nodeData.label}
      </h4>

      {/* File Path & Line Range */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="truncate max-w-[130px]" title={nodeData.filePath}>
          {nodeData.filePath.split('/').pop()}
        </span>
        <span className="text-slate-500">
          L{nodeData.lineRange[0]}-{nodeData.lineRange[1]}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-indigo-400 !w-2.5 !h-2.5 !border-slate-950"
      />
    </div>
  );
});
