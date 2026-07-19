<script lang="ts">
    import { useStore } from "@xyflow/svelte";

    let store = $derived(useStore());
    let scaledSizeSmallGrid = $derived(16 * store.viewport.zoom)
    let scaledSizeGrid = $derived(160 * store.viewport.zoom)
    let normalizedZoom = $derived((store.viewport.zoom + store.minZoom) / (store.maxZoom + store.minZoom));
    
</script>

<div class="flow-background">
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <pattern 
                id="smallGrid" 
                x={store.viewport.x} 
                y={store.viewport.y} 
                width="{scaledSizeSmallGrid}" 
                height="{scaledSizeSmallGrid}" 
                patternUnits="userSpaceOnUse">
            <path 
                d="M {scaledSizeSmallGrid} 0 L 0 0 0 {scaledSizeSmallGrid}" 
                fill="none" stroke="gray" stroke-width="3.0" opacity={normalizedZoom / 7.0}/>
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#smallGrid)" />
    </svg>
</div>