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

// How the node draws the control of an input or parameter, from a UI attribute
// on its VCL declaration (`[Knob(min, max, "unit", Log)]`). Pushed by grog's
// Serializer::SerializeWidget; absent means the default number box.
export interface KnobWidget {
    kind: "knob";
    min: number;
    max: number;
    unit?: string;
    scale: KnobScale;
    // The declaration's initializer, which a double-click resets to.
    defaultValue?: number | boolean;
}

export type Widget = KnobWidget;

export interface PortDefinition {
    varDef: VarDefinition;
    displayName: string;
    widget?: Widget;
}

export interface ParameterDefinition {
    varDef: VarDefinition;
    displayName: string;
    widget?: Widget;
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
    widget?: Widget;
}

export interface ParameterInstance {
    identity: Identity;
    displayName: string;
    type: Type;
    initializer?: Initializer;
    widget?: Widget;
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
    version?: number;
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

// Mirrors Grog::Message::MessageSeverity native-side. The host serializes the
// severity as its integer value.
export enum MessageSeverity {
    None = 0,
    Error = 1,
    Warning = 2,
    Info = 3,
    Debug = 4,
}

export interface ConsoleMessage {
    severity: MessageSeverity;
    message: string;
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

// How the compiler shares generated code between node instances. Persisted as
// its string value in the native config tree.
export enum CodeSharing {
    PerVariant = "PerVariant",
    PerInstance = "PerInstance",
}

// How a Knob maps its rotation onto [min, max]. "log" gives each decade the
// same travel (frequencies, gains); it needs min and max > 0, otherwise the
// knob falls back to "linear".
export type KnobScale = "linear" | "log";
