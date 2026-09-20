<script lang="ts">
    import { ContextMenu } from "bits-ui";
    import { createGraphInstance, deleteGraphInstance, updateGraphInstance, updateGraphName } from "../actions";
    import { grogState } from "../state.svelte";
    import EditableLabel from "./EditableLabel.svelte";

    function onAddGraph() {
        createGraphInstance();
    }

    function onChangeGraph(idx: number) {
        grogState.currentFlowIndex = idx;
        updateGraphInstance();
    }

    function onGraphNameEdit(idx: number, name: string) {
        updateGraphName(idx, name);
    }

    const onDragStart = (graphId: number, event: DragEvent) => {
        event.dataTransfer?.setData("subgraphId", graphId.toString());
    };
</script>

<div class="tab" style="z-index: 1;">
    <div class="tab-item-bg">
        {#each grogState.flowContexts as flow, index (flow)}
            <ContextMenu.Root>
                <ContextMenu.Trigger
                    data-tab-selected={index == grogState.currentFlowIndex}
                    class="tab-item"
                    draggable={index > 0 && index != grogState.currentFlowIndex}
                    ondragstart={(ev) => onDragStart(index, ev)}
                    role="document"
                >
                    <button class="tab-item-button" onclick={() => onChangeGraph(index)}>
                        {#if index == 0}
                            <svg class="tab-item-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"
                                ><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path
                                    d="M64 144C64 117.5 85.5 96 112 96L208 96C234.5 96 256 117.5 256 144L256 160L384 160L384 144C384 117.5 405.5 96 432 96L528 96C554.5 96 576 117.5 576 144L576 240C576 266.5 554.5 288 528 288L432 288C405.5 288 384 266.5 384 240L384 224L256 224L256 240C256 247.3 254.3 254.3 251.4 260.5L320 352L400 352C426.5 352 448 373.5 448 400L448 496C448 522.5 426.5 544 400 544L304 544C277.5 544 256 522.5 256 496L256 400C256 392.7 257.7 385.7 260.6 379.5L192 288L112 288C85.5 288 64 266.5 64 240L64 144z"
                                /></svg
                            >
                        {:else}
                            <svg class="tab-item-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"
                                ><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path
                                    d="M112 288L112 448C112 456.8 119.2 464 128 464L512 464C520.8 464 528 456.8 528 448L528 288L112 288zM64 192C64 156.7 92.7 128 128 128L512 128C547.3 128 576 156.7 576 192L576 448C576 483.3 547.3 512 512 512L128 512C92.7 512 64 483.3 64 448L64 192z"
                                /></svg
                            >
                        {/if}
                        <EditableLabel
                            class="tab-label"
                            bind:editable={flow.nameEditable}
                            value={flow.name}
                            onedit={(value) => onGraphNameEdit(index, value)}
                        />
                    </button>
                    {#if index > 0}
                        <button class="tab-item-button" onclick={() => deleteGraphInstance(index)}>
                            <svg class="tab-item-delete" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"
                                ><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path
                                    d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"
                                /></svg
                            >
                        </button>
                    {/if}
                </ContextMenu.Trigger>
                <ContextMenu.Portal>
                    <ContextMenu.Content
                        class="context-menu-frame"
                        style="z-index: 2;"
                        onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                        <ContextMenu.Item class="context-menu-item" onclick={() => (flow.nameEditable = true)}>
                            Rename
                        </ContextMenu.Item>
                        <ContextMenu.Separator class="context-menu-separator" />
                        <ContextMenu.Item class="context-menu-item" onclick={() => deleteGraphInstance(index)}>
                            Delete
                        </ContextMenu.Item>
                    </ContextMenu.Content>
                </ContextMenu.Portal>
            </ContextMenu.Root>
        {/each}
        <div class="tab-item">
            <button class="tab-item-button" onclick={onAddGraph}>
                <svg class="tab-item-plus" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"
                    ><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path
                        d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z"
                    /></svg
                >
            </button>
        </div>
    </div>
</div>
