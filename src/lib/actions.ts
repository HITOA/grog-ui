import type {
    GraphInstance,
    Identity,
    NodeInstance,
    NodeKey,
    NodeMove,
    Connection as GrogConnection,
    FeedbackEntry,
} from "./types";
import type { GenericNodeType } from "./components/nodes/GenericNode";
import * as API from "./api";
import { FlowContext, grogState, ViewType } from "./state.svelte";
import { type Connection, type Edge, type Node, type XYPosition } from "@xyflow/svelte";
import { assertIsGenericNode, assertIsString } from "./assertions";
import type { GenericEdgeType } from "./components/nodes/GenericEdge";

export function onUpdateGraphs(instances: GraphInstance[]): void {
    const flowContexts: FlowContext[] = [];

    instances.forEach((instance) => {
        const flowContext = new FlowContext();

        const nodes: Node[] = [];
        const edges: Edge[] = [];

        instance.nodes.forEach((instance) => {
            const node: GenericNodeType = {
                id: instance.identity.toString(),
                type: "genericNode",
                data: {
                    instance: instance,
                },
                position: {
                    x: instance.position.x,
                    y: instance.position.y,
                },
            };
            nodes.push(node);
        });

        instance.connections.forEach((connection) => {
            const edge: GenericEdgeType = {
                id: connection.identity.toString(),
                type: "genericEdge",
                source: connection.outNode.toString(),
                sourceHandle: connection.outPort.toString(),
                target: connection.inNode.toString(),
                targetHandle: connection.inPort.toString(),
            };
            edges.push(edge);
        });

        flowContext.name = instance.name;
        flowContext.nodes = nodes;
        flowContext.edges = edges;
        flowContext.feedbacks = instance.feedbacks;

        flowContexts.push(flowContext);
    });

    grogState.flowContexts = flowContexts;
    if (grogState.currentFlowIndex >= flowContexts.length) grogState.currentFlowIndex = 0;
}

export function onUpdateGraph(instance: GraphInstance): void {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    instance.nodes.forEach((instance) => {
        const node: GenericNodeType = {
            id: instance.identity.toString(),
            type: "genericNode",
            data: {
                instance: instance,
            },
            position: {
                x: instance.position.x,
                y: instance.position.y,
            },
        };
        nodes.push(node);
    });

    instance.connections.forEach((connection) => {
        const edge: GenericEdgeType = {
            id: connection.identity.toString(),
            type: "genericEdge",
            source: connection.outNode.toString(),
            sourceHandle: connection.outPort.toString(),
            target: connection.inNode.toString(),
            targetHandle: connection.inPort.toString(),
        };
        edges.push(edge);
    });

    grogState.currentFlow.name = instance.name;
    grogState.currentFlow.nodes = nodes;
    grogState.currentFlow.edges = edges;
    grogState.currentFlow.feedbacks = instance.feedbacks;
}

export function onUpdateFeedbackList(feedbacks: FeedbackEntry[]) {
    grogState.currentFlow.feedbacks = feedbacks;
}

export function updateGraphInstances(): void {
    API.getGraphInstances().then(onUpdateGraphs);
}

export function updateGraphInstance(): void {
    API.getGraphInstance(grogState.currentFlowIndex).then(onUpdateGraph);
}

export function createGraphInstance(): void {
    API.createGraphInstance().then((instance: GraphInstance) => {
        const flowContext = new FlowContext();

        const nodes: Node[] = [];
        const edges: Edge[] = [];

        instance.nodes.forEach((instance) => {
            const node: GenericNodeType = {
                id: instance.identity.toString(),
                type: "genericNode",
                data: {
                    instance: instance,
                },
                position: {
                    x: instance.position.x,
                    y: instance.position.y,
                },
            };
            nodes.push(node);
        });

        instance.connections.forEach((connection) => {
            const edge: GenericEdgeType = {
                id: connection.identity.toString(),
                type: "genericEdge",
                source: connection.outNode.toString(),
                sourceHandle: connection.outPort.toString(),
                target: connection.inNode.toString(),
                targetHandle: connection.inPort.toString(),
            };
            edges.push(edge);
        });

        flowContext.name = instance.name;
        flowContext.nodes = nodes;
        flowContext.edges = edges;
        grogState.flowContexts = grogState.flowContexts.concat(flowContext);
        grogState.currentFlowIndex = grogState.flowContexts.length - 1;
    });
}

export function deleteGraphInstance(graphId: number): void {
    API.deleteGraphInstance(graphId).then((r) => {
        if (r) {
            if (graphId == grogState.currentFlowIndex) grogState.currentFlowIndex = 0;
            else if (graphId < grogState.currentFlowIndex) grogState.currentFlowIndex = grogState.currentFlowIndex - 1;
            const flowContexts = grogState.flowContexts;
            flowContexts.splice(graphId, 1);
            grogState.flowContexts = [];
            grogState.flowContexts = flowContexts;
        }
    });
}

