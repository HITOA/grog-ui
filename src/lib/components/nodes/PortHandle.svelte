<script lang="ts">
    import { Handle, Position, useNodeConnections } from "@xyflow/svelte";
    import { PortColorVar, PortStyle } from "./PortStyle";
    import { PortState, type PortInstance } from "../../types";

    let { id, type, position, instance }: {
        id: string; type: 'source' | 'target'; position: Position; instance: PortInstance;
    } = $props();

    const connections = $derived(useNodeConnections({ handleType: type, handleId: id }));

    let style: PortStyle = $derived(PortStyle.getStyle(instance));
</script>

<Handle {type} {position} {id} class={`port-handle port-handle-${type}`} style="color: var({style.color})">
    {#if connections.current.length > 0}
        {@html style.shape?.second }
    {:else}
        {@html style.shape?.first }
    {/if}
</Handle>