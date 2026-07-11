<script lang="ts">
    import Flow from '$lib/components/Flow.svelte';
    import FlowContextMenu from '$lib/components/FlowContextMenu.svelte';
    import MainMenuBar from '$lib/components/MainMenuBar.svelte';
    import { SvelteFlowProvider } from '@xyflow/svelte';
</script>


<MainMenuBar/>

<SvelteFlowProvider>
    <FlowContextMenu>
        <Flow/>
    </FlowContextMenu>
</SvelteFlowProvider>