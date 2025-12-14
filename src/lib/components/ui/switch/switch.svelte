<script lang="ts">
	import { Switch as SwitchPrimitive } from 'bits-ui'
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js'

	let {
		ref = $bindable(null),
		class: className,
		checked = $bindable(false),
		...restProps
	}: WithoutChildrenOrChild<SwitchPrimitive.RootProps> = $props()
</script>

<SwitchPrimitive.Root
	bind:ref
	bind:checked
	data-slot="switch"
	class={cn(
		'data-[state=unchecked]:bg-white peer h-6 w-10 border-black inline-flex shrink-0 items-center rounded-none border-[3px] shadow-[2px_2px_0px_#000] transition-all outline-none focus-visible:border-[#CCFF00] focus-visible:shadow-[4px_4px_0px_#00FFFF] focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#CCFF00]',
		className
	)}
	{...restProps}
>
	<SwitchPrimitive.Thumb
		data-slot="switch-thumb"
		class={cn(
			'bg-black size-3 pointer-events-none block rounded-none ring-0 transition-transform data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-[2px]'
		)}
	/>
</SwitchPrimitive.Root>
