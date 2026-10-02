import type { XYPosition } from "@xyflow/svelte";
import { callNative } from "./bridge";
import type {
    ConsoleMessage,
    Connection,
    ExposedInfo,
    ExposedValue,
    ConnectionCreationData,
    GraphInstance,
    Identity,
    Initializer,
    InputValueResult,
    NodeDefinitionList,
    NodeInstance,
    NodeKey,
    NodeMove,
    OutputGuardStatus,
    PresetMetadata,
} from "./types";

// Optional extension filters for the native open-file dialog, e.g.
// `[{ name: "SMPS", extensions: ["asm", "txt"] }]`.
export interface FileFilter {
    name: string;
    extensions: string[];
}

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

export function getPluginList(): Promise<string[]> {
    return callNative<string[]>("get_plugin_list", {});
}

// Lists the theme stylesheets in the host's Themes folder. Returns theme names
// *without* the `.css` extension, matching what `setTheme(name)` expects.
export function getThemeList(): Promise<string[]> {
    return callNative<string[]>("get_theme_list", {});
}

// Opens a native open-file dialog and resolves with the chosen file's absolute
// path, or `null` if the user cancelled. The dialog is modal and may stay open
// as long as the user likes, so this passes timeout 0 (wait indefinitely).
export function openFileDialog(filters?: FileFilter[]): Promise<string | null> {
    return callNative<string | null>("open_file_dialog", { filters }, 0);
}

// Reads a file from disk (native-side) and resolves with its text contents.
// Rejects if the path can't be read.
export function readFile(path: string): Promise<string> {
    return callNative<string>("read_file", { path });
}

// Reads a value out of the native config tree. `key` may be a dotted path into
// the nested tree (e.g. `"Plugins.my-plugin"`); the host resolves scalars and
// whole subtrees alike, and returns `null` for a missing key.
export function getConfigKey<T = unknown>(key: string): Promise<T> {
    return callNative<T>("get_config_key", { key });
}

// Writes a value into the native config tree at the (possibly dotted) `key`,
// splicing in scalars or whole subtrees. The host persists the config after the
// write. Resolves `true` on success.
export function setConfigKey(key: string, value: unknown): Promise<boolean> {
    return callNative<boolean>("set_config_key", { key, value });
}

// Fetches the full backlog of console messages the host has accumulated so far.
// New messages arrive incrementally via the `console_message` event.
export function getConsoleMessages(): Promise<ConsoleMessage[]> {
    return callNative<ConsoleMessage[]>("get_console_messages", {});
}

// UI access to the variables a node exposes (`[Expose]`, `[Expose(Write)]`).
// Only nodes of the root graph (graphId 0) have them: a node of a subgraph has
// one copy per use. See grog's docs/state-as-data.md §6.6.

// The node's exposed variables, as the last compile laid them out.
export function getExposed(graphId: number, identity: Identity): Promise<ExposedInfo[]> {
    return callNative<ExposedInfo[]>("get_exposed", { graphId, identity });
}

// Writes an exposed variable now, without a recompile. `value` is a number for
// every element, or one number per element. Rejected when the variable isn't
// writable (read-only, an output, a connected input) or the graph isn't compiled.
// On an input, the host also keeps the value as its initializer.
// Tiering (`state-as-data.md` §6.7): an unconnected input of the root graph is
// live (written without a recompile) while it's edited, and folded back into a
// constant once it settles. A grab makes it live before it moves.
export function grabInput(graphId: number, portId: Identity): Promise<void> {
    return callNative<void>("grab_input", { graphId, portId });
}

export function releaseInput(graphId: number, portId: Identity): Promise<void> {
    return callNative<void>("release_input", { graphId, portId });
}

// Sets the initializer of an unconnected input (or a parameter). `tiered`: the
// host applies it live, no recompile is needed.
export function setInputValue(graphId: number, portId: Identity, value: number): Promise<InputValueResult> {
    return callNative<InputValueResult>("set_input_value", { graphId, portId, value });
}

export function setExposedValue(graphId: number, identity: Identity, name: string, value: ExposedValue): Promise<void> {
    return callNative<void>("set_exposed_value", { graphId, identity, name, value });
}

export interface ExposedWatch {
    watchId: number;
    graphId: number;
    identity: Identity;
    name: string;
}

// Replaces the list of watched variables. Their values then arrive through the
// `exposed_values` event, about 30 times a second.
export function watchExposed(watches: ExposedWatch[]): Promise<void> {
    return callNative<void>("watch_exposed", { watches });
}

// The output guard (see `OutputGuardEvent`). Disabling it is saved in the
// config (`core.outputGuard`).
export function getOutputGuard(): Promise<OutputGuardStatus> {
    return callNative<OutputGuardStatus>("get_output_guard", {});
}

export function setOutputGuard(enabled: boolean): Promise<boolean> {
    return callNative<boolean>("set_output_guard", { enabled });
}

// Sets the peak above which the output trips, linear (1 is full scale); saved
// in the config (`core.outputGuardCeiling`). Resolves with the ceiling applied.
export function setOutputGuardCeiling(ceiling: number): Promise<number> {
    return callNative<number>("set_output_guard_ceiling", { ceiling });
}

// Unmutes a latched guard: the output fades back in from a reset graph.
export function rearmOutput(): Promise<void> {
    return callNative<void>("rearm_output", {});
}

// The output gain, linear (1 is unity), applied before the output guard. Saved
// with the plugin's state, not the config.
export function getOutputGain(): Promise<number> {
    return callNative<number>("get_output_gain", {});
}

// Resolves with the gain applied; rejects outside 0..+12 dB.
export function setOutputGain(gain: number): Promise<number> {
    return callNative<number>("set_output_gain", { gain });
}
