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
</script>

<!--
  The footer is a horizontal strip that hosts the live-performance controls and,
  eventually, host telemetry. Panels are independent so more can be slotted in
  (a proper log line at the very bottom, meters, etc.) without disturbing the
  keyboard, which is the centrepiece.
-->
<div class="footer">
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
