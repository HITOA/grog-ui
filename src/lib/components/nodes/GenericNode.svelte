<script lang="ts">
    import { page } from '$app/state';
    import type { NodeInstance } from '$lib/types';
    import { Handle, Position, useSvelteFlow, type NodeProps, type Node } from '@xyflow/svelte';
    import type { GenericNodeType } from './GenericNode';

    let { id, data }: NodeProps<GenericNodeType> = $props();

    let { updateNodeData } = useSvelteFlow();
</script>

<div class="menu-frame">
    <h1>UWU</h1>
</div>