export function instantiateNode(nodeKey: NodeKey, position: XYPosition): void {
    API.instantiateNode(grogState.currentFlowIndex, nodeKey, position).then((instance: NodeInstance) => {
        const node: GenericNodeType = {
            id: instance.identity.toString(),
            type: "genericNode",
            data: {
                instance: instance,
            },
            position: {
                x: instance.position.x,
                y: instance.position.y,
            },
        };

        grogState.currentFlow.nodes = [...grogState.currentFlow.nodes, node];
    });
}

export function instantiateSubgraph(subgraphId: number, position: XYPosition): void {
    API.instantiateSubgraph(grogState.currentFlowIndex, subgraphId, position).then((instance: NodeInstance) => {
        const node: GenericNodeType = {
            id: instance.identity.toString(),
            type: "genericNode",
            data: {
                instance: instance,
            },
            position: {
                x: instance.position.x,
                y: instance.position.y,
            },
        };

        grogState.currentFlow.nodes = [...grogState.currentFlow.nodes, node];
    });
}

export function updateGraphName(graphId: number, name: string): void {
    API.updateGraphName(graphId, name).then((r) => {
        if (r) {
            grogState.flowContexts[graphId].name = name;
        }
    });
}

export function updateNodeName(
    node: GenericNodeType,
    name: string,
    updateNodeData: (id: string, dataUpdate: Partial<GenericNodeType["data"]>) => void,
): void {
    API.updateNodeName(grogState.currentFlowIndex, node.data.instance.identity, name).then((r) => {
        if (r) {
            node.data.instance.displayName = name;
            updateNodeData(node.data.instance.identity.toString(), node.data);
        }
    });
}

export function updateFeedback(
    node: GenericNodeType,
    feedback: Identity,
    updateNodeData: (id: string, dataUpdate: Partial<GenericNodeType["data"]>) => void,
): void {
    API.updateFeedback(grogState.currentFlowIndex, node.data.instance.identity, feedback).then((r) => {
        node.data.instance = r;
        updateNodeData(node.data.instance.identity.toString(), node.data);
    });
}

export function updateNodesPosition(nodes: Node[]): void {
    const moves: NodeMove[] = nodes.map((node) => {
        assertIsGenericNode(node);
        return {
            identity: node.data.instance.identity,
            position: node.position,
        };
    });

    API.updateNodesPosition(grogState.currentFlowIndex, moves).then(() => {
        nodes.forEach((node) => {
            assertIsGenericNode(node);
            node.data.instance.position = node.position;
        });
    });
}

export function createConnection(
    connection: Connection,
    updateNodeData: (id: string, dataUpdate: Partial<GenericNodeType["data"]>) => void,
): void {
    assertIsString(connection.sourceHandle);
    assertIsString(connection.targetHandle);
    const sourcePortId: Identity = parseInt(connection.sourceHandle);
    const targetPortId: Identity = parseInt(connection.targetHandle);

    API.createConnection(grogState.currentFlowIndex, sourcePortId, targetPortId).then((data) => {
        if (data.isValid) {
            grogState.currentFlow.edges.forEach((edge) => {
                if (
                    edge.source == connection.source &&
                    edge.sourceHandle == connection.sourceHandle &&
                    edge.target == connection.target &&
                    edge.targetHandle == connection.targetHandle
                ) {
                    edge.id = data.identity.toString();
                }
            });
            data.dirtyNodes?.forEach((instance) => {
                updateNodeData(instance.identity.toString(), {
                    instance: instance,
                });
            });
        } else {
            const edgesWithoutConnection = grogState.currentFlow.edges.filter((edge) => {
                assertIsString(edge.sourceHandle);
                assertIsString(edge.targetHandle);
                return connection.sourceHandle !== edge.sourceHandle || connection.targetHandle !== edge.targetHandle;
            });
            grogState.currentFlow.edges = edgesWithoutConnection;
        }
    });
}

export function deleteNodesAndEdges(
    nodesInstance: NodeInstance[],
    connections: GrogConnection[],
    updateNodeData: (id: string, dataUpdate: Partial<GenericNodeType["data"]>) => void,
): Promise<boolean> {
    return new Promise((res, rej) => {
        API.deleteNodesAndEdges(grogState.currentFlowIndex, nodesInstance, connections)
            .then((dirtyNodes) => {
                dirtyNodes.forEach((instance) => {
                    updateNodeData(instance.identity.toString(), {
                        instance: instance,
                    });
                });
                res(true);
            })
            .catch(() => rej());
    });
}

export function compileGraph() {
    API.compileGraph(0).then(() => {});
}

export function dumpGraphIR() {
    API.dumpGraphIR(0).then(() => {});
}

export function updatePresetList() {
    API.getPresetList().then((presets) => {
        grogState.presetList = presets;
    });
}

export function updateCurrentPreset() {
    API.getCurrentPresetMetadata().then((metadata) => {
        grogState.currentPreset = metadata;
    });
}

export function loadPreset(filename: string) {
    API.loadPreset(filename).then((success) => {
        // The host reconciles the graphs via pushed events; just return to the
        // flow view once the preset was accepted, and refresh the current preset.
        if (success) {
            grogState.view = ViewType.Flow;
            updateCurrentPreset();
        }
    });
}
