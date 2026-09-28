<script lang="ts">
    import { grogState } from "../state.svelte";
    import { MessageSeverity } from "../types";
    import FloatingWindow from "./FloatingWindow.svelte";

    function onClose(): void {
        grogState.consoleOpen = false;
    }

    // Maps a severity to the short label shown in the gutter of each row.
    const severityLabels: Record<MessageSeverity, string> = {
        [MessageSeverity.None]: "",
        [MessageSeverity.Error]: "ERROR",
        [MessageSeverity.Warning]: "WARN",
        [MessageSeverity.Info]: "INFO",
        [MessageSeverity.Debug]: "DEBUG",
    };

    function severityClass(severity: MessageSeverity): string {
        switch (severity) {
            case MessageSeverity.Error:
                return "console-row-error";
            case MessageSeverity.Warning:
                return "console-row-warning";
            case MessageSeverity.Info:
                return "console-row-info";
            case MessageSeverity.Debug:
                return "console-row-debug";
            default:
                return "";
        }
    }

    // Severities the user can toggle. `None`-severity messages have no chip and
    // are always shown.
    const filterableSeverities = [
        MessageSeverity.Error,
        MessageSeverity.Warning,
        MessageSeverity.Info,
        MessageSeverity.Debug,
    ] as const;

    // All enabled by default; toggling a chip hides that severity.
    let enabled = $state<Record<MessageSeverity, boolean>>({
        [MessageSeverity.None]: true,
        [MessageSeverity.Error]: true,
        [MessageSeverity.Warning]: true,
        [MessageSeverity.Info]: true,
        [MessageSeverity.Debug]: true,
    });

    function toggleSeverity(severity: MessageSeverity): void {
        enabled[severity] = !enabled[severity];
    }

    let visibleMessages = $derived(grogState.consoleMessages.filter((m) => enabled[m.severity]));

    // Copies the currently visible messages as plain text, one per line, each
    // prefixed with its severity label.
    let copied = $state(false);
    let copyResetTimer: ReturnType<typeof setTimeout> | undefined;

    async function copyToClipboard(): Promise<void> {
        const text = visibleMessages
            .map((m) => {
                const label = severityLabels[m.severity];
                return label ? `[${label}] ${m.message}` : m.message;
            })
            .join("\n");
        try {
            await navigator.clipboard.writeText(text);
            copied = true;
            clearTimeout(copyResetTimer);
            copyResetTimer = setTimeout(() => (copied = false), 1500);
        } catch {
            // Clipboard access can be denied; leave the button label unchanged.
        }
    }

    // Clicking a row copies just that message's text and flashes a floating
    // "Copied to clipboard" toast at the bottom of the console.
    let rowCopied = $state(false);
    let rowCopyTimer: ReturnType<typeof setTimeout> | undefined;

    async function copyRow(text: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(text);
            rowCopied = true;
            clearTimeout(rowCopyTimer);
            rowCopyTimer = setTimeout(() => (rowCopied = false), 1500);
        } catch {
            // Clipboard access can be denied; silently do nothing.
        }
    }

    // Keep the view pinned to the newest message as it streams in.
    let logEl = $state<HTMLDivElement>();
    $effect(() => {
        // Read length so this re-runs whenever the visible set changes.
        const count = visibleMessages.length;
        if (logEl && count >= 0) logEl.scrollTop = logEl.scrollHeight;
    });
</script>

{#if grogState.consoleOpen}
    <FloatingWindow title="Console" {onClose} width="760px" height="480px">
        <div class="console">
            <div class="console-toolbar">
                <div class="console-filters">
                    {#each filterableSeverities as severity (severity)}
                        <button
                            type="button"
                            class="console-filter {severityClass(severity)}"
                            class:console-filter-off={!enabled[severity]}
                            aria-pressed={enabled[severity]}
                            onclick={() => toggleSeverity(severity)}
                        >
                            {severityLabels[severity]}
                        </button>
                    {/each}
                </div>
                <button
                    type="button"
                    class="console-copy"
                    onclick={copyToClipboard}
                    disabled={visibleMessages.length === 0}
                >
                    {copied ? "Copied!" : "Copy"}
                </button>
            </div>

            <div class="console-log" bind:this={logEl}>
                {#if grogState.consoleMessages.length === 0}
                    <p class="console-empty">No messages yet.</p>
                {:else if visibleMessages.length === 0}
                    <p class="console-empty">No messages match the current filter.</p>
                {:else}
                    {#each visibleMessages as message, i (i)}
                        <button
                            type="button"
                            class="console-row {severityClass(message.severity)}"
                            title="Click to copy"
                            onclick={() => copyRow(message.message)}
                        >
                            <span class="console-severity">{severityLabels[message.severity]}</span>
                            <span class="console-message">{message.message}</span>
                        </button>
                    {/each}
                {/if}
            </div>

            {#if rowCopied}
                <div class="console-toast" role="status">Copied to clipboard</div>
            {/if}
        </div>
    </FloatingWindow>
{/if}
