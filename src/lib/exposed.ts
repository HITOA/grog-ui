import * as API from "./api";
import type { ExposedValue, ExposedValueUpdate, Identity } from "./types";

// Live values of the variables nodes expose (`[Expose]`). The host pushes them
// up to 60 times a second (`core.exposedRate`); they stay out of reactive
// state, so that they never make Svelte or xyflow re-render the graph. A
// readout registers a listener and draws the value itself; listeners run from
// one animation frame per update.

type Listener = (value: ExposedValue) => void;

interface Watch {
    watchId: number;
    graphId: number;
    identity: Identity;
    name: string;
    listeners: Set<Listener>;
    last?: ExposedValue;
}

// Delay coalescing the (un)registrations of a render into one watch list.
const SYNC_DELAY_MS = 50;

const watches = new Map<string, Watch>();
const watchesById = new Map<number, Watch>();
let nextWatchId = 1;
let syncTimer: ReturnType<typeof setTimeout> | null = null;

const pending = new Map<number, ExposedValue>();
let frame: number | null = null;

function keyOf(graphId: number, identity: Identity, name: string): string {
    return `${graphId}/${identity}/${name}`;
}

// The host keeps the whole list: send it again whenever it changes.
function scheduleSync(): void {
    if (syncTimer !== null) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
        syncTimer = null;
        const list = [...watches.values()].map(({ watchId, graphId, identity, name }) => ({
            watchId,
            graphId,
            identity,
            name,
        }));
        API.watchExposed(list).catch((err) => console.error("failed to update the watch list:", err));
    }, SYNC_DELAY_MS);
}

/**
 * Calls `listener` with each new value of the variable `name` of node `identity`,
 * until the returned function is called. Several listeners of one variable share
 * its watch.
 */
export function watchExposed(graphId: number, identity: Identity, name: string, listener: Listener): () => void {
    const key = keyOf(graphId, identity, name);
    let watch = watches.get(key);
    if (watch === undefined) {
        watch = { watchId: nextWatchId++, graphId, identity, name, listeners: new Set() };
        watches.set(key, watch);
        watchesById.set(watch.watchId, watch);
        scheduleSync();
    }
    watch.listeners.add(listener);
    if (watch.last !== undefined) listener(watch.last);

    const registered = watch;
    return () => {
        registered.listeners.delete(listener);
        if (registered.listeners.size > 0) return;
        watches.delete(key);
        watchesById.delete(registered.watchId);
        scheduleSync();
    };
}

function flush(): void {
    frame = null;
    for (const [watchId, value] of pending) {
        const watch = watchesById.get(watchId);
        if (watch === undefined) continue;
        watch.last = value;
        watch.listeners.forEach((listener) => listener(value));
    }
    pending.clear();
}

// Handles the host's `exposed_values` event.
export function onExposedValues(values: ExposedValueUpdate[]): void {
    values.forEach(({ watchId, value }) => pending.set(watchId, value));
    if (frame === null && pending.size > 0) frame = requestAnimationFrame(flush);
}

// A short text for a value: a value repeated in every element (a Vec splat) is
// shown once, a longer array by its first elements.
export function formatExposedValue(value: ExposedValue): string {
    const one = (v: number | boolean): string => {
        if (typeof v === "boolean") return v ? "on" : "off";
        if (Number.isInteger(v)) return String(v);
        const abs = Math.abs(v);
        return v.toFixed(abs >= 100 ? 1 : abs >= 10 ? 2 : 3);
    };
    if (!Array.isArray(value)) return one(value);
    if (value.length > 0 && value.every((v) => v === value[0])) return one(value[0]);
    const shown = value.slice(0, 3).map(one).join(", ");
    return value.length > 3 ? `[${shown}, …]` : `[${shown}]`;
}
