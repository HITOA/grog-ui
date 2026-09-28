<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        title: string;
        description?: string;
        onClose: () => void;
        // CSS length for the window; height is optional so short content can
        // still hug its contents.
        width?: string;
        height?: string;
        children: Snippet;
    }

    let { title, description, onClose, width = "420px", height, children }: Props = $props();

    // Close only when the click/keypress lands on the backdrop itself.
    function onBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) onClose();
    }
</script>

<!-- Click-away backdrop; the panel stops propagation so inner clicks don't close it. -->
<div class="overlay" role="presentation" onclick={onBackdropClick} onkeydown={(e) => e.key === "Escape" && onClose()}>
    <div class="window" role="dialog" aria-modal="true" tabindex="-1" style:width style:height>
        <div class="window-header">
            <div class="window-titles">
                <h1 class="window-title">{title}</h1>
                {#if description}
                    <p class="window-desc">{description}</p>
                {/if}
            </div>
            <button type="button" class="window-close" onclick={onClose} aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                    <path
                        d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"
                    />
                </svg>
            </button>
        </div>

        <div class="window-body">
            {@render children()}
        </div>
    </div>
</div>
