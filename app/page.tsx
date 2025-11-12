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
export const initialNodes: Node<GuidelineNodeData>[] = [
    // 1. ENTRY
    {
        id: '1',
        position: { x: 100, y: 60 },
        data: {
            label: 'Adult with suspected infection?',
            description: 'Patient presents with fever, rigors, or suspected source of infection.',
            outputs: [
                { id: 'yes', label: 'Yes', target: '2' },
                { id: 'no', label: 'No, different complaint', target: '10' },
            ],
            isEntry: true,
        },
        type: 'default',
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
    },

    // 2. Check vital signs
    {
        id: '2',
        position: { x: 380, y: 60 },
        data: {
            label: 'Are vitals stable?',
            description: 'HR < 120, SBP ≥ 100, RR < 22, SpO₂ ≥ 92% (or baseline).',
            outputs: [
                { id: 'unstable', label: 'No / Unstable', target: '4' },
                { id: 'stable', label: 'Yes / Stable', target: '3' },
            ],
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
    },

    // 3. Stable → look for high-risk features
    {
        id: '3',
        position: { x: 660, y: 20 },
        data: {
            label: 'High-risk features present?',
            description:
                'Immunocompromised, pregnancy, severe local infection, failure of oral intake, no social support.',
            outputs: [
                { id: 'highrisk_yes', label: 'Yes', target: '6' },
                { id: 'highrisk_no', label: 'No', target: '5' },
            ],
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
    },

    // 4. Unstable → sepsis screen
    {
        id: '4',
        position: { x: 660, y: 150 },
        data: {
            label: 'Sepsis or septic shock suspected?',
            description: 'Hypotension, lactate ↑, altered mental status, RR > 22, qSOFA ≥ 2.',
            outputs: [
                { id: 'sepsis_yes', label: 'Yes', target: '7' },
                { id: 'sepsis_no', label: 'No but unstable', target: '6' },
            ],
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
    },

    // 5. Low risk & stable → manage as outpatient
    {
        id: '5',
        position: { x: 950, y: -40 },
        data: {
            label: 'Outpatient management',
            description:
                'Give first dose if needed, send home with antibiotics (per local guideline), safety-net advice.',
            outputs: [],
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
    },

    // 6. Admit / observe
    {
        id: '6',
        position: { x: 950, y: 80 },
        data: {
            label: 'Admit or clinical observation',
            description:
                'Arrange admission or observation unit; monitor vitals; obtain cultures if indicated.',
            outputs: [],
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
    },

    // 7. Sepsis bundle
    {
        id: '7',
        position: { x: 950, y: 220 },
        data: {
            label: 'Initiate sepsis bundle (1 hour)',
            description:
                'O₂, cultures, broad-spectrum antibiotics, fluids 30 mL/kg if hypotensive, lactate, early ICU consult.',
            outputs: [
                { id: 'after_bundle', label: 'Reassess response', target: '8' },
            ],
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
    },

    // 8. Reassess after sepsis bundle
    {
        id: '8',
        position: { x: 1230, y: 220 },
        data: {
            label: 'Improving after bundle?',
            description: 'BP, lactate, mental status, urine output.',
            outputs: [
                { id: 'improving_yes', label: 'Yes', target: '6' }, // admit/observe
                { id: 'improving_no', label: 'No / worsening', target: '9' },
            ],
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
    },

    // 9. Escalate
    {
        id: '9',
        position: { x: 1510, y: 220 },
        data: {
            label: 'Escalate care / ICU consult',
            description: 'Consider vasopressors, ICU transfer, senior review.',
            outputs: [],
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
    },

    // 10. Not actually infection pathway
    {
        id: '10',
        position: { x: 380, y: 260 },
        data: {
            label: 'Not infection pathway',
            description: 'Route to appropriate clinical guideline (injury, cardiac, other).',
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
