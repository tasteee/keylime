<script lang="ts">
	import { setContext } from 'svelte'

	type ToggleTabsPropsT = {
		value: string
		size?: 'small' | 'medium' | 'large'
		onChange: (value: string) => void
		children?: any
	}

	type ToggleTabsContextT = {
		getValue: () => string
		getSize: () => 'small' | 'medium' | 'large'
		onChange: (value: string) => void
	}

	let props: ToggleTabsPropsT = $props()

	const size = $derived(props.size || 'small')

	const context: ToggleTabsContextT = {
		getValue: () => props.value,
		getSize: () => size,
		onChange: props.onChange
	}

	setContext('toggleTabs', context)
</script>

<nav class="toggleTabs">
	{@render props.children?.()}
</nav>

<style>
	.toggleTabs {
		display: flex;
		gap: 4px;
		padding: 4px;
		background-color: var(--n-01);
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
	}
</style>
