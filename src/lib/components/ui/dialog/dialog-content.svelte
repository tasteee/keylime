<script lang="ts">
	import { cn } from '$lib/utils.js'
	import { Dialog as DialogPrimitive } from 'bits-ui'
	import Icon from '@iconify/svelte'
	import * as Dialog from './index.js'

	let {
		ref = $bindable(null),
		class: className,
		portalProps,
		...restProps
	}: DialogPrimitive.ContentProps & {
		portalProps?: DialogPrimitive.PortalProps
	} = $props()
</script>

<DialogPrimitive.Portal {...portalProps}>
	<Dialog.Overlay />
	<DialogPrimitive.Content
		bind:ref
		data-slot="dialog-content"
		class={cn(
			'flows_basicsV2_modal_modal flows_basicsV2_modal_width_medium absolute top-[50%] left-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
			className
		)}
		{...restProps}
	>
		{@render restProps.children?.()}
		<DialogPrimitive.Close
			class="ring-offset-background focus:ring-ring rounded-sm absolute opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
			style="top: 30px; right: 30px;"
		>
			<Icon icon="mingcute:close-line" class="h-6 w-6" />
			<span class="sr-only">Close</span>
		</DialogPrimitive.Close>
	</DialogPrimitive.Content>
</DialogPrimitive.Portal>
