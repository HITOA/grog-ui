<script lang="ts">
    import {
        Position,
        useNodeConnections,
        useSvelteFlow,
        useUpdateNodeInternals,
        type NodeProps,
    } from "@xyflow/svelte";
    import { tick } from "svelte";
    import type { GenericNodeType } from "./GenericNode";
    import PortHandle from "./PortHandle.svelte";
    import PortControl from "./PortControl.svelte";
    import { NodeInstanceFlag, PortState } from "../../types";
    import { grogState } from "../../state.svelte";
    import { ContextMenu, Select } from "bits-ui";
    import EditableLabel from "../EditableLabel.svelte";
    import { updateFeedback, updateNodeName } from "../../actions";
    import { assertIsGenericNode } from "../../assertions";

    let { id, data }: NodeProps<GenericNodeType> = $props();

    let { updateNodeData, getNode } = useSvelteFlow();

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

    // Knob rows are shorter than their knobs, so consecutive knobs alternate
    // between a near and a far position to sit side by side instead of overlapping.
    function knobStagger(isKnob: boolean[]): boolean[] {
        const far: boolean[] = [];
        isKnob.forEach((knob, i) => far.push(knob && i > 0 && isKnob[i - 1] && !far[i - 1]));
        return far;
    }

    let inputsKnob: boolean[] = $derived(
        data.instance.inputs?.map((input, index) => inputsControlPresence[index] && input.widget?.kind === "knob") ??
            [],
    );
    let inputsKnobFar = $derived(knobStagger(inputsKnob));

    let parametersKnob: boolean[] = $derived(
        data.instance.parameters?.map(
            (parameter) =>
                (parameter.type.commonName == "Builtin_Numeric" || parameter.type.commonName == "Builtin_Control") &&
                parameter.widget?.kind === "knob",
        ) ?? [],
    );
    let parametersKnobFar = $derived(knobStagger(parametersKnob));

    let editableName: boolean = $state(false);

    let hasPorts = $derived(!!(data.instance.inputs?.length || data.instance.outputs?.length));
    let hasParameters = $derived(!!data.instance.parameters?.length);

    let portsCollapsed: boolean = $state(false);
    let parametersCollapsed: boolean = $state(false);

    const updateNodeInternals = useUpdateNodeInternals();

    // Collapsing moves the handles, so xyflow must re-measure them once the DOM has updated.
    async function toggleSection(section: "ports" | "parameters") {
        if (section == "ports") portsCollapsed = !portsCollapsed;
        else parametersCollapsed = !parametersCollapsed;
        await tick();
        updateNodeInternals(id);
    }

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
        <!-- Header and ports share a grid cell when collapsed, so the hidden handles centre on the header. -->
        <div class="node-top" class:node-ports-collapsed={portsCollapsed}>
            <div class="node-header">
                {#if hasPorts}
                    <button
                        class="node-header-toggle node-ports-toggle nodrag"
                        class:node-header-toggle-off={portsCollapsed}
                        onclick={() => toggleSection("ports")}
                        aria-expanded={!portsCollapsed}
                        aria-label={portsCollapsed ? "Expand ports" : "Collapse ports"}
                        title={portsCollapsed ? "Expand ports" : "Collapse ports"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor"
                            ><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path
                                d="M297.4 438.6C309.9 451.1 330.2 451.1 342.7 438.6L502.7 278.6C515.2 266.1 515.2 245.8 502.7 233.3C490.2 220.8 469.9 220.8 457.4 233.3L320 370.7L182.6 233.4C170.1 220.9 149.8 220.9 137.3 233.4C124.8 245.9 124.8 266.2 137.3 278.7L297.3 438.7z"
                            /></svg
                        >
                    </button>
                {/if}
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
            <!-- Kept mounted while collapsed: the handles must stay in the DOM so edges still attach. -->
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
                        {#if inputsKnob[index]}
                            <div class="knob-cell" class:knob-cell-far={inputsKnobFar[index]}>
                                <PortControl
                                    identity={input.identity}
                                    initializer={input.initializer}
                                    widget={input.widget}
                                    label={input.displayName}
                                />
                            </div>
                        {:else if inputsControlPresence[index]}
                            <PortControl
                                identity={input.identity}
                                initializer={input.initializer}
                                widget={input.widget}
                                label={input.displayName}
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
        </div>
        {#if hasParameters}
            <div class="node-parameters-section" class:node-parameters-collapsed={parametersCollapsed}>
                <button
                    class="node-parameters-toggle nodrag"
                    onclick={() => toggleSection("parameters")}
                    aria-expanded={!parametersCollapsed}
                    aria-label={parametersCollapsed ? "Expand parameters" : "Collapse parameters"}
                    title={parametersCollapsed ? "Expand parameters" : "Collapse parameters"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor"
                        ><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path
                            d="M297.4 438.6C309.9 451.1 330.2 451.1 342.7 438.6L502.7 278.6C515.2 266.1 515.2 245.8 502.7 233.3C490.2 220.8 469.9 220.8 457.4 233.3L320 370.7L182.6 233.4C170.1 220.9 149.8 220.9 137.3 233.4C124.8 245.9 124.8 266.2 137.3 278.7L297.3 438.7z"
                        /></svg
                    >
                </button>
                {#if !parametersCollapsed}
                    <div class="node-footer">
                        {#each data.instance.parameters as parameter, index (parameter.identity)}
                            <span class="port-label">{parameter.displayName}</span>
                            {#if parametersKnob[index]}
                                <div class="knob-cell" class:knob-cell-far={parametersKnobFar[index]}>
                                    <PortControl
                                        identity={parameter.identity}
                                        initializer={parameter.initializer}
                                        widget={parameter.widget}
                                        label={parameter.displayName}
                                    />
                                </div>
                            {:else if parameter.type.commonName == "Builtin_Numeric" || parameter.type.commonName == "Builtin_Control"}
                                <PortControl
                                    identity={parameter.identity}
                                    initializer={parameter.initializer}
                                    widget={parameter.widget}
                                    label={parameter.displayName}
                                />
                            {/if}
                        {/each}
                    </div>
                {/if}
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
