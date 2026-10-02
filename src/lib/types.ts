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

// A variable a node's UI may read (`[Expose]`) or also write (`[Expose(Write)]`):
// its name in the node's VCL source. Pushed by grog's Serializer::SerializeExposure.
export interface ExposedVariable {
    name: string;
    mode: "read" | "write";
}

// The live value of an exposed variable: a number (or boolean) when it has one
// element, an array otherwise (a Vec, an array...).
export type ExposedValue = number | boolean | (number | boolean)[];

// What `set_input_value` kept: the value (rounded to the input's type), and
// whether the host applies it live (tiering), so that no recompile is needed.
export interface InputValueResult {
    value: Initializer;
    tiered: boolean;
}

// The output guard: a breaker between the graph and the host, which mutes the
// output and resets the graph when it blows up (NaN, Inf, or a peak above the
// ceiling, +12 dBFS by default).
export type OutputGuardState = "armed" | "holding" | "fadingIn" | "latched";

export interface OutputGuardStatus {
    enabled: boolean;
    // The peak above which the output trips, linear (1 is full scale).
    ceiling: number;
    state: OutputGuardState;
}

// The host's `output_guard` event. `tripped`: muted for a moment, the graph
// reset. `latched`: it blew up again right after, muted until re-armed.
// `peak` is linear (1 is full scale), null when a sample wasn't a number.
export interface OutputGuardEvent {
    event: "tripped" | "latched" | "rearmed";
    peak: number | null;
}

// The host's `output_meter` event, `core.meterRate` times a second (15 by default) while audio runs.
// `peak`: each channel's peak since the last one, linear (1 is full scale),
// after the gain and the output guard. `load`: the time the audio thread took
// over the time the audio it rendered lasts (1: all of it), on its one thread.
// `threads`: the machine's hardware threads. `gain`: the output gain, linear.
export interface OutputMeterEvent {
    peak: number[];
    load: number;
    threads: number;
    gain: number;
}

// One value of the host's `exposed_values` event, for the watch `watchId`.
export interface ExposedValueUpdate {
    watchId: number;
    value: ExposedValue;
}

// What `get_exposed` says of a node's exposed variable in the last compile.
export interface ExposedInfo {
    name: string;
    mode: "read" | "write";
    type: string;
    element: string;
    count: number;
    size: number;
    location: "state" | "ui" | "constant";
    writable: boolean;
    connected: boolean;
}

export interface PortInstance {
    identity: Identity;
    displayName: string;
    type: Type;
    state: PortState;
    initializer?: Initializer;
    widget?: Widget;
    exposed?: ExposedVariable;
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
    // The node's state variables its UI may read or write.
    exposedState?: ExposedVariable[];
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
