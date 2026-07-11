<script lang="ts">
	import type { LayoutProps } from "./$types";
	
	let { children }: LayoutProps = $props()
</script>

<svelte:head>
	<link rel="stylesheet" href="./themes/default-dark.css">
</svelte:head>

{@render children()}
