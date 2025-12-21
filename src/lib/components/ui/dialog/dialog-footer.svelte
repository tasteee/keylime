<script lang="ts">
	import { cn } from '$lib/utils.js'
	import type { HTMLAttributes } from 'svelte/elements'

	let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props()
</script>

<div data-slot="dialog-footer" class={cn('DialogFooter', className)} {...restProps}>
	{@render restProps.children?.()}
</div>

<style>
	.DialogFooter {
		display: flex;
		align-items: center;
		justify-content: end;
		gap: 8px;
		padding-top: 24px;
	}
</style>
