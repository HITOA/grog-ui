import type { XYPosition } from "@xyflow/svelte";

export type Pair<T1, T2> = {
    first: T1;
    second: T2;
};

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
    IsOutputNode = 1 << 1,
}

export interface NodeDefinition {
    displayName: string;
    flags: NodeDefinitionFlag;
    inputs?: PortDefinition[];
    outputs?: PortDefinition[];
    parameters?: ParameterDefinition[];
}

export type Identity = number;

// A serialized constant value pushed from the native side (see grog's
// Serializer::SerializeConstantValue). Today only numeric, boolean or null
// values are produced — widen this union as more kinds are added.
export type Initializer = number | boolean | null;

export enum PortState {
    None = 0,
    Unresolved = 1,
    Resolved = 2,
}

export interface PortInstance {
    identity: Identity;
    displayName: string;
    type: Type;
    state: PortState;
    initializer?: Initializer;
}

export interface ParameterInstance {
    identity: Identity;
    displayName: string;
    type: Type;
    initializer?: Initializer;
}

export enum NodeInstanceFlag {
    None = 0,
    EditableName = 1,
    Subgraph = 2,
    FeedbackSelection = 4,
}

export interface NodeInstance {
    identity: Identity;
    displayName: string;
    position: XYPosition;
    flags: NodeInstanceFlag;
    inputs?: PortInstance[];
    outputs?: PortInstance[];
    parameters?: ParameterInstance[];
    feedback?: string;
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
    feedbacks: FeedbackEntry[];
}

export interface PresetMetadata {
    name: string;
    description: string;
    author: string;
    tags: string[];
    creation: number;
    lastModified: number;
    filename: string;
}

export type NodeKey = string;

export interface NodeDefinitionList {
    nodes: Record<NodeKey, NodeDefinition>;
}

export interface FeedbackEntry {
    value: string;
    label: string;
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
