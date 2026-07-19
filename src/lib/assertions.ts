import type { Edge, Node } from "@xyflow/svelte";
import type { GenericNodeType } from "./components/nodes/GenericNode";
import type { GenericEdgeType } from "./components/nodes/GenericEdge";

export function assertIsGenericNode(node: Node): asserts node is GenericNodeType {
    if (node.type !== "genericNode")
        throw new Error(`Expected genericNode, got ${node.type} instead.`);
}

export function assertIsGenericEdge(edge: Edge): asserts edge is GenericEdgeType {
    if (edge.type !== "genericEdge")
        throw new Error(`Expected genericEdge, got ${edge.type} instead.`);
}

export function assertIsString(value: any): asserts value is string {
    if (typeof value != "string")
        throw new Error(`Expected string, got ${typeof value} instead.`)
}