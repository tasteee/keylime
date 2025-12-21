<script lang="ts" module>
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements'
	import { type VariantProps, tv } from 'tailwind-variants'
	import { cn, type WithElementRef } from '$lib/utils.js'
	import mainStore from '$lib/stores/main.svelte'
	import type { Snippet } from 'svelte'

	export const inputVariants = tv({
		base: 'keyActionInput',
		variants: {
			size: {
				small: 'isSmallSize',
				medium: 'isMediumSize',
				large: 'isLargeSize'
			},
			isFullWidth: {
				true: 'isFullWidth'
			}
		},
		defaultVariants: {
			size: 'small'
		}
	})

	export type InputSizeT = VariantProps<typeof inputVariants>['size']
	type InputTypeT = Exclude<HTMLInputTypeAttribute, 'file'>

	type BaseInputPropsT = {
		size?: InputSizeT
		isFullWidth?: boolean
		startIcon?: Snippet
		endIcon?: Snippet
		label?: string
		width?: string
	}

	export type InputPropsT = WithElementRef<
		Omit<HTMLInputAttributes, 'type' | 'size'> &
			BaseInputPropsT &
			({ type: 'file'; files?: FileList } | { type?: InputTypeT; files?: undefined })
	>
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		size = 'small',
		width = '100%',
		isFullWidth = true,
		class: className,
		'data-slot': dataSlot = 'input',
		startIcon,
		endIcon,
		label,
		onfocus,
		onblur,
		...restProps
	}: InputPropsT = $props()

	const handleFocus = (event: FocusEvent & { currentTarget: EventTarget & HTMLInputElement }) => {
		mainStore.setInputFocused()
		onfocus?.(event)
	}

	const handleBlur = (event: FocusEvent & { currentTarget: EventTarget & HTMLInputElement }) => {
		mainStore.setInputBlurred()
		onblur?.(event)
	}

	const iconClass = $derived(startIcon ? 'hasStartIcon' : '')
</script>

{#if type === 'file'}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(inputVariants({ size, isFullWidth }), 'isFile', className)}
		style:width
		type="file"
		bind:files
		bind:value
		onfocus={handleFocus}
		onblur={handleBlur}
		{...restProps}
	/>
{:else if startIcon || endIcon}
	<div class={cn('relative', isFullWidth && 'w-full', iconClass)} style="width: {width}">
		{#if startIcon}
			<div class="left-3 text-muted-foreground absolute top-1/2 -translate-y-1/2">
				{@render startIcon()}
			</div>
		{/if}
		<input
			bind:this={ref}
			data-slot={dataSlot}
			style:padding-left={startIcon ? '36px' : undefined}
			class={cn(inputVariants({ size, isFullWidth }), endIcon && 'pr-10', 'w-full', className)}
			{type}
			bind:value
			onfocus={handleFocus}
			onblur={handleBlur}
			{...restProps}
		/>
		{#if endIcon}
			<div class="right-3 text-muted-foreground absolute top-1/2 -translate-y-1/2">
				{@render endIcon()}
			</div>
		{/if}
	</div>
{:else if label}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		style="width: {width}"
		class={cn(inputVariants({ size, isFullWidth }), 'cursor-text', className)}
		onclick={() => ref?.focus()}
		role="group"
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				ref?.focus()
			}
		}}
		tabindex="-1"
	>
		<span class="font-bold select-none">{label}</span>
		<input
			bind:this={ref}
			data-slot={dataSlot}
			class="p-0 m-0 font-normal min-w-0 h-full w-full flex-1 border-none bg-transparent outline-none focus:ring-0"
			{type}
			bind:value
			onfocus={handleFocus}
			onblur={handleBlur}
			{...restProps}
		/>
	</div>
{:else}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		style:width
		class={cn(inputVariants({ size, isFullWidth }), className)}
		{type}
		bind:value
		onfocus={handleFocus}
		onblur={handleBlur}
		{...restProps}
	/>
{/if}

<style>
	input:-webkit-autofill,
	input:autofill {
		background-color: white !important;
		color: black !important;
		transition:
			background-color 0s 600000s,
			color 0s 600000s !important;
	}

	/* Hide spin buttons for number inputs */
	input[type='number']::-webkit-inner-spin-button,
	input[type='number']::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	input[type='number'] {
		-moz-appearance: textfield;
	}

	:global(.keyActionInput) {
		/* Sizes - Matching Button */
		--smallSizeHeight: 28px;
		--smallSizePaddingY: 4px;
		--smallSizePaddingX: 12px;
		--smallSizeFontSize: 0.875rem;
		--mediumSizeHeight: 32px;
		--mediumSizePaddingY: 6px;
		--mediumSizePaddingX: 12px;
		--mediumSizeFontSize: 0.875rem;
		--largeSizeHeight: 36px;
		--largeSizePaddingY: 8px;
		--largeSizePaddingX: 12px;
		--largeSizeFontSize: 0.875rem;

		outline: 19px solid black;

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
		align-items: center;
		justify-content: flex-start; /* Inputs align text to start */
		white-space: nowrap;
		font-family: inherit;
		font-size: 0.875rem;
		font-weight: 500; /* Slightly less than button's 700 for readability */
		transition: all 150ms ease;
		outline: none;
		appearance: none;
		border-radius: 5px; /* Matching Button */
		border-width: 1px;
		border-style: solid;
		border-color: var(--inputBorderColor);
		background-color: var(--inputBgColor);
		color: var(--inputTextColor);
		width: auto;
	}

	:global(.keyActionInput:hover:not(:disabled):not(:focus):not(:focus-within)) {
		border-color: var(--inputBorderColor-hover);
	}

	:global(.keyActionInput:focus),
	:global(.keyActionInput:focus-within) {
		outline: none;
		border-color: var(--inputBorderColor-focus);
		box-shadow: 0 0 0 1px var(--inputBorderColor-focus); /* Optional: add a ring like focus effect */
	}

	:global(.keyActionInput:disabled) {
		pointer-events: none;
		cursor: default;
		background-color: rgb(243, 244, 246); /* Neutral disabled bg */
		color: rgb(156, 163, 175); /* Neutral disabled text */
	}

	:global(.keyActionInput::placeholder) {
		color: var(--inputPlaceholderColor);
	}

	/* Sizes */
	:global(.keyActionInput.isSmallSize) {
		height: var(--smallSizeHeight);
		padding: var(--smallSizePaddingY) var(--smallSizePaddingX);
		font-size: var(--smallSizeFontSize);
		gap: 0.5rem;
	}

	:global(.keyActionInput.isMediumSize) {
		height: var(--mediumSizeHeight);
		padding: var(--mediumSizePaddingY) var(--mediumSizePaddingX);
		font-size: var(--mediumSizeFontSize);
		gap: 0.5rem;
	}

	:global(.keyActionInput.isLargeSize) {
		height: var(--largeSizeHeight);
		padding: var(--largeSizePaddingY) var(--largeSizePaddingX);
		font-size: var(--largeSizeFontSize);
		gap: 0.75rem;
	}

	/* Full Width */
	:global(.keyActionInput.isFullWidth) {
		width: 100%;
		flex: 1;
	}

	/* File Input Specifics */
	:global(.keyActionInput.isFile) {
		padding: 0;
		align-items: center;
	}
	:global(.keyActionInput.isFile::file-selector-button) {
		border: 0;
		background: transparent;
		font-size: inherit;
		font-weight: 700;
		height: 100%;
		padding: 0 12px;
		margin-right: 12px;
		background-color: rgb(243, 244, 246);
		cursor: pointer;
		color: inherit;
	}
</style>
