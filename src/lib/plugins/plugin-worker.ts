/**
 * The single worker that hosts *all* plugins (one thread, not one-per-plugin).
 *
 * Responsibilities:
 *   - register: import a plugin's source and read its manifest (no `onLoad`).
 *   - enable/disable: run the plugin's lifecycle hooks.
 *   - command: invoke a declared action.
 *   - event: fan a host event out to every enabled plugin.
 *   - rpc: relay a plugin's `grog.*` call to the host and resolve its promise.
 *
 * Running here keeps plugins off the main thread (they cannot touch the DOM,
 * Svelte or the real `api.ts`); their only capability is the `grog` facade.
 */

/// <reference lib="webworker" />

import { createGrogApi, type GrogApiHandle } from "./grog-api";
import type { HostToWorker, ParamValue, PluginManifest, WorkerToHost } from "./protocol";

/** Shape a plugin module is expected to default-export. */
interface PluginModule {
    manifest: PluginManifest;
    onLoad?(grog: GrogApiHandle["api"]): void | Promise<void>;
    onUnload?(grog: GrogApiHandle["api"]): void | Promise<void>;
    onCommand?(grog: GrogApiHandle["api"], commandId: string): void | Promise<void>;
}

interface RegisteredPlugin {
    module: PluginModule;
    /** Present only while enabled. */
    handle?: GrogApiHandle;
}

const ctx = self as unknown as DedicatedWorkerGlobalScope;
const plugins = new Map<string, RegisteredPlugin>();

// --- RPC to the host (plugin -> grog.* -> host) ---

let rpcId = 0;
const pendingRpc = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

function post(message: WorkerToHost): void {
    ctx.postMessage(message);
}

function callHost(method: string, args: unknown[]): Promise<unknown> {
    return new Promise((resolve, reject) => {
        const requestId = rpcId++;
        pendingRpc.set(requestId, { resolve, reject });
        post({ kind: "rpc", requestId, method, args });
    });
}

// --- Lifecycle ---

async function register(pluginId: string, source: string): Promise<void> {
    try {
        // Turn the source string into an importable module. This is the same
        // path a user/native-delivered plugin takes; nothing is bundled in.
        const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
        let module: PluginModule;
        try {
            module = (await import(/* @vite-ignore */ url)).default as PluginModule;
        } finally {
            URL.revokeObjectURL(url);
        }
        if (!module?.manifest?.id) throw new Error("plugin has no manifest.id");
        plugins.set(pluginId, { module });
        post({ kind: "registered", pluginId, manifest: module.manifest });
    } catch (err) {
        post({ kind: "registered", pluginId, error: errorMessage(err) });
    }
}

async function enable(pluginId: string, params: Record<string, ParamValue>): Promise<void> {
    const entry = plugins.get(pluginId);
    if (!entry) return;
    try {
        entry.handle = createGrogApi(callHost, params);
        await entry.module.onLoad?.(entry.handle.api);
        post({ kind: "enabled", pluginId });
    } catch (err) {
        entry.handle = undefined;
        post({ kind: "enabled", pluginId, error: errorMessage(err) });
    }
}

async function disable(pluginId: string): Promise<void> {
    const entry = plugins.get(pluginId);
    if (!entry?.handle) return;
    try {
        await entry.module.onUnload?.(entry.handle.api);
        post({ kind: "disabled", pluginId });
    } catch (err) {
        post({ kind: "disabled", pluginId, error: errorMessage(err) });
    } finally {
        entry.handle = undefined;
    }
}

async function command(
    requestId: number,
    pluginId: string,
    commandId: string,
    params: Record<string, ParamValue>,
): Promise<void> {
    const entry = plugins.get(pluginId);
    if (!entry?.handle) {
        post({ kind: "commandResult", requestId, error: "plugin is not enabled" });
        return;
    }
    try {
        entry.handle.setParams(params);
        await entry.module.onCommand?.(entry.handle.api, commandId);
        post({ kind: "commandResult", requestId });
    } catch (err) {
        post({ kind: "commandResult", requestId, error: errorMessage(err) });
    }
}

function errorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
}

// --- Inbound message pump ---

ctx.onmessage = (e: MessageEvent<HostToWorker>) => {
    const msg = e.data;
    switch (msg.kind) {
        case "register":
            void register(msg.pluginId, msg.source);
            break;
        case "enable":
            void enable(msg.pluginId, msg.params);
            break;
        case "disable":
            void disable(msg.pluginId);
            break;
        case "params":
            plugins.get(msg.pluginId)?.handle?.setParams(msg.params);
            break;
        case "command":
            void command(msg.requestId, msg.pluginId, msg.commandId, msg.params);
            break;
        case "event":
            for (const entry of plugins.values()) entry.handle?.dispatch(msg.event, msg.data);
            break;
        case "rpcResult": {
            const pending = pendingRpc.get(msg.requestId);
            if (!pending) break;
            pendingRpc.delete(msg.requestId);
            if (msg.error) pending.reject(new Error(msg.error));
            else pending.resolve(msg.data);
            break;
        }
    }
};
