<script lang="ts">
    import { SvelteMap, SvelteSet } from "svelte/reactivity";
    import { isBlackKey, noteName, noteOff, noteOn, pitchClass } from "../midi";

    interface Props {
        // The keyboard always starts on a C and spans whole octaves; how many
        // are shown adapts to the available width so keys keep a comfortable
        // size instead of stretching with the window.
        baseNote?: number; // lowest note, expected to be a C (default C2 = 36)
        minOctaves?: number;
        maxOctaves?: number;
        idealKeyWidth?: number; // target white-key width in px
    }

    let { baseNote = 36, minOctaves = 1, maxOctaves = 6, idealKeyWidth = 36 }: Props = $props();

    // Measured width of the keyboard; drives how many octaves fit.
    let containerWidth = $state(0);

    // Pick the octave count whose resulting white-key width lands closest to the
    // ideal (7 white keys per octave). Snapping by whole octaves means keys
    // appear/disappear a group at a time rather than resizing continuously.
    let octaveCount = $derived(
        Math.max(minOctaves, Math.min(maxOctaves, Math.round(containerWidth / (idealKeyWidth * 7)))),
    );

    let startNote = $derived(baseNote);
    let endNote = $derived(baseNote + octaveCount * 12);

    // Notes currently sounding, whatever the source (mouse or computer keyboard).
    // Kept reactive so keys light up while held.
    const activeNotes = new SvelteSet<number>();

    // Split the range into white keys (laid out in a row) and black keys
    // (absolutely positioned over the gaps). `whiteIndex` on a black key is the
    // number of white keys to its left, which places its centre on that boundary.
    interface WhiteKey {
        midi: number;
        whiteIndex: number;
    }
    interface BlackKey {
        midi: number;
        whiteIndex: number;
    }

    let layout = $derived.by(() => {
        const whites: WhiteKey[] = [];
        const blacks: BlackKey[] = [];
        let whiteIndex = 0;
        for (let midi = startNote; midi <= endNote; midi++) {
            if (isBlackKey(midi)) {
                blacks.push({ midi, whiteIndex });
            } else {
                whites.push({ midi, whiteIndex });
                whiteIndex++;
            }
        }
        return { whites, blacks, whiteCount: whiteIndex };
    });

    function press(midi: number, velocity: number) {
        if (activeNotes.has(midi)) return;
        activeNotes.add(midi);
        noteOn(midi, velocity);
    }

    function release(midi: number) {
        if (!activeNotes.has(midi)) return;
        activeNotes.delete(midi);
        noteOff(midi);
    }

    // --- Mouse / touch ---------------------------------------------------------
    // A single "mouse note" is held at a time; dragging across keys glides from
    // one to the next (release the old, press the new).
    let pointerDown = $state(false);
    let mouseNote: number | null = null;

    // Velocity follows how far down the key you click: near the top is soft,
    // near the bottom (the front lip of the key) is loud.
    function velocityFromEvent(ev: PointerEvent, el: HTMLElement): number {
        const rect = el.getBoundingClientRect();
        const t = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
        return Math.round(40 + t * 87); // 40..127
    }

    function onKeyPointerDown(ev: PointerEvent, midi: number) {
        pointerDown = true;
        mouseNote = midi;
        press(midi, velocityFromEvent(ev, ev.currentTarget as HTMLElement));
    }

    function onKeyPointerEnter(ev: PointerEvent, midi: number) {
        if (!pointerDown) return;
        if (mouseNote !== null && mouseNote !== midi) release(mouseNote);
        mouseNote = midi;
        press(midi, velocityFromEvent(ev, ev.currentTarget as HTMLElement));
    }

    function onWindowPointerUp() {
        if (mouseNote !== null) release(mouseNote);
        mouseNote = null;
        pointerDown = false;
    }

    // --- Computer keyboard -----------------------------------------------------
    // Mapped by physical key position (KeyboardEvent.code) rather than the typed
    // character, so the layout of notes under the fingers is identical on QWERTY,
    // AZERTY, QWERTZ, … — only the printed letters differ. Two rows form a
    // chromatic octave-and-a-half from C of the current octave; KeyZ / KeyX
    // (the two bottom-left keys) shift the octave down / up.
    const CODE_TO_OFFSET: Record<string, number> = {
        KeyA: 0,
        KeyW: 1,
        KeyS: 2,
        KeyE: 3,
        KeyD: 4,
        KeyF: 5,
        KeyT: 6,
        KeyG: 7,
        KeyY: 8,
        KeyH: 9,
        KeyU: 10,
        KeyJ: 11,
        KeyK: 12,
        KeyO: 13,
        KeyL: 14,
        KeyP: 15,
        Semicolon: 16,
    };

    let octave = $state(4);
    // Tracks which physical key (by code) is holding which midi note, so key-up
    // releases the right note even if the octave changed meanwhile.
    const heldKeys = new SvelteMap<string, number>();

    function isTypingTarget(target: EventTarget | null): boolean {
        const el = target as HTMLElement | null;
        if (!el) return false;
        const tag = el.tagName;
        return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
    }

    function onWindowKeyDown(ev: KeyboardEvent) {
        if (ev.repeat || ev.metaKey || ev.ctrlKey || ev.altKey) return;
        if (isTypingTarget(ev.target)) return;

        if (ev.code === "KeyZ") {
            octave = Math.max(0, octave - 1);
            return;
        }
        if (ev.code === "KeyX") {
            octave = Math.min(9, octave + 1);
            return;
        }

        const offset = CODE_TO_OFFSET[ev.code];
        if (offset === undefined || heldKeys.has(ev.code)) return;
        const midi = 12 * (octave + 1) + offset;
        heldKeys.set(ev.code, midi);
        press(midi, 100);
    }

    function onWindowKeyUp(ev: KeyboardEvent) {
        const midi = heldKeys.get(ev.code);
        if (midi !== undefined) {
            heldKeys.delete(ev.code);
            release(midi);
        }
    }
</script>

<svelte:window
    onpointerup={onWindowPointerUp}
    onkeydown={onWindowKeyDown}
    onkeyup={onWindowKeyUp}
    onblur={onWindowPointerUp}
/>

<div class="keyboard" style="--white-count: {layout.whiteCount};" bind:clientWidth={containerWidth}>
    <div class="keyboard-whites">
        {#each layout.whites as key (key.midi)}
            <button
                class="key-white"
                class:key-active={activeNotes.has(key.midi)}
                title={noteName(key.midi)}
                aria-label={noteName(key.midi)}
                onpointerdown={(ev) => onKeyPointerDown(ev, key.midi)}
                onpointerenter={(ev) => onKeyPointerEnter(ev, key.midi)}
            >
                <!-- C keys show the octave (C2, C3, …) and are more prominent;
                     the rest are faint so the labels stay discreet. -->
                <span class="key-label" class:key-label-c={key.midi % 12 === 0}>
                    {key.midi % 12 === 0 ? noteName(key.midi) : pitchClass(key.midi)}
                </span>
            </button>
        {/each}
    </div>
    <div class="keyboard-blacks">
        {#each layout.blacks as key (key.midi)}
            <button
                class="key-black"
                class:key-active={activeNotes.has(key.midi)}
                style="left: calc({key.whiteIndex} / var(--white-count) * 100%);"
                title={noteName(key.midi)}
                aria-label={noteName(key.midi)}
                onpointerdown={(ev) => onKeyPointerDown(ev, key.midi)}
                onpointerenter={(ev) => onKeyPointerEnter(ev, key.midi)}
            ></button>
        {/each}
    </div>
</div>
