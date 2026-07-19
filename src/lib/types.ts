import type { XYPosition } from "@xyflow/svelte";

export type Pair<T1, T2> = {
    first: T1;
    second: T2;
}

export interface Type {
    typeHash: number;
    commonName: string;
}

export interface VarDefinition {
    type: Type;
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
    inputs?: PortDefinition[];
    outputs?: PortDefinition[];
    parameters?: ParameterDefinition[];
}

export type Identity = number;

export enum PortState {
    None = 0,
    Unresolved = 1,
    Resolved = 2
}

export interface PortInstance {
    identity: Identity;
    displayName: string;
    type: Type;
    state: PortState;
    initializer?: any;
}

export interface ParameterInstance {
    identity: Identity;
    displayName: string;
    type: Type;
    initializer?: any;
}

export interface NodeInstance {
    identity: Identity;
    displayName: string;
    position: XYPosition;
    inputs?: PortInstance[];
    outputs?: PortInstance[];
    parameters?: ParameterInstance[];
}

export interface Connection {
    identity: Identity;
    outNode: Identity;
    outPort: Identity;
    inNode: Identity;
    inPort: Identity;
}

export interface GraphInstance {
    name: string;
    nodes: NodeInstance[];
    connections: Connection[];
}

export type NodeKey = string;

export interface NodeDefinitionList {
    nodes: Record<NodeKey, NodeDefinition>;
}

export interface NodeMove {
    identity: Identity;
    position: XYPosition;
}

export interface ConnectionCreationData {
    isValid: boolean;
    identity: Identity;
    dirtyNodes?: NodeInstance[];
}