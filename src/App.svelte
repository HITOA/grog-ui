<script>
    import { SvelteFlowProvider } from "@xyflow/svelte";
    import MainMenuBar from "./lib/components/MainMenuBar.svelte";
    import FlowContextMenu from "./lib/components/FlowContextMenu.svelte";
    import Flow from "./lib/components/Flow.svelte";
    import { grogState, ViewType } from "./lib/state.svelte";
    import PresetBrowser from "./lib/components/PresetBrowser.svelte";
    import PresetEditor from "./lib/components/PresetEditor.svelte";
    import MainTabBar from "./lib/components/MainTabBar.svelte";
</script>

<MainMenuBar/>
<MainTabBar/>

{#if grogState.view == ViewType.Flow}
    <SvelteFlowProvider>
        <FlowContextMenu>
            <Flow/>
        </FlowContextMenu>
    </SvelteFlowProvider>
{:else if grogState.view == ViewType.PresetBrowser}
    <PresetBrowser/>
{:else if grogState.view == ViewType.PresetEditor}
    <PresetEditor/>
{/if}