<script lang="ts">
    import type { NodeDefinition, NodeKey } from "$lib/api";
    import { getGrogContext } from "$lib/context.svelte";
    import { Command, ContextMenu } from "bits-ui";

    let { children } = $props();

    let grogContext = getGrogContext()

    interface TreeNode {
        type: string
        name: string
        files?: Array<TreeNode>
    }

    function searchInTreeNode(name: string | undefined, node: TreeNode): TreeNode | undefined {
        return node.files?.find((file: TreeNode) => file.name == name);
    }

    function buildTree(nodes: Map<NodeKey, NodeDefinition>): TreeNode {  
        let root: TreeNode = {
            type: "folder",
            name: "root",
            files: []
        }

        nodes = new Map(nodes.entries().toArray().sort())

        nodes.entries().forEach(entry => {
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
                name: node.displayName
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
        return buildTree(grogContext.nodeDefinitionList.nodes)
    })

    let filterValue: string = $state("");

</script>

{#snippet file(node: TreeNode)}
    <ContextMenu.Item class="menu-item">
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

<ContextMenu.Root>
    <ContextMenu.Trigger style="width:100%;height:100%;">
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
                            {#each grogContext.nodeDefinitionList.nodes as entry}
                                <Command.Item value={entry[0]} keywords={entry[0].split("/")} class="menu-item">
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