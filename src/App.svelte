<script>
    import { SvelteFlowProvider } from "@xyflow/svelte";
    import MainMenuBar from "./lib/components/MainMenuBar.svelte";
    import FlowContextMenu from "./lib/components/FlowContextMenu.svelte";
    import Flow from "./lib/components/Flow.svelte";
    import { grogState, ViewType } from "./lib/state.svelte";
    import PresetBrowser from "./lib/components/PresetBrowser.svelte";
    import PresetEditor from "./lib/components/PresetEditor.svelte";
    import MainTabBar from "./lib/components/MainTabBar.svelte";
    import Footer from "./lib/components/Footer.svelte";
    import PluginConfig from "./lib/components/PluginConfig.svelte";
    import Preferences from "./lib/components/Preferences.svelte";
    import Console from "./lib/components/Console.svelte";
    import ConsoleStatusBar from "./lib/components/ConsoleStatusBar.svelte";
    import Notifications from "./lib/components/Notifications.svelte";
    import { subgraphDrag } from "./lib/drag.svelte";
</script>

<MainMenuBar />
<MainTabBar />

{#if grogState.view == ViewType.Flow}
    <SvelteFlowProvider>
        <FlowContextMenu>
            <Flow />
        </FlowContextMenu>
    </SvelteFlowProvider>
{:else if grogState.view == ViewType.PresetBrowser}
    <PresetBrowser />
{:else if grogState.view == ViewType.PresetEditor}
    <PresetEditor />
{/if}

<Footer />
<ConsoleStatusBar />

<PluginConfig />
<Preferences />
<Console />
<Notifications />

{#if subgraphDrag.dragging}
    <div class="subgraph-drag-ghost" style="left: {subgraphDrag.x}px; top: {subgraphDrag.y}px;">
        {subgraphDrag.label}
    </div>
{/if}
