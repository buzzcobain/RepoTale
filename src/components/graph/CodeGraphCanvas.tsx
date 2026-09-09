import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStory } from '../../context/StoryContext';
import { useSettings } from '../../context/SettingsContext';
import { getLayoutedElements } from './dagreLayout';
import { CodeSymbolNode } from './CustomNodes';
import { GraphControls } from './GraphControls';
import { Activity, Layers } from 'lucide-react';

const nodeTypes = {
  codeSymbol: CodeSymbolNode,
};

const FlowInner: React.FC = () => {
  const { story, activeNodes, selectedNodeId, selectNode } = useStory();
  const { settings } = useSettings();
  const { fitBounds, fitView } = useReactFlow();

  const [direction, setDirection] = useState<'TB' | 'LR'>('TB');

  // Compute Dagre layout
  const { initialNodes, initialEdges } = useMemo(() => {
    const layout = getLayoutedElements(story.callGraph.nodes, story.callGraph.edges, direction);
    return {
      initialNodes: layout.nodes,
      initialEdges: layout.edges,
    };
  }, [story, direction]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state whenever story or direction updates
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Update node active / selected flags
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        const isActive = activeNodes.includes(node.id);
        const isSelected = selectedNodeId === node.id;
        return {
          ...node,
          data: {
            ...node.data,
            isActive,
            isSelected,
          },
        };
      })
    );

    // Also highlight edges connected to active nodes
    setEdges((eds) =>
      eds.map((edge) => {
        const isConnectedToActive = activeNodes.includes(edge.source) && activeNodes.includes(edge.target);
        return {
          ...edge,
          animated: isConnectedToActive,
          style: {
            stroke: isConnectedToActive ? '#3b82f6' : '#272a34',
            strokeWidth: isConnectedToActive ? 2 : 1.25,
          },
        };
      })
    );
  }, [activeNodes, selectedNodeId, setNodes, setEdges]);

  // Smooth camera choreography to active subgraph
  const focusActiveSubgraph = useCallback(() => {
    if (!settings.autoPanGraph || nodes.length === 0) return;

    if (activeNodes.length === 0) {
      fitView({ duration: 600, padding: 0.2 });
      return;
    }

    const activeNodeElements = nodes.filter((n) => activeNodes.includes(n.id));
    if (activeNodeElements.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const nodeWidth = 240;
    const nodeHeight = 90;

    activeNodeElements.forEach((node) => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });

    // Add comfortable padding
    const padding = 120;
    const bounds = {
      x: minX - padding,
      y: minY - padding,
      width: (maxX - minX) + padding * 2,
      height: (maxY - minY) + padding * 2,
    };

    fitBounds(bounds, { duration: 700 });
  }, [activeNodes, nodes, fitBounds, fitView, settings.autoPanGraph]);

  useEffect(() => {
    const timer = setTimeout(() => {
      focusActiveSubgraph();
    }, 100);
    return () => clearTimeout(timer);
  }, [activeNodes, focusActiveSubgraph]);

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    selectNode(node.id === selectedNodeId ? null : node.id);
  };

  return (
    <div className="relative w-full h-full bg-[#080a0f] overflow-hidden">
      {/* Top Left Header Bar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3 px-3 py-1.5 rounded-lg bg-base-200/90 backdrop-blur-md border border-base-300 shadow-sm">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-mono font-bold tracking-wide uppercase text-slate-200">
            AST Call Graph
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 border-l border-base-300 pl-3">
          <Layers className="w-3 h-3 text-slate-500" />
          <span>{story.callGraph.nodes.length} symbols</span>
          <span>•</span>
          <span>{story.callGraph.edges.length} calls</span>
        </div>
      </div>

      {/* Floating Toolbar Controls */}
      <GraphControls
        direction={direction}
        onToggleDirection={() => setDirection((d) => (d === 'TB' ? 'LR' : 'TB'))}
        onResetFocus={focusActiveSubgraph}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        minZoom={0.2}
        maxZoom={2.0}
        proOptions={{ hideAttribution: true }}
        className="repotale-flow"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#272a34"
          className="opacity-70"
        />
        <MiniMap
          nodeColor={(n) => {
            const type = (n.data as any)?.type;
            if (type === 'entry') return '#38bdf8';
            if (type === 'middleware') return '#fbbf24';
            if (type === 'service') return '#3b82f6';
            if (type === 'data') return '#34d399';
            return '#64748b';
          }}
          maskColor="rgba(9, 11, 16, 0.75)"
          className="!bg-base-200/90 !border !border-base-300 !rounded-lg !bottom-4 !right-4 shadow-sm"
        />
      </ReactFlow>

      {/* Bottom Status Pill */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-2.5 py-1 rounded-md bg-base-200/90 backdrop-blur border border-base-300 text-[11px] text-slate-400 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        <span>Click node to jump to story chapter & code</span>
      </div>
    </div>
  );
};

export const CodeGraphCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowInner />
    </ReactFlowProvider>
  );
};
