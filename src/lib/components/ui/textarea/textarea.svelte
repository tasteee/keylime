<script lang="ts" module>
	import type { HTMLTextareaAttributes } from 'svelte/elements'
	import { type VariantProps, tv } from 'tailwind-variants'
	import { cn, type WithElementRef } from '$lib/utils.js'
	import mainStore from '$lib/stores/main.svelte'

	export const textareaVariants = tv({
		base: 'limeTextarea',
		variants: {
			size: {
				small: 'isSmallSize',
				medium: 'isMediumSize',
				large: 'isLargeSize'
			},
			isFullWidth: {
				true: 'isFullWidth'
			},
			isDisabled: {
				true: 'isDisabled'
			}
		},
		defaultVariants: {
			size: 'medium'
		}
	})

	export type TextareaSizeT = VariantProps<typeof textareaVariants>['size']

	type BaseTextareaPropsT = {
		size?: TextareaSizeT
		isFullWidth?: boolean
	}

	export type TextareaPropsT = WithElementRef<Omit<HTMLTextareaAttributes, 'size'> & BaseTextareaPropsT>
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		value = $bindable(),
		size = 'medium',
		isFullWidth = true,
		class: className,
		'data-slot': dataSlot = 'textarea',
		onfocus,
		onblur,
		...restProps
	}: TextareaPropsT = $props()

	const handleFocus = (event: FocusEvent & { currentTarget: EventTarget & HTMLTextAreaElement }) => {
		mainStore.setInputFocused()
		onfocus?.(event)
	}

	const handleBlur = (event: FocusEvent & { currentTarget: EventTarget & HTMLTextAreaElement }) => {
		mainStore.setInputBlurred()
		onblur?.(event)
	}
</script>

<textarea
	bind:this={ref}
	data-slot={dataSlot}
	class={cn(textareaVariants({ size, isFullWidth }), className)}
	bind:value
	onfocus={handleFocus}
	onblur={handleBlur}
	{...restProps}
></textarea>

<style>
	.limeTextarea {
		/* Sizes - Matching Button/Input but for Textarea */
		--smallSizePaddingY: 4px;
		--smallSizePaddingX: 12px;
		--smallSizeFontSize: 0.875rem;
		--mediumSizePaddingY: 8px;
		--mediumSizePaddingX: 12px;
		--mediumSizeFontSize: 0.875rem;
		--largeSizePaddingY: 12px;
		--largeSizePaddingX: 12px;
		--largeSizeFontSize: 0.875rem;

		/* Colors - Adapted from Button Neutral/Brand */
		/* Using Neutral Border for default state */
		--inputBorderColor: rgb(209, 213, 219);
		--inputBorderColor-hover: rgb(156, 163, 175);
		--inputBorderColor-focus: var(--a); /* Brand color for focus */

		--inputBgColor: var(--colorWhite);
		--inputTextColor: var(--colorBlack);
		--inputPlaceholderColor: rgb(156, 163, 175);

		display: inline-flex;
		flex-shrink: 0;
		align-items: flex-start;
		justify-content: flex-start;
		font-family: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 150ms ease;
		outline: none;
		appearance: none;
		border-radius: 5px;
		border-width: 1px;
		border-style: solid;
		border-color: var(--inputBorderColor);
		background-color: var(--inputBgColor);
		color: var(--inputTextColor);
		width: auto;
		min-height: 60px; /* Default min-height */
		resize: vertical;
	}

	.limeTextarea:hover:not(:disabled):not(:focus) {
		border-color: var(--inputBorderColor-hover);
	}

	.limeTextarea:focus {
		outline: none;
		border-color: var(--inputBorderColor-focus);
		box-shadow: 0 0 0 1px var(--inputBorderColor-focus);
	}

	.limeTextarea:disabled {
		pointer-events: none;
		cursor: default;
		background-color: rgb(243, 244, 246);
		color: rgb(156, 163, 175);
	}

	.limeTextarea::placeholder {
		color: var(--inputPlaceholderColor);
	}

	/* Sizes */
	.limeTextarea.isSmallSize {
		padding: var(--smallSizePaddingY) var(--smallSizePaddingX);
		font-size: var(--smallSizeFontSize);
		min-height: 40px;
	}

	.limeTextarea.isMediumSize {
		padding: var(--mediumSizePaddingY) var(--mediumSizePaddingX);
		font-size: var(--mediumSizeFontSize);
		min-height: 80px;
	}

	.limeTextarea.isLargeSize {
		padding: var(--largeSizePaddingY) var(--largeSizePaddingX);
		font-size: var(--largeSizeFontSize);
		min-height: 120px;
	}

	/* Full Width */
	.limeTextarea.isFullWidth {
		width: 100%;
		flex: 1;
	}

	/* Disabled */
	.limeTextarea.isDisabled {
		pointer-events: none;
		cursor: not-allowed;
		opacity: 0.5;
		background-color: rgb(243, 244, 246);
		color: rgb(156, 163, 175);
	}
</style>
