import type { XYPosition } from "@xyflow/svelte";
import { callNative } from "./bridge";
import type { Connection, ConnectionCreationData, GraphInstance, Identity, NodeDefinitionList, NodeInstance, NodeKey, NodeMove } from "./types";

export namespace API {
    export function getNodeDefinitionList(): Promise<NodeDefinitionList> {
        return callNative<NodeDefinitionList>("get_node_definition_list");
    }

    export function getGraphInstance(graphId: number): Promise<GraphInstance> {
        return callNative<GraphInstance>("get_graph_instance", { graphId });
    }

    export function instantiateNode(graphId: number, nodeKey: NodeKey, position: XYPosition): Promise<NodeInstance> {
        return callNative<NodeInstance>("instantiate_node", {
            graphId,
            nodeKey,
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

    export function deleteNodesAndEdges(graphId: number, nodes: NodeInstance[], connections: Connection[]): Promise<boolean> {
        return callNative<boolean>("delete_nodes_and_edges", {
            graphId,
            nodes,
            connections
        });
    }

    export function updateInitializer(graphId: number, initializerId: Identity, initializer: any) {
        return callNative<any>("update_initializer", {
            graphId,
            initializerId,
            initializer
        });
    }
}