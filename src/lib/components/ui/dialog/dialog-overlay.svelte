<script lang="ts">
	import { cn } from '$lib/utils.js'
	import { Dialog as DialogPrimitive } from 'bits-ui'
	import type { Snippet } from 'svelte'

	type DialogOverlayPropsT = DialogPrimitive.OverlayProps & {
		ref?: HTMLDivElement | null
		class?: string
		children?: Snippet
	}

	let { ref = $bindable(null), class: className, ...restProps }: DialogOverlayPropsT = $props()
</script>

<DialogPrimitive.Overlay
	bind:ref
	data-slot="dialog-overlay"
	class={cn(
		'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 inset-0 absolute z-50',
		className
	)}
	style="background-color: var(--flows-basicsV2-modal-overlayBackground);"
	{...restProps}
/>
