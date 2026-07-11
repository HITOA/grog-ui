<script lang="ts">
    import { type NodeDefinition, type NodeInstance, type NodeKey } from "$lib/types";
    import { Command, ContextMenu } from "bits-ui";
    import { useSvelteFlow, type XYPosition } from "@xyflow/svelte";
    import { instantiateNode } from "$lib/actions";
    import { grogState } from "$lib/state.svelte";

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
            {node.name}
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
                <Command.Input bind:value={filterValue} />
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