<script lang="ts">
    import { compileGraph, dumpGraphIR, loadPreset, updateCurrentPreset, updatePresetList } from "../actions";
    import { Button, ContextMenu, Menubar } from "bits-ui";
    import * as API from "../api";
    import { grogState, ViewType } from "../state.svelte";
    import { pluginHost } from "../plugins/plugin-host.svelte";

    // Clicking a plugin with parameters/commands opens its config window; a bare
    // plugin just toggles on/off.
    function onPluginClick(id: string, hasConfig: boolean, enabled: boolean): void {
        if (hasConfig) pluginHost.openConfig(id);
        else pluginHost.setEnabled(id, !enabled);
    }

    function onNewPreset() {
        API.newPreset().then(() => updateCurrentPreset());
    }

    function onSavePreset() {
        API.savePreset(undefined).then(() => {
            updatePresetList();
            updateCurrentPreset();
        });
    }

    function onLoadPreset() {
        API.loadPreset(undefined).then(() => {
            updatePresetList();
            updateCurrentPreset();
        });
    }

    function onBrowsePreset() {
        grogState.view = ViewType.PresetBrowser;
    }

    function onEditPreset() {
        grogState.view = ViewType.PresetEditor;
    }

    function onOpenPreferences() {
        grogState.preferencesOpen = true;
    }

    function onOpenConsole() {
        grogState.consoleOpen = true;
    }

    // Presets sorted alphabetically by name, for prev/next navigation.
    let sortedPresets = $derived([...grogState.presetList].sort((a, b) => a.name.localeCompare(b.name)));

    let currentIndex = $derived.by(() => {
        const current = grogState.currentPreset;
        if (!current) return -1;
        return sortedPresets.findIndex((p) => p.filename === current.filename);
    });

    // Step to the previous (-1) or next (+1) preset, wrapping around the list.
    function gotoPreset(offset: number): void {
        const presets = sortedPresets;
        if (presets.length === 0) return;
        // When the current preset isn't in the saved list (e.g. a new/unsaved
        // one), step in from either end.
        const target =
            currentIndex === -1
                ? offset > 0
                    ? 0
                    : presets.length - 1
                : (currentIndex + offset + presets.length) % presets.length;
        if (target === currentIndex) return;
        loadPreset(presets[target].filename);
    }
</script>

