<script lang="ts">
	import { Slider as SliderPrimitive } from 'bits-ui'
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js'

	let {
		ref = $bindable(null),
		value = $bindable(),
		orientation = 'horizontal',
		class: className,
		...restProps
	}: WithoutChildrenOrChild<SliderPrimitive.RootProps> = $props()
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along, so we shut typescript up by casting `value` to `never`.
-->
<SliderPrimitive.Root
	bind:ref
	bind:value={value as never}
	data-slot="slider"
	{orientation}
	class={cn(
		'data-[orientation=vertical]:min-h-44 relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
		className
	)}
	{...restProps}
>
	{#snippet children({ thumbs })}
		<span
			data-orientation={orientation}
			data-slot="slider-track"
			class={cn(
				'sliderTrack bg-secondary data-[orientation=horizontal]:h-2 data-[orientation=vertical]:w-2 relative grow overflow-hidden rounded-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full'
			)}
		>
			<SliderPrimitive.Range
				data-slot="slider-range"
				class={cn('sliderRange absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full')}
			/>
		</span>
		{#each thumbs as thumb (thumb)}
			<SliderPrimitive.Thumb
				data-slot="slider-thumb"
				index={thumb}
				class="sliderThumb h-5 w-5 bg-background ring-offset-background focus-visible:ring-ring block rounded-full border-2 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
			/>
		{/each}
	{/snippet}
</SliderPrimitive.Root>

<style>
	:global(.sliderRange) {
		background-color: var(--a);
	}

	:global(.sliderThumb) {
		border-color: var(--a);
	}

	:global(.sliderThumb:hover) {
		border-color: var(--a-05);
	}

	:global(.sliderThumb:active) {
		border-color: var(--a-06);
	}
</style>
