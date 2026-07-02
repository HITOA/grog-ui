export const prerender = true;
export const csr = true;
export const ssr = false;

import type { LayoutLoad } from "./$types";

import { getNodeDefinitionList } from "$lib/api";

export const load: LayoutLoad = async ({}) => {
    let nodeDefinitionList = await getNodeDefinitionList();
    nodeDefinitionList.nodes = new Map(Object.entries(nodeDefinitionList.nodes)); // It seems i have to do that?
    return { 
        nodeDefinitionList 
    };
}