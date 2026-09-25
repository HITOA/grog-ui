/**
 * Main-thread controller and reactive registry for the plugin system.
 *
 * Owns the single plugin worker, tracks each plugin's enabled state and
 * parameter values (as Svelte state, so the menu and config window stay live),
 * routes plugin RPCs to `host-api`, and fans host events out to the worker.
 */

import { handleHostCall } from "./host-api";
import { getPluginList, openFileDialog, readFile, type FileFilter } from "../api";
import type { HostToWorker, ParamValue, PluginManifest, PluginParam, WorkerToHost } from "./protocol";

/** Reactive per-plugin state. One instance per registered plugin. */
export class PluginEntry {
    /** Addressing key shared with the worker — the plugin's source file path. */
    readonly id: string;
    readonly manifest: PluginManifest;
    enabled = $state(false);
    params = $state<Record<string, ParamValue>>({});
    busy = $state(false);
    error = $state<string | undefined>(undefined);

    constructor(id: string, manifest: PluginManifest) {
        this.id = id;
        this.manifest = manifest;
        this.params = defaultParams(manifest.parameters);
    }

    /** A plugin with parameters or commands gets a config window; others just toggle. */
    get hasConfig(): boolean {
        return (this.manifest.parameters?.length ?? 0) > 0 || (this.manifest.commands?.length ?? 0) > 0;
    }
}

function defaultParams(params: PluginParam[] | undefined): Record<string, ParamValue> {
    const values: Record<string, ParamValue> = {};
    for (const param of params ?? []) values[param.key] = param.default;
    return values;
}

class PluginHost {
    /** All registered plugins, in registration order. */
    plugins = $state<PluginEntry[]>([]);
    /** The plugin whose config window is open, if any. */
    configPluginId = $state<string | undefined>(undefined);

    private worker: Worker | undefined;
    private commandReqId = 0;
    private pendingCommands = new Map<number, { resolve: () => void; reject: (e: Error) => void }>();

    /** Boot the worker and register every plugin the host discovered. Call once at startup. */
    async init(): Promise<void> {
        if (this.worker) return;
        this.worker = new Worker(new URL("./plugin-worker.ts", import.meta.url), { type: "module" });
        this.worker.onmessage = (e: MessageEvent<WorkerToHost>) => this.onWorkerMessage(e.data);

        // Fetch the plugin file list from the host, then register each one by its
        // source text. The file path doubles as the plugin's addressing id.
        let paths: string[];
        try {
            paths = await getPluginList();
        } catch (err) {
            console.error("failed to list plugins:", err);
            return;
        }
        for (const path of paths) {
            try {
                const source = await readFile(path);
                this.send({ kind: "register", pluginId: path, source });
            } catch (err) {
                console.error(`failed to read plugin "${path}":`, err);
            }
        }
    }

    getEntry(id: string | undefined): PluginEntry | undefined {
        return this.plugins.find((p) => p.id === id);
    }

    get configEntry(): PluginEntry | undefined {
        return this.getEntry(this.configPluginId);
    }

    openConfig(id: string): void {
        this.configPluginId = id;
    }

    closeConfig(): void {
        this.configPluginId = undefined;
    }

    setEnabled(id: string, enabled: boolean): void {
        const entry = this.getEntry(id);
        if (!entry || entry.enabled === enabled) return;
        entry.enabled = enabled;
        entry.error = undefined;
        entry.busy = true;
        if (enabled) this.send({ kind: "enable", pluginId: id, params: $state.snapshot(entry.params) });
        else this.send({ kind: "disable", pluginId: id });
    }

    setParam(id: string, key: string, value: ParamValue): void {
        const entry = this.getEntry(id);
        if (!entry) return;
        entry.params = { ...entry.params, [key]: value };
        if (entry.enabled) this.send({ kind: "params", pluginId: id, params: $state.snapshot(entry.params) });
    }

    /** Open a native file dialog for a `file` parameter and store the chosen path. */
    async browseParam(id: string, key: string, filters?: FileFilter[]): Promise<void> {
        // Contract is a bare path string, but tolerate a { path } object too.
        const result: unknown = await openFileDialog(filters);
        const path = typeof result === "string" ? result : ((result as { path?: string } | null)?.path ?? "");
        if (path) this.setParam(id, key, path);
    }

    /** Run a plugin command; resolves when the worker acks (rejects on error). */
    invokeCommand(id: string, commandId: string): Promise<void> {
        const entry = this.getEntry(id);
        if (!entry) return Promise.reject(new Error("unknown plugin"));
        return new Promise<void>((resolve, reject) => {
            const requestId = this.commandReqId++;
            this.pendingCommands.set(requestId, { resolve, reject });
            this.send({
                kind: "command",
                requestId,
                pluginId: id,
                commandId,
                params: $state.snapshot(entry.params),
            });
        });
    }

    /** Broadcast a host event to every enabled plugin. */
    emit(event: string, data: unknown): void {
        this.send({ kind: "event", event, data });
    }

    private send(message: HostToWorker): void {
        this.worker?.postMessage(message);
    }

    private onWorkerMessage(msg: WorkerToHost): void {
        switch (msg.kind) {
            case "registered": {
                if (msg.error || !msg.manifest) {
                    console.error(`plugin "${msg.pluginId}" failed to register:`, msg.error);
                    break;
                }
                this.plugins = [...this.plugins, new PluginEntry(msg.pluginId, msg.manifest)];
                break;
            }
            case "enabled": {
                const entry = this.getEntry(msg.pluginId);
                if (!entry) break;
                entry.busy = false;
                if (msg.error) {
                    entry.enabled = false;
                    entry.error = msg.error;
                }
                break;
            }
            case "disabled": {
                const entry = this.getEntry(msg.pluginId);
                if (entry) entry.busy = false;
                break;
            }
            case "commandResult": {
                const pending = this.pendingCommands.get(msg.requestId);
                if (!pending) break;
                this.pendingCommands.delete(msg.requestId);
                if (msg.error) pending.reject(new Error(msg.error));
                else pending.resolve();
                break;
            }
            case "rpc":
                void this.handleRpc(msg.requestId, msg.method, msg.args);
                break;
            case "log":
                console[msg.level](`[plugin ${msg.pluginId}]`, msg.message);
                break;
        }
    }

    private async handleRpc(requestId: number, method: string, args: unknown[]): Promise<void> {
        try {
            const data = await handleHostCall(method, args);
            this.send({ kind: "rpcResult", requestId, data });
        } catch (err) {
            this.send({ kind: "rpcResult", requestId, error: err instanceof Error ? err.message : String(err) });
        }
    }
}

export const pluginHost = new PluginHost();
