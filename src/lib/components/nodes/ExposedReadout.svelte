<script lang="ts">
    import { formatExposedValue, watchExposed } from "../../exposed";
    import type { Identity } from "../../types";

    // The live value of a variable a node exposes (`[Expose]`). It's drawn by
    // writing the text directly: values arrive about 30 times a second and must
    // not go through Svelte's reactivity.
    interface Props {
        graphId: number;
        identity: Identity;
        // The variable's name in the node's VCL source.
        name: string;
    }

    let { graphId, identity, name }: Props = $props();

    let element: HTMLSpanElement | undefined = $state();

    $effect(() => {
        const target = element;
        if (target === undefined) return;
        return watchExposed(graphId, identity, name, (value) => {
            target.textContent = formatExposedValue(value);
        });
    });
</script>

<span class="exposed-readout" bind:this={element} title={name}>–</span>
