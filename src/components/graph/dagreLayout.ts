import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';
import { CallGraphNode, CallGraphEdge } from '../../types/story';

export const getLayoutedElements = (
  nodes: CallGraphNode[],
  edges: CallGraphEdge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } => {
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

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes: Node[] = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
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

  const layoutedEdges: Edge[] = edges.map((edge) => ({
    id: edge.id,
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
