<script lang="ts" module>
	import type { HTMLInputAttributes } from 'svelte/elements'
	import { type VariantProps, tv } from 'tailwind-variants'
	import { cn, type WithElementRef } from '$lib/utils.js'
	import type { Snippet } from 'svelte'

	export const inputNumberButtonVariants = tv({
		base: 'keyActionInputNumberButton',
		variants: {
			kind: {
				solid: 'isSolidKind',
				outline: 'isOutlineKind',
				ghost: 'isGhostKind'
			},
			color: {
				red: 'isRedColor',
				neutral: 'isNeutralColor',
				brand: 'isBrandColor',
				dark: 'isDarkColor'
			},
			size: {
				small: 'isSmallSize',
				medium: 'isMediumSize',
				large: 'isLargeSize'
			}
		},
		defaultVariants: {
			kind: 'solid',
			color: 'neutral',
			size: 'small'
		}
	})

	export type InputNumberButtonKindT = VariantProps<typeof inputNumberButtonVariants>['kind']
	export type InputNumberButtonColorT = VariantProps<typeof inputNumberButtonVariants>['color']
	export type InputNumberButtonSizeT = VariantProps<typeof inputNumberButtonVariants>['size']

	type InputNumberButtonPropsT = WithElementRef<Omit<HTMLInputAttributes, 'type' | 'size'>> & {
		value: number | string
		min?: number | string
		max?: number | string
		step?: number | string
		isDisabled?: boolean
		oninput?: (event: Event & { currentTarget: EventTarget & HTMLInputElement }) => void
		onchange?: (event: Event & { currentTarget: EventTarget & HTMLInputElement }) => void
		oncommit?: (value: number) => void
		kind?: InputNumberButtonKindT
		color?: InputNumberButtonColorT
		size?: InputNumberButtonSizeT
		inputWidth?: number | string
		width?: number | string
		label?: string | Snippet
		class?: string
	}
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		value = $bindable(),
		min,
		max,
		step = 1,
		isDisabled = false,
		oninput,
		onchange,
		oncommit,
		kind = 'solid',
		color = 'neutral',
		size = 'small',
		inputWidth,
		width,
		label,
		class: className,
		...restProps
	}: InputNumberButtonPropsT = $props()

	let isEditing = $state(false)
	let inputElement = $state<HTMLInputElement | null>(null)
	let tempValue = $state(value?.toString() ?? '')

	// if value is defaulted at first, and then project data arrives
	// to fill it, we need to update tempValue accordingly...
	// BUT,

	$effect(() => {
		if (!isEditing) {
			tempValue = value?.toString() ?? ''
		}
	})

	const minNumber = $derived(typeof min === 'string' ? parseFloat(min) : min)
	const maxNumber = $derived(typeof max === 'string' ? parseFloat(max) : max)

	const handleButtonClick = () => {
		if (isDisabled) return
		isEditing = true
		tempValue = value?.toString() ?? ''
	}

	const commitValue = () => {
		if (!isEditing) return

		const parsedValue = parseFloat(tempValue)
		const isValidNumber = !isNaN(parsedValue)

		if (!isValidNumber) {
			tempValue = value?.toString() ?? ''
			isEditing = false
			return
		}

		let finalValue = parsedValue

		const hasMinConstraint = minNumber !== undefined
		const hasMaxConstraint = maxNumber !== undefined

		if (hasMinConstraint && finalValue < minNumber) {
			finalValue = minNumber
		}

		if (hasMaxConstraint && finalValue > maxNumber) {
			finalValue = maxNumber
		}

		value = finalValue
		tempValue = finalValue.toString()
		isEditing = false

		if (oncommit) {
			oncommit(finalValue)
		}
	}

	const handleInputKeyDown = (event: KeyboardEvent) => {
		const isEnterKey = event.key === 'Enter'
		if (isEnterKey) {
			event.preventDefault()
			commitValue()
			if (inputElement) {
				inputElement.blur()
			}
		}

		const isEscapeKey = event.key === 'Escape'
		if (isEscapeKey) {
			event.preventDefault()
			tempValue = value?.toString() ?? ''
			isEditing = false
			if (inputElement) {
				inputElement.blur()
			}
		}
	}

	const handleInputBlur = () => {
		commitValue()
	}

	const handleInputFocus = (event: FocusEvent & { currentTarget: EventTarget & HTMLInputElement }) => {
		event.currentTarget.select()
	}

	const handleInput = (event: Event & { currentTarget: EventTarget & HTMLInputElement }) => {
		tempValue = event.currentTarget.value
		if (oninput) {
			oninput(event)
		}
	}

	const handleChange = (event: Event & { currentTarget: EventTarget & HTMLInputElement }) => {
		if (onchange) {
			onchange(event)
		}
	}

	$effect(() => {
		const shouldFocusInput = isEditing && inputElement
		if (shouldFocusInput) {
			inputElement.focus()
		}
	})

	const containerStyle = $derived(width ? `width: ${typeof width === 'number' ? width + 'px' : width}` : '')
	const inputStyle = $derived(inputWidth ? `width: ${typeof inputWidth === 'number' ? inputWidth + 'px' : inputWidth}` : '')
