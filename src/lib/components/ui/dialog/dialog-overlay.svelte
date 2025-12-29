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
	class={cn(className)}
	style="background-color: var(--flows-basicsV2-modal-overlayBackground);"
	{...restProps}
/>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes fadeOut {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}
</style>
