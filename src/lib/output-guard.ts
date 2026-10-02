import * as API from "./api";
import { notifications } from "./notifications.svelte";
import { settings } from "./settings.svelte";
import type { OutputGuardEvent } from "./types";

// The output guard's notifications replace each other.
const NOTIFICATION_KEY = "output-guard";

function describePeak(peak: number | null): string {
    if (peak === null) return "a sample that isn't a number (NaN or Inf)";
    return `a peak of ${(20 * Math.log10(peak)).toFixed(1)} dBFS`;
}

// `peak` is undefined when unknown (latched before the UI opened).
function showLatched(peak?: number | null): void {
    const cause = peak === undefined ? "" : ` (${describePeak(peak)})`;
    notifications.notify({
        key: NOTIFICATION_KEY,
        level: "error",
        title: "Output muted",
        message:
            `The graph blew up again right after the output came back${cause}. ` +
            "It stays muted until you re-arm it: undo the change that caused it first.",
        sticky: true,
        actions: [{ label: "Re-arm output", run: () => void API.rearmOutput() }],
    });
}

// The host's `output_guard` event.
export function onOutputGuard(event: OutputGuardEvent): void {
    switch (event.event) {
        case "tripped":
            notifications.notify({
                key: NOTIFICATION_KEY,
                level: "warning",
                title: "Output muted",
                message: `The graph blew up (${describePeak(event.peak)}). The output was muted for a moment and the graph reset.`,
            });
            break;
        case "latched":
            showLatched(event.peak);
            break;
        case "rearmed":
            notifications.notify({ key: NOTIFICATION_KEY, level: "info", title: "Output back", timeout: 3000 });
            break;
    }
}

// Reads the guard's setting, and shows it latched if it was before the UI opened.
export async function initOutputGuard(): Promise<void> {
    try {
        const status = await API.getOutputGuard();
        settings.outputGuard = status.enabled;
        // Rounded: the host keeps it linear, as a float.
        settings.outputGuardCeilingDb = Math.round(20 * Math.log10(status.ceiling) * 10) / 10;
        if (status.state === "latched") showLatched();
    } catch (err) {
        console.error("failed to read the output guard:", err);
    }
}
