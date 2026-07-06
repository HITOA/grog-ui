<script lang="ts">
    import { page } from '$app/state';
    import type { NodeInstance } from '$lib/types';
    import { Handle, Position, useSvelteFlow, type NodeProps, type Node } from '@xyflow/svelte';
    import type { GenericNodeType } from './GenericNode';

    let { id, data }: NodeProps<GenericNodeType> = $props();

    let { updateNodeData } = useSvelteFlow();
</script>

<div class="node-frame">
    <div class="node-header">
        { data.instance.displayName }
    </div>
    <div class="node-content">
        <div class="node-inputs">
            {#each data.instance.inputs as input }
                <div class="node-row">
                    <Handle type="target" position={Position.Left} id={input.identity.toString()} />
                    <span class="port-label">{input.displayName}</span>
                    <input class="port-control" value={input.initializer}>
                </div>
            {/each }
        </div>
        <div class="node-outputs">
            {#each data.instance.outputs as output }
                <div class="node-row">
                    <span class="port-label">{output.displayName}</span>
                    <Handle type="source" position={Position.Right} id={output.identity.toString()} />
                </div>
            {/each }
        </div>
    </div>
</div>