import '@xyflow/svelte/dist/base.css';
import { mount } from 'svelte'
import App from "./App.svelte"
import { grogState } from './lib/state.svelte'
import { API } from './lib/api'
import { setTheme } from './lib/theme';
import { updateGraphInstances } from './lib/actions';

grogState.nodeDefinitionList = await API.getNodeDefinitionList();

setTheme("default-theme");

updateGraphInstances();

window.addEventListener("refresh_graph", () => {
  updateGraphInstances();
});

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app