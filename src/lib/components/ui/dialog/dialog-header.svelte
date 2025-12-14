<script lang="ts">
	import { cn } from '$lib/utils.js'
	import type { HTMLAttributes } from 'svelte/elements'

	let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props()
</script>

<div
	data-slot="dialog-header"
	class={cn('space-y-1.5 sm:text-left mt-2 relative flex flex-col text-center', className)}
	{...restProps}
>
	<div
		class="-top-10 w-40 h-8 border-black absolute left-1/2 -translate-x-1/2 -rotate-2 border-[3px] bg-[#CCFF00] shadow-[2px_2px_0px_#000]"
	></div>
	{@render restProps.children?.()}
</div>
