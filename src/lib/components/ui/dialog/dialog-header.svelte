<script lang="ts">
	import { cn } from '$lib/utils.js'
	import type { HTMLAttributes } from 'svelte/elements'

	let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props()
</script>

<div data-slot="dialog-header" class={cn('DialogHeader', className)} {...restProps}>
	{@render restProps.children?.()}
</div>

<style>
	.DialogHeader {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		gap: 16px;
	}
</style>
