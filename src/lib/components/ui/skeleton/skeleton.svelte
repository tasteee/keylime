<script lang="ts">
	import { cn, type WithElementRef, type WithoutChildren } from '$lib/utils.js'
	import type { HTMLAttributes } from 'svelte/elements'

	let {
		ref = $bindable(null),
		class: className,
		radius = '4px',
		border = 'none',
		width,
		height,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> & {
		width?: string | number
		height?: string | number
		radius?: string | number
		border?: string | number
	} = $props()
</script>

<div
	bind:this={ref}
	data-slot="skeleton"
	class={cn('limeSkeleton animate-pulse', className)}
	style:borderRadius={typeof radius === 'number' ? `${radius}px` : radius}
	style:width={typeof width === 'number' ? `${width}px` : width}
	style:height={typeof height === 'number' ? `${height}px` : height}
	style:border={typeof border === 'number' ? `${border}px solid var(--n-01)` : border}
	{...restProps}
></div>

<style>
	.limeSkeleton {
		background-color: var(--n-03);
	}
</style>
