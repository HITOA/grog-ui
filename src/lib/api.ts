import type { XYPosition } from "@xyflow/svelte";
import { callNative } from "./bridge";
import type { NodeDefinitionList, NodeInstance, NodeKey } from "./types";

export namespace API {
    export function getNodeDefinitionList(): Promise<NodeDefinitionList> {
        return callNative<NodeDefinitionList>("get_node_definition_list");
    }

    export function instantiateNode(graphId: number, nodeKey: NodeKey, position: XYPosition): Promise<NodeInstance> {
        return callNative<NodeInstance>("instantiate_node", {
            graphId: graphId,
            nodeKey: nodeKey,
            x: position.x,
            y: position.y
        });
    }
}