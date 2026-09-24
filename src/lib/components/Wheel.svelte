<script lang="ts">
    // A vertical performance wheel (pitch bend / mod wheel). Drag up/down to set
    // a normalized 0..1 value; the parent maps that onto whatever MIDI range it
    // wants. `springBack` returns the wheel to `rest` when released, as a real
    // pitch-bend wheel does.
    interface Props {
        label: string;
        value?: number;
        rest?: number;
        springBack?: boolean;
        oninput?: (value: number) => void;
    }

    let { label, value = $bindable(0), rest = 0, springBack = false, oninput }: Props = $props();

    let track: HTMLDivElement | undefined = $state();
    let dragging = $state(false);

    function setFromPointer(clientY: number) {
        if (!track) return;
        const rect = track.getBoundingClientRect();
        // Top of the track is 1, bottom is 0.
        const next = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
        value = next;
        oninput?.(next);
    }

    function onPointerDown(ev: PointerEvent) {
        dragging = true;
        (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
        setFromPointer(ev.clientY);
    }

    function onPointerMove(ev: PointerEvent) {
        if (dragging) setFromPointer(ev.clientY);
    }

    function onPointerUp(ev: PointerEvent) {
        if (!dragging) return;
        dragging = false;
        (ev.currentTarget as HTMLElement).releasePointerCapture(ev.pointerId);
        if (springBack) {
            value = rest;
            oninput?.(rest);
        }
    }
</script>

<div class="wheel">
    <div
        bind:this={track}
        class="wheel-track"
        class:wheel-track-idle={springBack && !dragging}
        role="slider"
        tabindex="0"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={value}
        onpointerdown={onPointerDown}
        onpointermove={onPointerMove}
        onpointerup={onPointerUp}
        onpointercancel={onPointerUp}
    >
        <!-- Inset the grip travel by half its height so it never overhangs the
             slot (and its label) at the extremes; the value mapping stays 0..1. -->
        <div
            class="wheel-indicator"
            style="bottom: calc(var(--wheel-grip-height) / 2 + {value} * (100% - var(--wheel-grip-height)));"
        ></div>
    </div>
    <span class="wheel-label">{label}</span>
</div>
