<script lang="ts">
    import type { KnobScale } from "../types";

    // A rotary knob for numeric node parameters. Drag vertically (hold Shift for
    // fine control), scroll, or use the arrow keys to turn it; double-click resets
    // it to `defaultValue`. Internally the knob works on a normalized 0..1
    // position and maps that onto [min, max] through `scale`.
    interface Props {
        value?: number;
        min?: number;
        max?: number;
        scale?: KnobScale;
        unit?: string;
        label?: string;
        defaultValue?: number;
        // Digits after the decimal point in the readout. Picked from the
        // magnitude of the value when omitted.
        decimals?: number;
        // Fires continuously while the value moves.
        oninput?: (value: number) => void;
        // Fires once per finished gesture (pointer release, wheel tick, key
        // press) — commit to the native side from here, not from `oninput`.
        onchange?: (value: number) => void;
    }

    let {
        value = $bindable(0),
        min = 0,
        max = 1,
        scale = "linear",
        unit = "",
        label,
        defaultValue,
        decimals,
        oninput,
        onchange,
    }: Props = $props();

    // Total rotation from min to max, centred on 12 o'clock.
    const SWEEP = 270;
    const START_ANGLE = -SWEEP / 2;
    // Vertical drag distance (px) that covers the whole range.
    const DRAG_RANGE_PX = 200;
    const FINE_FACTOR = 10;
    const WHEEL_STEP = 0.02;
    const KEY_STEP = 0.01;
    const PAGE_STEP = 0.1;

    let isLog = $derived(scale === "log" && min > 0 && max > 0);

    function clamp01(t: number): number {
        return Math.max(0, Math.min(1, t));
    }

    function toNormalized(v: number): number {
        const t = isLog ? Math.log(v / min) / Math.log(max / min) : (v - min) / (max - min);
        return Number.isFinite(t) ? clamp01(t) : 0;
    }

    function fromNormalized(t: number): number {
        return isLog ? min * Math.pow(max / min, t) : min + t * (max - min);
    }

    let position = $derived(toNormalized(value));
    let angle = $derived(START_ANGLE + position * SWEEP);

    function formatValue(v: number): string {
        const abs = Math.abs(v);
        const digits = decimals ?? (abs >= 100 ? 0 : abs >= 10 ? 1 : 2);
        const text = v.toFixed(digits);
        return unit ? `${text} ${unit}` : text;
    }

    let display = $derived(formatValue(value));

    // SVG geometry, in a 40x40 viewBox. Angles are degrees clockwise from 12 o'clock.
    function polar(deg: number, r: number): string {
        const rad = (deg * Math.PI) / 180;
        return `${(20 + r * Math.sin(rad)).toFixed(3)} ${(20 - r * Math.cos(rad)).toFixed(3)}`;
    }

    function arcPath(from: number, to: number, r: number): string {
        const largeArc = to - from > 180 ? 1 : 0;
        return `M ${polar(from, r)} A ${r} ${r} 0 ${largeArc} 1 ${polar(to, r)}`;
    }

    function setPosition(t: number) {
        const next = fromNormalized(clamp01(t));
        if (next === value) return;
        value = next;
        oninput?.(next);
    }

    function commit() {
        onchange?.(value);
    }

    // Dragging accumulates into its own position rather than re-deriving it from
    // `value` each move, so clamping at the ends doesn't make the knob "stick".
    let dragging = $state(false);
    let dragPosition = 0;
    let lastY = 0;
    let valueAtDragStart = 0;

    function onPointerDown(ev: PointerEvent) {
        if (ev.button !== 0) return;
        const target = ev.currentTarget as HTMLElement;
        target.focus();
        target.setPointerCapture(ev.pointerId);
        dragging = true;
        dragPosition = position;
        lastY = ev.clientY;
        valueAtDragStart = value;
    }

    function onPointerMove(ev: PointerEvent) {
        if (!dragging) return;
        const dy = lastY - ev.clientY;
        lastY = ev.clientY;
        dragPosition = clamp01(dragPosition + dy / (DRAG_RANGE_PX * (ev.shiftKey ? FINE_FACTOR : 1)));
        setPosition(dragPosition);
    }

    function onPointerUp(ev: PointerEvent) {
        if (!dragging) return;
        dragging = false;
        (ev.currentTarget as HTMLElement).releasePointerCapture(ev.pointerId);
        if (value !== valueAtDragStart) commit();
    }

    function onWheel(ev: WheelEvent) {
        ev.preventDefault();
        // Shift+wheel is turned into horizontal scrolling by most browsers.
        const delta = ev.deltaY || ev.deltaX;
        if (delta === 0) return;
        const step = ev.shiftKey ? WHEEL_STEP / FINE_FACTOR : WHEEL_STEP;
        const before = value;
        setPosition(position - Math.sign(delta) * step);
        if (value !== before) commit();
    }

    function onKeyDown(ev: KeyboardEvent) {
        const step = ev.shiftKey ? KEY_STEP / FINE_FACTOR : KEY_STEP;
        let target: number;
        switch (ev.key) {
            case "ArrowUp":
            case "ArrowRight":
                target = position + step;
                break;
            case "ArrowDown":
            case "ArrowLeft":
                target = position - step;
                break;
            case "PageUp":
                target = position + PAGE_STEP;
                break;
            case "PageDown":
                target = position - PAGE_STEP;
                break;
            case "Home":
                target = 0;
                break;
            case "End":
                target = 1;
                break;
            default:
                return;
        }
        ev.preventDefault();
        const before = value;
        setPosition(target);
        if (value !== before) commit();
    }

    function onDoubleClick() {
        if (defaultValue === undefined || defaultValue === value) return;
        value = defaultValue;
        oninput?.(value);
        commit();
    }
</script>

<!-- `nodrag` / `nowheel` stop SvelteFlow from panning or zooming the canvas while
     the knob is being turned. The SVG presentation attributes are a fallback so
     the knob stays visible under themes that don't style it yet. -->
<div class="knob nodrag nowheel">
    {#if label}
        <span class="knob-label">{label}</span>
    {/if}
    <div
        class="knob-dial"
        class:knob-dial-active={dragging}
        role="slider"
        tabindex="0"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={display}
        onpointerdown={onPointerDown}
        onpointermove={onPointerMove}
        onpointerup={onPointerUp}
        onpointercancel={onPointerUp}
        onwheel={onWheel}
        onkeydown={onKeyDown}
        ondblclick={onDoubleClick}
    >
        <svg viewBox="0 0 40 40" aria-hidden="true">
            <path
                class="knob-track"
                d={arcPath(START_ANGLE, START_ANGLE + SWEEP, 17)}
                fill="none"
                stroke="currentColor"
                stroke-opacity="0.25"
                stroke-width="3"
            />
            {#if position > 0}
                <path
                    class="knob-arc"
                    d={arcPath(START_ANGLE, angle, 17)}
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                />
            {/if}
            <circle class="knob-body" cx="20" cy="20" r="12" fill="none" stroke="currentColor" stroke-width="1" />
            <line
                class="knob-pointer"
                x1="20"
                y1="10"
                x2="20"
                y2="15"
                stroke="currentColor"
                stroke-width="2"
                transform="rotate({angle} 20 20)"
            />
        </svg>
    </div>
    <span class="knob-readout">{display}</span>
</div>
