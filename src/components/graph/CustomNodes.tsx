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
  badgeClass: string;
  badgeText: string;
  icon: React.ReactNode;
}> = {
  entry: {
    badgeClass: 'badge-info',
    badgeText: 'Entrypoint',
    icon: <Play className="w-3 h-3 text-info" />,
  },
  middleware: {
    badgeClass: 'badge-warning',
    badgeText: 'Middleware',
    icon: <Shield className="w-3 h-3 text-warning" />,
  },
  service: {
    badgeClass: 'badge-primary',
    badgeText: 'Service',
    icon: <Cpu className="w-3 h-3 text-primary" />,
  },
  data: {
    badgeClass: 'badge-success',
    badgeText: 'Data/Store',
    icon: <Database className="w-3 h-3 text-success" />,
  },
  utility: {
    badgeClass: 'badge-neutral',
    badgeText: 'Utility',
    icon: <Wrench className="w-3 h-3 text-slate-400" />,
  },
};

export const CodeSymbolNode: React.FC<NodeProps> = memo(({ data }) => {
  const nodeData = data as unknown as CustomNodeData;
  const style = typeStyles[nodeData.type] || typeStyles.utility;
  const isActive = nodeData.isActive;
  const isSelected = nodeData.isSelected;

  return (
    <div
      className={`relative w-[230px] rounded-lg p-3 transition-all duration-200 cursor-pointer bg-[#0e121a] border ${
        isSelected
          ? 'border-accent ring-1 ring-accent/50 shadow-md'
          : isActive
          ? 'border-primary ring-1 ring-primary/40 shadow-sm'
          : 'border-base-300 opacity-65 hover:opacity-100 hover:border-slate-600'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-400 !w-2 !h-2 !border-[#0e121a]"
      />

      {/* Top row: Icon & Type Badge */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {style.icon}
          <span className={`badge badge-xs badge-outline ${style.badgeClass} font-mono text-[10px]`}>
            {style.badgeText}
          </span>
        </div>
        {isActive && (
          <span className="w-2 h-2 rounded-full bg-primary" title="Active node in story" />
        )}
      </div>

      {/* Label / Symbol Name */}
      <h4 className="font-mono font-semibold text-xs text-white truncate mb-1">
        {nodeData.label}
      </h4>

      {/* File Path & Line Range */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="truncate max-w-[125px]" title={nodeData.filePath}>
          {nodeData.filePath.split('/').pop()}
        </span>
        <span className="text-slate-500">
          L{nodeData.lineRange[0]}-{nodeData.lineRange[1]}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-slate-400 !w-2 !h-2 !border-[#0e121a]"
      />
    </div>
  );
});
