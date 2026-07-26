import type { GraphInstance, NodeDefinitionList } from "./types";
import { type Node, type Edge } from "@xyflow/svelte";

export enum ViewType {
    Flow,
    PresetBrowser,
    PresetEditor
}

export class FlowContext {
    name: string = $state("Default");
    nodes: Node[] = $state.raw<Node[]>([]);
    edges: Edge[] = $state.raw<Edge[]>([]);
}

export class GrogState {
    view: ViewType = $state(ViewType.Flow);
    
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

    get flowContexts(): FlowContext[] {
        return this._flowContextList;
    }

    set flowContexts(flows: FlowContext[]) {
        this._flowContextList = flows;
    }

    set currentFlowIndex(value: number) {
        this._currentFlowIndex = value;
    }
}

export const grogState = new GrogState();