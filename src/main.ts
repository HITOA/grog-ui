import "@xyflow/svelte/dist/base.css";
import { mount } from "svelte";
import App from "./App.svelte";
import { grogState } from "./lib/state.svelte";
import * as API from "./lib/api";
import { setTheme } from "./lib/theme";
import { onUpdateFeedbackList, onUpdateGraph, onUpdateGraphs, updateGraphInstances } from "./lib/actions";
import type { GrogEvent } from "./lib/bridge";
import type { FeedbackEntry, GraphInstance } from "./lib/types";
import { pluginHost } from "./lib/plugins/plugin-host.svelte";

grogState.nodeDefinitionList = await API.getNodeDefinitionList();
grogState.presetList = await API.getPresetList();
grogState.currentPreset = await API.getCurrentPresetMetadata();

setTheme("default-theme");

pluginHost.init();

updateGraphInstances();

window.addEventListener("update_graph", (e: CustomEventInit<GrogEvent<GraphInstance>>) => {
    if (e.detail?.data) onUpdateGraph(e.detail.data);
});

window.addEventListener("update_graphs", (e: CustomEventInit<GrogEvent<GraphInstance[]>>) => {
    if (e.detail?.data) onUpdateGraphs(e.detail.data);
});

window.addEventListener("update_feedback_list", (e: CustomEventInit<GrogEvent<FeedbackEntry[]>>) => {
    if (e.detail?.data) onUpdateFeedbackList(e.detail.data);
});

const app = mount(App, {
    target: document.getElementById("app")!,
});

export default app;
