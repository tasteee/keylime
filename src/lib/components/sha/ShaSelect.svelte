<script lang="ts">
	import { CaretDown } from 'phosphor-svelte'

	type OptionT = { value: string | number; label: string }

	type PropsT = {
		value: string | number
		options: OptionT[]

		// States
		isDisabled?: boolean
		isFullWidth?: boolean

		// Automation
		onchange?: (value: string | number) => void
		class?: string
		id?: string
	}

	let {
		value = $bindable(),
		options = [],
		isDisabled = false,
		isFullWidth = false,
		onchange,
		class: className = '',
		id
	}: PropsT = $props()

	function handleChange(e: Event) {
		const target = e.target as HTMLSelectElement
		// Attempt to convert to number if the original value was a number
		const val = isNaN(Number(target.value)) ? target.value : Number(target.value)
		value = val
		onchange?.(val)
	}
</script>

<div class="select-wrapper {isDisabled ? 'isDisabled' : ''} {isFullWidth ? 'isFullWidth' : ''} {className}">
	<select {id} bind:value disabled={isDisabled} onchange={handleChange}>
		{#each options as opt}
			<option value={opt.value}>{opt.label}</option>
		{/each}
	</select>

	<!-- Custom visual arrow overlay -->
	<div class="icon-layer">
		<CaretDown weight="bold" size={14} />
	</div>
</div>

<style>
	.select-wrapper {
		position: relative;
		display: inline-flex;
		align-items: center;
		background: var(--color-surface-base);
		box-shadow: var(--shadow-surface-sm); /* Lifted look */
		border-radius: var(--radius-sm);
		transition: all 0.2s ease;
		height: 40px;
	}

	.isFullWidth {
		display: flex;
		width: 100%;
	}

	.select-wrapper:hover {
		transform: translateY(-1px);
		box-shadow: var(--shadow-surface-md);
	}

	.select-wrapper:focus-within {
		box-shadow: 0 0 0 2px var(--a);
	}

	select {
		appearance: none;
		-webkit-appearance: none;
		width: 100%;
		height: 100%;
		border: none;
		background: transparent;
		padding: 0 36px 0 16px; /* Space for arrow */
		font-family: var(--font-sans);
		font-size: 14px;
		font-weight: 500;
		color: var(--color-text-primary);
		cursor: pointer;
		outline: none;
		z-index: 2;
	}

	.icon-layer {
		position: absolute;
		right: 12px;
		pointer-events: none;
		color: var(--color-text-tertiary);
		z-index: 1;
		display: flex;
		align-items: center;
	}

	.isDisabled {
		opacity: 0.6;
		pointer-events: none;
		box-shadow: none;
		background: var(--color-surface-dim);
	}
</style>
