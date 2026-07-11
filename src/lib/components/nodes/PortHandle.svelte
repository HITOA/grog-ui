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

<Handle {type} {position} {id} class={`port-handle port-handle-${type}`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" style="width: 20px; height: 20px;">
        <path 
            stroke="var({style.color})" 
            stroke-width=25 
            fill={ connections.current.length > 0 ? `var(${style.color})` : "none" }
            d={style.path}/>
    </svg>
</Handle>