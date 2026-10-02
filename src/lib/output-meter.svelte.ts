import * as API from "./api";
import type { OutputMeterEvent } from "./types";

// The meter's scale, in dBFS.
export const METER_FLOOR_DB = -60;
export const METER_TOP_DB = 6;
// The gain knob's range, in dB (the host takes up to +12 dB).
export const GAIN_MIN_DB = -60;
export const GAIN_MAX_DB = 12;

// The bars fall back this fast; a peak is held this long before falling too.
const RELEASE_DB_PER_SECOND = 20;
const HOLD_MS = 1500;
// The load readout changes this often, as the mean of the loads received
// meanwhile: faster, it can't be read.
const LOAD_REFRESH_MS = 250;
// Without a meter event for this long, the audio isn't running.
const STALE_MS = 1000;

function linearToDb(linear: number, floor: number): number {
    return linear > 0 ? Math.max(floor, 20 * Math.log10(linear)) : floor;
}

// Position of `db` on the meter, 0..1 from the bottom.
export function meterPosition(db: number): number {
    return Math.max(0, Math.min(1, (db - METER_FLOOR_DB) / (METER_TOP_DB - METER_FLOOR_DB)));
}

// The output's level, the audio thread's load and the output gain, fed by the
// host's `output_meter` event. The bars move every animation frame while they
// fall, and stop when everything is at the floor.
class OutputMeter {
    // Displayed levels and held peaks per channel, in dBFS.
    levelDb = $state([METER_FLOOR_DB, METER_FLOOR_DB]);
    holdDb = $state([METER_FLOOR_DB, METER_FLOOR_DB]);
    // A peak went over 0 dBFS since the last `clearPeaks`.
    clipped = $state(false);
    // Null while no audio runs.
    load = $state<number | null>(null);
    // The machine's hardware threads: `load / threads` is the share of the whole machine.
    threads = $state(1);
    gainDb = $state(0);

    #holdUntil = [0, 0];
    #lastFrame = 0;
    #animating = false;
    #staleTimer: ReturnType<typeof setTimeout> | undefined;
    // The loads received since the readout last changed.
    #loadSum = 0;
    #loadCount = 0;
    #loadShownAt = 0;
    // The knob is held, or a gain set is in flight: the host's echo would make
    // it jump back.
    #grabbed = false;
    #pendingSets = 0;

    async init(): Promise<void> {
        try {
            this.gainDb = this.#gainToDb(await API.getOutputGain());
        } catch (err) {
            console.error("failed to read the output gain:", err);
        }
    }

    // The host's `output_meter` event.
    onOutputMeter(event: OutputMeterEvent): void {
        const now = performance.now();
        event.peak.forEach((peak, i) => {
            if (i >= this.levelDb.length) return;
            const db = linearToDb(peak, METER_FLOOR_DB);
            if (db > this.levelDb[i]) this.levelDb[i] = db;
            if (db >= this.holdDb[i]) {
                this.holdDb[i] = db;
                this.#holdUntil[i] = now + HOLD_MS;
            }
            if (peak > 1) this.clipped = true;
        });
        this.threads = Math.max(1, event.threads);
        this.#loadSum += event.load;
        this.#loadCount++;
        if (this.load === null || now - this.#loadShownAt >= LOAD_REFRESH_MS) {
            this.load = this.#loadSum / this.#loadCount;
            this.#loadSum = 0;
            this.#loadCount = 0;
            this.#loadShownAt = now;
        }
        clearTimeout(this.#staleTimer);
        this.#staleTimer = setTimeout(() => {
            this.load = null;
            this.#loadSum = 0;
            this.#loadCount = 0;
        }, STALE_MS);
        // Follows the host (a project loaded with another gain) unless the user is turning it.
        if (!this.#grabbed && this.#pendingSets === 0) {
            const gainDb = this.#gainToDb(event.gain);
            if (Math.abs(gainDb - this.gainDb) > 0.005) this.gainDb = gainDb;
        }
        this.#animate(now);
    }

    clearPeaks(): void {
        this.clipped = false;
        this.holdDb = this.levelDb.slice();
        this.#animate(performance.now());
    }

    grabGain(grabbed: boolean): void {
        this.#grabbed = grabbed;
    }

    setGainDb(gainDb: number): void {
        this.gainDb = gainDb;
        this.#pendingSets++;
        API.setOutputGain(Math.pow(10, gainDb / 20))
            .catch((err) => console.error("failed to set the output gain:", err))
            .finally(() => this.#pendingSets--);
    }

    // Rounded: the host keeps it linear, as a float.
    #gainToDb(gain: number): number {
        return Math.round(linearToDb(gain, GAIN_MIN_DB) * 100) / 100;
    }

    // Starts the animation loop if it isn't running.
    #animate(now: number): void {
        if (this.#animating) return;
        this.#animating = true;
        this.#lastFrame = now;
        requestAnimationFrame((t) => this.#tick(t));
    }

    #tick(now: number): void {
        const fall = (RELEASE_DB_PER_SECOND * Math.max(0, now - this.#lastFrame)) / 1000;
        this.#lastFrame = now;
        let moving = false;
        for (let i = 0; i < this.levelDb.length; ++i) {
            if (this.levelDb[i] > METER_FLOOR_DB) {
                this.levelDb[i] = Math.max(METER_FLOOR_DB, this.levelDb[i] - fall);
                moving = true;
            }
            if (this.holdDb[i] > this.levelDb[i]) {
                if (now > this.#holdUntil[i]) this.holdDb[i] = Math.max(this.levelDb[i], this.holdDb[i] - fall);
                moving = true;
            }
        }
        // Silence: the next event starts it again.
        if (moving) requestAnimationFrame((t) => this.#tick(t));
        else this.#animating = false;
    }
}

export const outputMeter = new OutputMeter();
