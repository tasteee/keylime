<script lang="ts" module>
	import { type VariantProps, tv } from 'tailwind-variants'
	import { cn } from '$lib/utils.js'

	export const rangeInputVariants = tv({
		base: 'keyActionRangeInput',
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

	export type RangeInputSizeT = VariantProps<typeof rangeInputVariants>['size']

	export type RangeInputPropsT = {
		valueMin: string | number
		valueMax: string | number
		min?: number
		max?: number
		placeholderMin?: string
		placeholderMax?: string
		label?: string
		size?: RangeInputSizeT
		isFullWidth?: boolean
		class?: string
	}
</script>

<script lang="ts">
	let {
		valueMin = $bindable(),
		valueMax = $bindable(),
		min = 0,
		max = 100,
		placeholderMin = '0',
		placeholderMax = '100',
		label,
		size = 'small',
		isFullWidth = false,
		class: className
	}: RangeInputPropsT = $props()

	const validateRange = (changed: 'min' | 'max') => {
		if (!valueMin || !valueMax) return
		const minVal = typeof valueMin === 'string' ? parseInt(valueMin) : valueMin
		const maxVal = typeof valueMax === 'string' ? parseInt(valueMax) : valueMax

		if (isNaN(minVal) || isNaN(maxVal)) return

		if (changed === 'min') {
			if (minVal > maxVal) {
				valueMax = valueMin
			}
		} else {
			if (maxVal < minVal) {
				valueMin = valueMax
			}
		}
	}
</script>

<div class={cn(rangeInputVariants({ size, isFullWidth }), className)}>
	{#if label}
		<span class="font-bold mr-2 select-none">{label}</span>
	{/if}
	<input
		type="number"
		class="min-input"
		bind:value={valueMin}
		oninput={() => validateRange('min')}
		placeholder={placeholderMin}
		{min}
		{max}
	/>
	<span class="separator">-</span>
	<input
		type="number"
		class="max-input"
		bind:value={valueMax}
		oninput={() => validateRange('max')}
		placeholder={placeholderMax}
		{min}
		{max}
	/>
</div>

<style>
	/* Hide spin buttons */
	input[type='number']::-webkit-inner-spin-button,
	input[type='number']::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	input[type='number'] {
		-moz-appearance: textfield;
	}

	:global(.keyActionRangeInput) {
		/* Sizes - Matching Input/Button */
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

		/* Colors */
		--inputBorderColor: rgb(209, 213, 219);
		--inputBorderColor-hover: rgb(156, 163, 175);
		--inputBorderColor-focus: var(--a);

		--inputBgColor: var(--colorWhite);
		--inputTextColor: var(--colorBlack);
		--inputPlaceholderColor: rgb(156, 163, 175);

		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		white-space: nowrap;
		font-family: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 150ms ease;
		border-radius: 5px;
		border-width: 1px;
		border-style: solid;
		border-color: var(--inputBorderColor);
		background-color: var(--inputBgColor);
		color: var(--inputTextColor);
		width: auto;
	}

	:global(.keyActionRangeInput:hover:not(:focus-within)) {
		border-color: var(--inputBorderColor-hover);
	}

	:global(.keyActionRangeInput:focus-within) {
		border-color: var(--inputBorderColor-focus);
		box-shadow: 0 0 0 1px var(--inputBorderColor-focus);
	}

	/* Sizes */
	:global(.keyActionRangeInput.isSmallSize) {
		height: var(--smallSizeHeight);
		padding: 0 var(--smallSizePaddingX);
		font-size: var(--smallSizeFontSize);
	}

	:global(.keyActionRangeInput.isMediumSize) {
		height: var(--mediumSizeHeight);
		padding: 0 var(--mediumSizePaddingX);
		font-size: var(--mediumSizeFontSize);
	}

	:global(.keyActionRangeInput.isLargeSize) {
		height: var(--largeSizeHeight);
		padding: 0 var(--largeSizePaddingX);
		font-size: var(--largeSizeFontSize);
	}

	/* Full Width */
	:global(.keyActionRangeInput.isFullWidth) {
		width: 100%;
		flex: 1;
	}

	.min-input,
	.max-input {
		background: transparent;
		background: var(--n-00);
		border: none;
		outline: none;
		width: 3rem;
		text-align: center;
		font-family: inherit;
		font-size: inherit;
		color: inherit;
		padding: 0px 8px;
		border-radius: 4px;
	}

	.min-input:focus,
	.max-input:focus {
		outline: none;
		box-shadow: none;
	}

	.min-input::placeholder,
	.max-input::placeholder {
		color: var(--inputPlaceholderColor);
	}

	.min-input {
		text-align: right;
	}

	.max-input {
		text-align: left;
	}

	.separator {
		color: var(--inputPlaceholderColor);
		margin: 0 8px;
		user-select: none;
	}
</style>
