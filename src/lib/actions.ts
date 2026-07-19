import type { GraphInstance, Identity, NodeInstance, NodeKey, NodeMove } from "./types";
import type { GenericNodeType } from "./components/nodes/GenericNode";
import { API } from "./api"
import { grogState } from "./state.svelte";
import { type Connection, type Edge, type Node, type XYPosition } from "@xyflow/svelte";
import { assertIsGenericNode, assertIsString } from "./assertions";
import type { GenericEdgeType } from "./components/nodes/GenericEdge";


export function updateGraphInstance() {
    API.getGraphInstance(grogState.currentFlowIndex).then((instance: GraphInstance) => {
        let nodes: Node[] = []
        let edges: Edge[] = []

        instance.nodes.forEach(instance => {
            let node: GenericNodeType = {
                id: instance.identity.toString(),
                type: "genericNode",
                data: {
                    instance: instance
                },
                position: {
                    x: instance.position.x,
                    y: instance.position.y
                }
            };
            nodes.push(node);
        });

        instance.connections.forEach(connection => {
            let edge: GenericEdgeType = {
                id: connection.identity.toString(),
                type: "genericEdge",
                source: connection.outNode.toString(),
                sourceHandle: connection.outPort.toString(),
                target: connection.inNode.toString(),
                targetHandle: connection.inPort.toString()
            };
            edges.push(edge);
        });

        grogState.currentFlow.nodes = nodes;
        grogState.currentFlow.edges = edges;
    });
}

export function instantiateNode(nodeKey: NodeKey, position: XYPosition): void {
    API.instantiateNode(grogState.currentFlowIndex, nodeKey, position).then((instance: NodeInstance) => {
        let node: GenericNodeType = {
            id: instance.identity.toString(),
            type: "genericNode",
            data: {
                instance: instance
            },
            position: {
                x: instance.position.x,
                y: instance.position.y
            }
        };

        grogState.currentFlow.nodes = [
            ...grogState.currentFlow.nodes,
            node
        ];
    });
}

export function updateNodesPosition(nodes: Node[]): void {
    const moves: NodeMove[] = nodes.map(node => {
        assertIsGenericNode(node);
        return {
            identity: node.data.instance.identity,
            position: node.position
        };
    });

    API.updateNodesPosition(grogState.currentFlowIndex, moves).then(() => {
        nodes.forEach(node => {
            assertIsGenericNode(node);
            node.data.instance.position = node.position;
        })
    });
}

export function createConnection(connection: Connection, 
        updateNodeData: (id: string, dataUpdate: Partial<GenericNodeType["data"]>) => void): void {
    assertIsString(connection.sourceHandle);
    assertIsString(connection.targetHandle);
    let sourcePortId: Identity = parseInt(connection.sourceHandle);
    let targetPortId: Identity = parseInt(connection.targetHandle);

    API.createConnection(grogState.currentFlowIndex, sourcePortId, targetPortId).then((data) => {
        if (data.isValid) {
            grogState.currentFlow.edges.forEach(edge => {
                if (edge.source == connection.source &&
                    edge.sourceHandle == connection.sourceHandle &&
                    edge.target == connection.target &&
                    edge.targetHandle == connection.targetHandle) {
                        edge.id = data.identity.toString();
                }

            });
            data.dirtyNodes?.forEach((instance) => {
                updateNodeData(instance.identity.toString(), {
                    instance: instance
                });
            });
        } else {
            let edgesWithoutConnection = grogState.currentFlow.edges.filter((edge) => {
                assertIsString(edge.sourceHandle);
                assertIsString(edge.targetHandle);
                return connection.sourceHandle !== edge.sourceHandle || connection.targetHandle !== edge.targetHandle;
            })
            grogState.currentFlow.edges = edgesWithoutConnection;
        }
    });
}

export function compileCurrentGraph() {
    API.compileGraph(grogState.currentFlowIndex).then(() => {});
}