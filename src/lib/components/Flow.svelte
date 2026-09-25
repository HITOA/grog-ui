<script lang="ts">
    import GenericNode from "./nodes/GenericNode.svelte";
    import { grogState } from "../state.svelte";
    import {
        SvelteFlow,
        SelectionMode,
        type NodeTargetEventWithPointer,
        type OnConnect,
        useSvelteFlow,
        type OnMoveEnd,
        type OnMoveStart,
        type OnConnectStart,
        type OnConnectEnd,
        type OnBeforeDelete,
        type XYPosition,
        MiniMap,
    } from "@xyflow/svelte";
    import { createConnection, deleteNodesAndEdges, instantiateSubgraph, updateNodesPosition } from "../actions";
    import GenericEdge from "./nodes/GenericEdge.svelte";
    import type { Connection, NodeInstance } from "../types";
    import { assertIsGenericNode } from "../assertions";
    import GenericBackground from "./GenericBackground.svelte";

    const nodeTypes = { genericNode: GenericNode };
    const edgeTypes = { genericEdge: GenericEdge };

    let { updateNodeData, screenToFlowPosition } = useSvelteFlow();

    function setNodesWillChange(willChange: string): void {
        const nodes = document.querySelectorAll<HTMLElement>(".svelte-flow__node");
        nodes.forEach((node) => {
            node.style.willChange = willChange;
        });
    }

    const onNodeDragStop: NodeTargetEventWithPointer<MouseEvent | TouchEvent> = ({ nodes }) => {
        updateNodesPosition(nodes);
    };

    const onConnect: OnConnect = (connection) => {
        createConnection(connection, updateNodeData);
    };

    const onConnectStart: OnConnectStart = () => {
        setNodesWillChange("transform");
    };

    const onConnectEnd: OnConnectEnd = () => {
        setNodesWillChange("auto");
    };

    const onMoveStart: OnMoveStart = () => {
        setNodesWillChange("transform");
    };

    const onMoveEnd: OnMoveEnd = () => {
        setNodesWillChange("auto");
    };

    const onBeforeDelete: OnBeforeDelete = ({ nodes, edges }) => {
        let nodesInstance: NodeInstance[] = [];
        let connections: Connection[] = [];

        nodes.forEach((node) => {
            assertIsGenericNode(node);
            nodesInstance.push(node.data.instance);
        });

        edges.forEach((edge) => {
            if (edge.id === undefined || edge.id === null) return new Promise<boolean>((res) => res(false));
            let connection: Connection = {
                identity: parseInt(edge.id),
                outNode: parseInt(edge.source),
                outPort: parseInt(edge.sourceHandle ? edge.sourceHandle : "0"),
                inNode: parseInt(edge.target),
                inPort: parseInt(edge.targetHandle ? edge.targetHandle : "0"),
            };
            connections.push(connection);
        });

        return deleteNodesAndEdges(nodesInstance, connections, updateNodeData);
    };

    const onDragOver = (event: DragEvent) => {
        event.preventDefault();
    };

    const OnDrop = (event: DragEvent) => {
        event.preventDefault();

        let subgraphId = event.dataTransfer?.getData("subgraphId");
        let position: XYPosition = { x: event.clientX, y: event.clientY };
        position = screenToFlowPosition(position);

        if (subgraphId) instantiateSubgraph(parseInt(subgraphId), position);
    };
</script>

<SvelteFlow
    bind:nodes={grogState.currentFlow.nodes}
    bind:edges={grogState.currentFlow.edges}
    {nodeTypes}
    {edgeTypes}
    defaultEdgeOptions={{ type: "genericEdge" }}
    selectionOnDrag
    panOnDrag={[1]}
    selectionMode={SelectionMode.Partial}
    onlyRenderVisibleElements={false}
    elevateEdgesOnSelect={false}
    deleteKey={["Backspace", "Delete"]}
    onconnectstart={onConnectStart}
    onconnectend={onConnectEnd}
    onnodedragstop={onNodeDragStop}
    onconnect={onConnect}
    onbeforedelete={onBeforeDelete}
    onmovestart={onMoveStart}
    onmoveend={onMoveEnd}
    ondragover={onDragOver}
    ondrop={OnDrop}
    proOptions={{ hideAttribution: true }}
    colorMode="dark"
    minZoom={0.5}
    maxZoom={2.0}
>
    <GenericBackground />
</SvelteFlow>
