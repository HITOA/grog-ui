import * as API from "./api";

/**
 * Typed helpers around the single `send_midi` native call (see API.sendMidi).
 *
 * Everything ultimately funnels into `send()`, which fires the raw byte array
 * at the host and swallows the response — MIDI is fire-and-forget, we never
 * wait on an ack, and a missing host (e.g. in the browser dev server) must not
 * spam unhandled rejections.
 */

// --- Status bytes (upper nibble; OR with the channel in the lower nibble) ---
export const MIDI_NOTE_OFF = 0x80;
export const MIDI_NOTE_ON = 0x90;
export const MIDI_CONTROL_CHANGE = 0xb0;
export const MIDI_PITCH_BEND = 0xe0;

// --- Common control-change numbers ---
export const CC_MODWHEEL = 1;

// --- Pitch-bend range (14-bit; centre = no bend) ---
export const PITCH_BEND_CENTER = 8192;
export const PITCH_BEND_MAX = 16383;

const clamp7 = (v: number) => Math.max(0, Math.min(127, Math.round(v)));

function send(data: number[]): void {
    void API.sendMidi(data).catch(() => {});
}

export function noteOn(note: number, velocity: number, channel = 0): void {
    send([MIDI_NOTE_ON | (channel & 0x0f), clamp7(note), clamp7(velocity)]);
}

export function noteOff(note: number, velocity = 0, channel = 0): void {
    send([MIDI_NOTE_OFF | (channel & 0x0f), clamp7(note), clamp7(velocity)]);
}

export function controlChange(controller: number, value: number, channel = 0): void {
    send([MIDI_CONTROL_CHANGE | (channel & 0x0f), clamp7(controller), clamp7(value)]);
}

/** `value` is the full 14-bit position (0..16383, centre 8192). */
export function pitchBend(value: number, channel = 0): void {
    const v = Math.max(0, Math.min(PITCH_BEND_MAX, Math.round(value)));
    send([MIDI_PITCH_BEND | (channel & 0x0f), v & 0x7f, (v >> 7) & 0x7f]);
}

// --- Note naming ---
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** The semitones within an octave that are black keys. */
export function isBlackKey(midi: number): boolean {
    const n = ((midi % 12) + 12) % 12;
    return n === 1 || n === 3 || n === 6 || n === 8 || n === 10;
}

/** e.g. 60 -> "C4" (MIDI octave numbering where 60 = C4). */
export function noteName(midi: number): string {
    const n = ((midi % 12) + 12) % 12;
    const octave = Math.floor(midi / 12) - 1;
    return `${NOTE_NAMES[n]}${octave}`;
}

/** The pitch class without the octave, e.g. 62 -> "D". */
export function pitchClass(midi: number): string {
    return NOTE_NAMES[((midi % 12) + 12) % 12];
}
