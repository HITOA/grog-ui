import "@xyflow/svelte/dist/base.css";
import { mount } from "svelte";
import App from "./App.svelte";
import { grogState } from "./lib/state.svelte";
import * as API from "./lib/api";
import { themeManager } from "./lib/theme.svelte";
import { settings } from "./lib/settings.svelte";
import {
    onConsoleMessage,
    onUpdateFeedbackList,
    onUpdateGraph,
    onUpdateGraphs,
    updateGraphInstances,
} from "./lib/actions";
import type { GrogEvent } from "./lib/bridge";
import type { ConsoleMessage, ExposedValueUpdate, FeedbackEntry, GraphInstance } from "./lib/types";
import { onExposedValues } from "./lib/exposed";
import { pluginHost } from "./lib/plugins/plugin-host.svelte";

grogState.nodeDefinitionList = await API.getNodeDefinitionList();
grogState.presetList = await API.getPresetList();
grogState.currentPreset = await API.getCurrentPresetMetadata();
grogState.consoleMessages = await API.getConsoleMessages();

await themeManager.init();
await settings.init();

void pluginHost.init();

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

window.addEventListener("exposed_values", (e: CustomEventInit<GrogEvent<ExposedValueUpdate[]>>) => {
    if (e.detail?.data) onExposedValues(e.detail.data);
});

window.addEventListener("console_message", (e: CustomEventInit<GrogEvent<ConsoleMessage>>) => {
    if (e.detail?.data) onConsoleMessage(e.detail.data);
});

const app = mount(App, {
    target: document.getElementById("app")!,
});

export default app;
