<script lang="ts">
    import Keyboard from "./Keyboard.svelte";
    import Knob from "./Knob.svelte";
    import Wheel from "./Wheel.svelte";
    import { CC_MODWHEEL, controlChange, PITCH_BEND_MAX, pitchBend } from "../midi";
    import { GAIN_MAX_DB, GAIN_MIN_DB, METER_FLOOR_DB, meterPosition, outputMeter } from "../output-meter.svelte";

    // Wheels report a normalized 0..1 position; map each onto its MIDI range.
    function onPitchBend(v: number) {
        pitchBend(v * PITCH_BEND_MAX);
    }

    function onModWheel(v: number) {
        controlChange(CC_MODWHEEL, v * 127);
    }

    // When collapsed the footer hides its panels and shrinks to a thin bar that
    // is itself the toggle to expand again.
    let collapsed = $state(false);

    // The highest held peak, printed under the meter.
    let peakDb = $derived(Math.max(...outputMeter.holdDb));
    let peakText = $derived(peakDb <= METER_FLOOR_DB ? "-inf" : peakDb.toFixed(1));

    function formatLoad(load: number | null): string {
        return load === null ? "—" : `${(load * 100).toFixed(2)}%`;
    }

    // The audio thread's load: the time it takes over the time the audio it
    // renders lasts, on its one thread. Near 100%, the audio drops out.
    let dspText = $derived(formatLoad(outputMeter.load));
    // The same time as a share of the whole machine (all its hardware threads),
    // as hosts like Reaper show it.
    let cpuText = $derived(formatLoad(outputMeter.load === null ? null : outputMeter.load / outputMeter.threads));
    const DSP_HOT = 0.8;
</script>

<!--
  The footer is a horizontal strip that hosts the live-performance controls and
  the output. Panels are independent so more can be slotted in
  (a proper log line at the very bottom, etc.) without disturbing the
  keyboard, which is the centrepiece.
-->
<div class="footer" class:footer-collapsed={collapsed}>
    <button
        class="footer-collapse-toggle"
        onclick={() => (collapsed = !collapsed)}
        title={collapsed ? "Expand footer" : "Collapse footer"}
        aria-label={collapsed ? "Expand footer" : "Collapse footer"}
    >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor"
            ><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path
                d="M297.4 438.6C309.9 451.1 330.2 451.1 342.7 438.6L502.7 278.6C515.2 266.1 515.2 245.8 502.7 233.3C490.2 220.8 469.9 220.8 457.4 233.3L320 370.7L182.6 233.4C170.1 220.9 149.8 220.9 137.3 233.4C124.8 245.9 124.8 266.2 137.3 278.7L297.3 438.7z"
            /></svg
        >
    </button>

    <!--
      Panels stay mounted (rather than sitting behind an {#if}) so the footer
      can glide between heights and fade the contents instead of snapping.
    -->
    <div class="footer-body">
        <div class="footer-panel footer-wheels">
            <Wheel label="Pitch" rest={0.5} value={0.5} springBack oninput={onPitchBend} />
            <Wheel label="Mod" oninput={onModWheel} />
        </div>

        <div class="footer-panel footer-keyboard">
            <Keyboard />
        </div>

        <!--
          The output: its level after the gain and the output guard, the gain,
          and the audio thread's load.
        -->
        <div class="footer-panel footer-output">
            <button
                class="footer-meter"
                class:footer-meter-clipped={outputMeter.clipped}
                onclick={() => outputMeter.clearPeaks()}
                title="Output level (dBFS). Click to clear the peaks."
                aria-label="Output level, peak {peakText} dBFS. Click to clear the peaks."
            >
                <span class="footer-meter-clip"></span>
                <span class="footer-meter-bars">
                    {#each outputMeter.levelDb as level, i (i)}
                        <span class="footer-meter-bar">
                            <!-- Moved by transforms, not sizes: no layout every frame. -->
                            <span class="footer-meter-unlit" style:transform="scaleY({1 - meterPosition(level)})"
                            ></span>
                            {#if outputMeter.holdDb[i] > METER_FLOOR_DB}
                                <span
                                    class="footer-meter-hold"
                                    style:transform="translateY({(1 - meterPosition(outputMeter.holdDb[i])) * 100}%)"
                                ></span>
                            {/if}
                        </span>
                    {/each}
                    <span class="footer-meter-zero" style:bottom="{meterPosition(0) * 100}%"></span>
                </span>
                <span class="footer-meter-readout">{peakText}</span>
            </button>
            <div class="footer-output-controls">
                <Knob
                    label="Gain"
                    min={GAIN_MIN_DB}
                    max={GAIN_MAX_DB}
                    unit="dB"
                    decimals={1}
                    defaultValue={0}
                    value={outputMeter.gainDb}
                    oninput={(v) => outputMeter.setGainDb(v)}
                    ongrab={() => outputMeter.grabGain(true)}
                    onrelease={() => outputMeter.grabGain(false)}
                />
                <div class="footer-stat" title="Thread usage.">
                    <span class="footer-stat-label">DSP</span>
                    <span class="footer-stat-value" class:footer-stat-value-hot={(outputMeter.load ?? 0) > DSP_HOT}
                        >{dspText}</span
                    >
                </div>
                <div class="footer-stat" title="CPU usage (over {outputMeter.threads} threads).">
                    <span class="footer-stat-label">CPU</span>
                    <span class="footer-stat-value">{cpuText}</span>
                </div>
            </div>
        </div>
    </div>
</div>
