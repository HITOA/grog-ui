<script>
    import { SvelteFlowProvider } from "@xyflow/svelte";
    import MainMenuBar from "./lib/components/MainMenuBar.svelte";
    import FlowContextMenu from "./lib/components/FlowContextMenu.svelte";
    import Flow from "./lib/components/Flow.svelte";
</script>

<MainMenuBar/>

<SvelteFlowProvider>
    <FlowContextMenu>
        <Flow/>
    </FlowContextMenu>
</SvelteFlowProvider>