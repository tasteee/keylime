<script lang="ts">
	import { getContext } from 'svelte'
	import { Button } from '$lib/components/ui/button'
	import Icon from '@iconify/svelte'

	type ToggleTabsOptionPropsT = {
		value: string
		isDisabled?: boolean
		iconName?: string
		iconClass?: string
		children?: any
	}

	type ToggleTabsContextT = {
		getValue: () => string
		getSize: () => 'small' | 'medium' | 'large'
		onChange: (value: string) => void
	}

	let props: ToggleTabsOptionPropsT = $props()

	const context = getContext<ToggleTabsContextT>('toggleTabs')

	const isActive = $derived(context.getValue() === props.value)

	const handleClick = () => {
		if (props.isDisabled) return
		context.onChange(props.value)
	}
</script>

<Button
	kind={isActive ? 'solid' : 'outline'}
	size={context.getSize()}
	onclick={handleClick}
	disabled={props.isDisabled}
	class={isActive ? 'activeTab' : 'inactiveTab'}
>
	{#if props.iconName}
		<Icon icon={props.iconName} class={props.iconClass || 'mr-2 size-4'} />
	{/if}
	{@render props.children?.()}
</Button>

<style>
	:global(.activeTab) {
		outline: 2px solid var(--a-05);
		outline-offset: -2px;
	}

	:global(.inactiveTab) {
		outline: 2px solid transparent;
		outline-offset: -2px;
	}
</style>
