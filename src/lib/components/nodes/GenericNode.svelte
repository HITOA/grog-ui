<script lang="ts">
    import { Position, type NodeProps } from '@xyflow/svelte';
    import type { GenericNodeType } from './GenericNode';
    import PortHandle from './PortHandle.svelte';
    import { PortState } from '../../types';
    import type { ChangeEventHandler } from 'svelte/elements';
    import { API } from '../../api';
    import { grogState } from '../../state.svelte';

    let { id, data }: NodeProps<GenericNodeType> = $props();

    const onInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        API.updateInitializer(
            grogState.currentFlowIndex, 
            parseInt(event.currentTarget.id),
            parseFloat(event.currentTarget.value)).then((result) => {
                event.currentTarget.value = result;
            })
    }

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
                    <input id="{input.identity.toString()}" 
                        type="number" class="port-control nodrag" 
                        value={input.initializer} onchange={onInputChange}>
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
    {#if data.instance.parameters?.length}
        <div class="node-footer">
            {#each data.instance.parameters as parameter }
                <span class="port-label">{parameter.displayName}</span>
                {#if (parameter.type.commonName == "Builtin_Numeric" || parameter.type.commonName == "Builtin_Control")}
                    <input id="{parameter.identity.toString()}" 
                        type="number" class="port-control nodrag" 
                        value={parameter.initializer} onchange={onInputChange}>
                {/if}
            {/each }
        </div>
    {/if}
</div>