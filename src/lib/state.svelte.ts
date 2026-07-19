import type { GraphInstance, NodeDefinitionList } from "./types";
import { type Node, type Edge } from "@xyflow/svelte";

export class FlowContext {
    nodes: Node[] = $state.raw<Node[]>([]);
    edges: Edge[] = $state.raw<Edge[]>([]);
}

export class GrogState {
    private _nodeDefinitionList: NodeDefinitionList = $state.raw({} as NodeDefinitionList);
    private _flowContextList: FlowContext[] = $state.raw<FlowContext[]>([ new FlowContext() ]);
    private _currentFlowIndex: number = $state(0);

    set nodeDefinitionList(value: NodeDefinitionList) {
        this._nodeDefinitionList = value
    }

    get nodeDefinitionList(): NodeDefinitionList {
        return this._nodeDefinitionList;
    }
    
    get currentFlow(): FlowContext {
        return this._flowContextList[this._currentFlowIndex];
    }

    get currentFlowIndex(): number {
        return this._currentFlowIndex;
    }
}

export const grogState = new GrogState();