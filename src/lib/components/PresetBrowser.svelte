<script lang="ts">
    import { onMount } from "svelte";
    import { Button, Select } from "bits-ui";
    import { grogState, ViewType } from "../state.svelte";
    import { loadPreset, updatePresetList } from "../actions";
    import type { PresetMetadata } from "../types";

    type SortMode = "name" | "author" | "recent";

    const sortOptions: { value: SortMode; label: string }[] = [
        { value: "name", label: "Name (A–Z)" },
        { value: "author", label: "Author (A–Z)" },
        { value: "recent", label: "Recently modified" },
    ];

    let search = $state("");
    let selectedTags = $state<string[]>([]);
    let sortMode = $state<SortMode>("name");

    // Refresh from the host every time the browser opens.
    onMount(updatePresetList);

    // Every tag present across all presets, de-duplicated and sorted.
    let allTags = $derived(
        [...new Set(grogState.presetList.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b)),
    );

    let filtered = $derived.by(() => {
        const query = search.trim().toLowerCase();
        return grogState.presetList
            .filter((preset) => {
                const matchesSearch =
                    query === "" ||
                    preset.name.toLowerCase().includes(query) ||
                    preset.author.toLowerCase().includes(query) ||
                    preset.description.toLowerCase().includes(query) ||
                    preset.tags.some((tag) => tag.toLowerCase().includes(query));
                // Selected tags narrow the results: a preset must carry all of them.
                const matchesTags = selectedTags.every((tag) => preset.tags.includes(tag));
                return matchesSearch && matchesTags;
            })
            .sort(comparePresets);
    });

    function comparePresets(a: PresetMetadata, b: PresetMetadata): number {
        switch (sortMode) {
            case "author":
                return a.author.localeCompare(b.author) || a.name.localeCompare(b.name);
            case "recent":
                return b.lastModified - a.lastModified;
            default:
                return a.name.localeCompare(b.name);
        }
    }

    function toggleTag(tag: string): void {
        selectedTags = selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag];
    }

    function formatDate(timestamp: number): string {
        if (!timestamp) return "";
        // Host timestamps are assumed to be Unix seconds; scale to ms when needed.
        const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp;
        return new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    }

    function onClose(): void {
        grogState.view = ViewType.Flow;
    }
</script>

<div class="preset-window">
    <div class="preset-window-header">
        <h1 class="preset-window-title">Presets</h1>

        <div class="preset-search">
            <svg class="preset-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path
                    d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z"
                />
            </svg>
            <input class="preset-search-input" type="text" placeholder="Search presets..." bind:value={search} />
        </div>

        <Select.Root type="single" bind:value={() => sortMode, (v) => (sortMode = v as SortMode)} items={sortOptions}>
            <Select.Trigger class="preset-sort">
                <Select.Value placeholder="Sort" />
            </Select.Trigger>
            <Select.Portal>
                <Select.Content class="context-menu-frame" style="z-index: 2;" sideOffset={6}>
                    <Select.Viewport>
                        {#each sortOptions as option (option.value)}
                            <Select.Item class="context-menu-item" value={option.value} label={option.label}>
                                {option.label}
                            </Select.Item>
                        {/each}
                    </Select.Viewport>
                </Select.Content>
            </Select.Portal>
        </Select.Root>

        <Button.Root class="close-button" onclick={onClose}>
            <svg class="close-button-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path
                    d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"
                />
            </svg>
        </Button.Root>
    </div>

    {#if allTags.length > 0}
        <div class="preset-filter-bar">
            <div class="preset-tags">
                {#each allTags as tag (tag)}
                    <button
                        class="preset-tag-filter"
                        data-active={selectedTags.includes(tag)}
                        onclick={() => toggleTag(tag)}
                    >
                        {tag}
                    </button>
                {/each}
            </div>
            {#if selectedTags.length > 0}
                <button class="preset-clear-tags" onclick={() => (selectedTags = [])}>Clear</button>
            {/if}
        </div>
    {/if}

    <div class="preset-list">
        {#if filtered.length === 0}
            <div class="preset-empty">No presets found.</div>
        {:else}
            {#each filtered as preset (preset.filename)}
                <button class="preset-card" onclick={() => loadPreset(preset.filename)}>
                    <div class="preset-card-identity">
                        <span class="preset-card-name">{preset.name}</span>
                        {#if preset.author}
                            <span class="preset-card-author">by {preset.author}</span>
                        {/if}
                    </div>
                    <span class="preset-card-desc">{preset.description}</span>
                    {#if preset.tags.length > 0}
                        <div class="preset-card-tags">
                            {#each preset.tags as tag (tag)}
                                <span class="preset-tag">{tag}</span>
                            {/each}
                        </div>
                    {/if}
                    {#if preset.lastModified}
                        <span class="preset-card-date">{formatDate(preset.lastModified)}</span>
                    {/if}
                </button>
            {/each}
        {/if}
    </div>
</div>