</script>

{#if isEditing}
	<div class={cn(inputNumberButtonVariants({ kind, color, size }), 'isEditingState', className)} style={containerStyle}>
		{#if label}
			<span class="label">
				{#if typeof label === 'string'}
					{label}
				{:else}
					{@render label()}
				{/if}
			</span>
		{/if}
		<input
			bind:this={inputElement}
			bind:value={tempValue}
			type="number"
			class="inputField"
			style={inputStyle}
			{min}
			{max}
			{step}
			disabled={isDisabled}
			oninput={handleInput}
			onchange={handleChange}
			onblur={handleInputBlur}
			onfocus={handleInputFocus}
			onkeydown={handleInputKeyDown}
			{...restProps}
		/>
	</div>
{:else}
	<button
		bind:this={ref}
		data-slot="input-number-button"
		class={cn(inputNumberButtonVariants({ kind, color, size }), className)}
		style={containerStyle}
		disabled={isDisabled}
		onclick={handleButtonClick}
		type="button"
	>
		{#if label}
			<span class="label">
				{#if typeof label === 'string'}
					{label}
				{:else}
					{@render label()}
				{/if}
			</span>
		{/if}
		<span class="valueDisplay" style={inputStyle}>{value}</span>
	</button>
{/if}

<style>
	:global(.keyActionInputNumberButton) {
		/* Sizes */
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

		/* Neutral */
		--neutralColorBgColor: var(--colorWhite);
		--neutralColorBgColor-hover: rgb(248, 247, 254);
		--neutralColorBgColor-active: rgb(241, 239, 250);
		--neutralColorBgColor-disabled: rgb(243, 244, 246);

		--neutralColorBorderColor: rgb(209, 213, 219);
		--neutralColorBorderColor-hover: rgb(156, 163, 175);
		--neutralColorBorderColor-active: rgb(107, 114, 128);
		--neutralColorBorderColor-disabled: rgb(243, 244, 246);

		--neutralColorTextColor: var(--colorBlack);
		--neutralColorTextColor-hover: var(--colorBlack);
		--neutralColorTextColor-active: var(--colorBlack);
		--neutralColorTextColor-disabled: rgb(156, 163, 175);

		/* Brand */
		--brandColorBgColor: rgb(99, 102, 241);
		--brandColorBgColor-hover: rgb(79, 70, 229);
		--brandColorBgColor-active: rgb(67, 56, 202);
		--brandColorBgColor-disabled: rgb(209, 213, 219);

		--brandColorTextColor: white;
		--brandColorTextColor-hover: white;
		--brandColorTextColor-active: white;
		--brandColorTextColor-disabled: rgb(156, 163, 175);

		/* Red */
		--redColorBgColor: rgb(239, 68, 68);
		--redColorBgColor-hover: rgb(220, 38, 38);
		--redColorBgColor-active: rgb(185, 28, 28);
		--redColorBgColor-disabled: rgb(243, 244, 246);

		--redColorTextColor: white;
		--redColorTextColor-hover: white;
		--redColorTextColor-active: white;
		--redColorTextColor-disabled: rgb(156, 163, 175);

		/* Dark */
		--darkColorBgColor: rgb(31, 41, 55);
		--darkColorBgColor-hover: rgb(17, 24, 39);
		--darkColorBgColor-active: rgb(0, 0, 0);
		--darkColorBgColor-disabled: rgb(243, 244, 246);

		--darkColorTextColor: white;
		--darkColorTextColor-hover: white;
		--darkColorTextColor-active: white;
		--darkColorTextColor-disabled: rgb(156, 163, 175);
	}

	:global(.keyActionInputNumberButton) {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		white-space: nowrap;
		font-size: 0.875rem;
		font-weight: 400;
		transition: all 150ms ease;
		outline: none;
		appearance: none;
		border-radius: 5px;
		border: 1px solid transparent;
		cursor: pointer;
	}

	:global(.keyActionInputNumberButton:focus-visible) {
		outline: none;
	}

	:global(.keyActionInputNumberButton:disabled) {
		pointer-events: none;
		cursor: default;
	}

	:global(.keyActionInputNumberButton .label) {
		font-weight: 700;
	}

	:global(.keyActionInputNumberButton .valueDisplay) {
		font-weight: 400;
		justify-content: end;
		height: 22px;
		display: inline-flex;
		align-items: center;
	}

	:global(.keyActionInputNumberButton.isEditingState) {
		cursor: default;
		outline: 2px solid var(--a-05);
		outline-offset: -2px;
		transition: none;
	}

	:global(.keyActionInputNumberButton .inputField) {
		background: transparent;
		border: none;
		outline: none;
		font-size: inherit;
		font-weight: 400;
		color: inherit;
		padding: 0;
		margin: 0;
		min-width: 30px;
		text-align: right;
		height: 22px;
	}

	:global(.keyActionInputNumberButton .inputField:focus),
	:global(.keyActionInputNumberButton .inputField:focus-visible) {
		border: none;
		outline: none;
		box-shadow: none;
	}
	:global(.keyActionInputNumberButton .inputField::-webkit-inner-spin-button),
	:global(.keyActionInputNumberButton .inputField::-webkit-outer-spin-button) {
		-webkit-appearance: none;
		margin: 0;
	}

	:global(.keyActionInputNumberButton .inputField[type='number']) {
		-moz-appearance: textfield;
	}

	/* Sizes */
	:global(.keyActionInputNumberButton.isSmallSize) {
		height: var(--smallSizeHeight);
		padding: var(--smallSizePaddingY) var(--smallSizePaddingX);
		font-size: var(--smallSizeFontSize);
		gap: 0.25rem;
	}

	:global(.keyActionInputNumberButton.isMediumSize) {
		height: var(--mediumSizeHeight);
		padding: var(--mediumSizePaddingY) var(--mediumSizePaddingX);
		font-size: var(--mediumSizeFontSize);
		gap: 0.5rem;
	}

	:global(.keyActionInputNumberButton.isLargeSize) {
		height: var(--largeSizeHeight);
		padding: var(--largeSizePaddingY) var(--largeSizePaddingX);
		font-size: var(--largeSizeFontSize);
		gap: 0.75rem;
	}

	/* Kinds - Neutral */
	:global(.keyActionInputNumberButton.isSolidKind.isNeutralColor) {
		box-shadow:
			rgba(28, 26, 39, 0.12) 0px 1px 2px 0px,
			rgb(28 26 39 / 49%) 0px 0px 1px 0px;
		background-color: var(--neutralColorBgColor);
		border-color: var(--neutralColorBorderColor);
		color: var(--neutralColorTextColor);
		border: none;
	}

	:global(.keyActionInputNumberButton.isSolidKind.isNeutralColor:hover:not(:disabled)) {
		background-color: var(--neutralColorBgColor-hover);
		border-color: var(--neutralColorBorderColor-hover);
	}

	:global(.keyActionInputNumberButton.isSolidKind.isNeutralColor:active:not(:disabled)) {
		background-color: var(--neutralColorBgColor-active);
		border-color: var(--neutralColorBorderColor-active);
	}

	:global(.keyActionInputNumberButton.isSolidKind.isNeutralColor:disabled) {
		background-color: var(--neutralColorBgColor-disabled);
		border-color: var(--neutralColorBorderColor-disabled);
		color: var(--neutralColorTextColor-disabled);
	}

	:global(.keyActionInputNumberButton.isOutlineKind.isNeutralColor) {
		background-color: transparent;
		border-color: var(--neutralColorBorderColor);
		color: var(--neutralColorTextColor);
	}

	:global(.keyActionInputNumberButton.isOutlineKind.isNeutralColor:hover:not(:disabled)) {
		background-color: var(--neutralColorBgColor-hover);
		border-color: var(--neutralColorBorderColor-hover);
	}

	:global(.keyActionInputNumberButton.isOutlineKind.isNeutralColor:active:not(:disabled)) {
		background-color: var(--neutralColorBgColor-active);
		border-color: var(--neutralColorBorderColor-active);
	}

	:global(.keyActionInputNumberButton.isOutlineKind.isNeutralColor:disabled) {
		border-color: var(--neutralColorBorderColor-disabled);
		color: var(--neutralColorTextColor-disabled);
	}

	:global(.keyActionInputNumberButton.isGhostKind.isNeutralColor) {
		background-color: transparent;
		border-color: transparent;
		color: var(--neutralColorTextColor);
	}

	:global(.keyActionInputNumberButton.isGhostKind.isNeutralColor:hover:not(:disabled)) {
		background-color: var(--neutralColorBgColor-hover);
	}

	:global(.keyActionInputNumberButton.isGhostKind.isNeutralColor:active:not(:disabled)) {
		background-color: var(--neutralColorBgColor-active);
	}

	:global(.keyActionInputNumberButton.isGhostKind.isNeutralColor:disabled) {
		color: var(--neutralColorTextColor-disabled);
	}

	/* Kinds - Brand */
	:global(.keyActionInputNumberButton.isSolidKind.isBrandColor) {
		background-color: var(--brandColorBgColor);
		color: var(--brandColorTextColor);
	}

	:global(.keyActionInputNumberButton.isSolidKind.isBrandColor:hover:not(:disabled)) {
		background-color: var(--brandColorBgColor-hover);
	}

	:global(.keyActionInputNumberButton.isSolidKind.isBrandColor:active:not(:disabled)) {
		background-color: var(--brandColorBgColor-active);
	}

	:global(.keyActionInputNumberButton.isSolidKind.isBrandColor:disabled) {
		background-color: var(--brandColorBgColor-disabled);
		color: var(--brandColorTextColor-disabled);
	}

	/* Kinds - Red */
	:global(.keyActionInputNumberButton.isSolidKind.isRedColor) {
		background-color: var(--redColorBgColor);
		color: var(--redColorTextColor);
	}

	:global(.keyActionInputNumberButton.isSolidKind.isRedColor:hover:not(:disabled)) {
		background-color: var(--redColorBgColor-hover);
	}

	:global(.keyActionInputNumberButton.isSolidKind.isRedColor:active:not(:disabled)) {
		background-color: var(--redColorBgColor-active);
	}

	:global(.keyActionInputNumberButton.isSolidKind.isRedColor:disabled) {
		background-color: var(--redColorBgColor-disabled);
		color: var(--redColorTextColor-disabled);
	}

	/* Kinds - Dark */
	:global(.keyActionInputNumberButton.isSolidKind.isDarkColor) {
		background-color: var(--darkColorBgColor);
		color: var(--darkColorTextColor);
	}

	:global(.keyActionInputNumberButton.isSolidKind.isDarkColor:hover:not(:disabled)) {
		background-color: var(--darkColorBgColor-hover);
	}

	:global(.keyActionInputNumberButton.isSolidKind.isDarkColor:active:not(:disabled)) {
		background-color: var(--darkColorBgColor-active);
	}

	:global(.keyActionInputNumberButton.isSolidKind.isDarkColor:disabled) {
		background-color: var(--darkColorBgColor-disabled);
		color: var(--darkColorTextColor-disabled);
	}
</style>
