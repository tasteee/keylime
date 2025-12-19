<script lang="ts">
	type PropsT = {
		value: number
		min?: number
		max?: number
		step?: number

		// Automation
		onchange?: (value: number) => void
		isDisabled?: boolean
		class?: string
		id?: string
	}

	let {
		value = $bindable(),
		min,
		max,
		step = 1,
		onchange,
		isDisabled = false,
		class: className = '',
		id
	}: PropsT = $props()

	function update(v: number) {
		if (isDisabled) return
		// Clamp values
		let next = v
		if (min !== undefined && next < min) next = min
		if (max !== undefined && next > max) next = max

		value = next
		onchange?.(next)
	}
</script>

<div class="number-wrapper {isDisabled ? 'isDisabled' : ''} {className}">
	<!-- Decrement -->
	<button class="stepper" onclick={() => update(value - step)} tabindex="-1">−</button>

	<input
		type="number"
		{id}
		bind:value
		{min}
		{max}
		{step}
		disabled={isDisabled}
		onchange={(e) => update((e.target as HTMLInputElement).valueAsNumber)}
	/>

	<!-- Increment -->
	<button class="stepper" onclick={() => update(value + step)} tabindex="-1">+</button>
</div>

<style>
	.number-wrapper {
		display: flex;
		align-items: center;
		background: var(--color-surface-base);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-inner-sm); /* Recessed look */
		padding: 2px;
		width: fit-content;
		border: 1px solid transparent;
		transition: all 0.2s;
	}

	.number-wrapper:focus-within {
		border-color: var(--a);
		background: white;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	input {
		width: 48px;
		border: none;
		background: transparent;
		text-align: center;
		font-family: var(--font-sans);
		font-weight: 600;
		font-size: 14px;
		color: var(--color-text-primary);
		-moz-appearance: textfield;
	}

	input:focus {
		outline: none;
	}

	/* Remove browser arrows */
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.stepper {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		color: var(--color-text-tertiary);
		font-weight: bold;
		cursor: pointer;
		border-radius: 5px;
		user-select: none;
	}

	.stepper:hover {
		background: rgba(0, 0, 0, 0.05);
		color: var(--color-text-primary);
	}

	.stepper:active {
		background: rgba(0, 0, 0, 0.1);
	}

	.isDisabled {
		opacity: 0.5;
		pointer-events: none;
	}
</style>
