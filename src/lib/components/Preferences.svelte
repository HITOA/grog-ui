<script lang="ts">
    import { Select, Switch } from "bits-ui";
    import { grogState } from "../state.svelte";
    import { themeManager } from "../theme.svelte";
    import { settings } from "../settings.svelte";
    import FloatingWindow from "./FloatingWindow.svelte";

    // Vertical tab sections. Mostly empty for now — the theme picker lives under
    // "Appearance"; "General" is a placeholder for future settings.
    const tabs = [
        { id: "appearance", label: "Appearance" },
        { id: "general", label: "General" },
    ] as const;

    type TabId = (typeof tabs)[number]["id"];
    let activeTab = $state<TabId>("appearance");

    function onClose(): void {
        grogState.preferencesOpen = false;
    }

    function onThemeChange(value: string): void {
        themeManager.select(value);
    }
</script>

{#if grogState.preferencesOpen}
    <FloatingWindow title="Preferences" {onClose} width="640px" height="440px">
        <div class="prefs">
            <nav class="prefs-tabs">
                {#each tabs as tab (tab.id)}
                    <button
                        type="button"
                        class="prefs-tab"
                        class:prefs-tab-active={activeTab === tab.id}
                        onclick={() => (activeTab = tab.id)}
                    >
                        {tab.label}
                    </button>
                {/each}
            </nav>

            <div class="prefs-content">
                {#if activeTab === "appearance"}
                    <div class="prefs-field">
                        <span class="prefs-field-label">Theme</span>
                        <Select.Root type="single" value={themeManager.current} onValueChange={onThemeChange}>
                            <Select.Trigger class="prefs-select-trigger">
                                <span>{themeManager.current}</span>
                                <svg
                                    class="prefs-select-chevron"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 640 640"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M297.4 470.6C309.9 483.1 330.2 483.1 342.7 470.6L502.7 310.6C515.2 298.1 515.2 277.8 502.7 265.3C490.2 252.8 469.9 252.8 457.4 265.3L320 402.7L182.6 265.4C170.1 252.9 149.8 252.9 137.3 265.4C124.8 277.9 124.8 298.2 137.3 310.7L297.3 470.7z"
                                    />
                                </svg>
                            </Select.Trigger>
                            <Select.Portal>
                                <Select.Content
                                    class="context-menu-frame prefs-select-content"
                                    sideOffset={4}
                                    style="z-index: 100; width: var(--bits-select-anchor-width);"
                                >
                                    <Select.Viewport>
                                        {#each themeManager.themes as theme (theme)}
                                            <Select.Item class="context-menu-item prefs-select-item" value={theme}>
                                                {theme}
                                            </Select.Item>
                                        {/each}
                                    </Select.Viewport>
                                </Select.Content>
                            </Select.Portal>
                        </Select.Root>
                        {#if themeManager.themes.length === 0}
                            <span class="prefs-field-hint">No themes found in the themes folder.</span>
                        {/if}
                    </div>
                {:else if activeTab === "general"}
                    <div class="prefs-field prefs-field-row">
                        <div class="prefs-field-text">
                            <span class="prefs-field-label">Log bar</span>
                            <span class="prefs-field-hint"> Show the console preview strip beneath the footer. </span>
                        </div>
                        <Switch.Root
                            class="prefs-switch"
                            checked={settings.showLogBar}
                            onCheckedChange={(v) => settings.setShowLogBar(v)}
                        >
                            <Switch.Thumb class="prefs-switch-thumb" />
                        </Switch.Root>
                    </div>
                {/if}
            </div>
        </div>
    </FloatingWindow>
{/if}
