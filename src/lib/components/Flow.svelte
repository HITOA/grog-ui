<script lang="ts">
    import GenericNode from '$lib/components/nodes/GenericNode.svelte';
    import { grogState } from '$lib/state.svelte';
    import {
        SvelteFlow,
        Controls,
        MiniMap,
        Background,
        BackgroundVariant,
        SelectionMode,
        type NodeTargetEventWithPointer,
        type OnConnect,
        useSvelteFlow,
    } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';
    import { createConnection, updateNodesPosition } from '$lib/actions';
    
    const nodeTypes = { genericNode: GenericNode };

    let { updateNodeData } = useSvelteFlow();

    const onNodeDragStop: NodeTargetEventWithPointer<MouseEvent | TouchEvent> = ({ nodes }) => {
        updateNodesPosition(nodes)
    }

    const onConnect: OnConnect = (connection) => {
        createConnection(connection, updateNodeData);
    }

</script>

<SvelteFlow 
    bind:nodes={ grogState.currentFlow.nodes }
    bind:edges={ grogState.currentFlow.edges }
    {nodeTypes}
    selectionOnDrag
    panOnDrag={[1]}
    selectionMode={SelectionMode.Partial} 
    onlyRenderVisibleElements={false}

    onnodedragstop={onNodeDragStop}
    onconnect={onConnect}

    proOptions={{ hideAttribution: true }}

    colorMode="dark"
>
    <Controls />
    <MiniMap />
    <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
</SvelteFlow>