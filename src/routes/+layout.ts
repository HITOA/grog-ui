export const prerender = true;
export const csr = true;
export const ssr = false;

import type { LayoutLoad } from "./$types";

import { API } from "$lib/api";

export const load: LayoutLoad = async ({}) => {
    let nodeDefinitionList = await API.getNodeDefinitionList();
    return { 
        nodeDefinitionList 
    };
}