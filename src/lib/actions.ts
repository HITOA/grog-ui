import type { NodeInstance, NodeKey } from "./types";
import type { GenericNodeType } from "./components/nodes/GenericNode";
import { API } from "./api"
import { grogState } from "./state.svelte";
import type { XYPosition } from "@xyflow/svelte";


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
        ]
    })
}