<script lang="ts">
	import type { Snippet } from 'svelte'
	import AppTopBar from './shell/AppTopBar.svelte'

	type PageLayoutPropsT = {
		children?: Snippet
	}

	const props: PageLayoutPropsT = $props()
</script>

<z-column class="pageLayout">
	<AppTopBar />

	<z-scroll class="pageScroll">
		<z-container size="xl" gutter="lg">
			<z-column gap="lg" insetY="lg">
				{@render props.children?.()}
			</z-column>
		</z-container>
	</z-scroll>
</z-column>

<style>
	.pageLayout {
		flex: 1;
		min-height: 0;
		height: 100%;
		overflow: hidden;
	}

	.pageScroll {
		flex: 1;
		min-height: 0;
	}
</style>
