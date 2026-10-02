<script lang="ts">
    import type { ChangeEventHandler } from "svelte/elements";
    import { updateInitializer } from "../../actions";
    import type { Identity, Initializer, Widget } from "../../types";
    import Knob from "../Knob.svelte";

    // The control editing the initializer of an unconnected input or of a
    // parameter: the widget its VCL declaration asks for, or a number box.
    interface Props {
        identity: Identity;
        initializer?: Initializer;
        widget?: Widget;
    }

    let { identity, initializer, widget }: Props = $props();

    function toNumber(value: Initializer | undefined): number {
        if (typeof value === "number") return value;
        if (typeof value === "boolean") return value ? 1 : 0;
        return 0;
    }

    // Moves with the knob, and follows the native value whenever that changes.
    let knobValue = $derived(toNumber(initializer));

    // The native side may clamp or round (integer inputs): show what it kept.
    function onKnobChange(value: number) {
        updateInitializer(identity, value).then((result) => {
            knobValue = toNumber(result);
        });
    }

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
        defaultValue={widget.defaultValue === undefined ? undefined : toNumber(widget.defaultValue)}
        onchange={onKnobChange}
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
