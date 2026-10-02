<script lang="ts">
    import type { ChangeEventHandler } from "svelte/elements";
    import { setExposedValue, updateInitializer } from "../../actions";
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
        // An `[Expose(Write)]` input: the node and the input's variable name. Edits
        // then go to the running graph directly, while the knob moves, instead of
        // through a recompile.
        exposed?: { node: Identity; name: string };
    }

    let { identity, initializer, widget, label, exposed }: Props = $props();

    function toNumber(value: Initializer | undefined): number {
        if (typeof value === "number") return value;
        if (typeof value === "boolean") return value ? 1 : 0;
        return 0;
    }

    // Moves with the knob, and follows the native value whenever that changes.
    let knobValue = $derived(toNumber(initializer));

    // Live, while the knob moves: dropped values don't matter, the gesture's end commits.
    function onKnobInput(value: number) {
        if (exposed) setExposedValue(exposed.node, exposed.name, value).catch(() => {});
    }

    // An exposed input is written live, and the host keeps it as the initializer.
    // When it can't (the graph isn't compiled yet), the initializer is updated the
    // usual way, which recompiles. Resolves with the value kept.
    function commit(value: number): Promise<Initializer> {
        if (exposed)
            return setExposedValue(exposed.node, exposed.name, value).then(
                () => value,
                () => updateInitializer(identity, value),
            );
        return updateInitializer(identity, value);
    }

    // The native side may clamp or round (integer inputs): show what it kept.
    function onKnobChange(value: number) {
        commit(value).then((result) => {
            knobValue = toNumber(result);
        });
    }

    const onInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        const input = event.currentTarget;
        commit(parseFloat(input.value)).then((result) => {
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
        oninput={exposed ? onKnobInput : undefined}
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
