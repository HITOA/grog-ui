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
import { assertIsGenericNode } from "../assertions";
import type { NodeMove } from "../types";
import type { NodePositionMove, PluginConnection, PluginNode } from "./protocol";

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
