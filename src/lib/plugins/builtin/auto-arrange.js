/**
 * Auto Arrange — a built-in example plugin.
 *
 * Lays the active graph out in layers along the signal flow: nodes with no
 * incoming connections start the first layer, and each connection pushes its
 * target one layer further along. It only reads the graph and writes node
 * positions through the high-level `grog` API — it knows nothing about Svelte,
 * xyflow or the native bridge.
 *
 * This file is authored the way a user plugin would be and is loaded from its
 * source text, so it is intentionally excluded from the app's TypeScript build.
 */

export default {
    manifest: {
        id: "auto-arrange",
        name: "Auto Arrange",
        description: "Automatically lays the graph out in signal-flow layers.",
        version: "1.0.0",
        author: "grog",
        parameters: [
            {
                key: "gap",
                label: "Gap between nodes",
                description: "Minimum space between two nodes in the same layer.",
                type: "number",
                default: 40,
                min: 0,
                max: 400,
                step: 5,
            },
            {
                key: "layerGap",
                label: "Gap between layers",
                description: "Space between successive layers along the flow.",
                type: "number",
                default: 120,
                min: 0,
                max: 600,
                step: 10,
            },
            {
                key: "direction",
                label: "Flow direction",
                type: "enum",
                default: "horizontal",
                options: [
                    { value: "horizontal", label: "Left to right" },
                    { value: "vertical", label: "Top to bottom" },
                ],
            },
        ],
        commands: [{ id: "arrange", label: "Arrange now" }],
    },

    onLoad() {
        // Nothing to set up — this plugin is purely command-driven. A more
        // involved plugin could subscribe here, e.g. grog.on("graph.changed", ...).
    },

    async onCommand(grog, commandId) {
        if (commandId !== "arrange") return;
        await arrange(grog);
    },
};

async function arrange(grog) {
    const nodes = await grog.graph.getNodes();
    if (nodes.length === 0) return;

    const connections = await grog.graph.getConnections();
    const gap = numberParam(grog.params.gap, 40);
    const layerGap = numberParam(grog.params.layerGap, 120);
    const vertical = grog.params.direction === "vertical";

    const layerOf = computeLayers(nodes, connections);

    // Group nodes by layer, preserving a stable order (by current cross-axis
    // position) so the arrangement doesn't shuffle unpredictably.
    const layers = new Map();
    for (const node of nodes) {
        const layer = layerOf.get(node.id) ?? 0;
        if (!layers.has(layer)) layers.set(layer, []);
        layers.get(layer).push(node);
    }

    const originX = Math.min(...nodes.map((n) => n.x));
    const originY = Math.min(...nodes.map((n) => n.y));

    const moves = [];
    // `flow` advances along the signal direction (layer to layer); `cross`
    // stacks the nodes within a layer.
    let flow = vertical ? originY : originX;
    for (const layer of [...layers.keys()].sort((a, b) => a - b)) {
        const group = layers.get(layer).sort((a, b) => (vertical ? a.x - b.x : a.y - b.y));
        const flowExtent = Math.max(...group.map((n) => (vertical ? n.height : n.width)));

        let cross = vertical ? originX : originY;
        for (const node of group) {
            if (vertical) moves.push({ id: node.id, x: cross, y: flow });
            else moves.push({ id: node.id, x: flow, y: cross });
            cross += (vertical ? node.width : node.height) + gap;
        }
        flow += flowExtent + layerGap;
    }

    await grog.graph.setNodePositions(moves);
}

/**
 * Longest-path layering by relaxation: converges for acyclic graphs and stays
 * bounded (never loops forever) when the graph contains feedback cycles.
 */
function computeLayers(nodes, connections) {
    const layer = new Map(nodes.map((n) => [n.id, 0]));
    for (let iteration = 0; iteration < nodes.length; iteration++) {
        let changed = false;
        for (const edge of connections) {
            const from = layer.get(edge.source);
            if (from === undefined) continue;
            if ((layer.get(edge.target) ?? 0) < from + 1) {
                layer.set(edge.target, from + 1);
                changed = true;
            }
        }
        if (!changed) break;
    }
    return layer;
}

function numberParam(value, fallback) {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
