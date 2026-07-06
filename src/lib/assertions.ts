import type { Node } from "@xyflow/svelte";
import type { GenericNodeType } from "./components/nodes/GenericNode";

export function assertIsGenericNode(node: Node): asserts node is GenericNodeType {
    if (node.type !== "genericNode")
        throw new Error(`Expected genericNode, got ${node.type} instead.`);
}

export function assertIsString(value: any): asserts value is string {
    if (typeof value != "string")
        throw new Error(`Expected string, got ${typeof value} instead.`)
}