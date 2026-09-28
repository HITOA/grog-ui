<script lang="ts">
    import Keyboard from "./Keyboard.svelte";
    import Wheel from "./Wheel.svelte";
    import { CC_MODWHEEL, controlChange, PITCH_BEND_MAX, pitchBend } from "../midi";

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
</script>

<!--
  The footer is a horizontal strip that hosts the live-performance controls and,
  eventually, host telemetry. Panels are independent so more can be slotted in
  (a proper log line at the very bottom, meters, etc.) without disturbing the
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
          Host telemetry (CPU, voices, …) lives here. There is no native feed yet,
          so the readouts show placeholders until `send_midi`'s sibling stat events
          are wired up on the C++ side.
        -->
        <div class="footer-panel footer-stats">
            <div class="footer-stat">
                <span class="footer-stat-label">CPU</span>
                <span class="footer-stat-value">—</span>
            </div>
            <div class="footer-stat">
                <span class="footer-stat-label">Voices</span>
                <span class="footer-stat-value">—</span>
            </div>
        </div>
    </div>
</div>
