<script lang="ts">
    import FlowContextMenu from '$lib/components/FlowContextMenu.svelte';
import {
        SvelteFlow,
        Controls,
        MiniMap,
        Background,
        BackgroundVariant,
    } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';
    
    let nodes = $state.raw([
        { id: 'Potato', position: { x: 0, y: 0 }, data: { label: '1' } },
        { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
    ]);
    
    let edges = $state.raw([
        { id: 'e1-2', source: 'Potato', target: '2' },
    ]);

</script>

<FlowContextMenu>
	<SvelteFlow 
		bind:nodes 
		bind:edges 
		fitView 
		colorMode="dark"
	>
		<Controls />
		<MiniMap />
		<Background variant={BackgroundVariant.Dots} gap={12} size={1} />
	</SvelteFlow>
</FlowContextMenu>