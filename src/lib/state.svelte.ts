import { page } from "$app/state";
import type { GraphInstance, NodeDefinitionList } from "./types";
import { type Node, type Edge } from "@xyflow/svelte";

export class FlowContext {
    instance: GraphInstance = $state({});
    nodes: Node[] = $state.raw<Node[]>([]);
    edges: Edge[] = $state.raw<Edge[]>([]);
}

export class GrogState {
    private _flowContextList: FlowContext[] = $state.raw<FlowContext[]>([ new FlowContext() ]);
    private _currentFlowIndex: number = $state(0);

    get nodeDefinitionList(): NodeDefinitionList {
        return page.data.nodeDefinitionList;
    }
    
    get currentFlow(): FlowContext {
        return this._flowContextList[this._currentFlowIndex];
    }

    get currentFlowIndex(): number {
        return this._currentFlowIndex;
    }
}

export const grogState = new GrogState();