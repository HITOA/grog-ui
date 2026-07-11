import { type Node } from "@xyflow/svelte";
import { type NodeInstance } from "../../types";

export type GenericNodeType = Node<{ instance: NodeInstance }, "genericNode">;