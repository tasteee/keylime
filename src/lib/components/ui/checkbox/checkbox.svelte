<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from 'bits-ui'
	import CheckIcon from '@lucide/svelte/icons/check'
	import MinusIcon from '@lucide/svelte/icons/minus'
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js'

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> = $props()
</script>

<CheckboxPrimitive.Root
	bind:ref
	data-slot="checkbox"
	class={cn(
		'border-black bg-white data-[state=checked]:text-black peer size-5 flex shrink-0 items-center justify-center rounded-none border-[3px] shadow-[2px_2px_0px_#000] transition-all outline-none focus-visible:border-[#CCFF00] focus-visible:shadow-[4px_4px_0px_#00FFFF] focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#FF69B4]',
		className
	)}
	bind:checked
	bind:indeterminate
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<div data-slot="checkbox-indicator" class="text-current transition-none">
			{#if checked}
				<CheckIcon class="size-3.5" />
			{:else if indeterminate}
				<MinusIcon class="size-3.5" />
			{/if}
		</div>
	{/snippet}
</CheckboxPrimitive.Root>
