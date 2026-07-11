<script lang="ts">
    import { Position, type NodeProps } from '@xyflow/svelte';
    import type { GenericNodeType } from './GenericNode';
    import PortHandle from './PortHandle.svelte';
    import { PortState } from '../../types';

    let { id, data }: NodeProps<GenericNodeType> = $props();

</script>

<div class="node-frame">
    <div class="node-header">
        <h1 class="node-name-label">{ data.instance.displayName }</h1>
    </div>
    <div class="node-content">
        <div class="node-inputs">
            {#each data.instance.inputs as input }
                <PortHandle type="target" position={Position.Left} id={input.identity.toString()} instance={input} />
                <span class="port-label">{input.displayName}</span>
                {#if (input.type.commonName == "Builtin_Numeric" || input.type.commonName == "Builtin_Control") && input.state == PortState.Resolved}
                    <input type="number" class="port-control nodrag" bind:value={input.initializer}>
                {:else}
                    <div></div>
                {/if}
            {/each }
        </div>
        <div class="node-outputs">
            {#each data.instance.outputs as output }
                <div class="node-row">
                    <span class="port-label">{output.displayName}</span>
                    <PortHandle type="source" position={Position.Right} id={output.identity.toString()} instance={output} />
                </div>
            {/each }
        </div>
    </div>
</div>