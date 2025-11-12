import { GuidelineNodeData } from "@/app/page";
import { Node } from "reactflow";

type NodeInspectorProps = {
    node: Node<GuidelineNodeData>;
    allNodes: Node<GuidelineNodeData>[];
    onChange: (node: Node<GuidelineNodeData>) => void;
};

export function NodeInspector({ node, allNodes, onChange }: NodeInspectorProps) {
    const { data } = node;

    const updateData = (newData: Partial<GuidelineNodeData>) => {
        onChange({
            ...node,
            data: { ...node.data, ...newData },
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3>Node properties</h3>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                Title
                <input
                    value={data.label}
                    onChange={(e) => updateData({ label: e.target.value })}
                />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                Description
                <textarea
                    value={data.description ?? ''}
                    onChange={(e) => updateData({ description: e.target.value })}
                    rows={3}
                />
            </label>

            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h4>Outputs</h4>
                    <button
                        onClick={() =>
                            updateData({
                                outputs: [
                                    ...(data.outputs ?? []),
                                    {
                                        id: `out-${(data.outputs?.length ?? 0) + 1}`,
                                        label: 'New option',

                                    },
                                ],
                            })
                        }
                    >
                        + Add
                    </button>
                </div>

                {(data.outputs ?? []).map((out, idx) => (
                    <div
                        key={out.id}
                        style={{
                            border: '1px solid #ddd',
                            borderRadius: 6,
                            padding: 8,
                            marginTop: 8,
                        }}
                    >
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            Edge label
                            <input
                                value={out.label}
                                onChange={(e) => {
                                    const outputs = [...(data.outputs ?? [])];
                                    outputs[idx] = { ...out, label: e.target.value };
                                    updateData({ outputs });
                                }}
                            />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            Connects to
                            <select
                                value={out.target ?? ''}
                                onChange={(e) => {
                                    const outputs = [...(data.outputs ?? [])];
                                    outputs[idx] = {
                                        ...out,
                                        target: e.target.value || undefined,
                                    };
                                    updateData({ outputs });
                                }}
                            >
                                <option value="">— not connected —</option>
                                {allNodes
                                    .filter((n) => n.id !== node.id)
                                    .map((n) => (
                                        <option key={n.id} value={n.id}>
                                            {n.data.label || n.id}
                                        </option>
                                    ))}
                            </select>
                        </label>

                        <button
                            onClick={() => {
                                const outputs =
                                    (data.outputs ?? []).filter((o) => o.id !== out.id);
                                updateData({ outputs });
                            }}
                            style={{ marginTop: 6 }}
                        >
                            Delete output
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
