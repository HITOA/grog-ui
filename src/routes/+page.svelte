<script lang="ts">
    import FlowContextMenu from '$lib/components/FlowContextMenu.svelte';
    import GenericNode from '$lib/components/nodes/GenericNode.svelte';
    import { grogState } from '$lib/state.svelte';
import {
        SvelteFlow,
        Controls,
        MiniMap,
        Background,
        BackgroundVariant,
        SelectionMode,
        type Node,
        type Edge,

        SvelteFlowProvider

    } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';
    
    const nodeTypes = { genericNode: GenericNode };

</script>
<SvelteFlowProvider>
    <FlowContextMenu>
        <SvelteFlow 
            bind:nodes={ grogState.currentFlow.nodes }
            bind:edges={ grogState.currentFlow.edges }
            {nodeTypes}
            selectionOnDrag
            panOnDrag={[1]}
            selectionMode={SelectionMode.Partial}
            fitView 
            colorMode="dark"
        >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </SvelteFlow>
    </FlowContextMenu>
</SvelteFlowProvider>