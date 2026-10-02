<script lang="ts">
    import type { ChangeEventHandler } from "svelte/elements";
    import { grabInput, releaseInput, setInputValue, updateInitializer } from "../../actions";
    import type { Identity, Initializer, Widget } from "../../types";
    import Knob from "../Knob.svelte";

    // The control editing the initializer of an unconnected input or of a
    // parameter: the widget its VCL declaration asks for, or a number box.
    interface Props {
        identity: Identity;
        initializer?: Initializer;
        widget?: Widget;
        // The port's name, shown when hovering a knob (the row already prints it).
        label?: string;
    }

    let { identity, initializer, widget, label }: Props = $props();

    function toNumber(value: Initializer | undefined): number {
        if (typeof value === "number") return value;
        if (typeof value === "boolean") return value ? 1 : 0;
        return 0;
    }

    // Moves with the knob, and follows the native value whenever that changes.
    let knobValue = $derived(toNumber(initializer));

    // A knob writes while it moves: the host makes the input live for the
    // gesture (tiering), from the grab on. Dropped values don't matter, the
    // gesture's end commits.
    function onKnobInput(value: number) {
        setInputValue(identity, value, true).catch(() => {});
    }

    // The native side may clamp or round (integer inputs): show what it kept.
    function onKnobChange(value: number) {
        setInputValue(identity, value, false).then((result) => {
            knobValue = toNumber(result);
        });
    }

    // A typed value is one edit, not a gesture: it recompiles with the input
    // folded, rather than going live and back.
    const onInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        const input = event.currentTarget;
        updateInitializer(identity, parseFloat(input.value)).then((result) => {
            input.value = String(result ?? "");
        });
    };
</script>

{#if widget?.kind === "knob"}
    <Knob
        bind:value={knobValue}
        min={widget.min}
        max={widget.max}
        scale={widget.scale}
        unit={widget.unit}
        {label}
        showLabel={false}
        defaultValue={widget.defaultValue === undefined ? undefined : toNumber(widget.defaultValue)}
        oninput={onKnobInput}
        onchange={onKnobChange}
        ongrab={() => grabInput(identity)}
        onrelease={() => releaseInput(identity)}
    />
{:else}
    <input
        id={identity.toString()}
        type="number"
        class="port-control nodrag"
        value={initializer}
        onchange={onInputChange}
    />
{/if}
