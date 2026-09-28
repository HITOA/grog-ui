<script lang="ts">
    import { grogState } from "../state.svelte";
    import { settings } from "../settings.svelte";
    import { MessageSeverity } from "../types";

    // Maps a severity to the short label shown at the start of the line.
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

    // The strip previews only the newest message; clicking it opens the console.
    let lastMessage = $derived(grogState.consoleMessages[grogState.consoleMessages.length - 1]);

    function openConsole(): void {
        grogState.consoleOpen = true;
    }
</script>

{#if settings.showLogBar}
    <button
        type="button"
        class="console-status-bar {lastMessage ? severityClass(lastMessage.severity) : ''}"
        title="Open console"
        onclick={openConsole}
    >
        {#if lastMessage}
            <span class="console-status-severity">{severityLabels[lastMessage.severity]}</span>
            <span class="console-status-message">{lastMessage.message}</span>
        {:else}
            <span class="console-status-message console-status-empty">No messages yet.</span>
        {/if}
    </button>
{/if}
