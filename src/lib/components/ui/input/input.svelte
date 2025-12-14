<script lang="ts">
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements'
	import { cn, type WithElementRef } from '$lib/utils.js'

	type InputType = Exclude<HTMLInputTypeAttribute, 'file'>

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, 'type'> & ({ type: 'file'; files?: FileList } | { type?: InputType; files?: undefined })
	>

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		class: className,
		'data-slot': dataSlot = 'input',
		...restProps
	}: Props = $props()
</script>

{#if type === 'file'}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			'border-black bg-white selection:text-black placeholder:text-gray-400 h-10 min-w-0 px-3 pt-1.5 text-sm font-mono font-medium flex w-full rounded-none border-[3px] transition-all outline-none selection:bg-[#FF69B4] disabled:cursor-not-allowed disabled:opacity-50',
			'focus-visible:border-[#CCFF00] focus-visible:shadow-[4px_4px_0px_#00FFFF] focus-visible:ring-0',
			'aria-invalid:animate-pulse aria-invalid:border-[#FF9900]',
			className
		)}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			'border-black bg-white selection:text-black placeholder:text-gray-400 h-10 min-w-0 px-3 py-1 text-base md:text-sm font-mono flex w-full rounded-none border-[3px] transition-all outline-none selection:bg-[#FF69B4] disabled:cursor-not-allowed disabled:opacity-50',
			'focus-visible:border-[#CCFF00] focus-visible:shadow-[4px_4px_0px_#00FFFF] focus-visible:ring-0',
			'aria-invalid:animate-pulse aria-invalid:border-[#FF9900]',
			className
		)}
		{type}
		bind:value
		{...restProps}
	/>
{/if}
