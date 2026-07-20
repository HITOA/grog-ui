<script lang="ts">
    import { type NodeDefinition, type NodeKey } from "../types";
    import { Command, ContextMenu } from "bits-ui";
    import { useSvelteFlow, type XYPosition } from "@xyflow/svelte";
    import { instantiateNode } from "../actions";
    import { grogState } from "../state.svelte";

    let { children } = $props();

    interface TreeNode {
        type: string
        name: string
        nodeKey?: NodeKey
        files?: Array<TreeNode>
    }

    function searchInTreeNode(name: string | undefined, node: TreeNode): TreeNode | undefined {
        return node.files?.find((file: TreeNode) => file.name == name);
    }

    function buildTree(nodes: Record<NodeKey, NodeDefinition>): TreeNode {  
        let root: TreeNode = {
            type: "folder",
            name: "root",
            files: []
        }

        let sortedNodes = Object.entries(nodes).sort();

        sortedNodes.forEach(entry => {
            let path = entry[0].split("/")
            let node = entry[1]
            let insertAt = root
            
            while (path.length > 0) {
                let node = searchInTreeNode(path[0], insertAt);
                if (node != undefined) {
                    insertAt = node
                    path.shift()
                } else {
                    break;
                }
            }

            let toInsert: TreeNode = {
                type: "file",
                name: node.displayName,
                nodeKey: entry[0]
            }

            for (let i = path.length - 2; i >= 0; --i) {
                let newToInsert = {
                    type: "folder",
                    name: path[i],
                    files: [ toInsert ]
                }
                toInsert = newToInsert
            }

            insertAt.files?.push(toInsert)
        });

        return root;
    }

    let root: TreeNode = $derived.by(() => {
        return buildTree(grogState.nodeDefinitionList.nodes)
    })

    let filterValue: string = $state("");

    let contextMenuOpenState: boolean = $state(false);

    let lastClickPosInFlow: XYPosition = { x: 0.0, y: 0.0 }

    let { screenToFlowPosition } = useSvelteFlow();

    function onContextMenu(event: MouseEvent): void {
        lastClickPosInFlow.x = event.clientX;
        lastClickPosInFlow.y = event.clientY;
        lastClickPosInFlow = screenToFlowPosition(lastClickPosInFlow);
    }

    function onSelectFile(nodeKey: NodeKey | undefined) {
        if (nodeKey !== undefined)
            instantiateNode(nodeKey, lastClickPosInFlow);
        contextMenuOpenState = false;
    }

</script>

{#snippet file(node: TreeNode)}
    <ContextMenu.Item class="menu-item" onSelect={() => { onSelectFile(node.nodeKey) }}>
        {node.name}
    </ContextMenu.Item>
{/snippet}

{#snippet folder(node: TreeNode)}
    <ContextMenu.Sub>
        <ContextMenu.SubTrigger class="menu-item">
            <span class="menu-item-text">{node.name}</span>
            <span class="menu-item-file-count">{node.files?.length}</span>
            <svg class="menu-item-folder-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M439.1 297.4C451.6 309.9 451.6 330.2 439.1 342.7L279.1 502.7C266.6 515.2 246.3 515.2 233.8 502.7C221.3 490.2 221.3 469.9 233.8 457.4L371.2 320L233.9 182.6C221.4 170.1 221.4 149.8 233.9 137.3C246.4 124.8 266.7 124.8 279.2 137.3L439.2 297.3z"/></svg>
        </ContextMenu.SubTrigger>
        <ContextMenu.SubContent class="menu-frame">
            {#each node.files as f}
                {#if f.type == "folder"}
                    {@render folder(f)}
                {:else}
                    {@render file(f)}
                {/if}
            {/each}
        </ContextMenu.SubContent>
    </ContextMenu.Sub>
{/snippet}

<ContextMenu.Root bind:open={contextMenuOpenState}>
    <ContextMenu.Trigger oncontextmenu={onContextMenu} class="flow-container">
        {@render children?.()}
    </ContextMenu.Trigger>
    <ContextMenu.Portal>
        <ContextMenu.Content class="menu-frame">
            <Command.Root>
                <svg class="menu-input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z"/></svg>
                <Command.Input bind:value={filterValue} placeholder="Add Node..." class="menu-input"/>
                {#if filterValue.length > 0}
                    <Command.List>
                        <Command.Viewport>
                            <Command.Empty>
                                No Result Found
                            </Command.Empty>
                            {#each Object.entries(grogState.nodeDefinitionList.nodes) as entry}
                                <Command.Item 
                                value={entry[0]} 
                                keywords={entry[0].split("/")} 
                                class="menu-item"
                                onSelect={() => { onSelectFile(entry[0]) }}>
                                    {entry[1].displayName}
                                </Command.Item>
                            {/each}
                        </Command.Viewport>
                    </Command.List>
                {/if}
            </Command.Root>
            {#if filterValue.length <= 0}
                {#each root.files as f}
                    {#if f.type == "folder"}
                        {@render folder(f)}
                    {:else}
                        {@render file(f)}
                    {/if}
                {/each}
            {/if}
        </ContextMenu.Content>
    </ContextMenu.Portal>
</ContextMenu.Root>