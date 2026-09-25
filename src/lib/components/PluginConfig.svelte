<script lang="ts">
    import { pluginHost } from "../plugins/plugin-host.svelte";
    import type { PluginParam } from "../plugins/protocol";

    // The entry is reactive; the window is only rendered while one is open.
    let entry = $derived(pluginHost.configEntry);

    let running = $state<string | undefined>(undefined);

    function onClose(): void {
        pluginHost.closeConfig();
    }

    // Close only when the click/keypress lands on the backdrop itself.
    function onBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) onClose();
    }

    function toggleEnabled(): void {
        if (entry) pluginHost.setEnabled(entry.id, !entry.enabled);
    }

    function onNumber(param: PluginParam, event: Event): void {
        if (!entry) return;
        const value = (event.target as HTMLInputElement).valueAsNumber;
        if (Number.isFinite(value)) pluginHost.setParam(entry.id, param.key, value);
    }

    function onText(param: PluginParam, event: Event): void {
        if (entry) pluginHost.setParam(entry.id, param.key, (event.target as HTMLInputElement).value);
    }

    function onBoolean(param: PluginParam, event: Event): void {
        if (entry) pluginHost.setParam(entry.id, param.key, (event.target as HTMLInputElement).checked);
    }

    function onEnum(param: PluginParam, event: Event): void {
        if (entry) pluginHost.setParam(entry.id, param.key, (event.target as HTMLSelectElement).value);
    }

    async function runCommand(commandId: string): Promise<void> {
        if (!entry) return;
        running = commandId;
        try {
            await pluginHost.invokeCommand(entry.id, commandId);
        } catch (err) {
            entry.error = err instanceof Error ? err.message : String(err);
        } finally {
            running = undefined;
        }
    }
</script>

