/**
 * The `grog` object handed to every plugin (runs *inside* the worker).
 *
 * This is the public plugin API. It is intentionally a high-level facade — each
 * method turns into an RPC call to the host, which maps it onto the low-level
 * `API.*`/native calls. Plugins never see native message types, request ids,
 * graph indices or port identities; they get friendly promises.
 *
 * Bumped independently of the native protocol: as long as this surface holds,
 * user plugins keep working across host refactors.
 */

import type {
    CreateNodeOptions,
    CreatedNode,
    NodePositionMove,
    ParamValue,
    PluginConnection,
    PluginNode,
} from "./protocol";

export const GROG_API_VERSION = "1.0";

/** Sends one RPC to the host and resolves with its reply. */
export type HostCall = (method: string, args: unknown[]) => Promise<unknown>;

export interface NotePlayOptions {
    /** Velocity 0..127 (default 100). */
    velocity?: number;
    /** MIDI channel 0..15 (default 0). */
    channel?: number;
    /** If set, an automatic note-off is scheduled this many ms later. */
    duration?: number;
}

export interface GrogApi {
    /** Version of this plugin API surface. */
    readonly version: string;
    /** Current values of the plugin's declared parameters. */
    readonly params: Record<string, ParamValue>;

    /** Subscribe to a host event (e.g. "graph.changed"). Returns an unsubscribe fn. */
    on(event: string, handler: (data: unknown) => void): () => void;
    off(event: string, handler: (data: unknown) => void): void;

    graph: {
        /** Nodes in the active graph, with measured sizes for layout. */
        getNodes(): Promise<PluginNode[]>;
        /** Directed connections between nodes in the active graph. */
        getConnections(): Promise<PluginConnection[]>;
        /** Move nodes to absolute positions (persisted host-side). */
        setNodePositions(moves: NodePositionMove[]): Promise<void>;
        /**
         * Create a node on the active graph. `key` is the node key — the `.vcl`
         * path with the leading "Nodes/" and the ".vcl" removed (e.g. the file
         * "Nodes/Utils/Gain.vcl" has key "Utils/Gain"). Returns the node's port
         * identities so you can wire it up.
         */
        createNode(key: string, options?: CreateNodeOptions): Promise<CreatedNode>;
        /** Connect an output port to an input port (both are identities from `createNode`). */
        connect(sourceOutputPortId: number, targetInputPortId: number): Promise<void>;
        /** Re-sync the canvas from the host after a batch of graph edits. */
        refresh(): Promise<void>;
    };

    fs: {
        /** Read a file from disk by path; resolves with its text (rejects if unreadable). */
        readFile(path: string): Promise<string>;
    };

    midi: {
        noteOn(note: number, velocity?: number, channel?: number): Promise<void>;
        noteOff(note: number, velocity?: number, channel?: number): Promise<void>;
        /** Play a note; with `duration` set, the note-off is scheduled for you. */
        play(note: number, options?: NotePlayOptions): Promise<void>;
    };

    presets: {
        list(): Promise<unknown[]>;
        load(filename: string): Promise<void>;
    };
}

/** Internal handle the worker uses to drive a plugin's `grog` instance. */
export interface GrogApiHandle {
    api: GrogApi;
    setParams(params: Record<string, ParamValue>): void;
    dispatch(event: string, data: unknown): void;
}

export function createGrogApi(callHost: HostCall, initialParams: Record<string, ParamValue>): GrogApiHandle {
    let params: Record<string, ParamValue> = { ...initialParams };
    const handlers = new Map<string, Set<(data: unknown) => void>>();

    const api: GrogApi = {
        version: GROG_API_VERSION,
        get params() {
            return params;
        },
        on(event, handler) {
            let set = handlers.get(event);
            if (!set) {
                set = new Set();
                handlers.set(event, set);
            }
            set.add(handler);
            return () => api.off(event, handler);
        },
        off(event, handler) {
            handlers.get(event)?.delete(handler);
        },
        graph: {
            getNodes: () => callHost("graph.getNodes", []) as Promise<PluginNode[]>,
            getConnections: () => callHost("graph.getConnections", []) as Promise<PluginConnection[]>,
            setNodePositions: (moves) => callHost("graph.setNodePositions", [moves]) as Promise<void>,
            createNode: (key, options) => callHost("graph.createNode", [key, options]) as Promise<CreatedNode>,
            connect: (source, target) => callHost("graph.connect", [source, target]) as Promise<void>,
            refresh: () => callHost("graph.refresh", []) as Promise<void>,
        },
        fs: {
            readFile: (path) => callHost("fs.readFile", [path]) as Promise<string>,
        },
        midi: {
            noteOn: (note, velocity, channel) => callHost("midi.noteOn", [note, velocity, channel]) as Promise<void>,
            noteOff: (note, velocity, channel) => callHost("midi.noteOff", [note, velocity, channel]) as Promise<void>,
            play: (note, options) => callHost("midi.play", [note, options]) as Promise<void>,
        },
        presets: {
            list: () => callHost("presets.list", []) as Promise<unknown[]>,
            load: (filename) => callHost("presets.load", [filename]) as Promise<void>,
        },
    };

    return {
        api,
        setParams(next) {
            params = { ...next };
        },
        dispatch(event, data) {
            const set = handlers.get(event);
            if (!set) return;
            for (const handler of set) {
                try {
                    handler(data);
                } catch (err) {
                    console.error(`plugin event handler for "${event}" threw`, err);
                }
            }
        },
    };
}
