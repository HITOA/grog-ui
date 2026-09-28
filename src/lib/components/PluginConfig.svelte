<script lang="ts">
    import { pluginHost } from "../plugins/plugin-host.svelte";
    import type { PluginParam } from "../plugins/protocol";
    import FloatingWindow from "./FloatingWindow.svelte";

    // The entry is reactive; the window is only rendered while one is open.
    let entry = $derived(pluginHost.configEntry);

    let running = $state<string | undefined>(undefined);

    function onClose(): void {
        pluginHost.closeConfig();
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

    async function browse(param: PluginParam): Promise<void> {
        if (entry && param.type === "file") await pluginHost.browseParam(entry.id, param.key, param.filters);
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
    <FloatingWindow title={entry.manifest.name} description={entry.manifest.description} {onClose}>
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
                    {:else if param.type === "file"}
                        <div class="plugin-file">
                            <input
                                id={`param-${param.key}`}
                                class="plugin-input"
                                type="text"
                                placeholder="/path/to/file"
                                value={entry.params[param.key]}
                                oninput={(e) => onText(param, e)}
                            />
                            <button type="button" class="plugin-browse" onclick={() => browse(param)}> Browse… </button>
                        </div>
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
    </FloatingWindow>
{/if}

<style>
    .plugin-body {
        flex: 1;
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

    /* Restrained, dark-theme error tint (soft red text on a deep red surface).
       Themes can override via the --*-error tokens; sensible fallbacks otherwise. */
    .plugin-error {
        margin: 0;
        padding: 8px 10px;
        font-size: 12px;
        color: var(--color-error, #e2a3a3);
        background-color: var(--surface-error, #2a1d1f);
        border: 1px solid var(--border-error, #5c3234);
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

    .plugin-file {
        display: flex;
        gap: 8px;
    }

    .plugin-file .plugin-input {
        flex: 1;
        min-width: 0;
    }

    .plugin-browse {
        flex: 0 0 auto;
        height: 34px;
        padding: 0 14px;
        color: var(--color-text);
        background-color: var(--surface-menu-input);
        border: 1px solid var(--border-input-strong);
        border-radius: var(--radius-lg);
        transition: background-color var(--transition-fast);
        user-select: none;
    }

    .plugin-browse:hover {
        background-color: var(--surface-hover);
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