<div class="main-menu-bar-frame">
    <div class="main-menu-bar-left">
        <svg
            class="logo"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            version="1.1"
            width="584"
            height="420"
            viewBox="622 267 584 420"
        >
            <g stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10">
                <path d="M637,660l95,-140l238,1l127,-239c0,0 87,144 94,390" id="Path-1" />
            </g>
        </svg>
        <span class="title">GROG</span>
        <Menubar.Root style="display: flex;">
            <Menubar.Menu>
                <Menubar.Trigger class="menu-bar-trigger">File</Menubar.Trigger>
                <Menubar.Portal>
                    <Menubar.Content class="context-menu-frame" style="z-index: 2;">
                        <Menubar.Item class="context-menu-item" onclick={onNewPreset}>New Preset</Menubar.Item>
                        <Menubar.Separator class="context-menu-separator" />
                        <Menubar.Item class="context-menu-item" onclick={onSavePreset}>Save Preset</Menubar.Item>
                        <Menubar.Item class="context-menu-item" onclick={onSavePreset}>Save Preset As...</Menubar.Item>
                        <Menubar.Separator class="context-menu-separator" />
                        <Menubar.Item class="context-menu-item" onclick={onLoadPreset}>Load Preset</Menubar.Item>
                        <Menubar.Separator class="context-menu-separator" />
                        <Menubar.Item class="context-menu-item" onclick={onOpenPreferences}>Preferences...</Menubar.Item
                        >
                    </Menubar.Content>
                </Menubar.Portal>
            </Menubar.Menu>
            <Menubar.Menu>
                <Menubar.Trigger class="menu-bar-trigger">Plugins</Menubar.Trigger>
                <Menubar.Portal>
                    <Menubar.Content class="context-menu-frame" style="z-index: 2;">
                        {#if pluginHost.plugins.length === 0}
                            <Menubar.Item class="context-menu-item" disabled>No plugins</Menubar.Item>
                        {:else}
                            {#each pluginHost.plugins as plugin (plugin.id)}
                                <Menubar.Item
                                    class="context-menu-item plugin-menu-item"
                                    onclick={() => onPluginClick(plugin.id, plugin.hasConfig, plugin.enabled)}
                                >
                                    <span class="plugin-menu-dot" class:plugin-menu-dot-on={plugin.enabled}></span>
                                    <span>{plugin.manifest.name}</span>
                                </Menubar.Item>
                            {/each}
                        {/if}
                    </Menubar.Content>
                </Menubar.Portal>
            </Menubar.Menu>
            <Menubar.Menu>
                <Menubar.Trigger class="menu-bar-trigger">Window</Menubar.Trigger>
                <Menubar.Portal>
                    <Menubar.Content class="context-menu-frame" style="z-index: 2;">
                        <Menubar.Item class="context-menu-item" onclick={onOpenConsole}>Console</Menubar.Item>
                    </Menubar.Content>
                </Menubar.Portal>
            </Menubar.Menu>
        </Menubar.Root>
    </div>
    <div class="preset-selector">
        <Button.Root class="preset-selector-button" onclick={() => gotoPreset(-1)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"
                ><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path
                    d="M201.4 297.4C188.9 309.9 188.9 330.2 201.4 342.7L361.4 502.7C373.9 515.2 394.2 515.2 406.7 502.7C419.2 490.2 419.2 469.9 406.7 457.4L269.3 320L406.6 182.6C419.1 170.1 419.1 149.8 406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3L201.3 297.3z"
                /></svg
            >
        </Button.Root>
        <ContextMenu.Root>
            <ContextMenu.Trigger class="preset-name" onclick={onBrowsePreset}>
                <span>{grogState.currentPreset?.name || "Untitled"}</span>
            </ContextMenu.Trigger>
            <ContextMenu.Portal>
                <ContextMenu.Content class="context-menu-frame" style="z-index: 2;">
                    <ContextMenu.Item class="context-menu-item" onclick={onBrowsePreset}>
                        Browse Preset
                    </ContextMenu.Item>
                    <ContextMenu.Item class="context-menu-item" onclick={onEditPreset}>Edit Preset</ContextMenu.Item>
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu.Root>
        <Button.Root class="preset-selector-button" onclick={() => gotoPreset(1)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"
                ><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path
                    d="M439.1 297.4C451.6 309.9 451.6 330.2 439.1 342.7L279.1 502.7C266.6 515.2 246.3 515.2 233.8 502.7C221.3 490.2 221.3 469.9 233.8 457.4L371.2 320L233.9 182.6C221.4 170.1 221.4 149.8 233.9 137.3C246.4 124.8 266.7 124.8 279.2 137.3L439.2 297.3z"
                /></svg
            >
        </Button.Root>
    </div>
    <div class="main-menu-bar-right">
        <ContextMenu.Root>
            <ContextMenu.Trigger>
                <Button.Root class="compile-button" onclick={compileGraph}>
                    <svg
                        width="20px"
                        height="20px"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 640 640"
                        fill="currentColor"
                        ><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path
                            d="M187.2 100.9C174.8 94.1 159.8 94.4 147.6 101.6C135.4 108.8 128 121.9 128 136L128 504C128 518.1 135.5 531.2 147.6 538.4C159.7 545.6 174.8 545.9 187.2 539.1L523.2 355.1C536 348.1 544 334.6 544 320C544 305.4 536 291.9 523.2 284.9L187.2 100.9z"
                        /></svg
                    >
                    Compile
                </Button.Root>
            </ContextMenu.Trigger>
            <ContextMenu.Portal>
                <ContextMenu.Content class="context-menu-frame" style="z-index: 2;">
                    <ContextMenu.Item class="context-menu-item" onclick={compileGraph}>Compile</ContextMenu.Item>
                    <ContextMenu.Item class="context-menu-item" onclick={dumpGraphIR}>Dump LLVM IR</ContextMenu.Item>
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu.Root>
    </div>
</div>
