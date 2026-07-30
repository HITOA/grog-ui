<script lang="ts">
    import { BaseEdge, getBezierPath, Position, useNodesData, useSvelteFlow, type EdgeProps } from "@xyflow/svelte";
    import type { GenericEdgeType } from "./GenericEdge";
    import { PortStyle } from "./PortStyle";
    import type { GenericNodeType } from "./GenericNode";


    let { id, sourceX, sourceY, targetX, targetY, 
        sourceHandleId, targetHandleId, source, target }: EdgeProps<GenericEdgeType> = $props();

    let [edgePath] = $derived(getBezierPath({ 
        sourceX, 
        sourceY, 
        sourcePosition: Position.Right,
        targetX, 
        targetY,
        targetPosition: Position.Left }));

    let sourceNodeData = $derived(useNodesData(source));
    let targetNodeData = $derived(useNodesData(target));

    function GetPortStyle({ data, id }: GenericNodeType, handleId: string | null | undefined, isInput: boolean): PortStyle | undefined {
        if (handleId == undefined || handleId == null)
            return undefined;

        if (isInput) {
            let port = data.instance.inputs?.find((input) => input.identity.toString() === handleId)
            return PortStyle.getStyle(port);
        } else {
            let port = data.instance.outputs?.find((output) => output.identity.toString() === handleId)
            return PortStyle.getStyle(port);
        }
    }

    let sourcePortStyle = $derived(GetPortStyle(sourceNodeData.current as GenericNodeType, sourceHandleId, false));
    let targetPortStyle = $derived(GetPortStyle(targetNodeData.current as GenericNodeType, targetHandleId, true));

</script>

<defs>
  <linearGradient id="edge-gradient-{id}" gradientUnits="userSpaceOnUse" x1={sourceX} y1={sourceY} x2={targetX} y2={targetY}>
    <stop offset="33%" style="stop-color: var({sourcePortStyle?.color})" />
    <stop offset="66%" style="stop-color: var({targetPortStyle?.color})" />
  </linearGradient>
</defs>
<BaseEdge {id} path={edgePath} style="stroke: url(#edge-gradient-{id})"/>