<script lang="ts">
    import Flow from '$lib/components/Flow.svelte';
    import FlowContextMenu from '$lib/components/FlowContextMenu.svelte';
    import { SvelteFlowProvider } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';
</script>

<SvelteFlowProvider>
    <FlowContextMenu>
        <Flow/>
    </FlowContextMenu>
</SvelteFlowProvider>