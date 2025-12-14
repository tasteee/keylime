<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui'
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down'
	import { cn, type WithoutChild } from '$lib/utils.js'

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = 'default',
		...restProps
	}: WithoutChild<SelectPrimitive.TriggerProps> & {
		size?: 'sm' | 'default'
	} = $props()
</script>

<SelectPrimitive.Trigger
	bind:ref
	data-slot="select-trigger"
	data-size={size}
	class={cn(
		"border-black bg-white data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground gap-2 px-3 py-2 text-sm font-mono font-bold data-[size=default]:h-10 data-[size=sm]:h-8 *:data-[slot=select-value]:gap-2 [&_svg:not([class*='size-'])]:size-4 flex w-fit items-center justify-between rounded-none border-[3px] whitespace-nowrap uppercase transition-all outline-none select-none focus-visible:border-[#CCFF00] focus-visible:shadow-[4px_4px_0px_#00FFFF] focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[#FF9900] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<ChevronDownIcon class="size-4 opacity-50" />
</SelectPrimitive.Trigger>
