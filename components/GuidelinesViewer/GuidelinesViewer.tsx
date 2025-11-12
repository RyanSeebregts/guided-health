'use client';

import { GuidelineNodeData } from '@/app/page';
import React, { useMemo, useState } from 'react';
import type { Node } from 'reactflow';

type GuidelineAccordionViewerProps = {
    nodes: Node<GuidelineNodeData>[];
    entryNodeId: string;
};

export function GuidelineAccordionViewer({
    nodes,
    entryNodeId,
}: GuidelineAccordionViewerProps) {
    // path of node ids in order
    const [path, setPath] = useState<string[]>([entryNodeId]);

    // to find nodes fast
    const nodeById = useMemo(() => {
        const map: Record<string, Node<GuidelineNodeData>> = {};
        nodes.forEach((n) => {
            map[n.id] = n;
        });
        return map;
    }, [nodes]);

    // if entry node is missing, show nothing
    if (!nodeById[entryNodeId]) {
        return <div>Entry node not found.</div>;
    }

    function handleSelectOutput(stepIndex: number, targetNodeId?: string) {
        if (!targetNodeId) {
            // no target = end
            setPath((prev) => prev.slice(0, stepIndex + 1));
            return;
        }
        if (!nodeById[targetNodeId]) {
            // target not found – just stop at current
            setPath((prev) => prev.slice(0, stepIndex + 1));
            return;
        }
        setPath((prev) => {
            const next = prev.slice(0, stepIndex + 1); // chop off anything after this step
            next.push(targetNodeId);
            return next;
        });
    }

    return (
        <div style={{ maxWidth: 540, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {path.map((nodeId, idx) => {
                const node = nodeById[nodeId];
                const isLast = idx === path.length - 1;
                const outputs = node?.data.outputs ?? [];

                return (
                    <div
                        key={`${nodeId}-${idx}`}
                        style={{
                            border: '1px solid #ddd',
                            borderRadius: 8,
                            overflow: 'hidden',
                            background: 'white',
                        }}
                    >
                        {/* header */}
                        <div
                            style={{
                                padding: '10px 14px',
                                background: '#f5f5f5',
                                fontWeight: 600,
                            }}
                        >
                            Step {idx + 1}: {node?.data.label ?? 'Untitled'}
                        </div>

                        {/* body - only fully "active" for the last item */}
                        <div style={{ padding: 14, opacity: isLast ? 1 : 0.7 }}>
                            {node?.data.description && (
                                <p style={{ marginBottom: 10 }}>{node.data.description}</p>
                            )}

                            {outputs.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {outputs.map((out) => (
                                        <button
                                            key={out.id}
                                            onClick={() => handleSelectOutput(idx, out.target)}
                                            style={{
                                                padding: '6px 10px',
                                                borderRadius: 6,
                                                border: '1px solid #ccc',
                                                background: '#fff',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {out.label || 'Next'}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ fontStyle: 'italic', color: '#666' }}>
                                    No outputs – this looks like an end node.
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
