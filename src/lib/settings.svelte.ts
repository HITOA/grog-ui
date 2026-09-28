import { getConfigKey, setConfigKey } from "./api";

// Dotted config keys holding UI preferences, persisted native-side.
const SHOW_LOG_BAR_KEY = "Preferences.showLogBar";
const DEFAULT_SHOW_LOG_BAR = false;

/**
 * Reactive controller for general UI preferences, persisted through the native
 * config tree (mirrors {@link themeManager} in shape).
 */
class SettingsManager {
    // Whether the thin console status strip beneath the footer is shown.
    showLogBar: boolean = $state(DEFAULT_SHOW_LOG_BAR);

    /** Restore saved preferences from the native config tree. */
    async init(): Promise<void> {
        let saved: boolean | null = null;
        try {
            saved = await getConfigKey<boolean | null>(SHOW_LOG_BAR_KEY);
        } catch (err) {
            console.error("failed to load saved settings:", err);
        }
        this.showLogBar = saved ?? DEFAULT_SHOW_LOG_BAR;
    }

    /** Toggle the console status strip and persist the choice. */
    setShowLogBar(value: boolean): void {
        this.showLogBar = value;
        void setConfigKey(SHOW_LOG_BAR_KEY, value).catch((err) => console.error("failed to persist showLogBar:", err));
    }
}

export const settings = new SettingsManager();
