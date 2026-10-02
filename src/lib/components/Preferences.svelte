<script lang="ts">
    import { Select, Switch } from "bits-ui";
    import { grogState } from "../state.svelte";
    import { themeManager } from "../theme.svelte";
    import { settings } from "../settings.svelte";
    import FloatingWindow from "./FloatingWindow.svelte";
    import { CodeSharing } from "../types";

    // Vertical tab sections.
    const tabs = [
        { id: "general", label: "General" },
        { id: "appearance", label: "Appearance" },
        { id: "optimization", label: "Optimization" },
    ] as const;

    const codeSharingOptions = [
        { value: CodeSharing.PerInstance, label: "Per instance" },
        { value: CodeSharing.PerVariant, label: "Per variant" },
    ];

    let codeSharingLabel = $derived(
        codeSharingOptions.find((option) => option.value === settings.codeSharing)?.label ?? settings.codeSharing,
    );

    // Output guard ceilings offered, in dBFS. One set in the config by hand
    // shows as is.
    const ceilingOptions = [0, 3, 6, 12, 18, 24].map((db) => ({ value: db.toString(), label: formatDb(db) }));

    function formatDb(db: number): string {
        return `${db > 0 ? "+" : ""}${db} dBFS`;
    }

    function onCeilingChange(value: string): void {
        settings.setOutputGuardCeilingDb(Number(value));
    }

    type TabId = (typeof tabs)[number]["id"];
    let activeTab = $state<TabId>("general");

    function onClose(): void {
        grogState.preferencesOpen = false;
    }

    function onThemeChange(value: string): void {
        themeManager.select(value);
    }

    function onCodeSharingChange(value: string): void {
        settings.setCodeSharing(value as CodeSharing);
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
                    <div class="prefs-field prefs-field-row">
                        <div class="prefs-field-text">
                            <span class="prefs-field-label">Node widgets</span>
                            <span class="prefs-field-hint">Display node's widgets. </span>
                        </div>
                        <Switch.Root
                            class="prefs-switch"
                            checked={settings.nodeWidgets}
                            onCheckedChange={(v) => settings.setNodeWidgets(v)}
                        >
                            <Switch.Thumb class="prefs-switch-thumb" />
                        </Switch.Root>
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
                    <div class="prefs-field prefs-field-row">
                        <div class="prefs-field-text">
                            <span class="prefs-field-label">Live recompilation</span>
                            <span class="prefs-field-hint">
                                Recompile the graph automatically after every modification.
                            </span>
                        </div>
                        <Switch.Root
                            class="prefs-switch"
                            checked={settings.liveRecompile}
                            onCheckedChange={(v) => settings.setLiveRecompile(v)}
                        >
                            <Switch.Thumb class="prefs-switch-thumb" />
                        </Switch.Root>
                    </div>
                    <div class="prefs-field prefs-field-row">
                        <div class="prefs-field-text">
                            <span class="prefs-field-label">Output guard</span>
                            <span class="prefs-field-hint">
                                Mute the output and reset the graph when it blows up.
                            </span>
                            <span class="prefs-field-danger" class:prefs-field-danger-active={!settings.outputGuard}>
                                Disabling it is dangerous
                            </span>
                        </div>
                        <Switch.Root
                            class="prefs-switch"
                            checked={settings.outputGuard}
                            onCheckedChange={(v) => settings.setOutputGuard(v)}
                        >
                            <Switch.Thumb class="prefs-switch-thumb" />
                        </Switch.Root>
                    </div>
                    <div class="prefs-field">
                        <span class="prefs-field-label">Output guard ceiling</span>
                        <span class="prefs-field-hint">
                            The output guard threshold.
                        </span>
                        <Select.Root
                            type="single"
                            value={settings.outputGuardCeilingDb.toString()}
                            onValueChange={onCeilingChange}
                            disabled={!settings.outputGuard}
                        >
                            <Select.Trigger class="prefs-select-trigger">
                                <span>{formatDb(settings.outputGuardCeilingDb)}</span>
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
                                        {#each ceilingOptions as option (option.value)}
                                            <Select.Item
                                                class="context-menu-item prefs-select-item"
                                                value={option.value}
                                                label={option.label}
                                            >
                                                {option.label}
                                            </Select.Item>
                                        {/each}
                                    </Select.Viewport>
                                </Select.Content>
                            </Select.Portal>
                        </Select.Root>
                    </div>
                {:else if activeTab === "optimization"}
                    <div class="prefs-field prefs-field-row">
                        <div class="prefs-field-text">
                            <span class="prefs-field-label">Optimization enabled</span>
                            <span class="prefs-field-hint">Apply the optimizations below when compiling the graph.</span
                            >
                        </div>
                        <Switch.Root
                            class="prefs-switch"
                            checked={settings.optimizationEnabled}
                            onCheckedChange={(v) => settings.setOptimizationEnabled(v)}
                        >
                            <Switch.Thumb class="prefs-switch-thumb" />
                        </Switch.Root>
                    </div>
                    <div class="prefs-field">
                        <span class="prefs-field-label">Code sharing</span>
                        <span class="prefs-field-hint">
                            Generate code once per node variant, or separately for every node instance.
                        </span>
                        <Select.Root
                            type="single"
                            value={settings.codeSharing}
                            onValueChange={onCodeSharingChange}
                            disabled={!settings.optimizationEnabled}
                        >
                            <Select.Trigger class="prefs-select-trigger">
                                <span>{codeSharingLabel}</span>
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
                                        {#each codeSharingOptions as option (option.value)}
                                            <Select.Item
                                                class="context-menu-item prefs-select-item"
                                                value={option.value}
                                                label={option.label}
                                            >
                                                {option.label}
                                            </Select.Item>
                                        {/each}
                                    </Select.Viewport>
                                </Select.Content>
                            </Select.Portal>
                        </Select.Root>
                    </div>
                    <div class="prefs-field prefs-field-row">
                        <div class="prefs-field-text">
                            <span class="prefs-field-label">Inlined nodes</span>
                            <span class="prefs-field-hint">Inline node code into the graph instead of calling it.</span>
                        </div>
                        <Switch.Root
                            class="prefs-switch"
                            checked={settings.inlinedNodes}
                            onCheckedChange={(v) => settings.setInlinedNodes(v)}
                            disabled={!settings.optimizationEnabled}
                        >
                            <Switch.Thumb class="prefs-switch-thumb" />
                        </Switch.Root>
                    </div>
                    <div class="prefs-field prefs-field-row">
                        <div class="prefs-field-text">
                            <span class="prefs-field-label">Use variant cache</span>
                            <span class="prefs-field-hint"
                                >Reuse already-compiled node variants across compilations.</span
                            >
                        </div>
                        <Switch.Root
                            class="prefs-switch"
                            checked={settings.useVariantCache}
                            onCheckedChange={(v) => settings.setUseVariantCache(v)}
                            disabled={!settings.optimizationEnabled}
                        >
                            <Switch.Thumb class="prefs-switch-thumb" />
                        </Switch.Root>
                    </div>
                {/if}
            </div>
        </div>
    </FloatingWindow>
{/if}
