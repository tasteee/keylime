<script lang="ts">
	import { cn } from '$lib/utils.js'
	import type { HTMLAttributes } from 'svelte/elements'

	let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props()
</script>

<div data-slot="dialog-footer" class={cn('gap-2 pt-4 flex items-center', className)} {...restProps}>
	{@render restProps.children?.()}
</div>
