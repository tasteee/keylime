<script lang="ts">
	import { cn } from '$lib/utils.js'
	import type { HTMLAttributes } from 'svelte/elements'

	let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props()
</script>

<div data-slot="dialog-header" class={cn('space-y-1.5 sm:text-left flex flex-col text-center', className)} {...restProps}>
	{@render restProps.children?.()}
</div>
