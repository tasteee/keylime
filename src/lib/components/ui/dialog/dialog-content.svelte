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
			'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] max-w-lg gap-4 p-6 border-black fixed top-[50%] left-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] rounded-none border-[3px] shadow-[10px_10px_0px_#000] duration-200',
			className
		)}
		{...restProps}
	>
		{@render restProps.children?.()}
		<DialogPrimitive.Close
			class="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground top-4 right-4 rounded-sm absolute opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
		>
			<Icon icon="mingcute:close-line" class="h-4 w-4" />
			<span class="sr-only">Close</span>
		</DialogPrimitive.Close>
	</DialogPrimitive.Content>
</DialogPrimitive.Portal>
