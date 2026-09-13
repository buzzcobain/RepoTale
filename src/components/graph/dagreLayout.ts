import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';
import { CallGraphNode, CallGraphEdge } from '../../types/story';

export const getLayoutedElements = (
  nodes: CallGraphNode[] = [],
  edges: CallGraphEdge[] = [],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } => {
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeEdges = Array.isArray(edges) ? edges : [];

  if (safeNodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 240;
  const nodeHeight = 90;

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 50,
    ranksep: 70,
    marginx: 40,
    marginy: 40,
  });

  safeNodes.forEach((node) => {
    if (node?.id) {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    }
  });

  safeEdges.forEach((edge) => {
    if (edge?.source && edge?.target) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  try {
    dagre.layout(dagreGraph);
  } catch (err) {
    console.warn('Dagre layout failed, using fallback grid:', err);
  }

  const layoutedNodes: Node[] = safeNodes.map((node, idx) => {
    const nodeWithPosition = dagreGraph.node(node.id) || {
      x: 100 + (idx % 3) * 280,
      y: 100 + Math.floor(idx / 3) * 140,
    };
    return {
      id: node.id,
      type: 'codeSymbol',
      data: {
        ...node,
        rawNode: node
      },
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  const layoutedEdges: Edge[] = safeEdges.map((edge, idx) => ({
    id: edge.id || `e-${idx + 1}`,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: true,
    style: {
      stroke: '#64748b',
      strokeWidth: 2,
    },
    labelStyle: {
      fill: '#94a3b8',
      fontSize: 11,
      fontFamily: 'monospace',
    },
    labelBgStyle: {
      fill: '#0f172a',
      fillOpacity: 0.9,
    },
    labelBgPadding: [4, 2],
    labelBgBorderRadius: 4,
  }));

  return { nodes: layoutedNodes, edges: layoutedEdges };
};
