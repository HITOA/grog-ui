/**
 * Host-side implementation of the plugin API (runs on the main thread).
 *
 * Every `grog.*` call a plugin makes arrives here as one RPC and is mapped onto
 * the low-level `API.*`/native calls. This is the *only* place plugin requests
 * touch the real app, so it doubles as the capability boundary: a method that
 * isn't in this switch simply doesn't exist for plugins.
 */

import * as API from "../api";
import * as midi from "../midi";
import { grogState } from "../state.svelte";
import { onUpdateGraph } from "../actions";
import { assertIsGenericNode } from "../assertions";
import type { Initializer, NodeMove } from "../types";
import type { CreateNodeOptions, CreatedNode, NodePositionMove, PluginConnection, PluginNode } from "./protocol";

// Fallback node footprint when the canvas hasn't measured a node yet.
const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 80;

function getNodes(): PluginNode[] {
    return grogState.currentFlow.nodes.map((node) => {
        assertIsGenericNode(node);
        return {
            id: node.id,
            name: node.data.instance.displayName,
            x: node.position.x,
            y: node.position.y,
            width: node.measured?.width ?? node.width ?? DEFAULT_NODE_WIDTH,
            height: node.measured?.height ?? node.height ?? DEFAULT_NODE_HEIGHT,
        };
    });
}

function getConnections(): PluginConnection[] {
    return grogState.currentFlow.edges.map((edge) => ({ source: edge.source, target: edge.target }));
}

async function setNodePositions(moves: NodePositionMove[]): Promise<void> {
    const graphId = grogState.currentFlowIndex;
    const nodeMoves: NodeMove[] = moves.map((move) => ({
        identity: parseInt(move.id),
        position: { x: move.x, y: move.y },
    }));

    await API.updateNodesPosition(graphId, nodeMoves);

    // Reflect the new positions on the canvas. `nodes` is `$state.raw`, so we
    // reassign a fresh array (with fresh position objects) to trigger a render.
    const byId = new Map(moves.map((move) => [move.id, move]));
    grogState.currentFlow.nodes = grogState.currentFlow.nodes.map((node) => {
        const move = byId.get(node.id);
        return move ? { ...node, position: { x: move.x, y: move.y } } : node;
    });
}

async function createNode(key: string, options: CreateNodeOptions): Promise<CreatedNode> {
    const graphId = grogState.currentFlowIndex;
    const position = options.position ?? { x: 0, y: 0 };
    const instance = await API.instantiateNode(graphId, key, position);

    // Map each port's display name to the host-assigned identity so the plugin
    // can address ports by name when setting initializers and wiring.
    const inputs: Record<string, number> = {};
    const outputs: Record<string, number> = {};
    const parameters: Record<string, number> = {};
    instance.inputs?.forEach((port) => (inputs[port.displayName] = port.identity));
    instance.outputs?.forEach((port) => (outputs[port.displayName] = port.identity));
    instance.parameters?.forEach((port) => (parameters[port.displayName] = port.identity));

    // Apply requested initializers. Ports left unset keep the node's defaults
    // (and any port that gets connected later is driven by its connection).
    // They target distinct ports of the just-created node, so fire them together.
    const inits: Promise<unknown>[] = [];
    for (const [name, value] of Object.entries(options.inputs ?? {})) {
        const id = inputs[name];
        if (id !== undefined) inits.push(API.updateInitializer(graphId, id, value as Initializer));
    }
    for (const [name, value] of Object.entries(options.parameters ?? {})) {
        const id = parameters[name];
        if (id !== undefined) inits.push(API.updateInitializer(graphId, id, value as Initializer));
    }
    await Promise.all(inits);

    return { id: instance.identity, inputs, outputs, parameters };
}

async function connect(sourceOutputPortId: number, targetInputPortId: number): Promise<void> {
    const result = await API.createConnection(grogState.currentFlowIndex, sourceOutputPortId, targetInputPortId);
    if (!result.isValid) {
        throw new Error(`connection ${sourceOutputPortId} -> ${targetInputPortId} was rejected`);
    }
}

async function refreshGraph(): Promise<void> {
    // Pull authoritative state and rebuild the canvas — simpler and safer than
    // tracking every incremental node/edge the plugin just created.
    onUpdateGraph(await API.getGraphInstance(grogState.currentFlowIndex));
}

/**
 * Dispatch one plugin RPC. Args are positional, matching the `grog` facade in
 * `grog-api.ts`. Throwing here rejects the plugin's promise with the message.
 */
export async function handleHostCall(method: string, args: unknown[]): Promise<unknown> {
    switch (method) {
        case "graph.getNodes":
            return getNodes();
        case "graph.getConnections":
            return getConnections();
        case "graph.setNodePositions":
            return setNodePositions(args[0] as NodePositionMove[]);
        case "graph.createNode":
            return createNode(args[0] as string, (args[1] ?? {}) as CreateNodeOptions);
        case "graph.connect":
            return connect(args[0] as number, args[1] as number);
        case "graph.refresh":
            return refreshGraph();

        case "fs.readFile":
            return API.readFile(args[0] as string);

        case "midi.noteOn":
            midi.noteOn(args[0] as number, (args[1] as number) ?? 100, (args[2] as number) ?? 0);
            return;
        case "midi.noteOff":
            midi.noteOff(args[0] as number, (args[1] as number) ?? 0, (args[2] as number) ?? 0);
            return;
        case "midi.play": {
            const note = args[0] as number;
            const opts = (args[1] ?? {}) as { velocity?: number; channel?: number; duration?: number };
            const velocity = opts.velocity ?? 100;
            const channel = opts.channel ?? 0;
            midi.noteOn(note, velocity, channel);
            if (opts.duration && opts.duration > 0) {
                setTimeout(() => midi.noteOff(note, 0, channel), opts.duration);
            }
            return;
        }

        case "presets.list":
            return API.getPresetList();
        case "presets.load":
            return API.loadPreset(args[0] as string);

        default:
            throw new Error(`unknown plugin API method "${method}"`);
    }
}
