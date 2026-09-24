import type { XYPosition } from "@xyflow/svelte";
import { callNative } from "./bridge";
import type {
    Connection,
    ConnectionCreationData,
    GraphInstance,
    Identity,
    Initializer,
    NodeDefinitionList,
    NodeInstance,
    NodeKey,
    NodeMove,
    PresetMetadata,
} from "./types";

export function getNodeDefinitionList(): Promise<NodeDefinitionList> {
    return callNative<NodeDefinitionList>("get_node_definition_list");
}

export function getGraphInstances(): Promise<GraphInstance[]> {
    return callNative<GraphInstance[]>("get_graph_instances", {});
}

export function getGraphInstance(graphId: number): Promise<GraphInstance> {
    return callNative<GraphInstance>("get_graph_instance", { graphId });
}

export function createGraphInstance(): Promise<GraphInstance> {
    return callNative<GraphInstance>("create_graph_instance", {});
}

export function deleteGraphInstance(graphId: number): Promise<boolean> {
    return callNative<boolean>("delete_graph_instance", { graphId });
}

export function instantiateNode(graphId: number, nodeKey: NodeKey, position: XYPosition): Promise<NodeInstance> {
    return callNative<NodeInstance>("instantiate_node", {
        graphId,
        nodeKey,
        x: position.x,
        y: position.y,
    });
}

export function instantiateSubgraph(graphId: number, subgraphId: number, position: XYPosition): Promise<NodeInstance> {
    return callNative<NodeInstance>("instantiate_subgraph", {
        graphId,
        subgraphId,
        x: position.x,
        y: position.y,
    });
}

export function updateGraphName(graphId: number, name: string): Promise<boolean> {
    return callNative<boolean>("update_graph_name", {
        graphId,
        name,
    });
}

export function updateNodeName(graphId: number, identity: number, name: string): Promise<boolean> {
    return callNative<boolean>("update_node_name", {
        graphId,
        identity,
        name,
    });
}

export function updateFeedback(graphId: number, identity: number, feedbackIdentity: number): Promise<NodeInstance> {
    return callNative<NodeInstance>("update_feedback", {
        graphId,
        identity,
        feedbackIdentity,
    });
}

export function updateNodesPosition(graphId: number, moves: NodeMove[]): Promise<void> {
    return callNative<void>("update_nodes_position", { graphId, moves });
}

export function createConnection(
    graphId: number,
    sourcePortId: Identity,
    targetPortId: Identity,
): Promise<ConnectionCreationData> {
    return callNative<ConnectionCreationData>("create_connection", {
        graphId,
        sourcePortId,
        targetPortId,
    });
}

export function compileGraph(graphId: number): Promise<void> {
    return callNative<void>("compile_graph", { graphId });
}

export function dumpGraphIR(graphId: number): Promise<void> {
    return callNative<void>("dump_graph_ir", { graphId });
}

export function deleteNodesAndEdges(
    graphId: number,
    nodes: NodeInstance[],
    connections: Connection[],
): Promise<NodeInstance[]> {
    return callNative<NodeInstance[]>("delete_nodes_and_edges", {
        graphId,
        nodes,
        connections,
    });
}

export function updateInitializer(
    graphId: number,
    initializerId: Identity,
    initializer: Initializer,
): Promise<Initializer> {
    return callNative<Initializer>("update_initializer", {
        graphId,
        initializerId,
        initializer,
    });
}

export function newPreset(): Promise<boolean> {
    return callNative<boolean>("new_preset", {});
}

export function loadPreset(filename: string | undefined): Promise<boolean> {
    return callNative<boolean>("load_preset", {
        filename,
    });
}

export function savePreset(filename: string | undefined): Promise<boolean> {
    return callNative<boolean>("save_preset", {
        filename,
    });
}

export function getPresetList(): Promise<PresetMetadata[]> {
    return callNative<PresetMetadata[]>("get_preset_list", {});
}

export function getCurrentPresetMetadata(): Promise<PresetMetadata> {
    return callNative<PresetMetadata>("get_current_preset_metadata", {});
}

// Applies edited metadata to the current in-memory preset. The host bumps
// `lastModified` and returns the stored metadata.
export function updateCurrentPresetMetadata(metadata: PresetMetadata): Promise<PresetMetadata> {
    return callNative<PresetMetadata>("update_current_preset_metadata", { metadata });
}

// Sends a raw MIDI message to the native host. `data` is the byte sequence of a
// single MIDI message (status byte followed by its data bytes), e.g.
// `[0x90, 60, 100]` for Note On, middle C, velocity 100. This is deliberately
// low-level so any MIDI event (notes, control changes, pitch bend, …) can be
// expressed. Prefer the typed builders in `midi.ts` over calling this directly.
export function sendMidi(data: number[]): Promise<void> {
    return callNative<void>("send_midi", { data });
}
