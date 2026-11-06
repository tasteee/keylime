<script lang="ts">
	import SelectOutput from '$lib/components/Project/SelectOutput.svelte'
</script>

<z-column class="bottomBar">
	<z-separator></z-separator>
	<z-row insetX="lg" insetY="sm" alignsX="end" alignsY="center" isFullWidth>
		<SelectOutput />
	</z-row>
</z-column>

<style>
	.bottomBar {
		flex-shrink: 0;
		background: var(--card);
	}
</style>
