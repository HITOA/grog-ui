<script lang="ts">
    import { Position, useNodeConnections, useSvelteFlow, type NodeProps } from "@xyflow/svelte";
    import type { GenericNodeType } from "./GenericNode";
    import PortHandle from "./PortHandle.svelte";
    import { NodeInstanceFlag, PortState } from "../../types";
    import type { ChangeEventHandler } from "svelte/elements";
    import { grogState } from "../../state.svelte";
    import { ContextMenu, Select } from "bits-ui";
    import EditableLabel from "../EditableLabel.svelte";
    import { updateFeedback, updateInitializer, updateNodeName } from "../../actions";
    import { assertIsGenericNode } from "../../assertions";

    let { id, data }: NodeProps<GenericNodeType> = $props();

    let { updateNodeData, getNode } = useSvelteFlow();

    const onInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
        updateInitializer(parseInt(event.currentTarget.id), parseFloat(event.currentTarget.value)).then((result) => {
            event.currentTarget.value = String(result ?? "");
        });
    };

    function onNameEdit(value: string) {
        let node = getNode(id);
        if (node == undefined) return;
        assertIsGenericNode(node);
        updateNodeName(node, value, updateNodeData);
    }

    let connectionsByInput = $derived(
        data.instance.inputs?.map((input) =>
            useNodeConnections({ handleType: "target", handleId: input.identity.toString() }),
        ) ?? [],
    );

    let inputsControlPresence: boolean[] = $derived(
        data.instance.inputs?.map((input, index) => {
            return (
                (input.type.commonName == "Builtin_Numeric" || input.type.commonName == "Builtin_Control") &&
                input.state == PortState.Resolved &&
                input.initializer != undefined &&
                connectionsByInput[index].current.length <= 0
            );
        }) ?? [],
    );

    let editableName: boolean = $state(false);

    function getFeedbackValue(): string {
        return data.instance.feedback ?? "";
    }

    function setFeedbackValue(feedback: string): void {
        let node = getNode(id);
        if (node == undefined) return;
        assertIsGenericNode(node);
        updateFeedback(node, parseInt(feedback), updateNodeData);
    }
</script>

<ContextMenu.Root>
    <ContextMenu.Trigger class="node-frame">
        <div class="node-header">
            {#if data.instance.flags & NodeInstanceFlag.EditableName}
                <EditableLabel
                    bind:editable={editableName}
                    class="node-name-label"
                    onedit={onNameEdit}
                    value={data.instance.displayName}
                />
            {:else if data.instance.flags & NodeInstanceFlag.FeedbackSelection}
                <Select.Root
                    type="single"
                    bind:value={getFeedbackValue, setFeedbackValue}
                    items={grogState.currentFlow.feedbacks}
                >
                    <Select.Trigger class="node-feedback-selector">
                        <Select.Value placeholder="select feedback..." />
                    </Select.Trigger>
                    <Select.Portal>
                        <Select.Content class="context-menu-frame" style="z-index: 2;" sideOffset={10}>
                            <Select.Viewport>
                                {#each grogState.currentFlow.feedbacks as entry (entry.value)}
                                    <Select.Item class="context-menu-item" value={entry.value} label={entry.label}>
                                        {entry.label}
                                    </Select.Item>
                                {/each}
                            </Select.Viewport>
                        </Select.Content>
                    </Select.Portal>
                </Select.Root>
            {:else}
                <h1 class="node-name-label">{data.instance.displayName}</h1>
            {/if}
        </div>
        <div class="node-content">
            <div class="node-inputs">
                {#each data.instance.inputs as input, index (input.identity)}
                    <PortHandle
                        type="target"
                        position={Position.Left}
                        id={input.identity.toString()}
                        instance={input}
                    />
                    <span class="port-label">{input.displayName}</span>
                    {#if inputsControlPresence[index]}
                        <input
                            id={input.identity.toString()}
                            type="number"
                            class="port-control nodrag"
                            value={input.initializer}
                            onchange={onInputChange}
                        />
                    {:else}
                        <div></div>
                    {/if}
                {/each}
            </div>
            <div class="node-outputs">
                {#each data.instance.outputs as output (output.identity)}
                    <div class="node-row">
                        <span class="port-label">{output.displayName}</span>
                        <PortHandle
                            type="source"
                            position={Position.Right}
                            id={output.identity.toString()}
                            instance={output}
                        />
                    </div>
                {/each}
            </div>
        </div>
        {#if data.instance.parameters?.length}
            <div class="node-footer">
                {#each data.instance.parameters as parameter (parameter.identity)}
                    <span class="port-label">{parameter.displayName}</span>
                    {#if parameter.type.commonName == "Builtin_Numeric" || parameter.type.commonName == "Builtin_Control"}
                        <input
                            id={parameter.identity.toString()}
                            type="number"
                            class="port-control nodrag"
                            value={parameter.initializer}
                            onchange={onInputChange}
                        />
                    {/if}
                {/each}
            </div>
        {/if}
    </ContextMenu.Trigger>
    <ContextMenu.Portal>
        <ContextMenu.Content
            class="context-menu-frame"
            style="z-index: 2;"
            onCloseAutoFocus={(e) => e.preventDefault()}
        >
            {#if data.instance.flags & NodeInstanceFlag.EditableName}
                <ContextMenu.Item class="context-menu-item" onclick={() => (editableName = true)}>
                    Rename
                </ContextMenu.Item>
            {/if}
            <ContextMenu.Item class="context-menu-item">Delete</ContextMenu.Item>
        </ContextMenu.Content>
    </ContextMenu.Portal>
</ContextMenu.Root>