{#if entry}
    <!-- Click-away backdrop; the panel stops propagation so inner clicks don't close it. -->
    <div
        class="plugin-overlay"
        role="presentation"
        onclick={onBackdropClick}
        onkeydown={(e) => e.key === "Escape" && onClose()}
    >
        <div class="plugin-window" role="dialog" aria-modal="true" tabindex="-1">
            <div class="plugin-window-header">
                <div class="plugin-window-titles">
                    <h1 class="plugin-window-title">{entry.manifest.name}</h1>
                    {#if entry.manifest.description}
                        <p class="plugin-window-desc">{entry.manifest.description}</p>
                    {/if}
                </div>
                <button type="button" class="plugin-close" onclick={onClose} aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                        <path
                            d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"
                        />
                    </svg>
                </button>
            </div>

            <div class="plugin-body">
                <label class="plugin-enable">
                    <input type="checkbox" checked={entry.enabled} onchange={toggleEnabled} disabled={entry.busy} />
                    <span>Enabled</span>
                </label>

                {#if entry.error}
                    <p class="plugin-error">{entry.error}</p>
                {/if}

                {#each entry.manifest.parameters ?? [] as param (param.key)}
                    <div class="plugin-field">
                        <label class="plugin-field-label" for={`param-${param.key}`}>{param.label}</label>
                        {#if param.type === "number"}
                            <input
                                id={`param-${param.key}`}
                                class="plugin-input"
                                type="number"
                                min={param.min}
                                max={param.max}
                                step={param.step}
                                value={entry.params[param.key]}
                                oninput={(e) => onNumber(param, e)}
                            />
                        {:else if param.type === "boolean"}
                            <input
                                id={`param-${param.key}`}
                                type="checkbox"
                                checked={Boolean(entry.params[param.key])}
                                onchange={(e) => onBoolean(param, e)}
                            />
                        {:else if param.type === "enum"}
                            <select
                                id={`param-${param.key}`}
                                class="plugin-input"
                                value={entry.params[param.key]}
                                onchange={(e) => onEnum(param, e)}
                            >
                                {#each param.options as option (option.value)}
                                    <option value={option.value}>{option.label}</option>
                                {/each}
                            </select>
                        {:else}
                            <input
                                id={`param-${param.key}`}
                                class="plugin-input"
                                type="text"
                                value={entry.params[param.key]}
                                oninput={(e) => onText(param, e)}
                            />
                        {/if}
                        {#if param.description}
                            <span class="plugin-field-hint">{param.description}</span>
                        {/if}
                    </div>
                {/each}

                {#if (entry.manifest.commands ?? []).length > 0}
                    <div class="plugin-commands">
                        {#each entry.manifest.commands ?? [] as command (command.id)}
                            <button
                                type="button"
                                class="plugin-command"
                                onclick={() => runCommand(command.id)}
                                disabled={!entry.enabled || running !== undefined}
                            >
                                {running === command.id ? "Working…" : command.label}
                            </button>
                        {/each}
                    </div>
                    {#if !entry.enabled}
                        <p class="plugin-hint">Enable the plugin to run its commands.</p>
                    {/if}
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .plugin-overlay {
        position: fixed;
        inset: 0;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.45);
    }

    .plugin-window {
        width: 420px;
        max-width: calc(100vw - 40px);
        max-height: calc(100vh - 80px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: var(--color-text);
        background-color: var(--surface-menu);
        border: 1px solid var(--border-menu);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-menu);
    }

    .plugin-window-header {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 16px;
        background: var(--grad-bar) border-box;
        border-bottom: 1px solid var(--border-menu);
    }

    .plugin-window-titles {
        flex: 1;
        min-width: 0;
    }

    .plugin-window-title {
        margin: 0;
        font-size: 16px;
        font-weight: bold;
        color: var(--color-text);
        user-select: none;
    }

    .plugin-window-desc {
        margin: 4px 0 0;
        font-size: 12px;
        color: var(--color-text-muted);
    }

    .plugin-close {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 28px;
        width: 28px;
        padding: 0;
        color: var(--color-text);
        background-color: var(--surface-menu);
        border: 1px solid var(--border-input-strong);
        border-radius: var(--radius-md);
        transition: background-color var(--transition-fast);
    }

    .plugin-close:hover {
        background-color: var(--surface-hover);
    }

    .plugin-close svg {
        height: 18px;
        width: 18px;
        fill: currentColor;
    }

    .plugin-body {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px;
        overflow-y: auto;
    }

    .plugin-enable {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: bold;
        user-select: none;
    }

    .plugin-error {
        margin: 0;
        padding: 8px 10px;
        font-size: 12px;
        color: var(--color-text);
        background-color: var(--color-node-selected);
        border-radius: var(--radius-md);
    }

    .plugin-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .plugin-field-label {
        font-size: 12px;
        font-weight: bold;
        color: var(--color-text-muted);
        user-select: none;
    }

    .plugin-field-hint {
        font-size: 11px;
        color: var(--color-text-muted);
    }

    .plugin-input {
        box-sizing: border-box;
        width: 100%;
        height: 34px;
        color: var(--color-text);
        background-color: var(--surface-menu-input);
        border: 1px solid var(--border-input);
        border-radius: var(--radius-lg);
        padding: 8px 10px;
    }

    .plugin-input:focus {
        border-color: var(--color-text-muted);
    }

    .plugin-commands {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .plugin-command {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        color: var(--color-text);
        background-color: var(--accent);
        border: 1px solid var(--accent-hover);
        border-radius: var(--radius-lg);
        filter: drop-shadow(0px 2px var(--accent-shadow));
        transition: background-color var(--transition-fast);
        user-select: none;
    }

    .plugin-command:hover:not(:disabled) {
        background-color: var(--accent-hover);
    }

    .plugin-command:disabled {
        opacity: 0.5;
    }

    .plugin-hint {
        margin: 0;
        font-size: 11px;
        color: var(--color-text-muted);
    }
</style>
