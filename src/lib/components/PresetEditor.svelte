<script lang="ts">
    import { onMount } from "svelte";
    import { Button } from "bits-ui";
    import { grogState, ViewType } from "../state.svelte";
    import { updatePresetList } from "../actions";
    import * as API from "../api";
    import type { PresetMetadata } from "../types";

    let meta = $state<PresetMetadata | undefined>(undefined);

    let tagQuery = $state("");
    let tagInputFocused = $state(false);

    onMount(() => {
        // Load both the current preset's metadata and the tag pool from all presets.
        API.getCurrentPresetMetadata().then((m) => (meta = m));
        updatePresetList();
    });

    // Every tag used across all presets, de-duplicated and sorted.
    let allTags = $derived(
        [...new Set(grogState.presetList.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b)),
    );

    // Existing tags matching the query that aren't already on this preset.
    let tagSuggestions = $derived.by(() => {
        if (!meta) return [];
        const current = meta.tags;
        const query = tagQuery.trim().toLowerCase();
        return allTags.filter((tag) => !current.includes(tag) && tag.toLowerCase().includes(query));
    });

    // Offer to create a tag when the query doesn't match any existing tag.
    let canCreate = $derived.by(() => {
        if (!meta) return false;
        const query = tagQuery.trim().toLowerCase();
        if (query === "") return false;
        const exists =
            allTags.some((t) => t.toLowerCase() === query) || meta.tags.some((t) => t.toLowerCase() === query);
        return !exists;
    });

    let showSuggestions = $derived(tagInputFocused && (tagSuggestions.length > 0 || canCreate));

    // Push the current edits to the host, then reflect the refreshed lastModified.
    function commit(): void {
        if (!meta) return;
        API.updateCurrentPresetMetadata($state.snapshot(meta)).then((updated) => {
            if (meta) meta.lastModified = updated.lastModified;
            // Keep the menu-bar preset name in sync with edits.
            grogState.currentPreset = updated;
        });
    }

    function addTag(tag: string): void {
        const value = tag.trim();
        if (!meta || value === "" || meta.tags.includes(value)) return;
        meta.tags = [...meta.tags, value];
        tagQuery = "";
        commit();
    }

    function removeTag(tag: string): void {
        if (!meta) return;
        meta.tags = meta.tags.filter((t) => t !== tag);
        commit();
    }

    function onTagKeydown(event: KeyboardEvent): void {
        if (event.key === "Enter") {
            event.preventDefault();
            const query = tagQuery.trim();
            if (query === "") return;
            const exact = tagSuggestions.find((t) => t.toLowerCase() === query.toLowerCase());
            if (exact) addTag(exact);
            else if (canCreate) addTag(query);
            else if (tagSuggestions.length > 0) addTag(tagSuggestions[0]);
        } else if (event.key === "Escape") {
            tagQuery = "";
            tagInputFocused = false;
        }
    }

    function formatDate(timestamp: number): string {
        if (!timestamp) return "—";
        // Unix seconds → ms.
        return new Date(timestamp * 1000).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    function onClose(): void {
        grogState.view = ViewType.Flow;
    }
</script>

<div class="preset-window">
    <div class="preset-window-header">
        <h1 class="preset-window-title">Edit Preset</h1>
        <div style="flex: 1;"></div>
        <Button.Root class="close-button" onclick={onClose}>
            <svg class="close-button-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path
                    d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"
                />
            </svg>
        </Button.Root>
    </div>

    <div class="preset-editor">
        {#if meta}
            <div class="preset-form">
                <div class="preset-field">
                    <label class="preset-field-label" for="preset-name">Name</label>
                    <input id="preset-name" class="preset-input" type="text" bind:value={meta.name} onchange={commit} />
                </div>

                <div class="preset-field">
                    <label class="preset-field-label" for="preset-author">Author</label>
                    <input
                        id="preset-author"
                        class="preset-input"
                        type="text"
                        bind:value={meta.author}
                        onchange={commit}
                    />
                </div>

                <div class="preset-field">
                    <label class="preset-field-label" for="preset-description">Description</label>
                    <textarea
                        id="preset-description"
                        class="preset-textarea"
                        bind:value={meta.description}
                        onchange={commit}></textarea>
                </div>

                <div class="preset-field">
                    <span class="preset-field-label">Tags</span>
                    <div class="preset-tag-editor">
                        {#if meta.tags.length > 0}
                            <div class="preset-tag-list">
                                {#each meta.tags as tag (tag)}
                                    <span class="preset-tag-chip">
                                        {tag}
                                        <button
                                            class="preset-tag-remove"
                                            aria-label={`Remove ${tag}`}
                                            onclick={() => removeTag(tag)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                                                <path
                                                    d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"
                                                />
                                            </svg>
                                        </button>
                                    </span>
                                {/each}
                            </div>
                        {/if}

                        <div class="preset-tag-add">
                            <input
                                class="preset-tag-input"
                                type="text"
                                placeholder="Search or create a tag..."
                                bind:value={tagQuery}
                                onfocus={() => (tagInputFocused = true)}
                                onblur={() => (tagInputFocused = false)}
                                onkeydown={onTagKeydown}
                            />
                            {#if showSuggestions}
                                <div class="preset-tag-suggestions">
                                    {#each tagSuggestions as tag (tag)}
                                        <button
                                            class="preset-tag-option"
                                            onmousedown={(e) => e.preventDefault()}
                                            onclick={() => addTag(tag)}
                                        >
                                            {tag}
                                        </button>
                                    {/each}
                                    {#if canCreate}
                                        <button
                                            class="preset-tag-option preset-tag-create"
                                            onmousedown={(e) => e.preventDefault()}
                                            onclick={() => addTag(tagQuery)}
                                        >
                                            <span>Create <strong>{tagQuery.trim()}</strong></span>
                                        </button>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>

                <div class="preset-meta-info">
                    <span>Created: {formatDate(meta.creation)}</span>
                    <span>Modified: {formatDate(meta.lastModified)}</span>
                    {#if meta.version !== undefined}
                        <span>Version: {meta.version}</span>
                    {/if}
                </div>
            </div>
        {:else}
            <div class="preset-empty">Loading…</div>
        {/if}
    </div>
</div>
