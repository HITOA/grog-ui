import { getConfigKey, setConfigKey } from "./api";
import { CodeSharing } from "./types";

// Dotted config keys holding UI preferences, persisted native-side.
const SHOW_LOG_BAR_KEY = "Preferences.showLogBar";
const DEFAULT_SHOW_LOG_BAR = false;
const LIVE_RECOMPILE_KEY = "Preferences.liveRecompile";
const DEFAULT_LIVE_RECOMPILE = true;

// Graph compilation / optimization options, read by the native compiler.
const OPTIMIZATION_ENABLED_KEY = "Compilation.optimizationEnabled";
const DEFAULT_OPTIMIZATION_ENABLED = true;
const CODE_SHARING_KEY = "Compilation.codeSharing";
const DEFAULT_CODE_SHARING = CodeSharing.PerInstance;
const INLINED_NODES_KEY = "Compilation.inlinedNodes";
const DEFAULT_INLINED_NODES = true;
const USE_VARIANT_CACHE_KEY = "Compilation.useVariantCache";
const DEFAULT_USE_VARIANT_CACHE = true;

/**
 * Reactive controller for general UI preferences, persisted through the native
 * config tree (mirrors {@link themeManager} in shape).
 */
class SettingsManager {
    // Whether the thin console status strip beneath the footer is shown.
    showLogBar: boolean = $state(DEFAULT_SHOW_LOG_BAR);
    // Whether the graph is recompiled automatically after every modification.
    liveRecompile: boolean = $state(DEFAULT_LIVE_RECOMPILE);

    // Optimization options forwarded to the graph compiler.
    optimizationEnabled: boolean = $state(DEFAULT_OPTIMIZATION_ENABLED);
    codeSharing: CodeSharing = $state(DEFAULT_CODE_SHARING);
    inlinedNodes: boolean = $state(DEFAULT_INLINED_NODES);
    useVariantCache: boolean = $state(DEFAULT_USE_VARIANT_CACHE);

    /** Restore saved preferences from the native config tree. */
    async init(): Promise<void> {
        const [showLogBar, liveRecompile, optimizationEnabled, codeSharing, inlinedNodes, useVariantCache] =
            await Promise.all([
                loadKey<boolean>(SHOW_LOG_BAR_KEY),
                loadKey<boolean>(LIVE_RECOMPILE_KEY),
                loadKey<boolean>(OPTIMIZATION_ENABLED_KEY),
                loadKey<string>(CODE_SHARING_KEY),
                loadKey<boolean>(INLINED_NODES_KEY),
                loadKey<boolean>(USE_VARIANT_CACHE_KEY),
            ]);
        this.showLogBar = showLogBar ?? DEFAULT_SHOW_LOG_BAR;
        this.liveRecompile = liveRecompile ?? DEFAULT_LIVE_RECOMPILE;
        this.optimizationEnabled = optimizationEnabled ?? DEFAULT_OPTIMIZATION_ENABLED;
        this.codeSharing = isCodeSharing(codeSharing) ? codeSharing : DEFAULT_CODE_SHARING;
        this.inlinedNodes = inlinedNodes ?? DEFAULT_INLINED_NODES;
        this.useVariantCache = useVariantCache ?? DEFAULT_USE_VARIANT_CACHE;
    }

    /** Toggle the console status strip and persist the choice. */
    setShowLogBar(value: boolean): void {
        this.showLogBar = value;
        persistKey(SHOW_LOG_BAR_KEY, value);
    }

    /** Toggle automatic recompilation after graph modifications and persist the choice. */
    setLiveRecompile(value: boolean): void {
        this.liveRecompile = value;
        persistKey(LIVE_RECOMPILE_KEY, value);
    }

    /** Enable or disable graph optimizations and persist the choice. */
    setOptimizationEnabled(value: boolean): void {
        this.optimizationEnabled = value;
        persistKey(OPTIMIZATION_ENABLED_KEY, value);
    }

    /** Select how generated code is shared between node instances and persist the choice. */
    setCodeSharing(value: CodeSharing): void {
        this.codeSharing = value;
        persistKey(CODE_SHARING_KEY, value);
    }

    /** Toggle node inlining and persist the choice. */
    setInlinedNodes(value: boolean): void {
        this.inlinedNodes = value;
        persistKey(INLINED_NODES_KEY, value);
    }

    /** Toggle the compiled-variant cache and persist the choice. */
    setUseVariantCache(value: boolean): void {
        this.useVariantCache = value;
        persistKey(USE_VARIANT_CACHE_KEY, value);
    }
}

function isCodeSharing(value: unknown): value is CodeSharing {
    return Object.values(CodeSharing).includes(value as CodeSharing);
}

async function loadKey<T>(key: string): Promise<T | null> {
    try {
        return await getConfigKey<T | null>(key);
    } catch (err) {
        console.error(`failed to load saved setting ${key}:`, err);
        return null;
    }
}

function persistKey(key: string, value: unknown): void {
    void setConfigKey(key, value).catch((err) => console.error(`failed to persist ${key}:`, err));
}

export const settings = new SettingsManager();
