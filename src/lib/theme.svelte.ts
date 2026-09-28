import { getConfigKey, getThemeList, setConfigKey } from "./api";
import { setTheme } from "./theme";

// Dotted config key holding the user's chosen theme, persisted native-side.
const THEME_CONFIG_KEY = "Preferences.theme";
const DEFAULT_THEME = "default-theme";

/**
 * Reactive theme controller. Holds the list of available themes (discovered
 * native-side from the Themes folder) and the currently applied one, and
 * persists the selection through the native config tree.
 */
class ThemeManager {
    themes: string[] = $state([]);
    current: string = $state(DEFAULT_THEME);

    /** Load the theme list, restore the saved theme, and apply it. */
    async init(): Promise<void> {
        try {
            this.themes = await getThemeList();
        } catch (err) {
            console.error("failed to load theme list:", err);
            this.themes = [];
        }

        let saved: string | null = null;
        try {
            saved = await getConfigKey<string | null>(THEME_CONFIG_KEY);
        } catch (err) {
            console.error("failed to load saved theme:", err);
        }

        // Don't re-persist on startup — we're only restoring what's already saved.
        this.select(saved ?? DEFAULT_THEME, false);
    }

    /** Apply a theme and (by default) persist it as the user's preference. */
    select(name: string, persist: boolean = true): void {
        this.current = name;
        setTheme(name);
        if (persist) {
            void setConfigKey(THEME_CONFIG_KEY, name).catch((err) => console.error("failed to persist theme:", err));
        }
    }
}

export const themeManager = new ThemeManager();
