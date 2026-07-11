import type { XYPosition } from "@xyflow/svelte";
import { callNative } from "./bridge";
import type { ConnectionCreationData, Identity, NodeDefinitionList, NodeInstance, NodeKey, NodeMove } from "./types";

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

    export function updateNodesPosition(graphId: number, moves: NodeMove[]): Promise<void> {
        return callNative<void>("update_nodes_position", { graphId, moves });
    }

    export function createConnection(graphId: number, sourcePortId: Identity, targetPortId: Identity): Promise<ConnectionCreationData> {
        return callNative<ConnectionCreationData>("create_connection", {
            graphId,
            sourcePortId,
            targetPortId
        });
    }

    export function compileGraph(graphId: number): Promise<void> {
        return callNative<void>("compile_graph", { graphId });
    }
}