import type { ConsoleMessage, FeedbackEntry, NodeDefinitionList, PresetMetadata } from "./types";
import { type Node, type Edge } from "@xyflow/svelte";

export enum ViewType {
    Flow,
    PresetBrowser,
    PresetEditor,
}

export class FlowContext {
    name: string = $state("Default");
    nodes: Node[] = $state.raw<Node[]>([]);
    edges: Edge[] = $state.raw<Edge[]>([]);
    nameEditable: boolean = $state(false);
    feedbacks: FeedbackEntry[] = $state([]);
}

export class GrogState {
    view: ViewType = $state(ViewType.Flow);

    // Whether the (modal) preferences window is open.
    preferencesOpen: boolean = $state(false);

    // Whether the console window is open.
    consoleOpen: boolean = $state(false);

    // Backlog of console messages pushed from the host, oldest first.
    consoleMessages: ConsoleMessage[] = $state<ConsoleMessage[]>([]);

    private _nodeDefinitionList: NodeDefinitionList = $state.raw({} as NodeDefinitionList);
    private _presetList: PresetMetadata[] = $state.raw([]);
    private _currentPreset: PresetMetadata | undefined = $state.raw(undefined);

    private _flowContextList: FlowContext[] = $state.raw<FlowContext[]>([new FlowContext()]);
    private _currentFlowIndex: number = $state(0);

    set nodeDefinitionList(value: NodeDefinitionList) {
        this._nodeDefinitionList = value;
    }

    get nodeDefinitionList(): NodeDefinitionList {
        return this._nodeDefinitionList;
    }

    set presetList(value: PresetMetadata[]) {
        this._presetList = value;
    }

    get presetList(): PresetMetadata[] {
        return this._presetList;
    }

    set currentPreset(value: PresetMetadata | undefined) {
        this._currentPreset = value;
    }

    get currentPreset(): PresetMetadata | undefined {
        return this._currentPreset;
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
