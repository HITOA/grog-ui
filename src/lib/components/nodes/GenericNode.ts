import { type Node } from "@xyflow/svelte";
import { type NodeInstance } from "$lib/types";

export type GenericNodeType = Node<{ instance: NodeInstance }, "genericNode">;