<script lang="ts" module>
	import { Checkbox as CheckboxPrimitive } from 'bits-ui'
	import { type VariantProps, tv } from 'tailwind-variants'
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js'
	import CheckIcon from '@lucide/svelte/icons/check'
	import MinusIcon from '@lucide/svelte/icons/minus'
	import { Square } from 'phosphor-svelte'

	export const checkboxVariants = tv({
		base: 'limeCheckbox',
		variants: {
			size: {
				small: 'isSmallSize',
				medium: 'isMediumSize',
				large: 'isLargeSize'
			}
		},
		defaultVariants: {
			size: 'medium'
		}
	})

	export type CheckboxSizeT = VariantProps<typeof checkboxVariants>['size']

	type BaseCheckboxPropsT = {
		size?: CheckboxSizeT
	}

	export type CheckboxPropsT = WithoutChildrenOrChild<
		Omit<CheckboxPrimitive.RootProps, 'checked' | 'indeterminate' | 'disabled'>
	> &
		BaseCheckboxPropsT & {
			isChecked?: boolean
			isIndeterminate?: boolean
			isDisabled?: boolean
		}
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		isChecked = $bindable(false),
		isIndeterminate = $bindable(false),
		isDisabled = false,
		size = 'medium',
		class: className,
		...restProps
	}: CheckboxPropsT = $props()
</script>

<CheckboxPrimitive.Root
	bind:ref
	data-slot="checkbox"
	class={cn(checkboxVariants({ size }), className)}
	bind:checked={isChecked}
	bind:indeterminate={isIndeterminate}
	disabled={isDisabled}
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<div data-slot="checkbox-indicator" class="checkboxIndicator">
			<Square class="boxIcon" weight="regular" />
			{#if checked}
				<CheckIcon class="icon checkIcon" />
			{:else if indeterminate}
				<MinusIcon class="icon minusIcon" />
			{/if}
		</div>
	{/snippet}
</CheckboxPrimitive.Root>

<style>
	:global(.limeCheckbox) {
		/* Colors - Matching Input/Button */
		--checkboxBorderColor: rgb(209, 213, 219);
		--checkboxBorderColor-hover: rgb(156, 163, 175);
		--checkboxBorderColor-checked: var(--a); /* Brand color */
		--checkboxBgColor: var(--colorWhite);
		--checkboxBgColor-checked: var(--a);
		--checkboxFgColor: var(--colorWhite); /* Icon color */

		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		/* border-width: 1px; */
		border-style: solid;
		border-color: var(--checkboxBorderColor);
		background-color: var(--checkboxBgColor);
		cursor: pointer;
		transition: all 150ms ease;
		flex-shrink: 0;
	}

	:global .limeCheckbox:hover:not([data-disabled]) {
		border-color: var(--checkboxBorderColor-hover);
	}

	:global .limeCheckbox[data-state='checked'],
	:global .limeCheckbox[data-state='indeterminate'] {
		background-color: var(--checkboxBgColor-checked);
		border-color: var(--checkboxBorderColor-checked);
		color: var(--checkboxFgColor);
	}

	:global .limeCheckbox:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 2px var(--checkboxBorderColor-checked),
			0 0 0 4px var(--colorWhite);
	}

	:global .limeCheckbox[data-disabled] {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Sizes */
	:global .limeCheckbox.isSmallSize {
		width: 16px;
		height: 16px;
	}

	:global .limeCheckbox.isMediumSize {
		width: 20px;
		height: 20px;
	}

	:global .limeCheckbox.isLargeSize {
		width: 24px;
		height: 24px;
	}

	.checkboxIndicator {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		color: currentColor;
		position: relative;
		opacity: 0.75;
	}

	:global(.limeCheckbox .boxIcon) {
		width: 100%;
		height: 100%;
		position: absolute;
		color: var(--checkboxBorderColor);
	}

	:global(.limeCheckbox:hover .boxIcon) {
		color: var(--checkboxBorderColor-hover);
	}

	:global(.limeCheckbox[data-state='checked'] .boxIcon),
	:global(.limeCheckbox[data-state='indeterminate'] .boxIcon) {
		color: var(--checkboxBorderColor-checked);
	}

	:global(.limeCheckbox .checkIcon),
	:global(.limeCheckbox .minusIcon) {
		width: 80%;
		height: 80%;
		stroke-width: 3.5px;
		position: relative;
		z-index: 1;
	}
</style>
