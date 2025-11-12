'use client';

import { GuidelineAccordionViewer } from '@/components/GuidelinesViewer/GuidelinesViewer';
import { NodeInspector } from '@/components/NodeInspector/NodeInspector';
import React, { useCallback, useState, useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Connection,
    Edge,
    Node,
    OnConnect,
    applyNodeChanges,
    Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

export type GuidelineNodeData = {
    label: string;
    description?: string;
    outputs: { id: string; label: string; target?: string }[];
    isEntry?: boolean;
};

const initialNodes: Node<GuidelineNodeData>[] = [
    {
        id: '1',
        position: { x: 100, y: 100 },
        data: {
            label: 'Is the patient HIV positive?',
            description: 'Check records or ask.',
            outputs: [
                { id: 'yes', label: 'Yes', target: '2' },
                { id: 'no', label: 'No', target: '3' },
            ],
            isEntry: true,
        },
        type: 'default',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
    },
    {
        id: '2',
        position: { x: 450, y: 40 },
        data: {
            label: 'Start ART pathway',
            outputs: [],
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
    },
    {
        id: '3',
        position: { x: 450, y: 200 },
        data: {
            label: 'Consider HIV testing',
            outputs: [],
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
    },
];

export default function GuidelineEditorPage() {
    const [nodes, setNodes] = useState<Node<GuidelineNodeData>[]>(initialNodes);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>('1');

    const [nodeViewerOpen, setNodeViewerOpen] = useState(true);

    // derive edges from nodes.outputs
    const edges: Edge[] = useMemo(() => {
        const e: Edge[] = [];
        nodes.forEach((n) => {
            n.data.outputs?.forEach((o) => {
                if (o.target) {
                    e.push({
                        id: `${n.id}-${o.id}`,
                        source: n.id,
                        target: o.target,
                        label: o.label,
                        animated: false,
                    });
                }
            });
        });
        return e;
    }, [nodes]);

    // ✅ use the React Flow helper
    const onNodesChange = useCallback(
        (changes: any) => {
            setNodes((nds) => applyNodeChanges(changes, nds));
        },
        []
    );

    // when you drag a connection in the canvas
    const onConnect: OnConnect = useCallback(
        (connection: Connection) => {
            const { source, target } = connection;
            if (!source || !target) return;

            setNodes((prev) =>
                prev.map((n) => {
                    if (n.id !== source) return n;

                    const outputs = n.data.outputs ? [...n.data.outputs] : [];
                    const freeIndex = outputs.findIndex((o) => !o.target);
                    if (freeIndex >= 0) {
                        outputs[freeIndex] = { ...outputs[freeIndex], target };
                    } else {
                        outputs.push({
                            id: `out-${outputs.length + 1}`,
                            label: 'Next',
                            target,
                        });
                    }
                    return {
                        ...n,
                        data: { ...n.data, outputs },
                    };
                })
            );
        },
        []
    );

    const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

    console.log('edges', edges);
    console.log('nodes', nodes);

    return (
        <div >
            <div style={{ background: "darkgray", height: 60, width: '100%', display: "flex", alignItems: "center", padding: "0 16px", gap: 16, justifyContent: "space-between" }}>
                <button
                    onClick={() => {
                        const newId = String(nodes.length + 1);
                        setNodes((prev) => [
                            ...prev,
                            {
                                id: newId,
                                position: { x: 200, y: 200 },
                                data: { label: 'New node', outputs: [] },
                                sourcePosition: Position.Right,
                                targetPosition: Position.Left,
                            },
                        ]);
                        setSelectedNodeId(newId);
                    }}
                >
                    + Add node
                </button>

                <div>
                    <button onClick={() => setNodeViewerOpen(true)}>
                        Nodes
                    </button>
                    <button onClick={() => setNodeViewerOpen(false)}>
                        Guideline
                    </button>
                </div>
            </div>
            {
                nodeViewerOpen ? (
                    <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
                        {/* canvas */}
                        <div style={{ flex: 1 }}>
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onConnect={onConnect}
                                onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                                fitView
                            >
                                <MiniMap />
                                <Controls />
                                <Background />
                            </ReactFlow>
                        </div>

                        {/* side panel */}
                        <div style={{ width: 340, borderLeft: '1px solid #eee', padding: 16 }}>
                            {selectedNode ? (
                                <NodeInspector
                                    key={selectedNode.id}
                                    node={selectedNode}
                                    allNodes={nodes}
                                    onChange={(updatedNode) =>
                                        setNodes((prev) =>
                                            prev.map((n) => (n.id === updatedNode.id ? updatedNode : n))
                                        )
                                    }
                                />
                            ) : (
                                <p>Select a node</p>
                            )}
                        </div>
                    </div>
                ) :
                    <GuidelineAccordionViewer
                        nodes={nodes}
                        entryNodeId={nodes.find((n) => n.data.isEntry)?.id || nodes[0].id}
                    />
            }
        </div>
    );
}
