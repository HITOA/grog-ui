import { createContext } from "svelte";
import { page } from "$app/state";
import type { NodeDefinitionList } from "./api";

export class GrogContext {
    nodeDefinitionList: NodeDefinitionList = $derived(page.data.nodeDefinitionList)
}

export const [ getGrogContext, setGrogContext ] = createContext<GrogContext>();