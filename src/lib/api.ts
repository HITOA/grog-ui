import { callNative } from "./bridge";

export interface VarDefinition {
    typeHash: number;
    name: string;
}

export interface PortDefinition {
    varDef: VarDefinition;
    displayName: string;
}

export interface ParameterDefinition {
    varDef: VarDefinition;
    displayName: string;
}

export enum NodeDefinitionFlag {
    None = 0,
    IsInputNode = 1 << 0,
    IsOutputNode = 1 << 1
}

export interface NodeDefinition {
    displayName: string;
    flags: NodeDefinitionFlag;
    inputs?: Array<PortDefinition>;
    outputs?: Array<PortDefinition>;
    parameters?: Array<ParameterDefinition>;
}

export type NodeKey = string;

export interface NodeDefinitionList {
    nodes: Map<NodeKey, NodeDefinition>;
}

export function getNodeDefinitionList(): Promise<NodeDefinitionList> {
    return callNative<NodeDefinitionList>("get_node_definition_list");
}