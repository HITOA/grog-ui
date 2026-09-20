<script lang="ts">
    import { Handle, Position, useNodeConnections } from "@xyflow/svelte";
    import { PortStyle } from "./PortStyle";
    import type { PortInstance } from "../../types";

    let {
        id,
        type,
        position,
        instance,
    }: {
        id: string;
        type: "source" | "target";
        position: Position;
        instance: PortInstance;
    } = $props();

    const connections = $derived(useNodeConnections({ handleType: type, handleId: id }));

    let style: PortStyle = $derived(PortStyle.getStyle(instance));
</script>

<Handle {type} {position} {id} class={`port-handle port-handle-${type}`} style="color: var({style.color})">
    {#if connections.current.length > 0}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted static SVG from PortStyle, not user input -->
        {@html style.shape?.second}
    {:else}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- trusted static SVG from PortStyle, not user input -->
        {@html style.shape?.first}
    {/if}
</Handle>
