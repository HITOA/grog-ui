/**
 * Shared contract between the main thread (plugin host) and the plugin worker.
 *
 * Everything here is plain data — it crosses the worker boundary via
 * `postMessage`, which structured-clones its argument, so no functions, class
 * instances or Svelte `$state` proxies may appear in these shapes. (Snapshot
 * reactive state with `$state.snapshot` before sending it.)
 *
 * This is deliberately separate from `src/lib/api.ts`: `api.ts` mirrors the raw
 * native protocol, whereas this is the high-level, stable surface plugins see.
 */

// --- Parameter schema (declared by a plugin, rendered by the host) ---

export type ParamValue = number | boolean | string;

interface ParamBase {
    /** Stable key used to read the value back (`grog.params[key]`). */
    key: string;
    /** Human label shown in the config window. */
    label: string;
    description?: string;
}

export interface NumberParam extends ParamBase {
    type: "number";
    default: number;
    min?: number;
    max?: number;
    step?: number;
}

export interface BooleanParam extends ParamBase {
    type: "boolean";
    default: boolean;
}

export interface StringParam extends ParamBase {
    type: "string";
    default: string;
}

export interface EnumParam extends ParamBase {
    type: "enum";
    default: string;
    options: { value: string; label: string }[];
}

export type PluginParam = NumberParam | BooleanParam | StringParam | EnumParam;

/** A one-shot action a plugin exposes; rendered as a button in the config window. */
export interface PluginCommand {
    id: string;
    label: string;
    description?: string;
}

/**
 * Declarative description of a plugin. Extracted from the plugin module without
 * running its `onLoad`, so the host can build menus and config windows for a
 * plugin that isn't enabled yet.
 */
export interface PluginManifest {
    id: string;
    name: string;
    description?: string;
    version?: string;
    author?: string;
    parameters?: PluginParam[];
    commands?: PluginCommand[];
}

// --- High-level data the plugin API exchanges with the host ---

/** A node as a plugin sees it: identity + placement + measured size. */
export interface PluginNode {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

/** A directed link between two nodes (port detail omitted — high level). */
export interface PluginConnection {
    source: string;
    target: string;
}

/** A request to move a node to an absolute position. */
export interface NodePositionMove {
    id: string;
    x: number;
    y: number;
}

// --- Messages: host -> worker ---

export type HostToWorker =
    | { kind: "register"; pluginId: string; source: string }
    | { kind: "enable"; pluginId: string; params: Record<string, ParamValue> }
    | { kind: "disable"; pluginId: string }
    | { kind: "params"; pluginId: string; params: Record<string, ParamValue> }
    | { kind: "command"; requestId: number; pluginId: string; commandId: string; params: Record<string, ParamValue> }
    | { kind: "event"; event: string; data: unknown }
    | { kind: "rpcResult"; requestId: number; data?: unknown; error?: string };

// --- Messages: worker -> host ---

export type WorkerToHost =
    | { kind: "registered"; pluginId: string; manifest?: PluginManifest; error?: string }
    | { kind: "enabled"; pluginId: string; error?: string }
    | { kind: "disabled"; pluginId: string; error?: string }
    | { kind: "commandResult"; requestId: number; error?: string }
    | { kind: "rpc"; requestId: number; method: string; args: unknown[] }
    | { kind: "log"; pluginId: string; level: "log" | "warn" | "error"; message: string };
