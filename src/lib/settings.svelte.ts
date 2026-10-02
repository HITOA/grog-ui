import { getConfigKey, setConfigKey, setOutputGuard, setOutputGuardCeiling } from "./api";
import { CodeSharing } from "./types";

// Dotted config keys holding UI preferences, persisted native-side.
const SHOW_LOG_BAR_KEY = "Preferences.showLogBar";
const DEFAULT_SHOW_LOG_BAR = false;
const LIVE_RECOMPILE_KEY = "Preferences.liveRecompile";
const DEFAULT_LIVE_RECOMPILE = true;
const NODE_WIDGETS_KEY = "Preferences.nodeWidgets";
const DEFAULT_NODE_WIDGETS = true;

// Graph compilation / optimization options, read by the native compiler.
const OPTIMIZATION_ENABLED_KEY = "Compilation.optimizationEnabled";
const DEFAULT_OPTIMIZATION_ENABLED = true;
const CODE_SHARING_KEY = "Compilation.codeSharing";
const DEFAULT_CODE_SHARING = CodeSharing.PerInstance;
const INLINED_NODES_KEY = "Compilation.inlinedNodes";
const DEFAULT_INLINED_NODES = true;
const USE_VARIANT_CACHE_KEY = "Compilation.useVariantCache";
const DEFAULT_USE_VARIANT_CACHE = true;

// How often the host sends the watched exposed values and the output meter, in
// Hz. Read by the audio thread, which takes them in 1..60.
const EXPOSED_RATE_KEY = "core.exposedRate";
const METER_RATE_KEY = "core.meterRate";
export const DEFAULT_UPDATE_RATE = 15;

// How long the audio thread ramps a knob's input to each value sent, in seconds
// (0 is off): moved fast, it would otherwise step and crackle. Read by the
// audio thread, which takes it in 0..1.
const INPUT_SMOOTHING_KEY = "core.inputSmoothing";
export const DEFAULT_INPUT_SMOOTHING_MS = 30;

// The output guard's default ceiling, +12 dBFS (linear 4).
export const DEFAULT_OUTPUT_GUARD_CEILING_DB = 12;

/**
 * Reactive controller for general UI preferences, persisted through the native
 * config tree (mirrors {@link themeManager} in shape).
 */
class SettingsManager {
    // Whether the thin console status strip beneath the footer is shown.
    showLogBar: boolean = $state(DEFAULT_SHOW_LOG_BAR);
    // Whether the graph is recompiled automatically after every modification.
    liveRecompile: boolean = $state(DEFAULT_LIVE_RECOMPILE);
    // Whether node controls use the widget their VCL declaration asks for
    // (e.g. a knob), or always fall back to a plain number box.
    nodeWidgets: boolean = $state(DEFAULT_NODE_WIDGETS);

    // Optimization options forwarded to the graph compiler.
    optimizationEnabled: boolean = $state(DEFAULT_OPTIMIZATION_ENABLED);
    codeSharing: CodeSharing = $state(DEFAULT_CODE_SHARING);
    inlinedNodes: boolean = $state(DEFAULT_INLINED_NODES);
    useVariantCache: boolean = $state(DEFAULT_USE_VARIANT_CACHE);

    // Whether the output guard mutes the output when the graph blows up. Read
    // from the host by `initOutputGuard`: the audio thread uses it too.
    outputGuard: boolean = $state(true);
    // The peak above which it trips, in dBFS (the host keeps it linear).
    outputGuardCeilingDb: number = $state(DEFAULT_OUTPUT_GUARD_CEILING_DB);

    // Updates per second of the exposed values' readouts, and of the meter.
    exposedRate: number = $state(DEFAULT_UPDATE_RATE);
    meterRate: number = $state(DEFAULT_UPDATE_RATE);
    // How long a knob's input glides to each value, in milliseconds.
    inputSmoothingMs: number = $state(DEFAULT_INPUT_SMOOTHING_MS);

    /** Restore saved preferences from the native config tree. */
    async init(): Promise<void> {
        const [
            showLogBar,
            liveRecompile,
            nodeWidgets,
            optimizationEnabled,
            codeSharing,
            inlinedNodes,
            useVariantCache,
            exposedRate,
            meterRate,
            inputSmoothing,
        ] = await Promise.all([
            loadKey<boolean>(SHOW_LOG_BAR_KEY),
            loadKey<boolean>(LIVE_RECOMPILE_KEY),
            loadKey<boolean>(NODE_WIDGETS_KEY),
            loadKey<boolean>(OPTIMIZATION_ENABLED_KEY),
            loadKey<string>(CODE_SHARING_KEY),
            loadKey<boolean>(INLINED_NODES_KEY),
            loadKey<boolean>(USE_VARIANT_CACHE_KEY),
            loadKey<number>(EXPOSED_RATE_KEY),
            loadKey<number>(METER_RATE_KEY),
            loadKey<number>(INPUT_SMOOTHING_KEY),
        ]);
        this.showLogBar = showLogBar ?? DEFAULT_SHOW_LOG_BAR;
        this.liveRecompile = liveRecompile ?? DEFAULT_LIVE_RECOMPILE;
        this.nodeWidgets = nodeWidgets ?? DEFAULT_NODE_WIDGETS;
        this.optimizationEnabled = optimizationEnabled ?? DEFAULT_OPTIMIZATION_ENABLED;
        this.codeSharing = isCodeSharing(codeSharing) ? codeSharing : DEFAULT_CODE_SHARING;
        this.inlinedNodes = inlinedNodes ?? DEFAULT_INLINED_NODES;
        this.useVariantCache = useVariantCache ?? DEFAULT_USE_VARIANT_CACHE;
        this.exposedRate = exposedRate ?? DEFAULT_UPDATE_RATE;
        this.meterRate = meterRate ?? DEFAULT_UPDATE_RATE;
        this.inputSmoothingMs =
            inputSmoothing === null ? DEFAULT_INPUT_SMOOTHING_MS : Math.round(inputSmoothing * 1000);
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

    /** Toggle node widgets (knobs, ...) versus plain number boxes and persist the choice. */
    setNodeWidgets(value: boolean): void {
        this.nodeWidgets = value;
        persistKey(NODE_WIDGETS_KEY, value);
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

    /** Enable or disable the output guard; the host saves the choice. */
    setOutputGuard(value: boolean): void {
        const previous = this.outputGuard;
        this.outputGuard = value;
        void setOutputGuard(value).catch((err) => {
            console.error("failed to set the output guard:", err);
            this.outputGuard = previous;
        });
    }

    /** Set the output guard's ceiling, in dBFS; the host saves the choice. */
    setOutputGuardCeilingDb(value: number): void {
        const previous = this.outputGuardCeilingDb;
        this.outputGuardCeilingDb = value;
        void setOutputGuardCeiling(Math.pow(10, value / 20)).catch((err) => {
            console.error("failed to set the output guard ceiling:", err);
            this.outputGuardCeilingDb = previous;
        });
    }

    /** Set how often the exposed values are sent, in Hz, and persist the choice. */
    setExposedRate(value: number): void {
        this.exposedRate = value;
        persistKey(EXPOSED_RATE_KEY, value);
    }

    /** Set how often the output meter is sent, in Hz, and persist the choice. */
    setMeterRate(value: number): void {
        this.meterRate = value;
        persistKey(METER_RATE_KEY, value);
    }

    /** Set how long a knob's input glides to each value, in milliseconds, and persist the choice. */
    setInputSmoothingMs(value: number): void {
        this.inputSmoothingMs = value;
        persistKey(INPUT_SMOOTHING_KEY, value / 1000);
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
