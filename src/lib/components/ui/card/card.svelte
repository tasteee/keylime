<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements'
	import { cn, type WithElementRef } from '$lib/utils.js'

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props()
</script>

<div
	bind:this={ref}
	data-slot="card"
	class={cn(
		'bg-card text-card-foreground gap-6 border-black py-6 flex flex-col rounded-none border-[3px]  transition-transform duration-200 hover:rotate-1',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
