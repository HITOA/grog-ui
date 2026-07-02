<script lang="ts">
    import { GrogContext, setGrogContext } from "$lib/context.svelte";
	import type { LayoutProps } from "./$types";
	
	let { children }: LayoutProps = $props()

	setGrogContext(new GrogContext());
</script>

<svelte:head>
	<link rel="stylesheet" href="/themes/default-dark.css">
</svelte:head>

{@render children()}
