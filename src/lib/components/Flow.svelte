<script lang="ts">
    import GenericNode from './nodes/GenericNode.svelte';
    import { grogState } from '../state.svelte';
    import {
        SvelteFlow,
        Controls,
        SelectionMode,
        type NodeTargetEventWithPointer,
        type OnConnect,
        useSvelteFlow,
        type OnMoveEnd,
        type OnMoveStart,
        type OnConnectStart,
        type OnConnectEnd,
        type OnBeforeDelete
    } from '@xyflow/svelte';
    import { createConnection, updateNodesPosition } from '../actions';
    import GenericEdge from './nodes/GenericEdge.svelte';
    import type { Connection, NodeInstance } from '../types';
    import { assertIsGenericEdge, assertIsGenericNode } from '../assertions';
    import { API } from '../api';
    
    const nodeTypes = { genericNode: GenericNode };
    const edgeTypes = { genericEdge: GenericEdge };

    let { updateNodeData } = useSvelteFlow();

    function setNodesWillChange(willChange: string): void {
        const nodes = document.querySelectorAll<HTMLElement>(".svelte-flow__node");
        nodes.forEach((node) => {
            node.style.willChange = willChange;
        });
    }

    const onNodeDragStop: NodeTargetEventWithPointer<MouseEvent | TouchEvent> = ({ nodes }) => {
        updateNodesPosition(nodes)
    }

    const onConnect: OnConnect = (connection) => {
        createConnection(connection, updateNodeData);
    }

    const onConnectStart: OnConnectStart = (event, params) => {
        setNodesWillChange("transform");
    }

    const onConnectEnd: OnConnectEnd = (event, connectionState) => {
        setNodesWillChange("auto");
    }

    const onMoveStart: OnMoveStart = (event, viewport) => {
        setNodesWillChange("transform");
    }

    const onMoveEnd: OnMoveEnd = (event, viewport) => {
        setNodesWillChange("auto");
    }

    const onBeforeDelete: OnBeforeDelete = ({ nodes, edges }) => {
        let nodesInstance: NodeInstance[] = [];
        let connections: Connection[] = [];

        nodes.forEach(node => {
            assertIsGenericNode(node);
            nodesInstance.push(node.data.instance);
        })

        edges.forEach(edge => {
            if (edge.id === undefined || edge.id === null)
                return new Promise<boolean>((res, rej) => res(false));
            let connection: Connection = {
                identity: parseInt(edge.id),
                outNode: parseInt(edge.source),
                outPort: parseInt(edge.sourceHandle ? edge.sourceHandle : "0"),
                inNode: parseInt(edge.target),
                inPort: parseInt(edge.targetHandle ? edge.targetHandle : "0")
            };
            connections.push(connection);
        })

        return API.deleteNodesAndEdges(grogState.currentFlowIndex, nodesInstance, connections);
    }

</script>

<SvelteFlow 
    bind:nodes={ grogState.currentFlow.nodes }
    bind:edges={ grogState.currentFlow.edges }
    nodeTypes={nodeTypes}
    edgeTypes={edgeTypes}
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

    proOptions={{ hideAttribution: true }}

    colorMode="dark"
>
    <Controls />
</SvelteFlow>